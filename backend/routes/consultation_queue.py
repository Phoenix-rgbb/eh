from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ConsultationQueue
from schemas import ConsultationQueueCreate, ConsultationQueueResponse

router = APIRouter(prefix="/api/queue", tags=["consultation-queue"])

@router.post("/join", response_model=ConsultationQueueResponse)
def join_consultation_queue(
    queue_data: ConsultationQueueCreate,
    db: Session = Depends(get_db)
):
    """
    Add a patient to the consultation queue with their symptoms
    """
    # Create new consultation queue entry
    db_queue = ConsultationQueue(
        patient_name=queue_data.patient_name,
        symptoms=queue_data.symptoms,
        status="waiting"
    )
    
    db.add(db_queue)
    db.commit()
    db.refresh(db_queue)
    
    return db_queue

@router.get("/", response_model=List[ConsultationQueueResponse])
def get_consultation_queue(db: Session = Depends(get_db)):
    """
    Get all patients in the consultation queue with status 'waiting', sorted by joined_at
    """
    queues = db.query(ConsultationQueue).filter(
        ConsultationQueue.status == "waiting"
    ).order_by(ConsultationQueue.joined_at.asc()).all()
    
    return queues

@router.get("/all", response_model=List[ConsultationQueueResponse])
def get_all_consultation_queue(db: Session = Depends(get_db)):
    """
    Get all consultation queue entries (for admin/doctor view)
    """
    queues = db.query(ConsultationQueue).order_by(
        ConsultationQueue.joined_at.desc()
    ).all()
    
    return queues

@router.put("/{queue_id}/status")
def update_queue_status(
    queue_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """
    Update the status of a consultation queue entry
    """
    if status not in ["waiting", "in_consultation", "done"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    queue = db.query(ConsultationQueue).filter(
        ConsultationQueue.id == queue_id
    ).first()
    
    if not queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    queue.status = status
    db.commit()
    
    return {"message": f"Queue status updated to {status}"}
