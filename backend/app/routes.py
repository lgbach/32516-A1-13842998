from fastapi import APIRouter, HTTPException, Query, Depends, Header
from typing import List, Optional
from app.schemas import Expense, ExpenseCreate, ExpenseUpdate
from app.db_models import create_expense_document, expense_to_dict, create_activity_document, user_to_dict
from app.database import get_db
from app.auth import verify_token
from datetime import datetime, timezone
from bson import ObjectId
import re

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


def get_current_user(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
):
    """Dependency to get current authenticated user"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    token = authorization.split(" ")[1]
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


def log_activity(db, user_id: str, action: str, resource_type: str, resource_id: Optional[str] = None, details: Optional[str] = None):
    """Log user activity"""
    activity_doc = create_activity_document(user_id, action, resource_type, resource_id, details)
    db.user_activities.insert_one(activity_doc)


@router.get("/", response_model=List[Expense])
async def get_expenses(
    category: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    search: str = Query(None),
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all expenses for current user with optional filtering"""
    query_filter = {"user_id": str(user["_id"])}
    
    if category:
        query_filter["category"] = category
    
    if search:
        # Case-insensitive regex search
        regex_pattern = re.compile(search, re.IGNORECASE)
        query_filter["$or"] = [
            {"title": regex_pattern},
            {"description": regex_pattern}
        ]
    
    if start_date:
        query_filter["date"] = query_filter.get("date", {})
        query_filter["date"]["$gte"] = start_date
    
    if end_date:
        query_filter["date"] = query_filter.get("date", {})
        query_filter["date"]["$lte"] = end_date
    
    expenses = list(db.expenses.find(query_filter).sort("date", -1))
    return [expense_to_dict(exp) for exp in expenses]


@router.post("/", response_model=Expense)
async def create_expense(
    expense: ExpenseCreate,
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new expense for current user"""
    expense_doc = create_expense_document(
        user_id=str(user["_id"]),
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        date=expense.date,
        description=expense.description or ""
    )
    
    result = db.expenses.insert_one(expense_doc)
    expense_doc["_id"] = result.inserted_id
    
    # Log activity
    log_activity(db, str(user["_id"]), "create", "expense", str(result.inserted_id), f"Created expense: {expense.title}")
    
    return expense_to_dict(expense_doc)


@router.get("/{expense_id}", response_model=Expense)
async def get_expense(
    expense_id: str,
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get a specific expense by ID"""
    try:
        expense = db.expenses.find_one({
            "_id": ObjectId(expense_id),
            "user_id": str(user["_id"])
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid expense ID format")
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense_to_dict(expense)


@router.put("/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: str,
    expense: ExpenseUpdate,
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update an expense"""
    try:
        object_id = ObjectId(expense_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid expense ID format")
    
    # Check if expense exists and belongs to user
    existing_expense = db.expenses.find_one({
        "_id": object_id,
        "user_id": str(user["_id"])
    })
    
    if not existing_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Build update document
    update_data = expense.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Update the expense
    db.expenses.update_one(
        {"_id": object_id},
        {"$set": update_data}
    )
    
    # Get updated expense
    updated_expense = db.expenses.find_one({"_id": object_id})
    
    # Log activity
    log_activity(db, str(user["_id"]), "update", "expense", expense_id, f"Updated expense: {updated_expense['title']}")
    
    return expense_to_dict(updated_expense)


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete an expense"""
    try:
        object_id = ObjectId(expense_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid expense ID format")
    
    # Check if expense exists and belongs to user
    expense = db.expenses.find_one({
        "_id": object_id,
        "user_id": str(user["_id"])
    })
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Delete the expense
    db.expenses.delete_one({"_id": object_id})
    
    # Log activity
    log_activity(db, str(user["_id"]), "delete", "expense", expense_id, f"Deleted expense: {expense['title']}")
    
    return {"message": "Expense deleted successfully"}


@router.get("/stats/summary")
async def get_summary_stats(
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get summary statistics for user's expenses"""
    expenses = list(db.expenses.find({"user_id": str(user["_id"])}))
    
    if not expenses:
        return {
            "total_expenses": 0,
            "total_amount": 0.0,
            "average_amount": 0.0,
            "category_breakdown": []
        }
    
    total_amount = sum(exp["amount"] for exp in expenses)
    category_breakdown = {}
    
    for exp in expenses:
        cat = exp["category"]
        if cat not in category_breakdown:
            category_breakdown[cat] = {"category": cat, "total": 0.0, "count": 0}
        category_breakdown[cat]["total"] += exp["amount"]
        category_breakdown[cat]["count"] += 1
    
    return {
        "total_expenses": len(expenses),
        "total_amount": total_amount,
        "average_amount": total_amount / len(expenses),
        "category_breakdown": list(category_breakdown.values())
    }


@router.get("/stats/categories")
async def get_category_stats(
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get spending by category"""
    pipeline = [
        {"$match": {"user_id": str(user["_id"])}},
        {"$group": {
            "_id": "$category",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total": -1}}
    ]
    
    results = list(db.expenses.aggregate(pipeline))
    
    return [
        {
            "category": r["_id"],
            "total": r["total"],
            "count": r["count"]
        }
        for r in results
    ]
