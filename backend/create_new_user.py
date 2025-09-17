#!/usr/bin/env python3
"""
Script to create a new user login for the Rural Telemedicine Portal
"""

from sqlalchemy.orm import Session
from database import SessionLocal, create_tables
from models import User, Patient, UserRole
from utils import get_password_hash
from datetime import datetime

def create_new_patient_user():
    """Create a new patient user account"""
    
    # Create database session
    db = SessionLocal()
    
    try:
        # New user details
        user_data = {
            "name": "Arjun Patel",
            "email": "arjun.patel@email.com",
            "password": "newuser123",
            "role": UserRole.patient,
            "phone": "+91-9876543250"
        }
        
        # Patient specific details
        patient_data = {
            "age": 29,
            "gender": "Male",
            "village": "Newtown Village",
            "blood_group": "A+",
            "emergency_contact": "+91-9876543251",
            "medical_history": "No major health issues. Regular health checkups.",
            "allergies": "None known"
        }
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            print(f" User with email {user_data['email']} already exists!")
            return False
        
        # Create new user
        new_user = User(
            name=user_data["name"],
            email=user_data["email"],
            password=get_password_hash(user_data["password"]),
            role=user_data["role"],
            phone=user_data["phone"],
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create patient profile
        new_patient = Patient(
            user_id=new_user.id,
            age=patient_data["age"],
            gender=patient_data["gender"],
            village=patient_data["village"],
            blood_group=patient_data["blood_group"],
            emergency_contact=patient_data["emergency_contact"],
            medical_history=patient_data["medical_history"],
            allergies=patient_data["allergies"]
        )
        
        db.add(new_patient)
        db.commit()
        
        print("New patient user created successfully!")
        print("=" * 50)
        print("NEW LOGIN CREDENTIALS:")
        print("-" * 30)
        print(f"Name: {user_data['name']}")
        print(f"Email: {user_data['email']}")
        print(f"Password: {user_data['password']}")
        print(f"Role: {user_data['role']}")
        print(f"Phone: {user_data['phone']}")
        print(f"Village: {patient_data['village']}")
        print("-" * 30)
        print("You can now use these credentials to login to the patient portal!")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def create_new_doctor_user():
    """Create a new doctor user account"""
    
    # Import Doctor model
    from models import Doctor
    
    db = SessionLocal()
    
    try:
        # New doctor user details
        user_data = {
            "name": "Dr. Kavya Reddy",
            "email": "kavya.reddy@hospital.com",
            "password": "newdoc123",
            "role": UserRole.doctor,
            "phone": "+91-9876543260"
        }
        
        # Doctor specific details
        doctor_data = {
            "specialization": "Internal Medicine",
            "license_number": "MED006",
            "location": "Rural Health Center",
            "experience_years": 7,
            "is_available": True,
            "emergency_status": True
        }
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            print(f" User with email {user_data['email']} already exists!")
            return False
        
        # Create new user
        new_user = User(
            name=user_data["name"],
            email=user_data["email"],
            password=get_password_hash(user_data["password"]),
            role=user_data["role"],
            phone=user_data["phone"],
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create doctor profile
        new_doctor = Doctor(
            user_id=new_user.id,
            specialization=doctor_data["specialization"],
            license_number=doctor_data["license_number"],
            location=doctor_data["location"],
            experience_years=doctor_data["experience_years"],
            is_available=doctor_data["is_available"],
            emergency_status=doctor_data["emergency_status"],
            last_seen=datetime.utcnow()
        )
        
        db.add(new_doctor)
        db.commit()
        
        print("New doctor user created successfully!")
        print("=" * 50)
        print("NEW DOCTOR LOGIN CREDENTIALS:")
        print("-" * 30)
        print(f"Name: {user_data['name']}")
        print(f"Email: {user_data['email']}")
        print(f"Password: {user_data['password']}")
        print(f"Role: {user_data['role']}")
        print(f"Specialization: {doctor_data['specialization']}")
        print(f"License: {doctor_data['license_number']}")
        print(f"Location: {doctor_data['location']}")
        print("-" * 30)
        print("You can now use these credentials to login to the doctor portal!")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"Error creating doctor: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Main function to create new users"""
    print("Rural Telemedicine Portal - New User Creation")
    print("=" * 60)
    
    print("\nChoose user type to create:")
    print("1. Patient User")
    print("2. Doctor User")
    print("3. Both")
    
    choice = input("\nEnter your choice (1/2/3): ").strip()
    
    if choice == "1":
        create_new_patient_user()
    elif choice == "2":
        create_new_doctor_user()
    elif choice == "3":
        print("\nCreating Patient User...")
        create_new_patient_user()
        print("\nCreating Doctor User...")
        create_new_doctor_user()
    else:
        print("Invalid choice!")

if __name__ == "__main__":
    main()
