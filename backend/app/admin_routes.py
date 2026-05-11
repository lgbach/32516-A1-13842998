"""
Admin routes for managing users and viewing activities - MongoDB version
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from typing import List, Optional
from app.schemas import UserResponse, UserActivity
from app.db_models import user_to_dict, activity_to_dict
from app.database import get_db
from app.auth import verify_token
from bson import ObjectId

router = APIRouter(prefix="/api/admin", tags=["admin"])


def get_current_admin(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
):
    """Dependency to verify admin access"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    token = authorization.split(" ")[1]
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin = Depends(get_current_admin),
    db = Depends(get_db)
):
    """Get all users (admin only)"""
    users = list(db.users.find({}))
    return [
        {
            "id": str(user["_id"]),
            "email": user["email"],
            "username": user["username"],
            "is_admin": user.get("is_admin", False)
        }
        for user in users
    ]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    admin = Depends(get_current_admin),
    db = Depends(get_db)
):
    """Get a specific user (admin only)"""
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "username": user["username"],
        "is_admin": user.get("is_admin", False)
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin = Depends(get_current_admin),
    db = Depends(get_db)
):
    """Delete a user (admin only)"""
    if user_id == str(admin["_id"]):
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    try:
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.users.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user's activities and expenses
    db.user_activities.delete_many({"user_id": user_id})
    db.expenses.delete_many({"user_id": user_id})
    
    # Delete user
    db.users.delete_one({"_id": object_id})
    
    return {"message": "User deleted successfully"}


@router.get("/activities")
async def get_activities(
    limit: int = Query(50, le=100),
    skip: int = Query(0),
    admin = Depends(get_current_admin),
    db = Depends(get_db)
):
    """Get recent user activities (admin only)"""
    activities = list(
        db.user_activities
        .find({})
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    
    return [activity_to_dict(activity) for activity in activities]


@router.get("/activities/user/{user_id}")
async def get_user_activities(
    user_id: str,
    limit: int = Query(50, le=100),
    admin = Depends(get_current_admin),
    db = Depends(get_db)
):
    """Get activities for a specific user (admin only)"""
    activities = list(
        db.user_activities
        .find({"user_id": user_id})
        .sort("timestamp", -1)
        .limit(limit)
    )
    
    return [activity_to_dict(activity) for activity in activities]


@router.get("/stats")
async def get_admin_stats(
    admin = Depends(get_current_admin),
    db = Depends(get_db)
):
    """Get system statistics (admin only)"""
    total_users = db.users.count_documents({})
    total_expenses = db.expenses.count_documents({})
    total_activities = db.user_activities.count_documents({})
    
    # Get recent users (last 7 days)
    from datetime import datetime, timedelta, timezone
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_users = db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    
    return {
        "total_users": total_users,
        "total_expenses": total_expenses,
        "total_activities": total_activities,
        "recent_users": recent_users
    }
