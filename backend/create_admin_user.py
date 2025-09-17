#!/usr/bin/env python3
"""
Script to create a new admin user for the Rural Telemedicine Portal
"""

from sqlalchemy.orm import Session
from database import SessionLocal, create_tables
from models import User, UserRole
from utils import get_password_hash
from datetime import datetime

def create_new_admin_user():
    """Create a new admin user account"""
    
    # Create database session
    db = SessionLocal()
    
    try:
        # New admin user details
        admin_data = {
            "name": "Dr. Ananya Sharma",
            "email": "ananya.sharma@ruralhealth.gov.in",
            "password": "admin2024",
            "role": UserRole.admin,
            "phone": "+91-9876543270"
        }
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == admin_data["email"]).first()
        if existing_user:
            print(f"User with email {admin_data['email']} already exists!")
            return False
        
        # Create new admin user
        new_admin = User(
            name=admin_data["name"],
            email=admin_data["email"],
            password=get_password_hash(admin_data["password"]),
            role=admin_data["role"],
            phone=admin_data["phone"],
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(new_admin)
        db.commit()
        
        print("New admin user created successfully!")
        print("=" * 60)
        print("NEW ADMIN LOGIN CREDENTIALS:")
        print("-" * 40)
        print(f"Name: {admin_data['name']}")
        print(f"Email: {admin_data['email']}")
        print(f"Password: {admin_data['password']}")
        print(f"Role: {admin_data['role']}")
        print(f"Phone: {admin_data['phone']}")
        print("-" * 40)
        print("ADMIN ACCESS CODES (use any one):")
        print("- RURAL_HEALTH_2024")
        print("- GOV_HEALTH_ADMIN")
        print("- EMERGENCY_OVERRIDE")
        print("-" * 40)
        print("You can now use these credentials to login to the admin portal!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def create_government_official():
    """Create a new government official user account"""
    
    db = SessionLocal()
    
    try:
        # New government official details
        gov_data = {
            "name": "Mr. Vikram Singh",
            "email": "vikram.singh@health.gov.in",
            "password": "govofficial2024",
            "role": UserRole.gov_official,
            "phone": "+91-9876543280"
        }
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == gov_data["email"]).first()
        if existing_user:
            print(f"User with email {gov_data['email']} already exists!")
            return False
        
        # Create new government official user
        new_gov_user = User(
            name=gov_data["name"],
            email=gov_data["email"],
            password=get_password_hash(gov_data["password"]),
            role=gov_data["role"],
            phone=gov_data["phone"],
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(new_gov_user)
        db.commit()
        
        print("New government official user created successfully!")
        print("=" * 60)
        print("NEW GOVERNMENT OFFICIAL LOGIN CREDENTIALS:")
        print("-" * 40)
        print(f"Name: {gov_data['name']}")
        print(f"Email: {gov_data['email']}")
        print(f"Password: {gov_data['password']}")
        print(f"Role: {gov_data['role']}")
        print(f"Phone: {gov_data['phone']}")
        print("-" * 40)
        print("ADMIN ACCESS CODES (use any one):")
        print("- RURAL_HEALTH_2024")
        print("- GOV_HEALTH_ADMIN")
        print("- EMERGENCY_OVERRIDE")
        print("-" * 40)
        print("You can now use these credentials to login to the admin portal!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"Error creating government official: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Main function to create new admin users"""
    print("Rural Telemedicine Portal - New Admin User Creation")
    print("=" * 70)
    
    print("\nChoose admin user type to create:")
    print("1. System Administrator")
    print("2. Government Official")
    print("3. Both")
    
    choice = input("\nEnter your choice (1/2/3): ").strip()
    
    if choice == "1":
        create_new_admin_user()
    elif choice == "2":
        create_government_official()
    elif choice == "3":
        print("\nCreating System Administrator...")
        create_new_admin_user()
        print("\nCreating Government Official...")
        create_government_official()
    else:
        print("Invalid choice!")

if __name__ == "__main__":
    main()
