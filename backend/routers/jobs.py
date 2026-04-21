from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from routers.auth import get_current_user
import models

router = APIRouter()

@router.get("/jobs/{job_id}")
def get_job_status(job_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    job = db.query(models.AuditJob).filter(models.AuditJob.id == job_id, models.AuditJob.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    response = {
        "id": job.id,
        "status": job.status,
        "filename": job.filename
    }

    if job.status == "FAILED":
        response["error"] = job.error_msg

    if job.status == "COMPLETED":
        # Fetch summary and anomalies
        anomalies = db.query(models.InvoiceAnomaly).filter(models.InvoiceAnomaly.job_id == job.id).all()
        response["summary"] = {
            "total_invoices": job.total_invoices,
            "high_risk_count": job.high_risk_count,
            "total_gst_amount": job.total_gst_amount,
            "total_anomalies": len(anomalies)
        }
        
        # Serialize anomalies list
        anomaly_list = []
        for an in anomalies:
            anomaly_list.append({
                "Invoice_ID": an.invoice_id,
                "GSTIN_Supplier": an.supplier_gstin,
                "Total_Amount": an.total_amount,
                "Risk_Score": an.risk_score,
                "Is_High_Risk": an.is_high_risk,
                "Flags": an.flags
            })
        response["anomalies"] = anomaly_list
        
    return response

@router.get("/my-audits")
def get_my_audits(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    jobs = db.query(models.AuditJob).filter(models.AuditJob.user_id == current_user.id).order_by(models.AuditJob.created_at.desc()).all()
    return [{"id": j.id, "filename": j.filename, "status": j.status, "date": j.created_at} for j in jobs]
