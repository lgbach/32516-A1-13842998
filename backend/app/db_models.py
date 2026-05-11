"""
MongoDB Document Models and Helper Functions
MongoDB uses flexible document structure, so we define helper functions instead of ORM models
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId


def create_user_document(
    email: str,
    username: str,
    password_hash: str,
    is_admin: bool = False
) -> Dict[str, Any]:
    """Create a user document for MongoDB"""
    return {
        "email": email,
        "username": username,
        "password_hash": password_hash,
        "is_admin": is_admin,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }


def user_to_dict(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert user document to response dictionary"""
    if not user_doc:
        return None
    return {
        "id": str(user_doc["_id"]),
        "email": user_doc.get("email"),
        "username": user_doc.get("username"),
        "is_admin": user_doc.get("is_admin", False),
        "created_at": user_doc.get("created_at").isoformat() if user_doc.get("created_at") else None,
        "updated_at": user_doc.get("updated_at").isoformat() if user_doc.get("updated_at") else None
    }


def create_expense_document(
    user_id: str,
    title: str,
    amount: float,
    category: str,
    date: str,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """Create an expense document for MongoDB"""
    return {
        "user_id": user_id,
        "title": title,
        "amount": amount,
        "category": category,
        "date": date,
        "description": description,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }


def expense_to_dict(expense_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert expense document to response dictionary"""
    if not expense_doc:
        return None
    return {
        "id": str(expense_doc["_id"]),
        "user_id": expense_doc.get("user_id"),
        "title": expense_doc.get("title"),
        "amount": expense_doc.get("amount"),
        "category": expense_doc.get("category"),
        "date": expense_doc.get("date"),
        "description": expense_doc.get("description"),
        "created_at": expense_doc.get("created_at").isoformat() if expense_doc.get("created_at") else None,
        "updated_at": expense_doc.get("updated_at").isoformat() if expense_doc.get("updated_at") else None
    }


def create_activity_document(
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """Create a user activity document for MongoDB"""
    return {
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc)
    }


def activity_to_dict(activity_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert activity document to response dictionary"""
    if not activity_doc:
        return None
    return {
        "id": str(activity_doc["_id"]),
        "user_id": activity_doc.get("user_id"),
        "action": activity_doc.get("action"),
        "resource_type": activity_doc.get("resource_type"),
        "resource_id": activity_doc.get("resource_id"),
        "details": activity_doc.get("details"),
        "ip_address": activity_doc.get("ip_address"),
        "timestamp": activity_doc.get("timestamp").isoformat() if activity_doc.get("timestamp") else None
    }
