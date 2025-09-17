from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"
    gov_official = "gov_official"

class QueueStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    admin_code: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Doctor Schemas
class DoctorBase(BaseModel):
    specialization: str
    license_number: str
    location: Optional[str] = None
    experience_years: Optional[int] = None

class DoctorCreate(DoctorBase):
    user: UserCreate

class DoctorUpdate(BaseModel):
    specialization: Optional[str] = None
    is_available: Optional[bool] = None
    emergency_status: Optional[bool] = None
    location: Optional[str] = None

class DoctorResponse(DoctorBase):
    id: int
    user_id: int
    is_available: bool
    emergency_status: bool
    last_seen: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True

# Patient Schemas
class PatientBase(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    village: Optional[str] = None
    medical_history: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None

class PatientCreate(PatientBase):
    user: UserCreate

class PatientUpdate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    user_id: int
    user: UserResponse
    
    class Config:
        from_attributes = True

# Record Schemas
class RecordBase(BaseModel):
    symptoms: str
    diagnosis: Optional[str] = None
    prescriptions: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    is_emergency: bool = False

class RecordCreate(RecordBase):
    patient_id: int
    doctor_id: int

class RecordResponse(RecordBase):
    id: int
    patient_id: int
    doctor_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Medicine Schemas
class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    category: Optional[str] = None
    stock_quantity: int = 0
    price: Optional[float] = None
    expiry_date: Optional[datetime] = None
    outbreak_demand_flag: bool = False
    minimum_stock_alert: int = 10
    supplier: Optional[str] = None

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    stock_quantity: Optional[int] = None
    price: Optional[float] = None
    outbreak_demand_flag: Optional[bool] = None

class MedicineResponse(MedicineBase):
    id: int
    
    class Config:
        from_attributes = True

# Queue Schemas
class QueueBase(BaseModel):
    symptoms_brief: str
    priority: int = 1

class QueueCreate(QueueBase):
    patient_id: int
    doctor_id: Optional[int] = None

class QueueUpdate(BaseModel):
    status: Optional[QueueStatus] = None
    doctor_id: Optional[int] = None
    priority: Optional[int] = None

class QueueResponse(QueueBase):
    id: int
    patient_id: int
    doctor_id: Optional[int] = None
    status: QueueStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_wait_time: Optional[int] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    
    class Config:
        from_attributes = True

# Emergency Schemas
class EmergencyAlertBase(BaseModel):
    alert_type: str
    location: str
    description: str

class EmergencyAlertCreate(EmergencyAlertBase):
    patient_id: int

class EmergencyAlertResponse(EmergencyAlertBase):
    id: int
    patient_id: int
    doctor_id: Optional[int] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Outbreak Schemas
class OutbreakAlertBase(BaseModel):
    disease_name: str
    location: str
    affected_count: int = 1
    severity_level: int = 1
    description: Optional[str] = None
    medicines_needed: Optional[str] = None

class OutbreakAlertCreate(OutbreakAlertBase):
    pass

class OutbreakAlertResponse(OutbreakAlertBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# AI Schemas
class SymptomAnalysisRequest(BaseModel):
    symptoms: List[str]
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    symptom_description: Optional[str] = None

class SimilarCase(BaseModel):
    case_id: str
    diagnosis: str
    symptoms: List[str]
    treatment: str
    doctor_quote: str
    doctor_name: str
    similarity_score: float

class AIInsights(BaseModel):
    symptom_summary: str
    contextual_analysis: str
    follow_up_timeline: str
    red_flags: List[str]

class SymptomAnalysisResponse(BaseModel):
    risk_level: str
    possible_conditions: List[str]
    recommendations: List[str]
    similar_cases: List[SimilarCase]
    confidence: float
    emergency_required: bool
    ai_insights: AIInsights

# Consultation Queue Schemas
class ConsultationQueueCreate(BaseModel):
    patient_name: str
    symptoms: str

class ConsultationQueueResponse(BaseModel):
    id: int
    patient_name: str
    symptoms: str
    status: str
    joined_at: datetime
    
    class Config:
        from_attributes = True

class AISymptomData(BaseModel):
    symptoms: List[str]
    symptom_description: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
