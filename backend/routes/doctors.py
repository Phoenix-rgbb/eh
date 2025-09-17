from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models import Doctor, User, UserRole
from schemas import DoctorResponse, DoctorUpdate
from .auth import get_current_user

router = APIRouter(prefix="/doctors", tags=["doctors"])

@router.get("/", response_model=List[DoctorResponse])
def get_all_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).join(User).all()
    return doctors

@router.get("/available", response_model=List[DoctorResponse])
def get_available_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).join(User).filter(Doctor.is_available == True).all()
    return doctors

@router.get("/emergency", response_model=List[DoctorResponse])
def get_emergency_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).join(User).filter(
        Doctor.emergency_status == True,
        Doctor.is_available == True
    ).all()
    return doctors

@router.get("/specialization/{specialization}", response_model=List[DoctorResponse])
def get_doctors_by_specialization(specialization: str, db: Session = Depends(get_db)):
    doctors = db.query(Doctor).join(User).filter(
        Doctor.specialization.ilike(f"%{specialization}%")
    ).all()
    return doctors

@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).join(User).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if current user is the doctor or an admin
    if current_user.role not in [UserRole.admin, UserRole.doctor] or (current_user.role == UserRole.doctor and doctor.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this doctor")
    
    update_data = doctor_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)
    
    # Update last_seen timestamp
    doctor.last_seen = datetime.utcnow()
    
    db.commit()
    db.refresh(doctor)
    return doctor

@router.put("/{doctor_id}/availability")
def toggle_availability(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if current user is the doctor or an admin
    print(f"=== AVAILABILITY AUTHORIZATION DEBUG ===")
    print(f"Current user ID: {current_user.id}")
    print(f"Current user role: {current_user.role}")
    print(f"Doctor user_id: {doctor.user_id}")
    print(f"Doctor ID: {doctor.id}")
    print(f"Role check: {current_user.role in [UserRole.admin, UserRole.doctor]}")
    print(f"User ID match: {doctor.user_id == current_user.id}")
    
    if current_user.role not in [UserRole.admin, UserRole.doctor] or (current_user.role == UserRole.doctor and doctor.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this doctor")
    
    doctor.is_available = not doctor.is_available
    doctor.last_seen = datetime.utcnow()
    
    db.commit()
    return {"message": f"Doctor availability updated to {doctor.is_available}"}

@router.put("/{doctor_id}/emergency-status")
def toggle_emergency_status(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if current user is the doctor or an admin
    if current_user.role not in [UserRole.admin, UserRole.doctor] or (current_user.role == UserRole.doctor and doctor.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this doctor")
    
    doctor.emergency_status = not doctor.emergency_status
    doctor.last_seen = datetime.utcnow()
    
    db.commit()
    return {"message": f"Doctor emergency status updated to {doctor.emergency_status}"}

@router.post("/create-profile", response_model=DoctorResponse)
def create_doctor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a doctor profile for the current user if they don't have one"""
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Only doctor users can create doctor profiles")
    
    # Check if doctor profile already exists
    existing_doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if existing_doctor:
        return existing_doctor
    
    # Create new doctor profile
    new_doctor = Doctor(
        user_id=current_user.id,
        specialization="General Medicine",
        license_number=f"LIC{current_user.id:06d}",  # Generate a temporary license number
        is_available=True,
        emergency_status=False,
        experience_years=0,
        location="Not specified"
    )
    
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    
    return new_doctor

@router.get("/analytics/workload")
def get_doctor_workload_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.admin, UserRole.gov_official]:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")
    
    # Get doctor workload data
    from ..models import Queue, Record
    from sqlalchemy import func
    
    # Queue statistics
    queue_stats = db.query(
        Doctor.specialization,
        func.count(Queue.id).label("pending_consultations")
    ).join(Queue, Doctor.id == Queue.doctor_id, isouter=True)\
     .filter(Queue.status == "waiting")\
     .group_by(Doctor.specialization).all()
    
    # Consultation statistics (last 30 days)
    consultation_stats = db.query(
        Doctor.specialization,
        func.count(Record.id).label("consultations_completed")
    ).join(Record, Doctor.id == Record.doctor_id, isouter=True)\
     .filter(Record.created_at >= datetime.utcnow().replace(day=1))\
     .group_by(Doctor.specialization).all()
    
    return {
        "queue_statistics": [{"specialization": stat[0], "pending": stat[1]} for stat in queue_stats],
        "consultation_statistics": [{"specialization": stat[0], "completed": stat[1]} for stat in consultation_stats]
    }
