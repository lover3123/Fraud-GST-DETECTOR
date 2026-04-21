from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditJob(Base):
    __tablename__ = "audit_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    status = Column(String, default="PENDING") # PENDING, PROCESSING, COMPLETED, FAILED
    error_msg = Column(String, nullable=True)
    
    # Stores the summary of the audit
    total_invoices = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)
    total_gst_amount = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InvoiceAnomaly(Base):
    __tablename__ = "invoice_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("audit_jobs.id"))
    invoice_id = Column(String)
    supplier_gstin = Column(String)
    total_amount = Column(Float)
    risk_score = Column(Float)
    is_high_risk = Column(Boolean, default=False)
    flags = Column(JSON) # List of string flags
    created_at = Column(DateTime(timezone=True), server_default=func.now())
