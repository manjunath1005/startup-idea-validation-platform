import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from email_validator import validate_email, EmailNotValidError

from app.database import get_db
from app.models import User, OTPVerification
from app.schemas import UserCreate, UserLogin, UserResponse, Token, OTPRequest
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(otp_in: OTPRequest, db: Session = Depends(get_db)):
    # 1. Validate email address exists and is deliverable
    email = otp_in.email.strip().lower()
    try:
        # Check email deliverability (validates domain and MX records)
        validation_info = validate_email(email, check_deliverability=True)
        email = validation_info.ascii_email
    except EmailNotValidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email address is invalid or does not exist: {str(e)}"
        )
    except Exception as e:
        # Fail-safe logic if DNS check times out or fails (e.g. offline dev mode)
        # Just use syntax validation fallback
        try:
            validation_info = validate_email(email, check_deliverability=False)
            email = validation_info.ascii_email
        except EmailNotValidError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is syntactically invalid."
            )

    # 2. Check if a user with this email already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # 3. Clean up older OTP records for this email
    db.query(OTPVerification).filter(OTPVerification.email == email).delete()

    # 4. Generate random 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"

    # 5. Create new OTP record valid for 10 minutes
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    db_otp = OTPVerification(
        email=email,
        otp=otp,
        expires_at=expires_at
    )
    db.add(db_otp)
    db.commit()

    # 6. Send the OTP
    smtp_failed = False
    error_msg = ""
    try:
        send_otp_email(email, otp)
    except Exception as e:
        smtp_failed = True
        error_msg = str(e)
        print(f"Warning: SMTP email delivery failed: {error_msg}")

    if smtp_failed:
        return {
            "message": f"Verification code generated (SMTP delivery failed: {error_msg}). For testing, your verification code is: {otp}"
        }

    return {"message": f"Verification code sent successfully to {email}."}



@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    email = user_in.email.strip().lower()

    # 1. Check if email exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # 2. Check and verify OTP
    otp_record = db.query(OTPVerification).filter(
        OTPVerification.email == email
    ).order_by(OTPVerification.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP code has been sent to this email. Please request one first."
        )
    
    # Check expiry
    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code has expired. Please request a new one."
        )
    
    # Check match
    if otp_record.otp != user_in.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code. Please check your email and try again."
        )

    # 3. Create the user
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    db.add(db_user)
    
    # 4. Clean up verified OTP
    db.query(OTPVerification).filter(OTPVerification.email == email).delete()
    
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# Support standard OAuth2 Form login (useful for FastAPI /docs interactive Swagger)
@router.post("/swagger-login", response_model=Token, include_in_schema=False)
def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
