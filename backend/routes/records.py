from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from models import Record, User, Patient, Doctor
from schemas import RecordResponse, RecordCreate
from .auth import get_current_user

router = APIRouter(prefix="/records", tags=["records"])

@router.get("/", response_model=List[RecordResponse])
def get_all_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all records")
    
    records = db.query(Record).all()
    return records

@router.get("/patient/{patient_id}", response_model=List[RecordResponse])
def get_patient_records(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if current user can access this patient's records
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized to view these records")
    elif current_user.role not in ["admin", "doctor", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    records = db.query(Record).filter(Record.patient_id == patient_id).order_by(Record.created_at.desc()).all()
    return records

@router.get("/doctor/{doctor_id}", response_model=List[RecordResponse])
def get_doctor_records(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if current user can access this doctor's records
    if current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or doctor.id != doctor_id:
            raise HTTPException(status_code=403, detail="Not authorized to view these records")
    elif current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    records = db.query(Record).filter(Record.doctor_id == doctor_id).order_by(Record.created_at.desc()).all()
    return records

@router.get("/my-records", response_model=List[RecordResponse])
def get_my_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        records = db.query(Record).filter(Record.patient_id == patient.id).order_by(Record.created_at.desc()).all()
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        records = db.query(Record).filter(Record.doctor_id == doctor.id).order_by(Record.created_at.desc()).all()
    else:
        raise HTTPException(status_code=403, detail="Only patients and doctors can access this endpoint")
    
    return records

@router.get("/{record_id}", response_model=RecordResponse)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Check authorization
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or record.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this record")
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or record.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this record")
    elif current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return record

@router.post("/", response_model=RecordResponse)
def create_record(
    record: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Only doctors can create records")
    
    # If current user is a doctor, ensure they can only create records for themselves
    if current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or record.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Doctors can only create records for themselves")
    
    # Verify patient and doctor exist
    patient = db.query(Patient).filter(Patient.id == record.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == record.doctor_id).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    db_record = Record(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.get("/emergency/recent")
def get_recent_emergency_records(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "doctor", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view emergency records")
    
    since_date = datetime.utcnow() - timedelta(days=days)
    records = db.query(Record).filter(
        Record.is_emergency == True,
        Record.created_at >= since_date
    ).order_by(Record.created_at.desc()).all()
    
    return records

@router.get("/analytics/trends")
def get_health_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")
    
    from sqlalchemy import func, extract
    
    # Monthly consultation trends
    monthly_trends = db.query(
        extract('year', Record.created_at).label('year'),
        extract('month', Record.created_at).label('month'),
        func.count(Record.id).label('consultation_count')
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    # Common symptoms analysis
    # This is a simplified version - in production, you'd want better text analysis
    symptom_keywords = ['fever', 'cough', 'headache', 'pain', 'nausea', 'fatigue', 'breathing']
    symptom_counts = {}
    
    for keyword in symptom_keywords:
        count = db.query(func.count(Record.id)).filter(
            Record.symptoms.ilike(f'%{keyword}%')
        ).scalar()
        symptom_counts[keyword] = count
    
    # Emergency vs regular consultations
    emergency_count = db.query(func.count(Record.id)).filter(Record.is_emergency == True).scalar()
    regular_count = db.query(func.count(Record.id)).filter(Record.is_emergency == False).scalar()
    
    return {
        "monthly_trends": [
            {
                "year": int(trend[0]) if trend[0] else 0,
                "month": int(trend[1]) if trend[1] else 0,
                "consultations": trend[2]
            } for trend in monthly_trends
        ],
        "common_symptoms": symptom_counts,
        "consultation_types": {
            "emergency": emergency_count,
            "regular": regular_count
        }
    }

@router.get("/sync/offline")
def get_offline_sync_data(
    last_sync: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get records for offline synchronization"""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can sync offline data")
    
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    query = db.query(Record).filter(Record.patient_id == patient.id)
    
    if last_sync:
        query = query.filter(Record.created_at > last_sync)
    
    records = query.order_by(Record.created_at.desc()).limit(50).all()
    
    return {
        "records": records,
        "sync_timestamp": datetime.utcnow(),
        "total_count": len(records)
    }
