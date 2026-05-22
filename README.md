# 💰 Smart Expense Tracker

**Gia Bach Le — 13842998**

---

## 📖 Project Overview

**Problem Statement:**
Managing personal finances can be overwhelming without proper tracking tools. Users struggle to monitor their spending patterns, categorize expenses, and gain insights into where their money goes.

**Solution:**
Smart Expense Tracker is a full-stack single-page application that empowers users to record, categorize, and analyze their expenses — with all data persisted in a MongoDB database via a REST API backend.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: **React** (v19.2.4) with React Router DOM for navigation
- **Build Tool**: **Vite** (v8.0.0) - Modern build tool for faster development
- **Styling**: Vanilla CSS (Grid & Flexbox) with Dark Mode support
- **Charts**: **Chart.js** (v4.5.1) with **react-chartjs-2** (v5.3.1) for data visualization
- **Language**: JavaScript (JSX)

### Backend
- **Framework**: **FastAPI** (v0.136.1) - Modern Python web framework
- **Server**: **Uvicorn** (v0.46.0) - ASGI server
- **Language**: Python 3.10+

### Database
- **Database**: **MongoDB** (v4.17.0 driver)
- **Connection**: PyMongo for MongoDB operations

### Authentication & Security
- **Password Hashing**: **bcrypt** (v5.0.0)
- **Token Authentication**: **JWT** (PyJWT v2.12.1)
- **Validation**: **Pydantic** (v2.13.3) for data validation

### Architecture Overview
```
┌─────────────────────────────────────────────────┐
│           SMART EXPENSE TRACKER                 │
├─────────────────────────────────────────────────┤
│  Frontend:        React 19 (Vite)               │
│  Routing:         React Router DOM v7           │
│  Backend:         Python 3 + FastAPI            │
│  Database:        MongoDB (port 27017)          │
│  API:             RESTful JSON (port 8000)      │
│  Dev Server:      Vite (port 5173)              │
└─────────────────────────────────────────────────┘
```

---

## ✨ Features Implemented

### Core Features
- ✅ **Single-Page Application** — React dynamically swaps tabs, no page reloads
- ✅ **Full CRUD Operations** — Add, View, Edit, and Delete expenses with MongoDB persistence
- ✅ **8 Expense Categories** — Food, Transport, Bills, Shopping, Entertainment, Utilities, Healthcare, Other
- ✅ **Live Search** — Real-time filtering by title or description (client-side instant results)
- ✅ **Category Filtering** — Filter expenses by category
- ✅ **Sorting** — Sort by date (newest/oldest) or amount (highest/lowest)
- ✅ **Dashboard Overview** — Total spend, monthly spend, average per day, last 5 expenses
- ✅ **Input Validation** — Frontend validation for required fields and positive amounts

### User Interface
- ✅ **Modal Editing** — Edit expenses in a popup modal
- ✅ **Confirmation Dialogs** — Delete expenses with confirmation
- ✅ **Dark Mode Toggle** — Responsive theme switching with system preference detection
- ✅ **Responsive Design** — Fully responsive for desktop and mobile
- ✅ **Smooth Animations** — Transitions and animations throughout the app
- ✅ **Keyboard Accessibility** — Proper keyboard navigation support

### Analytics & Visualization
- ✅ **Spending Breakdown** — Category-based visualization with doughnut charts
- ✅ **6-Month Trends** — Monthly spending trends with bar charts
- ✅ **Category Summary** — Count, total, and average per category in summary table

### Advanced Features
- ✅ **User Authentication** — Secure registration/login with JWT tokens
- ✅ **Password Security** — bcrypt hashing for all passwords
- ✅ **Admin Dashboard** — Admin users can manage all user accounts
- ✅ **Activity Tracking** — Audit logs for login/logout and CRUD operations
- ✅ **Error Handling** — Loading state and error banner with retry button
- ✅ **API Documentation** — Automatic Swagger docs at `/docs`

### Assignment Requirements Checklist
✅ **Dynamic Frontend Framework**: React  
✅ **Backend Framework**: FastAPI  
✅ **Database**: MongoDB  
✅ **User Authentication**: JWT + bcrypt  
✅ **Complex Features**: Live search, admin dashboard, activity tracking, data visualization  
✅ **Real-world Application**: Expense tracking/personal finance management

---

## 🔑 Key Features Deep Dive

### 1. **User Registration & Login** (JWT Authentication)

Users can create accounts and log in securely using email/password with JWT tokens.

**Password Hashing** (`backend/app/auth.py`):
```python
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
```

**JWT Token Creation** (`backend/app/auth.py`):
```python
def create_access_token(data: dict) -> str:
    """Create a JWT access token with 30-minute expiration"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt
```

**Login Flow**:
1. User submits email/password
2. Backend verifies credentials against MongoDB `users` collection
3. Password is checked using bcrypt
4. If valid, creates JWT token containing user_id and email
5. Returns token + user data to frontend
6. Frontend stores token in localStorage for subsequent requests

**Database** (`users` collection):
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  username: "username",
  password_hash: "$2b$12$...",  // bcrypt hashed
  is_admin: false,
  created_at: ISODate(),
  updated_at: ISODate()
}
```

### 2. **Live Search** (Real-time Filtering)

As users type in the search bar, expense items are filtered instantly without page reload or API call.

**Real-time Filtering Logic** (`frontend/src/App.jsx`):
```javascript
const filteredExpenses = expenses
  .filter(exp => {
    const matchesCategory = filters.category === 'All' || exp.category === filters.category;
    const matchesSearch = 
      exp.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (exp.description && exp.description.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesCategory && matchesSearch;
  })
```

**How It Works**:
- User types in search input
- `onChange` event updates `filters.search` state
- React re-renders component
- `filteredExpenses` recalculates matching expenses
- Only matching items are displayed (searches in title & description)
- **No API call needed** - filtering happens client-side for instant results

**Backend Server-side Search** (`backend/app/routes.py`):
```python
@router.get("/expenses/")
async def get_expenses(
    search: str = Query(None),  # Optional search parameter
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    query_filter = {"user_id": str(user["_id"])}
    
    if search:
        # Case-insensitive regex search in MongoDB
        regex_pattern = re.compile(search, re.IGNORECASE)
        query_filter["$or"] = [
            {"title": regex_pattern},
            {"description": regex_pattern}
        ]
    
    expenses = list(db.expenses.find(query_filter))
    return [expense_to_dict(exp) for exp in expenses]
```

The app uses **client-side filtering** for instant results, but also supports **server-side search** via MongoDB regex queries for scalability.

### 3. **Admin Dashboard** (User Management & Activity Tracking)

Admin users can view all users, delete accounts, and monitor all user activities.

**Features**:
- View all users with delete functionality
- View user activity logs (login/logout, CRUD operations, timestamps)
- Admin-only routes protected by JWT middleware
- Checks `user.is_admin` flag for access control

**Database** (`user_activities` collection):
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  username: "username",
  action: "LOGIN|CREATE_EXPENSE|UPDATE_EXPENSE|DELETE_EXPENSE|LOGOUT",
  details: {
    expense_id: ObjectId,  // for CRUD operations
    category: "Food",      // for expense operations
    amount: 50.00
  },
  timestamp: ISODate(),
  ip_address: "127.0.0.1"
}
```

### 4. **CRUD Operations** (Full Expense Management)

- **Create**: Add new expenses with title, amount, category, date, description
- **Read**: View all expenses with pagination and filters
- **Update**: Edit existing expense details
- **Delete**: Remove expenses with confirmation

---

## 🗂️ Folder Structure

```
32516-A1-13842998/
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx             # Main SPA component (all tabs, modals, logic)
│   │   ├── main.jsx            # React entry point
│   │   └── style.css           # All styling (CSS variables, dark mode, responsive)
│   ├── index.html              # Single HTML file
│   ├── vite.config.js          # Vite config with /api proxy to backend
│   └── package.json
│
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, startup, lifespan
│   │   ├── routes.py           # Expense CRUD endpoints
│   │   ├── auth_routes.py      # Login/register endpoints
│   │   ├── admin_routes.py     # User/activity management (admin only)
│   │   ├── auth.py             # JWT & bcrypt utilities
│   │   ├── database.py         # MongoDB connection & initialization
│   │   ├── db_models.py        # Data conversion helpers
│   │   └── schemas.py          # Pydantic request/response models
│   ├── create_admin.py         # Script to create admin users
│   ├── verify_admin.py         # Script to verify admin user
│   ├── main.py                 # Backend launcher
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment template
│
├── .gitignore
└── README.md
```

---

## How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB 4.0+ running on port 27017

### 1. Backend Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder (or copy `.env.example`):
```
MONGO_USER=root
MONGO_PASSWORD=root
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_DB=expense_tracker
MONGO_AUTH_SOURCE=admin

SECRET_KEY=your-super-secret-jwt-key-please-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

```powershell
uvicorn app.main:app --reload
# API:   http://localhost:8000
# Docs:  http://localhost:8000/docs
```

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## How to Use

### Managing Expenses
- **Add**: Click **+ Add New Expense** on the Overview tab
- **Edit**: Click **Edit** on any expense card to modify it in a modal
- **Delete**: Click **Delete** and confirm in the popup dialog
- **Filter**: Select a category from the dropdown
- **Search**: Type in the search box to find by title or description
- **Sort**: Choose newest/oldest/highest/lowest from the sort dropdown

### Viewing Analytics
- Switch to the **Analytics** tab
- View spending breakdown by category with visual bar charts
- Check monthly spending trends over the last 6 months
- See count, total, and average per category in the summary table

### Admin Features
**Admin Dashboard** allows administrators to manage all user accounts and view user activity logs (login/logout, CRUD operations).

#### Create an Admin User
Run the `create_admin.py` script in the backend folder:

```powershell
cd "f:\Studying\32516 Internet Prog\32516-A1-13842998\backend"
python create_admin.py admin@test.com admin_user AdminPassword123
```

Parameters:
- `admin@test.com` — Email address for the admin account
- `admin_user` — Username (optional, defaults to email prefix)
- `AdminPassword123` — Password (optional, defaults to 'TempPassword123!')

#### Access Admin Dashboard
1. Log in with the admin account credentials
2. Click the **Admin** link in the navigation menu (only visible to admin users)
3. View two tabs:
   - **Users**: List all users with delete functionality
   - **Activities**: View user activity logs (logins, CRUD operations, timestamps)

MongoDB is used for data persistence. Ensure MongoDB is running on `localhost:27017`.

---

## MongoDB Management with mongosh

### Connect to the Database
```powershell
mongosh -u root -p root --authenticationDatabase admin expense_tracker
```

**Connection details:**
- **Host:** 127.0.0.1
- **Port:** 27017
- **Username:** root
- **Password:** root
- **Database:** expense_tracker
- **Auth Source:** admin

### Useful mongosh Queries

#### View All Data
```javascript
// Show all users
db.users.find().pretty()

// Show all expenses
db.expenses.find().pretty()

// Show user activities
db.user_activities.find().pretty()
```

#### Helpful Commands
```javascript
// Count documents
db.expenses.countDocuments()

// Find specific user's expenses
db.expenses.find({ user_id: ObjectId("...") }).pretty()

// Delete all expenses for a user
db.expenses.deleteMany({ user_id: ObjectId("...") })

// Get total spending by category
db.expenses.aggregate([
  { $group: { _id: "$category", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])
```

---

## 🔗 API Structure

### Base URL: `http://localhost:8000/api`

```
/api
├── auth/
│   ├── POST    /register          - Create new user account
│   ├── POST    /login             - Login and get JWT token
│   └── POST    /logout            - Logout user
│
├── expenses/
│   ├── GET     /                  - List user expenses (with filters/search)
│   ├── POST    /                  - Create new expense
│   ├── GET     /{id}              - Get specific expense
│   ├── PUT     /{id}              - Update expense
│   └── DELETE  /{id}              - Delete expense
│
└── admin/
    ├── GET     /users             - Get all users (admin only)
    ├── GET     /users/{id}        - Get specific user (admin only)
    ├── DELETE  /users/{id}        - Delete user (admin only)
    ├── GET     /activities        - Get all activities (admin only)
    └── GET     /activities/user/{id} - Get user activities (admin only)
```

---

## 💾 MongoDB Collections

### Database: `expense_tracker`

#### 1. **users** Collection
Stores user account information with authentication credentials.

```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  username: "username",
  password_hash: "$2b$12$...",  // bcrypt hashed
  is_admin: false,
  created_at: ISODate("2026-05-22T12:00:00Z"),
  updated_at: ISODate("2026-05-22T12:00:00Z")
}
```

#### 2. **expenses** Collection
Stores expense records for each user.

```javascript
{
  _id: ObjectId,
  user_id: ObjectId("..."),
  title: "Lunch at Restaurant",
  description: "Lunch with colleagues",
  amount: 15.50,
  category: "Food",
  date: ISODate("2026-05-22T12:00:00Z"),
  created_at: ISODate("2026-05-22T12:00:00Z"),
  updated_at: ISODate("2026-05-22T12:00:00Z")
}
```

#### 3. **user_activities** Collection
Audit log for tracking user actions (login/logout, CRUD operations).

```javascript
{
  _id: ObjectId,
  user_id: ObjectId("..."),
  username: "username",
  action: "LOGIN|CREATE_EXPENSE|UPDATE_EXPENSE|DELETE_EXPENSE|LOGOUT",
  details: {
    expense_id: ObjectId,        // for expense operations
    category: "Food",
    amount: 15.50,
    old_amount: null,            // for updates
    new_amount: 20.00
  },
  timestamp: ISODate("2026-05-22T12:00:00Z"),
  ip_address: "127.0.0.1"
}
```

---

## 📊 Additional Libraries Used

### Frontend
- **react-router-dom** (v7.14.2) - Client-side routing
- **chart.js** (v4.5.1) - Chart library
- **react-chartjs-2** (v5.3.1) - React wrapper for Chart.js
- **vite** (v8.0.0) - Build tool

### Backend
- **uvicorn** (v0.46.0) - ASGI server
- **bcrypt** (v5.0.0) - Password hashing
- **PyJWT** (v2.12.1) - JWT token generation/validation
- **pydantic** (v2.13.3) - Data validation
- **pymongo** (v4.17.0) - MongoDB driver
- **python-dotenv** (v1.2.2) - Environment variables management

---

## 👥 Test Accounts

### Admin User:
- **Email**: admin@test.com
- **Username**: administrator
- **Password**: admin123

### Regular User:
- **Email**: giabach1532@gmail.com
- **Username**: giabach1532
- **Password**: Gi@b@ch1532

---

## 📝 Key Files to Review

### Frontend (React)
- **Main App**: `frontend/src/App.jsx` (single-file component architecture with all tabs, modals, and logic)
- **Styles**: `frontend/src/style.css` (CSS variables, dark mode, responsive)
- **Config**: `frontend/package.json`, `frontend/vite.config.js`

### Backend (FastAPI)
- **Entry Point**: `backend/app/main.py`
- **Authentication**: `backend/app/auth.py`, `backend/app/auth_routes.py`
- **Expenses API**: `backend/app/routes.py`
- **Admin API**: `backend/app/admin_routes.py`
- **Database**: `backend/app/database.py`, `backend/app/db_models.py`
- **Validation**: `backend/app/schemas.py`

### Utility Scripts
- **Create Admin**: `backend/create_admin.py`
- **Verify Admin**: `backend/verify_admin.py`

---

## 🚀 Deployment Notes

### Environment Variables (.env)
```
MONGO_USER=root
MONGO_PASSWORD=root
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_DB=expense_tracker
MONGO_AUTH_SOURCE=admin

SECRET_KEY=your-super-secret-jwt-key-please-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Production Considerations
1. Change `SECRET_KEY` to a strong random value
2. Set `ALLOWED_ORIGINS` to your production domain
3. Configure MongoDB with proper authentication in production
4. Build frontend with `npm run build` for optimized deployment
5. Run backend with production ASGI server (Gunicorn + Uvicorn)
6. Enable HTTPS for all connections
7. Set secure CORS policies

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running on `localhost:27017`
- Verify `.env` file exists with correct credentials
- Run `python -m uvicorn app.main:app --reload` from `backend/` directory

### Frontend can't connect to backend
- Check backend is running on `http://localhost:8000`
- Verify CORS settings in `backend/app/main.py`
- Check `frontend/vite.config.js` proxy configuration

### MongoDB connection issues
- Test connection: `mongosh -u root -p root --authenticationDatabase admin expense_tracker`
- Check credentials in `.env` file
- Ensure MongoDB service is running

---

## 📄 Quick Start Reference

```powershell
# 1. Backend Setup
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload

# 2. Frontend Setup (in new terminal)
cd frontend
npm install
npm run dev

# 3. Create Admin User (optional)
cd backend
python create_admin.py admin@test.com admin_user AdminPassword123
```

Then visit:
- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:8000**
- API Docs: **http://localhost:8000/docs**

---

## 🌐 How to Use the Application

### Managing Expenses
- **Add**: Click **+ Add New Expense** on the Overview tab
- **Edit**: Click **Edit** on any expense card to modify it in a modal
- **Delete**: Click **Delete** and confirm in the popup dialog
- **Filter**: Select a category from the dropdown
- **Search**: Type in the search box to find by title or description
- **Sort**: Choose newest/oldest/highest/lowest from the sort dropdown

### Viewing Analytics
- Switch to the **Analytics** tab
- View spending breakdown by category with visual charts
- Check monthly spending trends over the last 6 months
- See count, total, and average per category in the summary table

### Admin Features
1. Log in with admin account credentials
2. Click the **Admin** link in the navigation menu (only visible to admin users)
3. View two tabs:
   - **Users**: List all users with delete functionality
   - **Activities**: View user activity logs (logins, CRUD operations, timestamps)

---

## 📊 Database Management

### MongoDB Connection
```powershell
mongosh -u root -p root --authenticationDatabase admin expense_tracker
```

**Connection Details:**
- **Host:** 127.0.0.1
- **Port:** 27017
- **Username:** root
- **Password:** root
- **Database:** expense_tracker
- **Auth Source:** admin

### Useful Queries

```javascript
// View all documents
db.users.find().pretty()
db.expenses.find().pretty()
db.user_activities.find().pretty()

// Count documents
db.expenses.countDocuments()

// Find user's expenses
db.expenses.find({ user_id: ObjectId("...") }).pretty()

// Spending by category
db.expenses.aggregate([
  { $group: { _id: "$category", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])

// Activity logs for specific user
db.user_activities.find({ user_id: ObjectId("...") }).sort({ timestamp: -1 }).pretty()
```

---

## 🎓 Technical Details

### Architecture
- **Frontend SPA**: React Router v7 for client-side navigation
- **State Management**: React hooks (useState, useEffect)
- **API Communication**: Fetch API with JWT Bearer token authentication
- **Authentication**: JWT tokens (30-minute expiry) + bcrypt password hashing
- **Build**: Vite with HMR for fast development; proxy to backend API

### Database Indexes
- `users.email` — Unique index for fast email lookups
- `users.username` — Unique index for fast username lookups
- `expenses` — Composite index on (user_id, date)
- `user_activities` — Index on (user_id, timestamp)

---

## � Database Export & Setup

### Included Database Backup
The `database_export/` directory contains JSON exports of all MongoDB collections:

- **users.json** — User accounts with authentication data
- **expenses.json** — Expense records
- **user_activities.json** — User activity audit logs
- **_metadata.json** — Export metadata and collection counts

### Restoring the Database

#### Option 1: Using the Import Script
A utility script is included to restore the exported data:

```powershell
cd backend
python import_database.py
```

#### Option 2: Manual Import via mongosh
```powershell
mongosh -u root -p root --authenticationDatabase admin expense_tracker

# In mongosh shell:
db.users.deleteMany({})
db.expenses.deleteMany({})
db.user_activities.deleteMany({})

# Import from JSON files (MongoDB CLI)
mongoimport --authenticationDatabase admin -u root -p root \
  --host 127.0.0.1 --port 27017 -d expense_tracker \
  -c users --file database_export/users.json --jsonArray
```

### Exporting the Database

To create a fresh export of the database:

```powershell
python export_database.py
```

This creates JSON files in `database_export/` directory with all collections and metadata.

---

## 🎥 Assignment Submission

### Requirements Checklist
✅ **GitHub Repository**: [lgbach/32516-A1-13842998](https://github.com/lgbach/32516-A1-13842998)  
✅ **Database Export**: JSON files in `database_export/` directory  
✅ **README Documentation**: Complete setup and usage guide  
✅ **Video Demo**: Required (≤3 minutes)

### Submission Components

1. **Source Code** — Available on GitHub
   - Full frontend and backend code
   - Database export files
   - Utility scripts for database operations

2. **Database Export** — Located in `database_export/`
   - All MongoDB collections exported as JSON
   - Includes sample data for testing
   - Can be imported using the provided scripts

3. **README** — This file
   - Project overview and features
   - Complete setup instructions
   - API documentation
   - Troubleshooting guide

4. **Video Demonstration** (≤3 minutes)
   - To be recorded and submitted separately
   - Should demonstrate:
     - User authentication (registration/login)
     - Adding and managing expenses
     - Searching and filtering
     - Analytics and visualizations
     - Admin features (if applicable)

---

## 📚 License & Attribution

Created as an academic assignment for **Internet Programming (32516)**  
**Student:** Gia Bach Le — **Student ID:** 13842998

For questions or feedback, contact: giabach.le@student.uts.edu.au