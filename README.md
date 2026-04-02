# 💰 Smart Expense Tracker

**Gia Bach Le — 13842998**
---

## Project Overview

**Problem Statement:**
Managing personal finances can be overwhelming without proper tracking tools. Users struggle to monitor their spending patterns, categorize expenses, and gain insights into where their money goes.

**Solution:**
Smart Expense Tracker is a full-stack single-page application that empowers users to record, categorize, and analyze their expenses — with all data persisted in a MySQL database via a REST API backend.

---

## Technical Stack

```
┌─────────────────────────────────────────────────┐
│           SMART EXPENSE TRACKER                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Frontend:        React 19 (Vite)               │
│  Styling:         Vanilla CSS (Grid & Flexbox)  │
│  Routing:         React state-based SPA tabs    │
│  Backend:         Python 3 + FastAPI            │
│  ORM:             SQLAlchemy 2                  │
│  Database:        MySQL 9                       │
│  API:             RESTful JSON (port 8000)      │
│  Dev Server:      Vite (port 5173)              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Feature List

- Single-Page Application — React dynamically swaps tabs, no page reloads
- Full CRUD: Add, View, Edit, and Delete expenses — all persisted in MySQL
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
32661-A1-13842998/
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
│   │   ├── main.py             # FastAPI app, CORS, startup
│   │   ├── routes.py           # All REST endpoints (CRUD + analytics)
│   │   ├── database.py         # SQLAlchemy engine, session, auto DB creation
│   │   ├── db_models.py        # ORM model for expenses table
│   │   └── schemas.py          # Pydantic request/response schemas
│   ├── main.py                 # Convenience launcher (python main.py)
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # DB credentials (not committed)
│
├── expense_tracker.sql         # Database export
├── .gitignore
└── README.md
```

---

## How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8+ running on port 3306

### 1. Backend Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:
```
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=3306
DB_NAME=expense_tracker
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

---

## Database

Add MySQL to the PowerShell session PATH if needed:
```powershell
$env:PATH += ";C:\Program Files\MySQL\MySQL Server 9.6\bin"
```

View current data:
```powershell
mysql -u root -proot -e "SELECT id, title, category, amount, date, description FROM expense_tracker.expenses ORDER BY date DESC;"
```

Export database to `expense_tracker.sql`:
```powershell
& "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysqldump.exe" -u root -proot --set-gtid-purged=OFF expense_tracker > expense_tracker.sql
```

Import database:
```powershell
Get-Content expense_tracker.sql | mysql -u root -proot expense_tracker
```

---

## Challenges Overcome

1. **Python 3.14 compatibility**: Pinned package versions (e.g. `pydantic==2.4.2`) required Rust to compile from source on Python 3.14. Fixed by switching to flexible `>=` version constraints that have pre-built wheels available.

2. **SQLAlchemy Base registry split**: The ORM model (`DBExpense`) declared its own `Base = declarative_base()` separately from `database.py`, meaning `init_db()` saw zero models and never created tables. Fixed by importing `Base` from `database.py` in all model files.

3. **Auto database creation**: The app crashed on first run if the MySQL database didn't exist yet. Fixed `database.py` to connect without a database name first and run `CREATE DATABASE IF NOT EXISTS` before initialising SQLAlchemy.

4. **React state mutation bug**: `expenses.sort()` was mutating the state array in place, causing unpredictable re-renders in the Overview tab. Fixed by spreading into a new array (`[...expenses].sort(...)`) before sorting.

5. **API proxy configuration**: Vite's dev server runs on a different port from FastAPI. Configured Vite to proxy all `/api` requests to `http://localhost:8000` so the frontend uses relative URLs without CORS issues in development.


## License & Attribution

Created as an academic assignment for Internet Programming (32561) — Gia Bach Le, 13842998.

