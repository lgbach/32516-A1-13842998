from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ExpenseBase(BaseModel):
    title: str
    category: str
    amount: float
    date: str
    description: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None


class Expense(ExpenseBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True


class CategoryStats(BaseModel):
    category: str
    count: int
    total: float
    average: float


class SummaryStats(BaseModel):
    total_spent: float
    month_spent: float
    avg_per_day: float
    expense_count: int
