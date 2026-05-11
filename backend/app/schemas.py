from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


# ============ User Schemas ============
# Tutorial 10 Security: Input Validation with Field Constraints
class UserRegister(BaseModel):
    email: EmailStr  # Validates email format
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)  # Minimum 8 characters


class UserLogin(BaseModel):
    email: EmailStr  # Validates email format
    password: str


class User(BaseModel):
    id: str  # Changed from int to str for MongoDB ObjectId
    email: str
    username: str
    is_admin: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: str  # Changed from int to str for MongoDB ObjectId
    email: str
    username: str
    is_admin: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ============ User Activity Schemas ============
class UserActivityCreate(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[str] = None  # Changed to str for MongoDB ObjectId
    details: Optional[str] = None
    ip_address: Optional[str] = None


class UserActivity(BaseModel):
    id: str  # Changed to str for MongoDB ObjectId
    user_id: str  # Changed to str for MongoDB ObjectId
    action: str
    resource_type: str
    resource_id: Optional[str]  # Changed to str for MongoDB ObjectId
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: str

    class Config:
        from_attributes = True


# ============ Expense Schemas ============
# Tutorial 10 Security: Input Validation with Field Constraints
class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)  # Must be greater than 0
    date: str
    description: Optional[str] = Field(None, max_length=1000)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)  # Must be greater than 0
    date: Optional[str] = None
    description: Optional[str] = Field(None, max_length=1000)


class Expense(ExpenseBase):
    id: str  # Changed to str for MongoDB ObjectId
    user_id: str  # Changed to str for MongoDB ObjectId
    created_at: str
    updated_at: str

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
