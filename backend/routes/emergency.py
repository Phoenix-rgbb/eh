from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from database import get_db
from models import EmergencyAlert, User, Patient, Doctor
from schemas import EmergencyAlertResponse, EmergencyAlertCreate
from .auth import get_current_user

router = APIRouter(prefix="/emergency", tags=["emergency"])

@router.get("/alerts", response_model=List[EmergencyAlertResponse])
def get_all_emergency_alerts(
    status: str = "active",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "doctor", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view emergency alerts")
    
    query = db.query(EmergencyAlert)
    if status:
        query = query.filter(EmergencyAlert.status == status)
    
    alerts = query.order_by(EmergencyAlert.created_at.desc()).all()
    return alerts

@router.get("/alerts/unassigned", response_model=List[EmergencyAlertResponse])
def get_unassigned_emergency_alerts(db: Session = Depends(get_db)):
    alerts = db.query(EmergencyAlert).filter(
        EmergencyAlert.status == "active",
        EmergencyAlert.doctor_id.is_(None)
    ).order_by(EmergencyAlert.created_at.asc()).all()
    return alerts

@router.get("/doctors/on-duty", response_model=List[dict])
def get_emergency_doctors_on_duty(db: Session = Depends(get_db)):
    """Get all doctors currently on emergency duty"""
    doctors = db.query(Doctor).join(User).filter(
        Doctor.emergency_status == True,
        Doctor.is_available == True
    ).all()
    
    # Include location and last seen information
    result = []
    for doctor in doctors:
        result.append({
            "id": doctor.id,
            "name": doctor.user.name,
            "specialization": doctor.specialization,
            "location": doctor.location,
            "last_seen": doctor.last_seen,
            "phone": doctor.user.phone
        })
    
    return result

@router.get("/doctors/nearest/{location}")
def find_nearest_emergency_doctors(
    location: str,
    db: Session = Depends(get_db)
):
    """Find nearest available emergency doctors to a location"""
    # This is a simplified version - in production, you'd use proper geolocation
    doctors = db.query(Doctor).join(User).filter(
        Doctor.emergency_status == True,
        Doctor.is_available == True
    ).all()
    
    # Simple location matching (in production, use proper distance calculation)
    nearest_doctors = []
    for doctor in doctors:
        if doctor.location and location.lower() in doctor.location.lower():
            nearest_doctors.append({
                "id": doctor.id,
                "name": doctor.user.name,
                "specialization": doctor.specialization,
                "location": doctor.location,
                "phone": doctor.user.phone,
                "distance": "nearby"  # Placeholder
            })
    
    # If no nearby doctors, return all emergency doctors
    if not nearest_doctors:
        for doctor in doctors:
            nearest_doctors.append({
                "id": doctor.id,
                "name": doctor.user.name,
                "specialization": doctor.specialization,
                "location": doctor.location,
                "phone": doctor.user.phone,
                "distance": "distant"
            })
    
    return nearest_doctors[:5]  # Return top 5

@router.post("/alert", response_model=EmergencyAlertResponse)
def create_emergency_alert(
    alert_data: EmergencyAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == alert_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization
    if current_user.role == "patient":
        if patient.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Patients can only create alerts for themselves")
    elif current_user.role not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_alert = EmergencyAlert(**alert_data.dict())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    # Auto-assign to nearest available emergency doctor
    nearest_doctors = db.query(Doctor).filter(
        Doctor.emergency_status == True,
        Doctor.is_available == True
    ).all()
    
    if nearest_doctors:
        # Simple assignment to first available doctor
        # In production, implement proper location-based assignment
        db_alert.doctor_id = nearest_doctors[0].id
        db_alert.status = "assigned"
        db.commit()
    
    return db_alert

@router.put("/alert/{alert_id}/assign/{doctor_id}")
def assign_emergency_alert(
    alert_id: int,
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="Not authorized to assign emergency alerts")
    
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Emergency alert not found")
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    if not doctor.emergency_status:
        raise HTTPException(status_code=400, detail="Doctor is not on emergency duty")
    
    alert.doctor_id = doctor_id
    alert.status = "assigned"
    db.commit()
    
    return {"message": f"Emergency alert assigned to Dr. {doctor.user.name}"}

@router.put("/alert/{alert_id}/resolve")
def resolve_emergency_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Emergency alert not found")
    
    # Check authorization
    if current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or alert.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not authorized to resolve this alert")
    elif current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    alert.status = "resolved"
    alert.resolved_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Emergency alert resolved successfully"}

@router.get("/analytics/response-times")
def get_emergency_response_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")
    
    from sqlalchemy import func
    
    # Response time statistics (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    resolved_alerts = db.query(EmergencyAlert).filter(
        EmergencyAlert.status == "resolved",
        EmergencyAlert.created_at >= thirty_days_ago,
        EmergencyAlert.resolved_at.isnot(None)
    ).all()
    
    response_times = []
    for alert in resolved_alerts:
        response_time = (alert.resolved_at - alert.created_at).total_seconds() / 60  # in minutes
        response_times.append(response_time)
    
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0
    
    # Alert type distribution
    alert_types = db.query(
        EmergencyAlert.alert_type,
        func.count(EmergencyAlert.id).label("count")
    ).filter(EmergencyAlert.created_at >= thirty_days_ago).group_by(EmergencyAlert.alert_type).all()
    
    # Emergency doctor availability
    total_doctors = db.query(func.count(Doctor.id)).scalar()
    emergency_doctors = db.query(func.count(Doctor.id)).filter(Doctor.emergency_status == True).scalar()
    available_emergency_doctors = db.query(func.count(Doctor.id)).filter(
        Doctor.emergency_status == True,
        Doctor.is_available == True
    ).scalar()
    
    return {
        "response_times": {
            "average_minutes": round(avg_response_time, 2),
            "total_resolved": len(response_times)
        },
        "alert_types": [{"type": alert[0], "count": alert[1]} for alert in alert_types],
        "doctor_availability": {
            "total_doctors": total_doctors,
            "emergency_doctors": emergency_doctors,
            "available_emergency_doctors": available_emergency_doctors
        }
    }

@router.post("/test-alert")
def create_test_emergency_alert(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a test emergency alert for system testing"""
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create test alerts")
    
    # Find a test patient or create one
    test_patient = db.query(Patient).first()
    if not test_patient:
        raise HTTPException(status_code=404, detail="No patients found for test alert")
    
    test_alert = EmergencyAlert(
        patient_id=test_patient.id,
        alert_type="test",
        location="Test Location",
        description="This is a test emergency alert for system verification",
        status="active"
    )
    
    db.add(test_alert)
    db.commit()
    db.refresh(test_alert)
    
    return {"message": "Test emergency alert created", "alert_id": test_alert.id}
