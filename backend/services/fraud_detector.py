import pandas as pd
import numpy as np
import re
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
import models

class FraudDetector:
    def __init__(self):
        self.gstin_pattern = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")

    def validate_gstin(self, gstin):
        if pd.isna(gstin) or not isinstance(gstin, str):
            return False
        return bool(self.gstin_pattern.match(gstin.strip().upper()))

    def analyze_background(self, df: pd.DataFrame, job_id: int, db: Session):
        """
        Background worker that processes the CSV, runs Isolation Forest & rules,
        and saves results directly to the database.
        """
        try:
            total_invoices = len(df)
            high_risk_count = 0
            total_gst_amount = 0.0

            calc_cols = ['Total_Amount', 'CGST', 'SGST', 'IGST']
            for c in calc_cols:
                if c in df.columns:
                    df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)

            # Feature engineering for Machine Learning
            if total_invoices > 5: # Need enough data to train Isolation Forest
                df['Total_Tax'] = df['CGST'] + df['SGST'] + df['IGST']
                df['Tax_Ratio'] = np.where(df['Total_Amount'] > 0, df['Total_Tax'] / df['Total_Amount'], 0)
                
                features = df[['Total_Amount', 'Total_Tax', 'Tax_Ratio']].copy()
                # Run Isolation Forest to find pure statistical anomalies
                clf = IsolationForest(contamination=0.05, random_state=42)
                df['ML_Anomaly'] = clf.fit_predict(features) # -1 is anomaly, 1 is normal
            else:
                df['ML_Anomaly'] = 1
                df['Total_Tax'] = df['CGST'] + df['SGST'] + df['IGST']

            for idx, row in df.iterrows():
                flags = []
                risk_score = 0
                
                supplier_gst = str(row.get('GSTIN_Supplier', ''))
                cgst = row.get('CGST', 0)
                sgst = row.get('SGST', 0)
                igst = row.get('IGST', 0)
                total = row.get('Total_Amount', 0)
                total_tax = row.get('Total_Tax', 0)
                
                total_gst_amount += float(total_tax)

                # ML Check
                if row.get('ML_Anomaly') == -1:
                    flags.append("ML Isolation Forest: Statistical Outlier detected")
                    risk_score += 40

                # 1. Invalid GSTIN
                if not self.validate_gstin(supplier_gst):
                    flags.append("Invalid GSTIN Format")
                    risk_score += 40

                # 2. Tax mismatch
                if cgst > 0 and sgst > 0 and abs(cgst - sgst) > 1:
                    flags.append("CGST and SGST mismatch")
                    risk_score += 30

                # 3. High tax ratio > 28%
                if total > 0 and (total_tax / total) > 0.285:
                    flags.append("Tax amount exceeds maximum slab (28%)")
                    risk_score += 50
                    
                # 4. Zero Tax but huge amount
                if total > 1000000 and total_tax == 0:
                    flags.append("High value transaction with zero tax")
                    risk_score += 20

                is_high_risk = risk_score >= 50
                if is_high_risk:
                    high_risk_count += 1
                    
                if risk_score > 0:
                    anomaly_record = models.InvoiceAnomaly(
                        job_id=job_id,
                        invoice_id=str(row.get('Invoice_ID', f"Row-{idx}")),
                        supplier_gstin=supplier_gst,
                        total_amount=float(total),
                        risk_score=min(float(risk_score), 100.0),
                        is_high_risk=bool(is_high_risk),
                        flags=flags
                    )
                    db.add(anomaly_record)

            # Update Job Status
            job = db.query(models.AuditJob).filter(models.AuditJob.id == job_id).first()
            if job:
                job.status = "COMPLETED"
                job.total_invoices = total_invoices
                job.high_risk_count = high_risk_count
                job.total_gst_amount = total_gst_amount
            db.commit()

        except Exception as e:
            db.rollback()
            job = db.query(models.AuditJob).filter(models.AuditJob.id == job_id).first()
            if job:
                job.status = "FAILED"
                job.error_msg = str(e)
            db.commit()

