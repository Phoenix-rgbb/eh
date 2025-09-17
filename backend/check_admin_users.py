#!/usr/bin/env python3
"""
Script to check admin users and their roles in the database
"""

from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole

def check_admin_users():
    """Check all admin users in the database"""
    
    db = SessionLocal()
    
    try:
        # Get all users
        all_users = db.query(User).all()
        
        print("All Users in Database:")
        print("=" * 80)
        
        for user in all_users:
            print(f"ID: {user.id}")
            print(f"Name: {user.name}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role} (type: {type(user.role)})")
            print(f"Role Value: {user.role.value if hasattr(user.role, 'value') else 'No value attr'}")
            print(f"Is Active: {user.is_active}")
            print("-" * 40)
        
        # Check specifically admin and gov_official users
        admin_users = db.query(User).filter(User.role.in_([UserRole.admin, UserRole.gov_official])).all()
        
        print(f"\nAdmin/Gov Official Users Found: {len(admin_users)}")
        print("=" * 50)
        
        for admin in admin_users:
            print(f"Name: {admin.name}")
            print(f"Email: {admin.email}")
            print(f"Role: {admin.role}")
            print(f"Role Type: {type(admin.role)}")
            if hasattr(admin.role, 'value'):
                print(f"Role Value: {admin.role.value}")
            print(f"Active: {admin.is_active}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Error checking users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_admin_users()
