from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import pandas as pd
import io

from database import get_db, SessionLocal
from routers.auth import get_current_user
from services.fraud_detector import FraudDetector
import models

router = APIRouter()
detector = FraudDetector()

def background_processor(contents: bytes, job_id: int):
    # We need a new DB session for the background thread
    db = SessionLocal()
    try:
        df = pd.read_csv(io.BytesIO(contents))
        required_cols = {'Invoice_ID', 'GSTIN_Supplier', 'Total_Amount', 'CGST', 'SGST', 'IGST'}
        missing_cols = required_cols - set(df.columns)
        if missing_cols:
            job = db.query(models.AuditJob).filter(models.AuditJob.id == job_id).first()
            if job:
                job.status = "FAILED"
                job.error_msg = f"Missing required columns: {', '.join(missing_cols)}"
            db.commit()
            return
            
        # Execute the heavy ML task
        detector.analyze_background(df, job_id, db)
    except Exception as e:
        job = db.query(models.AuditJob).filter(models.AuditJob.id == job_id).first()
        if job:
            job.status = "FAILED"
            job.error_msg = str(e)
        db.commit()
    finally:
        db.close()

@router.post("/upload-invoices")
async def upload_invoices(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Read fully into memory to pass to background task (for larger files, save to disk instead)
    contents = await file.read()
    
    # Create the job
    job = models.AuditJob(user_id=current_user.id, filename=file.filename, status="PROCESSING")
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Dispatch
    background_tasks.add_task(background_processor, contents, job.id)
    
    return {"message": "Job enqueued successfully", "job_id": job.id}
