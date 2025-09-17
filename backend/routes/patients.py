from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Patient, User
from schemas import PatientResponse, PatientUpdate
from .auth import get_current_user

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/", response_model=List[PatientResponse])
def get_all_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "doctor", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all patients")
    
    patients = db.query(Patient).join(User).all()
    return patients

@router.get("/village/{village}", response_model=List[PatientResponse])
def get_patients_by_village(
    village: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "doctor", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view patients by village")
    
    patients = db.query(Patient).join(User).filter(
        Patient.village.ilike(f"%{village}%")
    ).all()
    return patients

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).join(User).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization
    if current_user.role == "patient" and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient")
    elif current_user.role not in ["admin", "doctor", "gov_official", "patient"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return patient

@router.get("/me/profile", response_model=PatientResponse)
def get_my_patient_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access this endpoint")
    
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization
    if current_user.role == "patient" and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this patient")
    elif current_user.role not in ["admin", "patient"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/analytics/demographics")
def get_patient_demographics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")
    
    from sqlalchemy import func
    
    # Age group distribution
    age_groups = db.query(
        func.case(
            (Patient.age < 18, "Under 18"),
            (Patient.age.between(18, 35), "18-35"),
            (Patient.age.between(36, 60), "36-60"),
            (Patient.age > 60, "Over 60"),
            else_="Unknown"
        ).label("age_group"),
        func.count(Patient.id).label("count")
    ).group_by("age_group").all()
    
    # Village distribution
    village_distribution = db.query(
        Patient.village,
        func.count(Patient.id).label("count")
    ).group_by(Patient.village).all()
    
    # Gender distribution
    gender_distribution = db.query(
        Patient.gender,
        func.count(Patient.id).label("count")
    ).group_by(Patient.gender).all()
    
    return {
        "age_groups": [{"group": group[0], "count": group[1]} for group in age_groups],
        "villages": [{"village": village[0], "count": village[1]} for village in village_distribution if village[0]],
        "gender": [{"gender": gender[0], "count": gender[1]} for gender in gender_distribution if gender[0]]
    }
