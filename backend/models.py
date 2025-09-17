from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base

class UserRole(enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"
    gov_official = "gov_official"

class QueueStatus(enum.Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    specialization = Column(String, nullable=False)
    license_number = Column(String, unique=True)
    is_available = Column(Boolean, default=True)
    emergency_status = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    location = Column(String)
    experience_years = Column(Integer)
    
    user = relationship("User")
    queues = relationship("Queue", back_populates="doctor")
    records = relationship("Record", back_populates="doctor")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    age = Column(Integer)
    gender = Column(String)
    village = Column(String)
    medical_history = Column(Text)
    emergency_contact = Column(String)
    blood_group = Column(String)
    allergies = Column(Text)
    
    user = relationship("User")
    queues = relationship("Queue", back_populates="patient")
    records = relationship("Record", back_populates="patient")

class Record(Base):
    __tablename__ = "records"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    symptoms = Column(Text, nullable=False)
    diagnosis = Column(Text)
    prescriptions = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    follow_up_date = Column(DateTime)
    is_emergency = Column(Boolean, default=False)
    
    patient = relationship("Patient", back_populates="records")
    doctor = relationship("Doctor", back_populates="records")

class Medicine(Base):
    __tablename__ = "pharmacy"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    generic_name = Column(String)
    category = Column(String)
    stock_quantity = Column(Integer, default=0)
    price = Column(Float)
    expiry_date = Column(DateTime)
    outbreak_demand_flag = Column(Boolean, default=False)
    minimum_stock_alert = Column(Integer, default=10)
    supplier = Column(String)
    
class Queue(Base):
    __tablename__ = "queues"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    status = Column(Enum(QueueStatus), default=QueueStatus.WAITING)
    priority = Column(Integer, default=1)  # 1=low, 2=medium, 3=high, 4=emergency
    symptoms_brief = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    estimated_wait_time = Column(Integer)  # in minutes
    
    patient = relationship("Patient", back_populates="queues")
    doctor = relationship("Doctor", back_populates="queues")

class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    alert_type = Column(String)  # cardiac, trauma, respiratory, etc.
    location = Column(String)
    description = Column(Text)
    status = Column(String, default="active")  # active, assigned, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    
class ConsultationQueue(Base):
    __tablename__ = "consultation_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    symptoms = Column(Text, nullable=False)
    status = Column(String, default="waiting")  # waiting, in_consultation, done
    joined_at = Column(DateTime, default=datetime.utcnow)

class OutbreakAlert(Base):
    __tablename__ = "outbreak_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    disease_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    affected_count = Column(Integer, default=1)
    severity_level = Column(Integer, default=1)  # 1-5 scale
    description = Column(Text)
    medicines_needed = Column(Text)  # JSON string of medicine requirements
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
