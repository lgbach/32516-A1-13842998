# 💰 Smart Expense Tracker

**Gia Bach Le — 13842998**
---

## Project Overview

**Problem Statement:**
Managing personal finances can be overwhelming without proper tracking tools. Users struggle to monitor their spending patterns, categorize expenses, and gain insights into where their money goes.

**Solution:**
Smart Expense Tracker is a full-stack single-page application that empowers users to record, categorize, and analyze their expenses — with all data persisted in a MongoDB database via a REST API backend.

---

## Technical Stack

```
┌─────────────────────────────────────────────────┐
│           SMART EXPENSE TRACKER                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Frontend:        React 19 (Vite)               │
│  Styling:         Vanilla CSS (Grid & Flexbox)  │
│  Routing:         React Router DOM v7           │
│  Backend:         Python 3 + FastAPI            │
│  Database Driver: PyMongo 4                     │
│  Database:        MongoDB                       │
│  API:             RESTful JSON (port 8000)      │
│  Dev Server:      Vite (port 5173)              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Feature List

- Single-Page Application — React dynamically swaps tabs, no page reloads
- Full CRUD: Add, View, Edit, and Delete expenses — all persisted in MongoDB
- 8 expense categories (Food, Transport, Bills, Shopping, Entertainment, Utilities, Healthcare, Other)
- Filter expenses by category
- Search expenses by title or description
- Sort by date (newest/oldest) or amount (highest/lowest)
- Dark mode toggle with system preference detection
- Overview dashboard: total spend, monthly spend, average per day, last 5 expenses
- Edit expenses via modal popup; delete with confirmation dialog
- Frontend input validation (required fields, positive amounts)
- Analytics: spending breakdown by category with bar charts, 6-month monthly trends, category summary table
- Loading state while fetching from API; error banner with retry button if API is unreachable
- Fully responsive design for desktop and mobile
- Smooth animations, transitions, and proper keyboard accessibility

---

## Folder Structure

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

View current data using MongoDB CLI:
```powershell
mongosh localhost:27017/expense_tracker
db.expenses.find().sort({date: -1})
```

Or use MongoDB Compass (GUI) to browse collections:
- **users** — User accounts (email, username, password_hash, is_admin flag)
- **expenses** — Expense items (title, amount, category, date, description, user_id)
- **user_activities** — Activity log (login, logout, CRUD operations, timestamps)

**Indexes** created automatically on startup:
- `users.email` — Unique index for fast email lookups
- `users.username` — Unique index for fast username lookups
- `expenses` — Composite index on (user_id, date) for filtering
- `user_activities` — Index on (user_id, timestamp) for activity logs

---

## Technology Stack Details

### Frontend (React 19 + Vite)
- **Architecture**: Client-side SPA with React Router v7 for navigation
- **State Management**: React hooks (useState, useEffect) for local component state
- **Styling**: Vanilla CSS with CSS variables for theme switching (dark/light mode)
- **HTTP Client**: Fetch API with JWT Bearer token authentication
- **Build Tool**: Vite with HMR (hot module reload) for fast development

### Backend (FastAPI + PyMongo)
- **API Design**: RESTful endpoints with Pydantic models for auto-validation
- **Authentication**: JWT tokens (30-min expiry) + bcrypt password hashing
- **Database Driver**: PyMongo 4 for MongoDB async operations
- **Auto Documentation**: OpenAPI/Swagger at `/docs` and `/redoc`
- **Startup/Shutdown**: Lifespan context manager for DB initialization & cleanup

### Database (MongoDB)
- **Data Model**: Document-based JSON with automatic schema validation via Pydantic
- **Indexing**: Automatic index creation on startup for query performance
- **Connection**: PyMongo with authentication and connection pooling

---

## Challenges Overcome

1. **Virtual environment issues**: Initial venv was linked to missing Microsoft Store Python. Fixed by creating fresh venv with standard Python 3.14.3 installation.

2. **Missing requirements.txt**: Backend requirements.txt was not in repository. Recreated with all necessary dependencies for FastAPI + MongoDB + Authentication.

3. **Database configuration**: Initial setup referenced MySQL but implementation uses MongoDB. Updated all documentation and removed outdated MySQL code files.

4. **React state mutation**: Fixed Array.sort() bug where state was mutated in place. Used spread operator to create new array before sorting to prevent unpredictable re-renders.

5. **JWT token validation**: Implemented proper token expiration (30 minutes) with timezone-aware UTC timestamps and verification on protected routes.

6. **API proxy configuration**: Vite dev server and FastAPI run on different ports. Configured Vite proxy to forward `/api` requests to backend (http://localhost:8000) without CORS issues.

7. **Analytics tab rendering**: Fixed missing `theme` prop in Dashboard component preventing Analytics tab from rendering. Now properly passes theme through component hierarchy.

8. **Chart.js dark mode colors**: Chart.js doesn't support CSS variables directly. Implemented dynamic color calculation based on theme state for readable charts in both light/dark modes.

9. **Admin account creation**: Created admin field naming issue (`password` vs `password_hash`). Fixed with database migration script and updated `create_admin.py` for future use.

---

## License & Attribution

Created as an academic assignment for **Internet Programming (32516)** — Gia Bach Le, Student ID: 13842998

**GitHub Repository**: https://github.com/lgbach/32516-A1-13842998

giabach1532@gmail.com Gi@bach1532
bachle15032002@gmail.com minhha7458
admin@test.com AdminPassword123