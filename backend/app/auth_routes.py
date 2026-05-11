"""
Authentication routes for user registration and login - MongoDB version
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.db_models import create_user_document, user_to_dict, create_activity_document
from app.database import get_db
from app.auth import hash_password, verify_password, create_access_token, verify_token
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister, db = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.users.find_one({
        "$or": [
            {"email": user_data.email},
            {"username": user_data.username}
        ]
    })
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    
    # Create new user with hashed password
    hashed_password = hash_password(user_data.password)
    user_doc = create_user_document(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        is_admin=False
    )
    
    result = db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Create access token
    access_token = create_access_token(data={"user_id": str(result.inserted_id), "email": user_data.email})
    
    user_response = user_to_dict(user_doc)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_response["id"],
            "email": user_response["email"],
            "username": user_response["username"],
            "is_admin": user_response["is_admin"]
        }
    }


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db = Depends(get_db)):
    """Login user and return access token"""
    user = db.users.find_one({"email": user_data.email})
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Log login activity
    activity_doc = create_activity_document(
        user_id=str(user["_id"]),
        action="login",
        resource_type="auth",
        details="User login successful"
    )
    db.user_activities.insert_one(activity_doc)
    
    # Create access token
    access_token = create_access_token(data={"user_id": str(user["_id"]), "email": user["email"]})
    
    user_response = user_to_dict(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_response["id"],
            "email": user_response["email"],
            "username": user_response["username"],
            "is_admin": user_response["is_admin"]
        }
    }


@router.post("/logout")
async def logout(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
):
    """Logout user and log the activity"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    token = authorization.split(" ")[1]
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Log logout activity
    activity_doc = create_activity_document(
        user_id=user_id,
        action="logout",
        resource_type="auth",
        details="User logout"
    )
    db.user_activities.insert_one(activity_doc)
    
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
):
    """Get current user information"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    token = authorization.split(" ")[1]
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_to_dict(user)
