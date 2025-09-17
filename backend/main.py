from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import create_tables, get_db
from routes import auth, doctors, patients, emergency, queues, pharmacy, ai_routes, admin_routes, consultation_queue

app = FastAPI(
    title="Rural Telemedicine Portal API",
    description="A comprehensive telemedicine platform for rural healthcare",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(doctors.router)
app.include_router(patients.router)
app.include_router(pharmacy.router)
app.include_router(queues.router)
app.include_router(consultation_queue.router)
app.include_router(emergency.router)
app.include_router(ai_routes.router)
app.include_router(admin_routes.router)

@app.on_event("startup")
def startup_event():
    create_tables()

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Rural Telemedicine Portal API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "OK"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "rural-telemedicine-api"}

@app.get("/gov-hospital/escalate/{consultation_id}")
def escalate_to_government_hospital(
    consultation_id: int,
    db: Session = Depends(get_db)
):
    """Escalate video call to linked city government hospitals"""
    # This is a placeholder for government hospital integration
    # In production, this would integrate with government hospital systems
    
    from models import Queue, Patient, Doctor
    
    consultation = db.query(Queue).filter(Queue.id == consultation_id).first()
    if not consultation:
        return {"error": "Consultation not found"}
    
    patient = db.query(Patient).filter(Patient.id == consultation.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == consultation.doctor_id).first()
    
    # Mock escalation data
    escalation_data = {
        "escalation_id": f"ESC-{consultation_id}-{consultation.created_at.strftime('%Y%m%d')}",
        "patient_info": {
            "name": patient.user.name if patient else "Unknown",
            "age": patient.age if patient else None,
            "village": patient.village if patient else "Unknown"
        },
        "referring_doctor": {
            "name": doctor.user.name if doctor else "Unknown",
            "specialization": doctor.specialization if doctor else "General"
        },
        "symptoms": consultation.symptoms_brief,
        "priority": consultation.priority,
        "government_hospital_contact": "+91-XXX-XXXX-XXXX",
        "video_call_link": f"https://gov-hospital-video.example.com/room/{consultation_id}",
        "status": "escalated",
        "estimated_response_time": "15-30 minutes"
    }
    
    return escalation_data
