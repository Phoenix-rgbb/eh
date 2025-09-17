"""
AI Patient Database for Symptom-Treatment Case Matching
Contains real patient cases with symptoms, treatments, and doctor recommendations
"""

import json
from datetime import datetime
from typing import List, Dict, Optional
import re

class AIPatientDatabase:
    def __init__(self):
        self.patient_cases = [
            {
                "case_id": "RTP001",
                "patient_age": 45,
                "patient_gender": "male",
                "village": "Rampur",
                "symptoms": ["fever", "cough", "headache", "body_ache"],
                "symptom_description": "High fever for 3 days, dry cough, severe headache, muscle pain",
                "diagnosis": "Viral Fever",
                "treatment": "Paracetamol 500mg twice daily, plenty of fluids, rest",
                "doctor_name": "Dr. Sharma",
                "doctor_quote": "This is a typical viral fever case. The combination of high fever with body ache and dry cough indicates viral infection. Rest and symptomatic treatment will help recovery in 5-7 days.",
                "consultation_date": "2024-01-15",
                "recovery_time": "6 days",
                "severity": "moderate"
            },
            {
                "case_id": "RTP002",
                "patient_age": 28,
                "patient_gender": "female",
                "village": "Krishnapur",
                "symptoms": ["stomach_pain", "nausea", "vomiting", "diarrhea"],
                "symptom_description": "Severe stomach cramps, frequent vomiting, loose motions since morning",
                "diagnosis": "Gastroenteritis",
                "treatment": "ORS solution, Metronidazole 400mg thrice daily, light diet",
                "doctor_name": "Dr. Patel",
                "doctor_quote": "This appears to be acute gastroenteritis, likely from contaminated food or water. Hydration is key. The antibiotic will help if bacterial. Avoid solid foods for 24 hours.",
                "consultation_date": "2024-01-20",
                "recovery_time": "3 days",
                "severity": "moderate"
            },
            {
                "case_id": "RTP003",
                "patient_age": 65,
                "patient_gender": "male",
                "village": "Govindpur",
                "symptoms": ["chest_pain", "shortness_of_breath", "dizziness"],
                "symptom_description": "Sharp chest pain, difficulty breathing, feeling lightheaded",
                "diagnosis": "Hypertensive Crisis",
                "treatment": "Immediate BP medication, hospital referral, cardiac monitoring",
                "doctor_name": "Dr. Kumar",
                "doctor_quote": "This is a serious condition requiring immediate attention. The chest pain with breathing difficulty in an elderly patient suggests cardiovascular involvement. Emergency referral is necessary.",
                "consultation_date": "2024-01-25",
                "recovery_time": "14 days",
                "severity": "high"
            },
            {
                "case_id": "RTP004",
                "patient_age": 8,
                "patient_gender": "female",
                "village": "Rampur",
                "symptoms": ["fever", "rash", "sore_throat"],
                "symptom_description": "Mild fever, red rash on body, throat pain while swallowing",
                "diagnosis": "Viral Exanthem",
                "treatment": "Paracetamol syrup, throat lozenges, calamine lotion for rash",
                "doctor_name": "Dr. Sharma",
                "doctor_quote": "This is a common viral infection in children causing fever and rash. The rash will fade in 3-4 days. Keep the child hydrated and comfortable.",
                "consultation_date": "2024-02-01",
                "recovery_time": "5 days",
                "severity": "low"
            },
            {
                "case_id": "RTP005",
                "patient_age": 35,
                "patient_gender": "female",
                "village": "Madhavpur",
                "symptoms": ["headache", "neck_stiffness", "fever", "sensitivity_to_light"],
                "symptom_description": "Severe headache, stiff neck, high fever, eyes hurt in bright light",
                "diagnosis": "Suspected Meningitis",
                "treatment": "Immediate hospital referral, IV antibiotics, lumbar puncture",
                "doctor_name": "Dr. Gupta",
                "doctor_quote": "The combination of severe headache, neck stiffness, and photophobia is highly concerning for meningitis. This requires immediate hospital admission and aggressive treatment.",
                "consultation_date": "2024-02-05",
                "recovery_time": "21 days",
                "severity": "critical"
            },
            {
                "case_id": "RTP006",
                "patient_age": 22,
                "patient_gender": "male",
                "village": "Sundarpur",
                "symptoms": ["cough", "weight_loss", "night_sweats", "fatigue"],
                "symptom_description": "Persistent cough for 6 weeks, unexplained weight loss, night sweats",
                "diagnosis": "Pulmonary Tuberculosis",
                "treatment": "Anti-TB therapy (DOTS), nutritional support, isolation initially",
                "doctor_name": "Dr. Singh",
                "doctor_quote": "The chronic cough with constitutional symptoms like weight loss and night sweats strongly suggests tuberculosis. Sputum test confirmed it. DOTS therapy for 6 months is essential.",
                "consultation_date": "2024-02-10",
                "recovery_time": "180 days",
                "severity": "high"
            },
            {
                "case_id": "RTP007",
                "patient_age": 40,
                "patient_gender": "female",
                "village": "Krishnapur",
                "symptoms": ["joint_pain", "morning_stiffness", "swelling"],
                "symptom_description": "Pain in multiple joints, stiffness worse in morning, swollen knuckles",
                "diagnosis": "Rheumatoid Arthritis",
                "treatment": "Methotrexate, NSAIDs, physiotherapy, regular monitoring",
                "doctor_name": "Dr. Mehta",
                "doctor_quote": "The pattern of joint involvement and morning stiffness indicates inflammatory arthritis. Early treatment with disease-modifying drugs is crucial to prevent joint damage.",
                "consultation_date": "2024-02-15",
                "recovery_time": "ongoing",
                "severity": "moderate"
            },
            {
                "case_id": "RTP008",
                "patient_age": 55,
                "patient_gender": "male",
                "village": "Rampur",
                "symptoms": ["frequent_urination", "excessive_thirst", "fatigue", "blurred_vision"],
                "symptom_description": "Urinating every hour, always thirsty, tired all the time, vision problems",
                "diagnosis": "Type 2 Diabetes Mellitus",
                "treatment": "Metformin, dietary changes, regular exercise, blood sugar monitoring",
                "doctor_name": "Dr. Sharma",
                "doctor_quote": "These are classic symptoms of diabetes. The blood sugar is quite high. With proper medication and lifestyle changes, we can control this effectively.",
                "consultation_date": "2024-02-20",
                "recovery_time": "ongoing",
                "severity": "moderate"
            },
            {
                "case_id": "RTP009",
                "patient_age": 30,
                "patient_gender": "female",
                "village": "Govindpur",
                "symptoms": ["missed_periods", "nausea", "breast_tenderness", "fatigue"],
                "symptom_description": "Missed period for 6 weeks, morning sickness, sore breasts, feeling tired",
                "diagnosis": "Pregnancy (First Trimester)",
                "treatment": "Folic acid supplements, prenatal vitamins, regular check-ups",
                "doctor_name": "Dr. Priya",
                "doctor_quote": "Congratulations! You're about 6 weeks pregnant. Start taking folic acid immediately and avoid alcohol, smoking. Regular antenatal check-ups are important.",
                "consultation_date": "2024-02-25",
                "recovery_time": "N/A",
                "severity": "low"
            },
            {
                "case_id": "RTP010",
                "patient_age": 12,
                "patient_gender": "male",
                "village": "Madhavpur",
                "symptoms": ["wheezing", "shortness_of_breath", "cough", "chest_tightness"],
                "symptom_description": "Whistling sound while breathing, can't run without getting breathless, dry cough at night",
                "diagnosis": "Bronchial Asthma",
                "treatment": "Salbutamol inhaler, preventive inhaler, avoid triggers, peak flow monitoring",
                "doctor_name": "Dr. Reddy",
                "doctor_quote": "This is asthma triggered by dust and exercise. With proper inhaler technique and avoiding triggers, the child can lead a normal active life.",
                "consultation_date": "2024-03-01",
                "recovery_time": "ongoing",
                "severity": "moderate"
            },
            {
                "case_id": "RTP011",
                "patient_age": 70,
                "patient_gender": "female",
                "village": "Sundarpur",
                "symptoms": ["memory_loss", "confusion", "difficulty_speaking", "mood_changes"],
                "symptom_description": "Forgetting recent events, getting confused about time and place, trouble finding words",
                "diagnosis": "Early Dementia",
                "treatment": "Cognitive assessment, family counseling, safety measures, routine establishment",
                "doctor_name": "Dr. Agarwal",
                "doctor_quote": "The cognitive decline pattern suggests early dementia. While we can't reverse it, we can slow progression and improve quality of life with proper care and routine.",
                "consultation_date": "2024-03-05",
                "recovery_time": "progressive",
                "severity": "high"
            },
            {
                "case_id": "RTP012",
                "patient_age": 25,
                "patient_gender": "male",
                "village": "Krishnapur",
                "symptoms": ["skin_rash", "itching", "redness", "scaling"],
                "symptom_description": "Red, itchy patches on arms and legs, skin is flaky and dry",
                "diagnosis": "Eczema (Atopic Dermatitis)",
                "treatment": "Moisturizing cream, topical steroid, antihistamine, avoid irritants",
                "doctor_name": "Dr. Jain",
                "doctor_quote": "This is eczema, a chronic skin condition. Regular moisturizing is key. Use the steroid cream only during flare-ups. Identify and avoid your triggers.",
                "consultation_date": "2024-03-10",
                "recovery_time": "ongoing",
                "severity": "low"
            },
            {
                "case_id": "RTP013",
                "patient_age": 50,
                "patient_gender": "female",
                "village": "Rampur",
                "symptoms": ["hot_flashes", "night_sweats", "mood_swings", "irregular_periods"],
                "symptom_description": "Sudden heat waves, sweating at night, emotional ups and downs, periods becoming irregular",
                "diagnosis": "Menopause",
                "treatment": "Hormone replacement therapy, calcium supplements, lifestyle modifications",
                "doctor_name": "Dr. Priya",
                "doctor_quote": "You're entering menopause, which is natural at your age. HRT can help with symptoms. Focus on calcium-rich diet and regular exercise for bone health.",
                "consultation_date": "2024-03-15",
                "recovery_time": "ongoing",
                "severity": "low"
            },
            {
                "case_id": "RTP014",
                "patient_age": 18,
                "patient_gender": "male",
                "village": "Govindpur",
                "symptoms": ["severe_headache", "vomiting", "fever", "neck_pain"],
                "symptom_description": "Worst headache of life, projectile vomiting, high fever, neck hurts to move",
                "diagnosis": "Acute Meningitis",
                "treatment": "Emergency hospitalization, IV antibiotics, supportive care, isolation",
                "doctor_name": "Dr. Kumar",
                "doctor_quote": "This is acute bacterial meningitis - a medical emergency. Immediate IV antibiotics are started. With prompt treatment, full recovery is expected.",
                "consultation_date": "2024-03-20",
                "recovery_time": "14 days",
                "severity": "critical"
            },
            {
                "case_id": "RTP015",
                "patient_age": 38,
                "patient_gender": "female",
                "village": "Madhavpur",
                "symptoms": ["anxiety", "palpitations", "sweating", "trembling"],
                "symptom_description": "Constant worry, heart racing, excessive sweating, hands shaking",
                "diagnosis": "Generalized Anxiety Disorder",
                "treatment": "Counseling, relaxation techniques, mild anxiolytic if needed, lifestyle changes",
                "doctor_name": "Dr. Verma",
                "doctor_quote": "Anxiety is treatable. Counseling and relaxation techniques work well. Medication is only if symptoms are severe. Regular exercise helps significantly.",
                "consultation_date": "2024-03-25",
                "recovery_time": "60 days",
                "severity": "moderate"
            }
        ]
        
        # Symptom patterns and weights for AI matching
        self.symptom_weights = {
            "fever": 0.8,
            "cough": 0.7,
            "headache": 0.6,
            "chest_pain": 0.9,
            "shortness_of_breath": 0.9,
            "stomach_pain": 0.7,
            "nausea": 0.6,
            "vomiting": 0.7,
            "diarrhea": 0.7,
            "rash": 0.6,
            "joint_pain": 0.7,
            "fatigue": 0.5,
            "dizziness": 0.6,
            "weight_loss": 0.8,
            "night_sweats": 0.8,
            "frequent_urination": 0.7,
            "excessive_thirst": 0.7,
            "blurred_vision": 0.6,
            "memory_loss": 0.8,
            "confusion": 0.8,
            "anxiety": 0.6,
            "palpitations": 0.7
        }

    def find_similar_cases(self, symptoms: List[str], patient_age: int = None, patient_gender: str = None) -> List[Dict]:
        """Find similar patient cases based on symptoms and demographics"""
        similar_cases = []
        
        for case in self.patient_cases:
            similarity_score = self._calculate_similarity(symptoms, case["symptoms"], patient_age, case["patient_age"])
            if similarity_score > 0.3:  # Minimum threshold
                case_copy = case.copy()
                case_copy["similarity_score"] = similarity_score
                similar_cases.append(case_copy)
        
        # Sort by similarity score (highest first)
        similar_cases.sort(key=lambda x: x["similarity_score"], reverse=True)
        return similar_cases[:5]  # Return top 5 matches

    def _calculate_similarity(self, input_symptoms: List[str], case_symptoms: List[str], input_age: int = None, case_age: int = None) -> float:
        """Calculate similarity score between input symptoms and case symptoms"""
        if not input_symptoms or not case_symptoms:
            return 0.0
        
        # Symptom matching score
        common_symptoms = set(input_symptoms) & set(case_symptoms)
        symptom_score = len(common_symptoms) / max(len(input_symptoms), len(case_symptoms))
        
        # Weight the score based on symptom importance
        weighted_score = 0
        for symptom in common_symptoms:
            weight = self.symptom_weights.get(symptom, 0.5)
            weighted_score += weight
        
        symptom_score = weighted_score / len(input_symptoms) if input_symptoms else 0
        
        # Age similarity bonus (if provided)
        age_bonus = 0
        if input_age and case_age:
            age_diff = abs(input_age - case_age)
            if age_diff <= 5:
                age_bonus = 0.2
            elif age_diff <= 15:
                age_bonus = 0.1
        
        return min(symptom_score + age_bonus, 1.0)

    def get_ai_recommendations(self, symptoms: List[str], symptom_description: str = "", patient_age: int = None, patient_gender: str = None) -> Dict:
        """Get AI-powered recommendations based on similar cases"""
        similar_cases = self.find_similar_cases(symptoms, patient_age, patient_gender)
        
        if not similar_cases:
            return {
                "risk_level": "unknown",
                "possible_conditions": [],
                "recommendations": ["Consult a doctor for proper diagnosis"],
                "similar_cases": [],
                "confidence": 0.0
            }
        
        # Analyze the top matches
        top_case = similar_cases[0]
        risk_levels = [case["severity"] for case in similar_cases[:3]]
        diagnoses = [case["diagnosis"] for case in similar_cases[:3]]
        
        # Determine overall risk level
        risk_level = self._determine_risk_level(risk_levels)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(similar_cases[:3], risk_level)
        
        return {
            "risk_level": risk_level,
            "possible_conditions": list(set(diagnoses)),
            "recommendations": recommendations,
            "similar_cases": similar_cases[:3],
            "confidence": top_case["similarity_score"],
            "emergency_required": risk_level in ["high", "critical"]
        }

    def _determine_risk_level(self, risk_levels: List[str]) -> str:
        """Determine overall risk level from multiple cases"""
        if "critical" in risk_levels:
            return "critical"
        elif "high" in risk_levels:
            return "high"
        elif "moderate" in risk_levels:
            return "moderate"
        else:
            return "low"

    def _generate_recommendations(self, cases: List[Dict], risk_level: str) -> List[str]:
        """Generate recommendations based on similar cases"""
        recommendations = []
        
        if risk_level in ["critical", "high"]:
            recommendations.append("⚠️ Seek immediate medical attention")
            recommendations.append("🏥 Consider emergency room visit if symptoms worsen")
        
        # Extract common treatments and advice
        treatments = []
        for case in cases:
            treatments.append(case["treatment"])
        
        # Add general recommendations based on risk level
        if risk_level == "low":
            recommendations.extend([
                "💊 Over-the-counter medications may help with symptoms",
                "🏠 Rest and home care are usually sufficient",
                "📞 Contact doctor if symptoms persist beyond a few days"
            ])
        elif risk_level == "moderate":
            recommendations.extend([
                "👨‍⚕️ Schedule appointment with doctor within 24-48 hours",
                "📋 Monitor symptoms closely",
                "💊 Follow prescribed treatment plan"
            ])
        
        recommendations.extend([
            "💧 Stay hydrated",
            "🛌 Get adequate rest",
            "🌡️ Monitor your temperature regularly"
        ])
        
        return recommendations

# Initialize the database
ai_patient_db = AIPatientDatabase()
