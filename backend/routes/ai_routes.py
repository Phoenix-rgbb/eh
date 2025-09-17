from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_patient_database import ai_patient_db

router = APIRouter(prefix="/ai-symptom", tags=["AI Health Assistant"])

class SymptomAnalysisRequest(BaseModel):
    symptoms: List[str]
    symptom_description: Optional[str] = ""
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    severity: Optional[str] = "moderate"

class SymptomAnalysisResponse(BaseModel):
    risk_level: str
    possible_conditions: List[str]
    recommendations: List[str]
    similar_cases: List[dict]
    confidence: float
    emergency_required: bool
    ai_insights: dict

@router.post("/analyze-symptoms")
async def analyze_symptoms(request: SymptomAnalysisRequest):
    """
    Analyze symptoms using AI patient database and provide health insights
    """
    try:
        # Get AI recommendations from patient database
        ai_result = ai_patient_db.get_ai_recommendations(
            symptoms=request.symptoms,
            symptom_description=request.symptom_description,
            patient_age=request.patient_age,
            patient_gender=request.patient_gender
        )
        
        # Enhanced AI insights
        ai_insights = {
            "analysis_method": "Case-based reasoning with patient database",
            "database_cases_analyzed": len(ai_patient_db.patient_cases),
            "matching_algorithm": "Weighted symptom similarity with demographic factors",
            "confidence_explanation": _get_confidence_explanation(ai_result["confidence"]),
            "risk_factors": _analyze_risk_factors(request.symptoms, request.patient_age),
            "follow_up_timeline": _get_follow_up_timeline(ai_result["risk_level"]),
            "red_flags": _identify_red_flags(request.symptoms)
        }
        
        return SymptomAnalysisResponse(
            risk_level=ai_result["risk_level"],
            possible_conditions=ai_result["possible_conditions"],
            recommendations=ai_result["recommendations"],
            similar_cases=ai_result["similar_cases"],
            confidence=ai_result["confidence"],
            emergency_required=ai_result["emergency_required"],
            ai_insights=ai_insights
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

def _get_confidence_explanation(confidence: float) -> str:
    """Explain the confidence score"""
    if confidence >= 0.8:
        return "Very high confidence - symptoms closely match known cases"
    elif confidence >= 0.6:
        return "High confidence - good symptom pattern match"
    elif confidence >= 0.4:
        return "Moderate confidence - partial symptom match found"
    elif confidence >= 0.2:
        return "Low confidence - limited symptom similarity"
    else:
        return "Very low confidence - no clear pattern match"

def _analyze_risk_factors(symptoms: List[str], age: Optional[int]) -> List[str]:
    """Analyze risk factors based on symptoms and demographics"""
    risk_factors = []
    
    # Age-based risk factors
    if age:
        if age > 65:
            risk_factors.append("Advanced age increases risk of complications")
        elif age < 5:
            risk_factors.append("Young age requires careful monitoring")
    
    # Symptom-based risk factors
    high_risk_symptoms = ["chest_pain", "shortness_of_breath", "severe_headache", "neck_stiffness"]
    for symptom in symptoms:
        if symptom in high_risk_symptoms:
            risk_factors.append(f"{symptom.replace('_', ' ').title()} is a concerning symptom")
    
    return risk_factors

def _get_follow_up_timeline(risk_level: str) -> str:
    """Get recommended follow-up timeline"""
    timelines = {
        "critical": "Immediate emergency care required",
        "high": "Seek medical attention within 2-4 hours",
        "moderate": "Schedule doctor visit within 24-48 hours",
        "low": "Monitor symptoms, contact doctor if worsening"
    }
    return timelines.get(risk_level, "Consult healthcare provider")

def _identify_red_flags(symptoms: List[str]) -> List[str]:
    """Identify red flag symptoms requiring immediate attention"""
    red_flags = []
    
    emergency_symptoms = {
        "chest_pain": "Chest pain may indicate heart attack",
        "shortness_of_breath": "Breathing difficulty requires urgent evaluation",
        "severe_headache": "Sudden severe headache may indicate serious condition",
        "neck_stiffness": "Neck stiffness with fever suggests meningitis",
        "confusion": "Altered mental status requires immediate attention",
        "high_fever": "Very high fever can lead to complications"
    }
    
    for symptom in symptoms:
        if symptom in emergency_symptoms:
            red_flags.append(emergency_symptoms[symptom])
    
    return red_flags
