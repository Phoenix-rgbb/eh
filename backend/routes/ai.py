from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Patient, Record, Medicine, OutbreakAlert
from schemas import SymptomAnalysisRequest, SymptomAnalysisResponse, OutbreakAlertCreate, OutbreakAlertResponse
from utils import analyze_symptoms_ai, predict_medicine_demand
from .auth import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/analyze-symptoms", response_model=SymptomAnalysisResponse)
def analyze_symptoms(
    analysis_request: SymptomAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify patient exists and check authorization
    patient = db.query(Patient).filter(Patient.id == analysis_request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user.role == "patient":
        if patient.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to analyze symptoms for this patient")
    elif current_user.role not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get patient's medical history for context
    recent_records = db.query(Record).filter(
        Record.patient_id == analysis_request.patient_id
    ).order_by(Record.created_at.desc()).limit(5).all()
    
    medical_history = patient.medical_history or ""
    if recent_records:
        recent_symptoms = [record.symptoms for record in recent_records]
        medical_history += f" Recent visits: {'; '.join(recent_symptoms)}"
    
    # Perform AI analysis
    analysis_result = analyze_symptoms_ai(
        analysis_request.symptoms,
        medical_history
    )
    
    return SymptomAnalysisResponse(**analysis_result)

@router.get("/patient-insights/{patient_id}")
def get_patient_insights(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify patient exists and check authorization
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user.role == "patient":
        if patient.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get patient's consultation history
    records = db.query(Record).filter(
        Record.patient_id == patient_id
    ).order_by(Record.created_at.desc()).all()
    
    if not records:
        return {
            "total_consultations": 0,
            "common_symptoms": [],
            "health_trends": "No consultation history available",
            "recommendations": ["Schedule regular health checkups"]
        }
    
    # Analyze patterns
    all_symptoms = []
    emergency_count = 0
    
    for record in records:
        if record.symptoms:
            all_symptoms.extend(record.symptoms.lower().split())
        if record.is_emergency:
            emergency_count += 1
    
    # Find most common symptoms
    from collections import Counter
    symptom_counter = Counter(all_symptoms)
    common_symptoms = [symptom for symptom, count in symptom_counter.most_common(5) if len(symptom) > 3]
    
    # Generate insights
    health_trends = "Stable health pattern"
    if emergency_count > len(records) * 0.3:
        health_trends = "Frequent emergency visits - requires attention"
    elif len(records) > 10:
        health_trends = "Regular consultation pattern - good health monitoring"
    
    recommendations = []
    if "fever" in common_symptoms:
        recommendations.append("Monitor temperature regularly")
    if "pain" in common_symptoms:
        recommendations.append("Consider pain management consultation")
    if emergency_count > 2:
        recommendations.append("Schedule preventive health checkup")
    if not recommendations:
        recommendations.append("Maintain current health practices")
    
    return {
        "total_consultations": len(records),
        "emergency_visits": emergency_count,
        "common_symptoms": common_symptoms,
        "health_trends": health_trends,
        "recommendations": recommendations,
        "last_visit": records[0].created_at if records else None
    }

@router.post("/outbreak-prediction")
def predict_outbreak_impact(
    outbreak_data: OutbreakAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to create outbreak predictions")
    
    # Predict medicine demand
    medicine_demand = predict_medicine_demand(
        outbreak_data.disease_name,
        outbreak_data.affected_count,
        outbreak_data.location
    )
    
    # Check current medicine stock
    current_stock = {}
    for medicine_name in medicine_demand.keys():
        medicine = db.query(Medicine).filter(
            Medicine.name.ilike(f"%{medicine_name}%")
        ).first()
        if medicine:
            current_stock[medicine_name] = medicine.stock_quantity
        else:
            current_stock[medicine_name] = 0
    
    # Calculate shortages
    shortages = {}
    for medicine, demand in medicine_demand.items():
        current = current_stock.get(medicine, 0)
        if current < demand:
            shortages[medicine] = demand - current
    
    # Create outbreak alert
    db_outbreak = OutbreakAlert(
        disease_name=outbreak_data.disease_name,
        location=outbreak_data.location,
        affected_count=outbreak_data.affected_count,
        severity_level=outbreak_data.severity_level,
        description=outbreak_data.description,
        medicines_needed=str(medicine_demand)
    )
    
    db.add(db_outbreak)
    db.commit()
    db.refresh(db_outbreak)
    
    # Update medicine outbreak flags
    for medicine_name in medicine_demand.keys():
        medicine = db.query(Medicine).filter(
            Medicine.name.ilike(f"%{medicine_name}%")
        ).first()
        if medicine:
            medicine.outbreak_demand_flag = True
            db.commit()
    
    return {
        "outbreak_alert": OutbreakAlertResponse.from_orm(db_outbreak),
        "predicted_demand": medicine_demand,
        "current_stock": current_stock,
        "shortages": shortages,
        "recommendations": [
            f"Increase stock for {med} by {shortage} units"
            for med, shortage in shortages.items()
        ] if shortages else ["Current stock levels are adequate"]
    }

@router.get("/doctor-workload-prediction")
def predict_doctor_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view workload predictions")
    
    from sqlalchemy import func
    from datetime import datetime, timedelta
    from ..models import Queue, Doctor
    
    # Analyze current queue patterns
    current_queues = db.query(
        Doctor.specialization,
        func.count(Queue.id).label("queue_count"),
        func.avg(Queue.priority).label("avg_priority")
    ).join(Queue, Doctor.id == Queue.doctor_id, isouter=True)\
     .filter(Queue.status == "waiting")\
     .group_by(Doctor.specialization).all()
    
    # Analyze historical patterns (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    historical_data = db.query(
        Doctor.specialization,
        func.count(Record.id).label("consultations"),
        func.avg(
            func.extract('epoch', Record.created_at - Queue.created_at) / 60
        ).label("avg_consultation_time")
    ).join(Record, Doctor.id == Record.doctor_id)\
     .join(Queue, Queue.patient_id == Record.patient_id, isouter=True)\
     .filter(Record.created_at >= thirty_days_ago)\
     .group_by(Doctor.specialization).all()
    
    # Predict workload for next week
    predictions = []
    for spec_data in current_queues:
        specialization = spec_data[0]
        current_queue = spec_data[1] or 0
        avg_priority = spec_data[2] or 1
        
        # Find historical data for this specialization
        historical = next((h for h in historical_data if h[0] == specialization), None)
        avg_consultations = historical[1] if historical else 10
        avg_time = historical[2] if historical and historical[2] else 15
        
        # Simple prediction model
        predicted_demand = int(avg_consultations * 1.2)  # 20% increase assumption
        estimated_hours = (predicted_demand * avg_time) / 60
        
        predictions.append({
            "specialization": specialization,
            "current_queue": current_queue,
            "predicted_weekly_demand": predicted_demand,
            "estimated_hours_needed": round(estimated_hours, 1),
            "priority_level": "high" if avg_priority > 2.5 else "medium" if avg_priority > 1.5 else "low"
        })
    
    # Overall recommendations
    total_predicted_hours = sum(p["estimated_hours_needed"] for p in predictions)
    available_doctors = db.query(func.count(Doctor.id)).filter(Doctor.is_available == True).scalar()
    
    recommendations = []
    if total_predicted_hours > available_doctors * 40:  # Assuming 40 hours per week
        recommendations.append("Consider increasing doctor availability or hiring additional staff")
    
    high_demand_specs = [p["specialization"] for p in predictions if p["priority_level"] == "high"]
    if high_demand_specs:
        recommendations.append(f"High demand expected for: {', '.join(high_demand_specs)}")
    
    return {
        "workload_predictions": predictions,
        "total_predicted_hours": round(total_predicted_hours, 1),
        "available_doctors": available_doctors,
        "recommendations": recommendations
    }

@router.get("/health-trends/{location}")
def analyze_location_health_trends(
    location: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view health trends")
    
    from datetime import datetime, timedelta
    
    # Get patients from the specified location
    patients_in_location = db.query(Patient).filter(
        Patient.village.ilike(f"%{location}%")
    ).all()
    
    if not patients_in_location:
        return {"message": f"No patients found in {location}"}
    
    patient_ids = [p.id for p in patients_in_location]
    
    # Analyze recent health records (last 60 days)
    sixty_days_ago = datetime.utcnow() - timedelta(days=60)
    recent_records = db.query(Record).filter(
        Record.patient_id.in_(patient_ids),
        Record.created_at >= sixty_days_ago
    ).all()
    
    # Analyze symptom patterns
    all_symptoms = []
    emergency_cases = 0
    
    for record in recent_records:
        if record.symptoms:
            all_symptoms.extend(record.symptoms.lower().split())
        if record.is_emergency:
            emergency_cases += 1
    
    from collections import Counter
    symptom_counter = Counter(all_symptoms)
    common_symptoms = [
        {"symptom": symptom, "frequency": count}
        for symptom, count in symptom_counter.most_common(10)
        if len(symptom) > 3
    ]
    
    # Check for potential outbreak indicators
    outbreak_risk = "low"
    if len(recent_records) > len(patients_in_location) * 0.5:  # More than 50% of population visited
        outbreak_risk = "medium"
    if emergency_cases > len(recent_records) * 0.2:  # More than 20% emergency cases
        outbreak_risk = "high"
    
    return {
        "location": location,
        "population": len(patients_in_location),
        "recent_consultations": len(recent_records),
        "emergency_cases": emergency_cases,
        "common_symptoms": common_symptoms,
        "outbreak_risk": outbreak_risk,
        "recommendations": [
            "Monitor symptom patterns closely" if outbreak_risk == "medium" else
            "Consider immediate health intervention" if outbreak_risk == "high" else
            "Continue routine health monitoring"
        ]
    }
