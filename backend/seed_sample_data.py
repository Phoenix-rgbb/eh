#!/usr/bin/env python3
"""
Seed script to create sample users for the Rural Telemedicine Portal
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, create_tables
from models import User, UserRole
from utils import get_password_hash
from datetime import datetime

def create_sample_users():
    db = SessionLocal()
    
    try:
        # Create tables first
        create_tables()
        
        # Check if users already exist
        existing_admin = db.query(User).filter(User.email == "admin@ruralhealth.gov.in").first()
        if existing_admin:
            print("Sample users already exist!")
            return
        
        # Create sample users
        users = [
            {
                "name": "System Administrator",
                "email": "admin@ruralhealth.gov.in",
                "password": "admin123",
                "role": UserRole.ADMIN,
                "phone": "+91-9876543210"
            },
            {
                "name": "Dr. Priya Sharma",
                "email": "priya.sharma@hospital.com",
                "password": "doctor123",
                "role": UserRole.DOCTOR,
                "phone": "+91-9876543211"
            },
            {
                "name": "Ramesh Kumar",
                "email": "ramesh.kumar@email.com",
                "password": "patient123",
                "role": UserRole.PATIENT,
                "phone": "+91-9876543212"
            },
            {
                "name": "Rajesh Kumar Singh",
                "email": "rajesh.kumar@health.gov.in",
                "password": "gov123",
                "role": UserRole.GOV_OFFICIAL,
                "phone": "+91-9876543213"
            }
        ]
        
        for user_data in users:
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                phone=user_data["phone"],
                created_at=datetime.utcnow(),
                is_active=True
            )
            db.add(user)
        
        db.commit()
        
        print("✅ Sample users created successfully!")
        print("\n🔐 Login Credentials:")
        print("Admin: admin@ruralhealth.gov.in / admin123")
        print("Doctor: priya.sharma@hospital.com / doctor123")
        print("Patient: ramesh.kumar@email.com / patient123")
        print("Gov Official: rajesh.kumar@health.gov.in / gov123")
        
    except Exception as e:
        print(f"❌ Error creating sample users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_users()
