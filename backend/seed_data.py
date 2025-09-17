import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal, create_tables
from models import User, Doctor, Patient, Medicine, Record, Queue, EmergencyAlert, OutbreakAlert, UserRole, QueueStatus
from utils import get_password_hash
from datetime import datetime, timedelta
import random

def seed_database():
    """Seed the database with sample data for testing and demonstration"""
    
    # Create tables
    create_tables()
    
    db = SessionLocal()
    
    try:
        # Clear existing data (optional - remove in production)
        db.query(OutbreakAlert).delete()
        db.query(EmergencyAlert).delete()
        db.query(Queue).delete()
        db.query(Record).delete()
        db.query(Medicine).delete()
        db.query(Patient).delete()
        db.query(Doctor).delete()
        db.query(User).delete()
        db.commit()
        
        print("Creating users...")
        
        # Create Admin User
        admin_user = User(
            name="System Administrator",
            email="admin@ruralhealth.gov.in",
            password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            phone="+91-9876543210"
        )
        db.add(admin_user)
        
        # Create Government Official
        gov_user = User(
            name="Dr. Rajesh Kumar",
            email="rajesh.kumar@health.gov.in",
            password=get_password_hash("gov123"),
            role=UserRole.GOV_OFFICIAL,
            phone="+91-9876543211"
        )
        db.add(gov_user)
        
        # Create Doctor Users
        doctors_data = [
            {
                "name": "Dr. Priya Sharma",
                "email": "priya.sharma@hospital.com",
                "specialization": "General Medicine",
                "license": "MED001",
                "location": "Primary Health Center",
                "experience": 8,
                "emergency": True
            },
            {
                "name": "Dr. Amit Patel",
                "email": "amit.patel@hospital.com",
                "specialization": "Pediatrics",
                "license": "MED002",
                "location": "Community Health Center",
                "experience": 12,
                "emergency": False
            },
            {
                "name": "Dr. Sunita Devi",
                "email": "sunita.devi@hospital.com",
                "specialization": "Gynecology",
                "license": "MED003",
                "location": "District Hospital",
                "experience": 15,
                "emergency": True
            },
            {
                "name": "Dr. Ravi Singh",
                "email": "ravi.singh@hospital.com",
                "specialization": "Cardiology",
                "license": "MED004",
                "location": "Referral Hospital",
                "experience": 20,
                "emergency": True
            },
            {
                "name": "Dr. Meera Gupta",
                "email": "meera.gupta@hospital.com",
                "specialization": "Dermatology",
                "license": "MED005",
                "location": "Skin Clinic",
                "experience": 6,
                "emergency": False
            }
        ]
        
        doctor_users = []
        for doc_data in doctors_data:
            user = User(
                name=doc_data["name"],
                email=doc_data["email"],
                password=get_password_hash("doctor123"),
                role=UserRole.DOCTOR,
                phone=f"+91-98765432{len(doctor_users)+12}"
            )
            db.add(user)
            doctor_users.append((user, doc_data))
        
        # Create Patient Users
        patients_data = [
            {
                "name": "Ramesh Kumar",
                "email": "ramesh.kumar@email.com",
                "age": 45,
                "gender": "Male",
                "village": "Bharatpur",
                "blood_group": "B+",
                "emergency_contact": "+91-9876543220"
            },
            {
                "name": "Sita Devi",
                "email": "sita.devi@email.com",
                "age": 32,
                "gender": "Female",
                "village": "Ramgarh",
                "blood_group": "O+",
                "emergency_contact": "+91-9876543221"
            },
            {
                "name": "Mohan Lal",
                "email": "mohan.lal@email.com",
                "age": 67,
                "gender": "Male",
                "village": "Sultanpur",
                "blood_group": "A+",
                "emergency_contact": "+91-9876543222"
            },
            {
                "name": "Geeta Sharma",
                "email": "geeta.sharma@email.com",
                "age": 28,
                "gender": "Female",
                "village": "Bharatpur",
                "blood_group": "AB+",
                "emergency_contact": "+91-9876543223"
            },
            {
                "name": "Suresh Yadav",
                "email": "suresh.yadav@email.com",
                "age": 54,
                "gender": "Male",
                "village": "Ramgarh",
                "blood_group": "O-",
                "emergency_contact": "+91-9876543224"
            },
            {
                "name": "Kamala Devi",
                "email": "kamala.devi@email.com",
                "age": 39,
                "gender": "Female",
                "village": "Sultanpur",
                "blood_group": "B-",
                "emergency_contact": "+91-9876543225"
            },
            {
                "name": "Rajesh Singh",
                "email": "rajesh.singh@email.com",
                "age": 41,
                "gender": "Male",
                "village": "Bharatpur",
                "blood_group": "A-",
                "emergency_contact": "+91-9876543226"
            },
            {
                "name": "Anita Kumari",
                "email": "anita.kumari@email.com",
                "age": 25,
                "gender": "Female",
                "village": "Ramgarh",
                "blood_group": "AB-",
                "emergency_contact": "+91-9876543227"
            },
            {
                "name": "Vinod Kumar",
                "email": "vinod.kumar@email.com",
                "age": 58,
                "gender": "Male",
                "village": "Sultanpur",
                "blood_group": "O+",
                "emergency_contact": "+91-9876543228"
            },
            {
                "name": "Sunita Rani",
                "email": "sunita.rani@email.com",
                "age": 36,
                "gender": "Female",
                "village": "Bharatpur",
                "blood_group": "B+",
                "emergency_contact": "+91-9876543229"
            }
        ]
        
        patient_users = []
        for pat_data in patients_data:
            user = User(
                name=pat_data["name"],
                email=pat_data["email"],
                password=get_password_hash("patient123"),
                role=UserRole.PATIENT,
                phone=pat_data["emergency_contact"]
            )
            db.add(user)
            patient_users.append((user, pat_data))
        
        db.commit()
        print(f"Created {len(doctor_users)} doctors and {len(patient_users)} patients")
        
        # Create Doctor profiles
        doctors = []
        for user, doc_data in doctor_users:
            doctor = Doctor(
                user_id=user.id,
                specialization=doc_data["specialization"],
                license_number=doc_data["license"],
                location=doc_data["location"],
                experience_years=doc_data["experience"],
                is_available=random.choice([True, True, True, False]),  # 75% available
                emergency_status=doc_data["emergency"],
                last_seen=datetime.utcnow() - timedelta(minutes=random.randint(0, 120))
            )
            db.add(doctor)
            doctors.append(doctor)
        
        # Create Patient profiles
        patients = []
        for user, pat_data in patient_users:
            patient = Patient(
                user_id=user.id,
                age=pat_data["age"],
                gender=pat_data["gender"],
                village=pat_data["village"],
                blood_group=pat_data["blood_group"],
                emergency_contact=pat_data["emergency_contact"],
                medical_history=f"Regular checkups, no major health issues. Resident of {pat_data['village']} village.",
                allergies="None known"
            )
            db.add(patient)
            patients.append(patient)
        
        db.commit()
        print("Created doctor and patient profiles")
        
        # Create Medicine inventory
        medicines_data = [
            {"name": "Paracetamol", "category": "Pain Relief", "stock": 500, "price": 2.50, "min_alert": 50, "supplier": "PharmaCorp"},
            {"name": "Amoxicillin", "category": "Antibiotics", "stock": 200, "price": 15.00, "min_alert": 30, "supplier": "MediSupply"},
            {"name": "Ibuprofen", "category": "Pain Relief", "stock": 300, "price": 5.00, "min_alert": 40, "supplier": "PharmaCorp"},
            {"name": "Cough Syrup", "category": "Fever & Cold", "stock": 150, "price": 25.00, "min_alert": 20, "supplier": "ColdCare"},
            {"name": "ORS Packets", "category": "Digestive", "stock": 1000, "price": 3.00, "min_alert": 100, "supplier": "HealthPlus"},
            {"name": "Vitamin D", "category": "Vitamins", "stock": 80, "price": 12.00, "min_alert": 25, "supplier": "VitaLife"},
            {"name": "Iron Tablets", "category": "Vitamins", "stock": 250, "price": 8.00, "min_alert": 50, "supplier": "VitaLife"},
            {"name": "Antiseptic", "category": "Emergency", "stock": 45, "price": 18.00, "min_alert": 20, "supplier": "MediCare"},
            {"name": "Bandages", "category": "Emergency", "stock": 120, "price": 6.00, "min_alert": 30, "supplier": "MediCare"},
            {"name": "Insulin", "category": "Diabetes", "stock": 15, "price": 150.00, "min_alert": 10, "supplier": "DiabetesSupply"}
        ]
        
        medicines = []
        for med_data in medicines_data:
            medicine = Medicine(
                name=med_data["name"],
                category=med_data["category"],
                stock_quantity=med_data["stock"],
                price=med_data["price"],
                minimum_stock_alert=med_data["min_alert"],
                supplier=med_data["supplier"],
                outbreak_demand_flag=random.choice([False, False, False, True])  # 25% chance
            )
            db.add(medicine)
            medicines.append(medicine)
        
        db.commit()
        print(f"Created {len(medicines)} medicines")
        
        # Create some medical records
        symptoms_list = [
            "Fever and headache for 3 days",
            "Persistent cough with chest pain",
            "Stomach pain and nausea",
            "High blood pressure symptoms",
            "Skin rash and itching",
            "Joint pain in knees",
            "Difficulty breathing",
            "Severe headache and dizziness",
            "Chest pain and palpitations",
            "Abdominal pain and vomiting"
        ]
        
        diagnoses_list = [
            "Viral fever - prescribed rest and paracetamol",
            "Bronchitis - prescribed antibiotics and cough syrup",
            "Gastritis - prescribed antacids and dietary changes",
            "Hypertension - prescribed medication and lifestyle changes",
            "Allergic dermatitis - prescribed antihistamines",
            "Arthritis - prescribed pain relief and physiotherapy",
            "Asthma - prescribed inhaler and breathing exercises",
            "Migraine - prescribed pain relief and rest",
            "Anxiety-related chest pain - prescribed counseling",
            "Food poisoning - prescribed ORS and rest"
        ]
        
        records = []
        for i in range(25):  # Create 25 sample records
            patient = random.choice(patients)
            doctor = random.choice(doctors)
            
            record = Record(
                patient_id=patient.id,
                doctor_id=doctor.id,
                symptoms=random.choice(symptoms_list),
                diagnosis=random.choice(diagnoses_list),
                prescriptions=f"Medicine prescribed: {random.choice(medicines).name}",
                notes="Follow-up recommended in 1 week",
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                is_emergency=random.choice([False, False, False, True])  # 25% emergency
            )
            db.add(record)
            records.append(record)
        
        db.commit()
        print(f"Created {len(records)} medical records")
        
        # Create some queue entries
        queue_symptoms = [
            "Sudden chest pain and shortness of breath",
            "High fever with chills",
            "Severe abdominal pain",
            "Persistent headache and nausea",
            "Skin infection with swelling"
        ]
        
        queues = []
        for i in range(8):  # Create 8 queue entries
            patient = random.choice(patients)
            doctor = random.choice([d for d in doctors if d.is_available])
            
            queue = Queue(
                patient_id=patient.id,
                doctor_id=doctor.id if random.choice([True, False]) else None,
                symptoms_brief=random.choice(queue_symptoms),
                status=random.choice([QueueStatus.WAITING, QueueStatus.WAITING, QueueStatus.IN_PROGRESS]),
                priority=random.randint(1, 4),
                created_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 120)),
                estimated_wait_time=random.randint(10, 45)
            )
            db.add(queue)
            queues.append(queue)
        
        db.commit()
        print(f"Created {len(queues)} queue entries")
        
        # Create emergency alerts
        emergency_types = ["cardiac", "respiratory", "trauma", "stroke", "poisoning"]
        locations = ["Bharatpur Village Center", "Ramgarh Health Post", "Sultanpur School", "Main Market Area"]
        
        alerts = []
        for i in range(3):  # Create 3 emergency alerts
            patient = random.choice(patients)
            doctor = random.choice([d for d in doctors if d.emergency_status])
            
            alert = EmergencyAlert(
                patient_id=patient.id,
                doctor_id=doctor.id if random.choice([True, False]) else None,
                alert_type=random.choice(emergency_types),
                location=random.choice(locations),
                description=f"Emergency situation requiring immediate medical attention",
                status=random.choice(["active", "assigned", "resolved"]),
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24))
            )
            db.add(alert)
            alerts.append(alert)
        
        db.commit()
        print(f"Created {len(alerts)} emergency alerts")
        
        # Create outbreak alerts
        diseases = ["Dengue", "Malaria", "Diarrhea", "Flu"]
        outbreak_locations = ["Bharatpur", "Ramgarh", "Sultanpur"]
        
        outbreaks = []
        for i in range(2):  # Create 2 outbreak alerts
            outbreak = OutbreakAlert(
                disease_name=random.choice(diseases),
                location=random.choice(outbreak_locations),
                affected_count=random.randint(5, 25),
                severity_level=random.randint(1, 4),
                description=f"Outbreak of {random.choice(diseases)} reported in {random.choice(outbreak_locations)} area",
                medicines_needed='{"Paracetamol": 100, "ORS Packets": 50}',
                status="active",
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 7))
            )
            db.add(outbreak)
            outbreaks.append(outbreak)
        
        db.commit()
        print(f"Created {len(outbreaks)} outbreak alerts")
        
        print("\n" + "="*50)
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*50)
        print("\nSample Login Credentials:")
        print("-" * 30)
        print("Admin:")
        print("  Email: admin@ruralhealth.gov.in")
        print("  Password: admin123")
        print("\nGovernment Official:")
        print("  Email: rajesh.kumar@health.gov.in")
        print("  Password: gov123")
        print("\nDoctor (example):")
        print("  Email: priya.sharma@hospital.com")
        print("  Password: doctor123")
        print("\nPatient (example):")
        print("  Email: ramesh.kumar@email.com")
        print("  Password: patient123")
        print("\nAll doctor emails: doctor123")
        print("All patient emails: patient123")
        print("-" * 30)
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
