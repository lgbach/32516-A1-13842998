from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List
from sqlalchemy.orm import Session
from app.schemas import Expense, ExpenseCreate, ExpenseUpdate, CategoryStats, SummaryStats
from app.db_models import DBExpense
from app.database import get_db
from datetime import datetime, timezone
from collections import defaultdict
import calendar

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/", response_model=List[Expense])
async def get_expenses(
    category: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db)
):
    """Get all expenses with optional filtering"""
    query = db.query(DBExpense)
    
    if category:
        query = query.filter(DBExpense.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (DBExpense.title.ilike(search_term)) |
            (DBExpense.description.ilike(search_term))
        )
    
    if start_date:
        query = query.filter(DBExpense.date >= start_date)
    
    if end_date:
        query = query.filter(DBExpense.date <= end_date)
    
    expenses = query.order_by(DBExpense.date.desc()).all()
    return [e.to_dict() for e in expenses]


@router.post("/", response_model=Expense)
async def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense"""
    new_expense = DBExpense(
        title=expense.title,
        category=expense.category,
        amount=expense.amount,
        date=expense.date,
        description=expense.description or ""
    )
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return new_expense.to_dict()


@router.get("/{expense_id}", response_model=Expense)
async def get_expense(expense_id: int, db: Session = Depends(get_db)):
    """Get a specific expense by ID"""
    expense = db.query(DBExpense).filter(DBExpense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense.to_dict()


@router.put("/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    db: Session = Depends(get_db)
):
    """Update an expense"""
    db_expense = db.query(DBExpense).filter(DBExpense.id == expense_id).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    
    return db_expense.to_dict()


@router.delete("/{expense_id}")
async def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense"""
    db_expense = db.query(DBExpense).filter(DBExpense.id == expense_id).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(db_expense)
    db.commit()
    
    return {"message": "Expense deleted successfully"}


@router.get("/stats/summary", response_model=SummaryStats)
async def get_summary_stats(db: Session = Depends(get_db)):
    """Get summary statistics"""
    expenses = db.query(DBExpense).all()
    
    total_spent = sum(e.amount for e in expenses)

    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year
    month_spent = sum(
        e.amount for e in expenses
        if datetime.fromisoformat(e.date).month == current_month
        and datetime.fromisoformat(e.date).year == current_year
    )

    days_in_month = calendar.monthrange(current_year, current_month)[1]
    avg_per_day = month_spent / days_in_month
    
    return {
        "total_spent": total_spent,
        "month_spent": month_spent,
        "avg_per_day": avg_per_day,
        "expense_count": len(expenses)
    }


@router.get("/stats/categories", response_model=List[CategoryStats])
async def get_category_stats(db: Session = Depends(get_db)):
    """Get spending statistics by category"""
    expenses = db.query(DBExpense).all()
    
    category_data = defaultdict(lambda: {"count": 0, "total": 0, "items": []})
    
    for expense in expenses:
        category = expense.category
        category_data[category]["count"] += 1
        category_data[category]["total"] += expense.amount
        category_data[category]["items"].append(expense.amount)
    
    result = []
    for category, data in category_data.items():
        average = data["total"] / data["count"] if data["count"] > 0 else 0
        result.append({
            "category": category,
            "count": data["count"],
            "total": data["total"],
            "average": average
        })
    
    return sorted(result, key=lambda x: x["total"], reverse=True)
