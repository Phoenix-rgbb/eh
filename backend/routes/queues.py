from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import Queue, User, Patient, Doctor, QueueStatus, ConsultationQueue, UserRole
from schemas import QueueResponse, QueueCreate, QueueUpdate, ConsultationQueueResponse
from utils import calculate_wait_time, prioritize_queue
from .auth import get_current_user

router = APIRouter(prefix="/queues", tags=["queues"])

@router.get("/", response_model=List[QueueResponse])
def get_all_queues(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "doctor", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all queues")
    
    query = db.query(Queue)
    if status:
        query = query.filter(Queue.status == status)
    
    queues = query.order_by(Queue.priority.desc(), Queue.created_at.asc()).all()
    return queues

@router.get("/waiting", response_model=List[QueueResponse])
def get_waiting_queue(db: Session = Depends(get_db)):
    queues = db.query(Queue).filter(
        Queue.status == QueueStatus.WAITING
    ).order_by(Queue.priority.desc(), Queue.created_at.asc()).all()
    
    # Calculate estimated wait times
    for i, queue in enumerate(queues):
        queue.estimated_wait_time = calculate_wait_time(i + 1)
    
    return queues

@router.get("/doctor/{doctor_id}", response_model=List[QueueResponse])
def get_doctor_queue(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check authorization
    if current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or doctor.id != doctor_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this doctor's queue")
    elif current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    queues = db.query(Queue).filter(
        Queue.doctor_id == doctor_id
    ).order_by(Queue.priority.desc(), Queue.created_at.asc()).all()
    return queues

@router.get("/patient/{patient_id}", response_model=List[QueueResponse])
def get_patient_queue(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check authorization
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this patient's queue")
    elif current_user.role not in ["admin", "doctor", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    queues = db.query(Queue).filter(
        Queue.patient_id == patient_id
    ).order_by(Queue.created_at.desc()).all()
    return queues

@router.get("/my-queue", response_model=List[QueueResponse])
def get_my_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        queues = db.query(Queue).filter(Queue.patient_id == patient.id).order_by(Queue.created_at.desc()).all()
    elif current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        queues = db.query(Queue).filter(Queue.doctor_id == doctor.id).order_by(Queue.priority.desc(), Queue.created_at.asc()).all()
    else:
        raise HTTPException(status_code=403, detail="Only patients and doctors can access this endpoint")
    
    return queues

@router.post("/", response_model=QueueResponse)
def join_queue(
    queue_data: QueueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == queue_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization - patients can only join queue for themselves
    if current_user.role == "patient":
        if patient.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Patients can only join queue for themselves")
    elif current_user.role not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if patient already has an active queue entry
    existing_queue = db.query(Queue).filter(
        Queue.patient_id == queue_data.patient_id,
        Queue.status.in_([QueueStatus.WAITING, QueueStatus.IN_PROGRESS])
    ).first()
    
    if existing_queue:
        raise HTTPException(status_code=400, detail="Patient already has an active queue entry")
    
    # Calculate priority based on symptoms and patient info
    priority = prioritize_queue(
        queue_data.symptoms_brief,
        patient.age,
        patient.medical_history
    )
    
    # If specific doctor requested, verify they exist and are available
    if queue_data.doctor_id:
        doctor = db.query(Doctor).filter(Doctor.id == queue_data.doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        if not doctor.is_available:
            raise HTTPException(status_code=400, detail="Doctor is not available")
    
    db_queue = Queue(
        patient_id=queue_data.patient_id,
        doctor_id=queue_data.doctor_id,
        symptoms_brief=queue_data.symptoms_brief,
        priority=priority,
        status=QueueStatus.WAITING
    )
    
    db.add(db_queue)
    db.commit()
    db.refresh(db_queue)
    
    # Calculate estimated wait time
    position = db.query(Queue).filter(
        Queue.status == QueueStatus.WAITING,
        Queue.created_at < db_queue.created_at
    ).count() + 1
    
    db_queue.estimated_wait_time = calculate_wait_time(position)
    db.commit()
    
    return db_queue

@router.put("/{queue_id}", response_model=QueueResponse)
def update_queue(
    queue_id: int,
    queue_update: QueueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    # Check authorization
    if current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        # Doctors can update queues assigned to them or assign themselves
        if queue.doctor_id and queue.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this queue")
    elif current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or queue.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this queue")
    elif current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = queue_update.dict(exclude_unset=True)
    
    # Handle status changes
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == QueueStatus.IN_PROGRESS and not queue.started_at:
            queue.started_at = datetime.utcnow()
        elif new_status == QueueStatus.COMPLETED and not queue.completed_at:
            queue.completed_at = datetime.utcnow()
    
    # If doctor is being assigned, verify they exist and are available
    if "doctor_id" in update_data and update_data["doctor_id"]:
        doctor = db.query(Doctor).filter(Doctor.id == update_data["doctor_id"]).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        if not doctor.is_available:
            raise HTTPException(status_code=400, detail="Doctor is not available")
    
    for field, value in update_data.items():
        setattr(queue, field, value)
    
    db.commit()
    db.refresh(queue)
    return queue

@router.delete("/{queue_id}")
def cancel_queue(
    queue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    # Check authorization
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or queue.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized to cancel this queue")
    elif current_user.role not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Can only cancel waiting queues
    if queue.status != QueueStatus.WAITING:
        raise HTTPException(status_code=400, detail="Can only cancel waiting queue entries")
    
    queue.status = QueueStatus.CANCELLED
    queue.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Queue entry cancelled successfully"}

# Doctor Dashboard endpoints
@router.get("/api/queue", response_model=List[ConsultationQueueResponse])
def get_waiting_patients_for_doctor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all waiting patients for doctor dashboard"""
    print(f"=== BACKEND DEBUG ===")
    print(f"Current user: {current_user.name if current_user else 'None'}")
    print(f"User role: {current_user.role if current_user else 'None'}")
    print(f"User email: {current_user.email if current_user else 'None'}")
    
    if current_user.role != UserRole.doctor:
        print(f"Access denied: User role '{current_user.role}' is not 'doctor'")
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    
    # Get waiting patients from consultation queue
    consultation_queues = db.query(ConsultationQueue).filter(
        ConsultationQueue.status == "waiting"
    ).order_by(ConsultationQueue.joined_at.asc()).all()
    
    print(f"Found {len(consultation_queues)} waiting patients")
    for queue in consultation_queues:
        print(f"  - {queue.patient_name}: {queue.symptoms}")
    
    return consultation_queues

@router.post("/api/queue/start/{queue_id}")
def start_consultation(
    queue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start consultation - sets status to 'in_consultation'"""
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Only doctors can start consultations")
    
    consultation_queue = db.query(ConsultationQueue).filter(ConsultationQueue.id == queue_id).first()
    if not consultation_queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    if consultation_queue.status != "waiting":
        raise HTTPException(status_code=400, detail="Can only start consultation for waiting patients")
    
    # Update consultation queue status
    consultation_queue.status = "in_consultation"
    
    db.commit()
    db.refresh(consultation_queue)
    
    return {"message": "Consultation started successfully", "queue_id": queue_id, "status": "in_consultation"}

@router.post("/api/queue/finish/{queue_id}")
def finish_consultation(
    queue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Finish consultation - sets status to 'done'"""
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    
    consultation_queue = db.query(ConsultationQueue).filter(ConsultationQueue.id == queue_id).first()
    if not consultation_queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    if consultation_queue.status != "in_consultation":
        raise HTTPException(status_code=400, detail="Can only finish consultations that are in progress")
    
    # Update consultation queue status
    consultation_queue.status = "done"
    
    db.commit()
    db.refresh(consultation_queue)
    
    return {"message": "Consultation finished successfully", "queue_id": queue_id, "status": "done"}

@router.get("/analytics/statistics")
def get_queue_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")
    
    from sqlalchemy import func
    
    # Current queue status
    status_counts = db.query(
        Queue.status,
        func.count(Queue.id).label("count")
    ).group_by(Queue.status).all()
    
    # Average wait times by priority
    avg_wait_times = db.query(
        Queue.priority,
        func.avg(Queue.estimated_wait_time).label("avg_wait_time")
    ).filter(Queue.estimated_wait_time.isnot(None)).group_by(Queue.priority).all()
    
    # Queue trends (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    daily_queue_counts = db.query(
        func.date(Queue.created_at).label("date"),
        func.count(Queue.id).label("count")
    ).filter(Queue.created_at >= thirty_days_ago).group_by("date").all()
    
    return {
        "status_distribution": [{"status": status[0].value, "count": status[1]} for status in status_counts],
        "average_wait_times": [{"priority": priority[0], "avg_wait_minutes": float(priority[1]) if priority[1] else 0} for priority in avg_wait_times],
        "daily_trends": [{"date": str(day[0]), "queue_count": day[1]} for day in daily_queue_counts]
    }
