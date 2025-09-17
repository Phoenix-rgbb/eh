from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from models import User, Doctor, Patient, UserRole
from schemas import UserCreate, UserLogin, AdminLogin, Token, UserResponse, DoctorCreate, PatientCreate
from utils import verify_password, get_password_hash, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    print(f"=== AUTH DEBUG ===")
    token = credentials.credentials
    print(f"Token received: {token[:50]}...")
    
    email = verify_token(token)
    print(f"Email from token: {email}")
    
    if email is None:
        print("Token verification failed!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.email == email).first()
    print(f"User found: {user.name if user else 'None'}")
    print(f"User role: {user.role if user else 'None'}")
    
    if user is None:
        print("User not found in database!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

@router.post("/register", response_model=Token)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            role=user_data.role,
            phone=user_data.phone
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(db_user)
    }

@router.post("/register/doctor", response_model=Token)
def register_doctor(doctor_data: DoctorCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == doctor_data.user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user first
    hashed_password = get_password_hash(doctor_data.user.password)
    db_user = User(
        name=doctor_data.user.name,
        email=doctor_data.user.email,
        password=hashed_password,
        role=doctor_data.user.role,
        phone=doctor_data.user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create doctor profile
    db_doctor = Doctor(
        user_id=db_user.id,
        specialization=doctor_data.specialization,
        license_number=doctor_data.license_number,
        location=doctor_data.location,
        experience_years=doctor_data.experience_years
    )
    db.add(db_doctor)
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(db_user)
    }

@router.post("/register/patient", response_model=Token)
def register_patient(patient_data: PatientCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == patient_data.user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user first
    hashed_password = get_password_hash(patient_data.user.password)
    db_user = User(
        name=patient_data.user.name,
        email=patient_data.user.email,
        password=hashed_password,
        role=patient_data.user.role,
        phone=patient_data.user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create patient profile
    db_patient = Patient(
        user_id=db_user.id,
        age=patient_data.age,
        gender=patient_data.gender,
        village=patient_data.village,
        medical_history=patient_data.medical_history,
        emergency_contact=patient_data.emergency_contact,
        blood_group=patient_data.blood_group,
        allergies=patient_data.allergies
    )
    db.add(db_patient)
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(db_user)
    }

@router.post("/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.post("/admin-login", response_model=Token)
def admin_login(admin_credentials: AdminLogin, db: Session = Depends(get_db)):
    # Predefined admin access codes for security
    VALID_ADMIN_CODES = {
        "RURAL_HEALTH_2024": "Primary admin access",
        "GOV_HEALTH_ADMIN": "Government health official access",
        "EMERGENCY_OVERRIDE": "Emergency administrative access"
    }
    
    # Validate admin access code
    if admin_credentials.admin_code not in VALID_ADMIN_CODES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin access code",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validate user credentials
    user = db.query(User).filter(User.email == admin_credentials.email).first()
    if not user or not verify_password(admin_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify user has admin or gov_official role
    if user.role not in [UserRole.admin, UserRole.gov_official]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have administrative privileges"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
