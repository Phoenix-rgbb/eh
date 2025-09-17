from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from database import get_db
from models import User, Doctor, Patient, Queue, Record
from routes.auth import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/admin", tags=["admin"])
security = HTTPBearer()

def get_admin_user(current_user: User = Depends(get_current_user)):
    """Ensure the current user has admin or gov_official privileges"""
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

@router.get("/dashboard/stats")
def get_dashboard_stats(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get real-time dashboard statistics"""
    
    # Get total patients
    total_patients = db.query(User).filter(User.role == "patient").count()
    
    # Get active doctors (those who have been active in last 24 hours or have consultations today)
    today = datetime.now().date()
    yesterday = datetime.now() - timedelta(days=1)
    
    active_doctors_query = db.query(Doctor).join(User).filter(
        and_(
            User.role == "doctor",
            User.is_active == True
        )
    )
    total_doctors = active_doctors_query.count()
    
    # Get active consultations (in progress)
    active_consultations = db.query(Queue).filter(
        Queue.status == "in_progress"
    ).count()
    
    # Get emergency cases (high priority queue items or recent emergency consultations)
    emergency_cases = db.query(Queue).filter(
        and_(
            Queue.status.in_(["waiting", "in_progress"]),
            Queue.priority == 4
        )
    ).count()
    
    # Get queue statistics
    waiting_queue = db.query(Queue).filter(Queue.status == "waiting").count()
    
    # Get recent activity data
    recent_activities = []
    
    # Recent doctor registrations
    recent_doctors = db.query(User).filter(
        and_(
            User.role == "doctor",
            User.created_at >= yesterday
        )
    ).limit(3).all()
    
    for doctor in recent_doctors:
        recent_activities.append({
            "type": "doctor_registration",
            "message": f"New doctor registered: Dr. {doctor.name}",
            "timestamp": doctor.created_at,
            "priority": "success"
        })
    
    # Recent high priority cases
    high_priority_cases = db.query(Queue).filter(
        and_(
            Queue.priority == "high",
            Queue.created_at >= yesterday
        )
    ).limit(2).all()
    
    for case in high_priority_cases:
        recent_activities.append({
            "type": "emergency_case",
            "message": f"Emergency case: Patient ID {case.patient_id}",
            "timestamp": case.created_at,
            "priority": "danger"
        })
    
    # Sort activities by timestamp
    recent_activities.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_activities = recent_activities[:5]  # Limit to 5 most recent
    
    return {
        "totalPatients": total_patients,
        "totalDoctors": total_doctors,
        "activeConsultations": active_consultations,
        "emergencyCases": emergency_cases,
        "waitingQueue": waiting_queue,
        "recentActivities": recent_activities,
        "lastUpdated": datetime.now().isoformat()
    }

@router.get("/dashboard/doctors")
def get_doctors_status(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get detailed doctor status information"""
    
    doctors_data = db.query(Doctor, User).join(User).filter(
        User.role == "doctor"
    ).all()
    
    doctors_list = []
    for doctor, user in doctors_data:
        # Check if doctor has active consultations
        active_consultations = db.query(Queue).filter(
            and_(
                Queue.doctor_id == doctor.id,
                Queue.status == "in_progress"
            )
        ).count()
        
        # Check if doctor is available for emergency
        is_emergency_available = doctor.emergency_available if hasattr(doctor, 'emergency_available') else False
        
        doctors_list.append({
            "id": doctor.id,
            "name": user.name,
            "specialization": doctor.specialization,
            "location": doctor.location,
            "isActive": user.is_active,
            "activeConsultations": active_consultations,
            "emergencyAvailable": is_emergency_available,
            "experienceYears": doctor.experience_years if hasattr(doctor, 'experience_years') else 0
        })
    
    return {
        "doctors": doctors_list,
        "totalActive": len([d for d in doctors_list if d["isActive"]]),
        "emergencyAvailable": len([d for d in doctors_list if d["emergencyAvailable"]]),
        "lastUpdated": datetime.now().isoformat()
    }

@router.get("/dashboard/consultations")
def get_consultations_status(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get detailed consultation status information"""
    
    # Get consultation statistics
    total_consultations = db.query(Queue).count()
    active_consultations = db.query(Queue).filter(
        Queue.status == "in_progress"
    ).count()
    completed_today = db.query(Queue).filter(
        and_(
            Queue.status == "completed",
            func.date(Queue.completed_at) == datetime.now().date()
        )
    ).count()
    
    # Get recent consultations
    recent_consultations = db.query(Queue, Patient, Doctor).join(
        Patient, Queue.patient_id == Patient.id
    ).join(
        Doctor, Queue.doctor_id == Doctor.id
    ).order_by(Queue.created_at.desc()).limit(10).all()
    
    consultations_list = []
    for consultation, patient, doctor in recent_consultations:
        consultations_list.append({
            "id": consultation.id,
            "patientName": patient.user.name,
            "doctorId": doctor.id,
            "status": consultation.status.value,
            "createdAt": consultation.created_at.isoformat(),
            "updatedAt": consultation.completed_at.isoformat() if consultation.completed_at else None
        })
    
    return {
        "totalConsultations": total_consultations,
        "activeConsultations": active_consultations,
        "completedToday": completed_today,
        "recentConsultations": consultations_list,
        "lastUpdated": datetime.now().isoformat()
    }

@router.get("/dashboard/queue")
def get_queue_status(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get detailed queue status information"""
    
    # Get queue statistics
    total_waiting = db.query(Queue).filter(Queue.status == "waiting").count()
    in_progress = db.query(Queue).filter(Queue.status == "in_progress").count()
    high_priority = db.query(Queue).filter(
        and_(
            Queue.priority == "high",
            Queue.status.in_(["waiting", "in_progress"])
        )
    ).count()
    
    # Get average wait time (mock calculation)
    avg_wait_time = 15  # minutes - this would be calculated from actual data
    
    # Get queue details
    queue_items = db.query(Queue, User).join(User).filter(
        Queue.status.in_(["waiting", "in_progress"])
    ).order_by(Queue.created_at.asc()).limit(20).all()
    
    queue_list = []
    for queue_item, patient in queue_items:
        queue_list.append({
            "id": queue_item.id,
            "patientName": patient.name,
            "priority": queue_item.priority,
            "status": queue_item.status,
            "waitTime": int((datetime.now() - queue_item.created_at).total_seconds() / 60),  # minutes
            "createdAt": queue_item.created_at.isoformat()
        })
    
    return {
        "totalWaiting": total_waiting,
        "inProgress": in_progress,
        "highPriority": high_priority,
        "averageWaitTime": avg_wait_time,
        "queueItems": queue_list,
        "lastUpdated": datetime.now().isoformat()
    }
