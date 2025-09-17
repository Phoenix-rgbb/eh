from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
import os
from dotenv import load_dotenv

from ai_patient_database import ai_patient_db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None

def calculate_wait_time(queue_position: int, avg_consultation_time: int = 15):
    """Calculate estimated wait time based on queue position"""
    return queue_position * avg_consultation_time

def prioritize_queue(symptoms: str, patient_age: int = None, medical_history: str = None):
    """Simple rule-based priority calculation"""
    priority = 1  # default low priority
    
    emergency_keywords = ["chest pain", "difficulty breathing", "severe bleeding", 
                         "unconscious", "heart attack", "stroke", "seizure"]
    high_priority_keywords = ["fever", "vomiting", "severe pain", "infection"]
    
    symptoms_lower = symptoms.lower()
    
    for keyword in emergency_keywords:
        if keyword in symptoms_lower:
            return 4  # emergency
    
    for keyword in high_priority_keywords:
        if keyword in symptoms_lower:
            priority = max(priority, 3)  # high priority
    
    # Age-based priority adjustment
    if patient_age and (patient_age > 65 or patient_age < 5):
        priority = max(priority, 2)  # medium priority for elderly and children
    
    return priority

def analyze_symptoms_ai(symptoms: List[str], patient_history: str = None, patient_age: int = None, patient_gender: str = None):
    """
    Analyzes symptoms using the AI patient database, providing a more advanced
    analysis than the original rule-based system.
    """
    ai_result = ai_patient_db.get_ai_recommendations(
        symptoms=symptoms,
        patient_age=patient_age,
        patient_gender=patient_gender
    )

    # Adapt the AI result to the format expected by legacy endpoints
    risk_map = {"low": 1, "moderate": 2, "high": 3, "critical": 4}
    urgency_level = risk_map.get(ai_result.get("risk_level", "low"), 1)

    possible_conditions = [
        {"name": cond, "probability": ai_result.get("confidence", 0.5)} 
        for cond in ai_result.get("possible_conditions", [])
    ]

    # Maintain specialist suggestions from the old system for compatibility
    symptom_patterns = {
        "fever": {"specialists": ["General Medicine", "Internal Medicine"]},
        "chest pain": {"specialists": ["Cardiology", "Emergency Medicine"]},
        "headache": {"specialists": ["Neurology", "General Medicine"]},
        "cough": {"specialists": ["Pulmonology", "General Medicine"]},
        "abdominal pain": {"specialists": ["Gastroenterology", "General Surgery"]},
    }
    specialists_set = set()
    for symptom in symptoms:
        symptom_lower = symptom.lower()
        for pattern, data in symptom_patterns.items():
            if pattern in symptom_lower:
                specialists_set.update(data["specialists"])

    return {
        "possible_conditions": possible_conditions,
        "recommended_actions": ai_result.get("recommendations", []),
        "urgency_level": urgency_level,
        "suggested_specialists": list(specialists_set)
    }

def predict_medicine_demand(disease_name: str, affected_count: int, location: str):
    """Predict medicine demand during outbreaks"""
    
    # Basic medicine requirements for common diseases
    disease_medicine_map = {
        "flu": ["Paracetamol", "Cough Syrup", "Vitamin C"],
        "diarrhea": ["ORS", "Loperamide", "Zinc Tablets"],
        "malaria": ["Artemether", "Paracetamol", "ORS"],
        "dengue": ["Paracetamol", "ORS", "Platelet Rich Plasma"],
        "covid": ["Paracetamol", "Vitamin D", "Zinc", "Oxygen"]
    }
    
    base_medicines = disease_medicine_map.get(disease_name.lower(), ["Paracetamol", "Basic Antibiotics"])
    
    # Calculate demand multiplier based on affected count
    demand_multiplier = max(1, affected_count // 10)
    
    medicine_demand = {}
    for medicine in base_medicines:
        medicine_demand[medicine] = affected_count * demand_multiplier
    
    return medicine_demand
