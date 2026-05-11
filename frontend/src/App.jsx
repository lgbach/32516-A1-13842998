import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import './style.css';

const THEME_KEY = 'expense-tracker-theme';
const TOKEN_KEY = 'auth-token';
const USER_KEY = 'current-user';
const API_BASE = 'http://localhost:8000/api';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Main App with Router
export default function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem(USER_KEY)) || null);
  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || 'light');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_KEY, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleLogin = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error logging out:', err);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <Router>
      <div className="app">
        {token ? (
          <>
            <Header theme={theme} toggleTheme={toggleTheme} user={user} onLogout={handleLogout} />
            <Routes>
              <Route path="/" element={<Dashboard token={token} user={user} theme={theme} />} />
              <Route path="/profile" element={<UserProfile token={token} user={user} theme={theme} />} />
              {user?.is_admin && <Route path="/admin" element={<AdminDashboard token={token} theme={theme} />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

// ============ Authentication Pages ============
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error('Invalid email or password');
      const data = await res.json();
      onLogin(data.access_token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>💰 Smart Expense Tracker</h1>
        <h2>Login</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-link">Don't have an account? <a href="/register">Register here</a></p>
      </div>
    </div>
  );
}

function RegisterPage({ onRegister }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });

      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();
      onRegister(data.access_token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>💰 Smart Expense Tracker</h1>
        <h2>Create Account</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-link">Already have an account? <a href="/login">Login here</a></p>
      </div>
    </div>
  );
}

// ============ Main Dashboard ============
function Dashboard({ token, user, theme }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    sort: 'date-desc'
  });

  useEffect(() => {
    fetchExpenses();
  }, [token]);

  const fetchExpenses = async () => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      const res = await fetch(`${API_BASE}/expenses/`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.status === 401) throw new Error('Session expired. Please log in again.');
      if (!res.ok) throw new Error(`Server error (${res.status}). Please try again.`);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
      setApiError(null);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setApiError('Request timed out. Check that the backend server is running on port 8000.');
      } else {
        setApiError(err.message || 'Could not load expenses. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/expenses/${editingId}` : `${API_BASE}/expenses/`;
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save expense');
      const result = await res.json();

      if (editingId) {
        setExpenses(expenses.map(exp => exp.id === editingId ? result : exp));
        setEditingId(null);
      } else {
        setExpenses([...expenses, result]);
      }
      setShowExpenseModal(false);
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Failed to save expense');
    }
  };

  const editExpense = (id) => {
    setEditingId(id);
    setShowExpenseModal(true);
  };

  const deleteExpense = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/expenses/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setExpenses(expenses.filter(exp => exp.id !== deleteTargetId));
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete expense');
    }
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const filteredExpenses = expenses
    .filter(exp => {
      const matchesCategory = filters.category === 'All' || exp.category === filters.category;
      const matchesSearch = 
        exp.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (exp.description && exp.description.toLowerCase().includes(filters.search.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case 'date-desc': return new Date(b.date) - new Date(a.date);
        case 'date-asc': return new Date(a.date) - new Date(b.date);
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        default: return 0;
      }
    });

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthSpent = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + exp.amount, 0);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const avgPerDay = monthSpent / daysInMonth;

  return (
    <main>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', fontSize: '1.1rem' }}>Loading...</div>
      ) : apiError ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--danger, #e53e3e)' }}>
          <p>{apiError}</p>
          <button className="btn btn-primary" onClick={fetchExpenses}>Retry</button>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              totalSpent={totalSpent}
              monthSpent={monthSpent}
              avgPerDay={avgPerDay}
              recentExpenses={recentExpenses}
              onAddExpense={() => setShowExpenseModal(true)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={filteredExpenses}
              filters={filters}
              setFilters={setFilters}
              onEdit={editExpense}
              onDelete={deleteExpense}
              onAddExpense={() => setShowExpenseModal(true)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab expenses={expenses} theme={theme} />
          )}

          {showExpenseModal && (
            <ExpenseModal
              editingExpense={editingId ? expenses.find(exp => exp.id === editingId) : null}
              onSubmit={handleFormSubmit}
              onClose={() => {
                setShowExpenseModal(false);
                setEditingId(null);
              }}
            />
          )}

          {showDeleteModal && (
            <DeleteModal
              onConfirm={confirmDelete}
              onCancel={() => {
                setShowDeleteModal(false);
                setDeleteTargetId(null);
              }}
            />
          )}
        </>
      )}
    </main>
  );
}

// ============ User Profile ============
function UserProfile({ token, user }) {
  return (
    <main>
      <section className="tab-content active" style={{ padding: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <a href="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>← Dashboard</a>
          <h2 style={{ margin: 0 }}>My Profile</h2>
        </div>
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Account Type:</strong> {user.is_admin ? 'Administrator' : 'User'}</p>
        </div>
      </section>
    </main>
  );
}

// ============ Admin Dashboard ============
function AdminDashboard({ token }) {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchAdminData();
  }, [token, activeTab]);

  const fetchAdminData = async () => {
    try {
      if (activeTab === 'users') {
        const res = await fetch(`${API_BASE}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } else {
        const res = await fetch(`${API_BASE}/admin/activities`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch activities');
        const data = await res.json();
        setActivities(data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  return (
    <main>
      <section className="tab-content active" style={{ padding: '40px' }}>
        <h2>Admin Dashboard</h2>

        <div className="nav-tabs" style={{ marginTop: '20px' }}>
          <button
            className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`nav-btn ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Activities
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : activeTab === 'users' ? (
          <div style={{ marginTop: '20px' }}>
            <h3>Manage Users ({users.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Username</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px' }}>{user.id}</td>
                    <td style={{ padding: '10px' }}>{user.email}</td>
                    <td style={{ padding: '10px' }}>{user.username}</td>
                    <td style={{ padding: '10px' }}>{user.is_admin ? 'Admin' : 'User'}</td>
                    <td style={{ padding: '10px' }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteUser(user.id)}
                        style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <h3>User Activities ({activities.length})</h3>
            <div style={{ marginTop: '10px' }}>
              {activities.slice(0, 20).map(activity => (
                <div
                  key={activity.id}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '6px',
                    borderLeft: '4px solid var(--primary-color)'
                  }}
                >
                  <strong>User {activity.user_id}</strong> - {activity.action} ({activity.resource_type})
                  <br />
                  <small>{new Date(activity.timestamp).toLocaleString()}</small>
                  {activity.details && <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{activity.details}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

// ============ UI Components ============
function Header({ theme, toggleTheme, user, onLogout }) {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      {/* Overlay to close panel when clicking outside */}
      {panelOpen && (
        <div className="panel-overlay" onClick={() => setPanelOpen(false)} />
      )}

      {/* Slide-in left panel */}
      <div className={`user-panel ${panelOpen ? 'open' : ''}`}>
        <div className="user-panel-header">
          <div className="user-panel-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <p className="user-panel-name">{user.username}</p>
          <p className="user-panel-email">{user.email}</p>
          <span className="user-panel-role">{user.is_admin ? '⭐ Admin' : 'User'}</span>
        </div>
        <div className="user-panel-actions">
          <a href="/profile" className="user-panel-btn" onClick={() => setPanelOpen(false)}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            View Profile
          </a>
          {user.is_admin && (
            <a href="/admin" className="user-panel-btn" onClick={() => setPanelOpen(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
              Admin Dashboard
            </a>
          )}
          <button className="user-panel-btn user-panel-logout" onClick={() => { setPanelOpen(false); onLogout(); }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
            Logout
          </button>
        </div>
      </div>

      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Avatar button on the left */}
          <button className="user-avatar-btn" onClick={() => setPanelOpen(!panelOpen)} aria-label="User menu">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            <span className="user-avatar-name">{user.username}</span>
          </button>
        </div>
        <div className="header-content" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <h1>💰 Smart Expense Tracker</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
            <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>
    </>
  );
}

function Navigation({ activeTab, setActiveTab, user }) {
  return (
    <nav className="nav-tabs">
      <button
        className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        Overview
      </button>
      <button
        className={`nav-btn ${activeTab === 'expenses' ? 'active' : ''}`}
        onClick={() => setActiveTab('expenses')}
      >
        Manage Expenses
      </button>
      <button
        className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => setActiveTab('analytics')}
      >
        Analytics
      </button>
      {user?.is_admin && (
        <a href="/admin" className="nav-btn">
          Admin
        </a>
      )}
    </nav>
  );
}

function OverviewTab({ totalSpent, monthSpent, avgPerDay, recentExpenses, onAddExpense }) {
  return (
    <section className="tab-content active">
      <div className="overview-container">
        <div className="summary-cards">
          <div className="summary-card total-card">
            <h3>Total Spent</h3>
            <p className="amount">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="summary-card month-card">
            <h3>This Month</h3>
            <p className="amount">${monthSpent.toFixed(2)}</p>
          </div>
          <div className="summary-card avg-card">
            <h3>Average per Day</h3>
            <p className="amount">${avgPerDay.toFixed(2)}</p>
          </div>
        </div>

        <div className="quick-add">
          <button className="btn btn-primary" onClick={onAddExpense}>+ Add New Expense</button>
        </div>

        <div className="recent-expenses">
          <h3>Recent Expenses</h3>
          <div className="expense-items">
            {recentExpenses.length === 0 ? (
              <div className="no-data">No expenses yet</div>
            ) : (
              recentExpenses.map(exp => (
                <div key={exp.id} className="expense-item-small">
                  <div>
                    <div className="expense-item-title">{exp.title}</div>
                    <div className="expense-item-meta">
                      <span>{exp.category}</span> • <span>{formatDate(exp.date)}</span>
                    </div>
                  </div>
                  <div className="expense-item-amount">${exp.amount.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExpensesTab({ expenses, filters, setFilters, onEdit, onDelete, onAddExpense }) {
  return (
    <section className="tab-content active">
      <div className="expenses-container">
        <div className="controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Live search expenses..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="filter-select"
            >
              <option>All</option>
              <option>Food</option>
              <option>Transport</option>
              <option>Bills</option>
              <option>Shopping</option>
              <option>Entertainment</option>
              <option>Utilities</option>
              <option>Healthcare</option>
              <option>Other</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="filter-select"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={onAddExpense}>+ Add Expense</button>
        </div>

        <div className="expense-list">
          {expenses.length === 0 ? (
            <div className="no-data">No expenses found</div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="expense-card">
                <div className="expense-card-content">
                  <div className="expense-category-badge">{exp.category}</div>
                  <div className="expense-details">
                    <h4>{exp.title}</h4>
                    <p>{exp.description}</p>
                    <small>{formatDate(exp.date)}</small>
                  </div>
                </div>
                <div className="expense-card-actions">
                  <div className="expense-amount">${exp.amount.toFixed(2)}</div>
                  <button className="btn btn-sm btn-primary" onClick={() => onEdit(exp.id)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => onDelete(exp.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function AnalyticsTab({ expenses = [], theme }) {
  const expenseList = Array.isArray(expenses) ? expenses : [];
  
  // Calculate category statistics
  const categoryStats = {};
  const monthlyStats = {};
  
  expenseList.forEach(exp => {
    const category = exp.category || 'Other';
    const amount = Number(exp.amount) || 0;
    
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, count: 0 };
    }
    categoryStats[category].total += amount;
    categoryStats[category].count += 1;
    
    // Monthly stats
    const expDate = new Date(exp.date);
    const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = 0;
    }
    monthlyStats[monthKey] += amount;
  });

  // Get last 6 months
  const last6Months = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    last6Months[monthKey] = monthlyStats[monthKey] || 0;
  }

  // Determine colors based on theme
  const isDark = theme === 'dark';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const tooltipBg = isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(0, 0, 0, 0.8)';

  // Chart data
  const categories = Object.keys(categoryStats);
  const categoryColors = {
    'Food': '#FF6B6B',
    'Transport': '#4ECDC4',
    'Bills': '#45B7D1',
    'Shopping': '#FFA07A',
    'Entertainment': '#98D8C8',
    'Utilities': '#F7DC6F',
    'Healthcare': '#BB8FCE',
    'Other': '#85C1E2'
  };

  const categoryChartData = {
    labels: categories,
    datasets: [{
      data: categories.map(cat => categoryStats[cat].total),
      backgroundColor: categories.map(cat => categoryColors[cat] || '#8E8E8E'),
      borderColor: borderColor,
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  const monthlyChartData = {
    labels: Object.keys(last6Months).map(m => {
      const [year, month] = m.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [{
      label: 'Monthly Spending',
      data: Object.values(last6Months),
      backgroundColor: '#45B7D1',
      borderColor: '#2A95BD',
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: '#2A95BD'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          padding: 15,
          font: { size: 12, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: borderColor,
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            return `$${value.toFixed(2)}`;
          }
        }
      }
    }
  };

  const totalSpent = Object.values(categoryStats).reduce((sum, cat) => sum + cat.total, 0);
  const avgPerCategory = categories.length > 0 ? totalSpent / categories.length : 0;
  const topCategory = categories.length > 0 
    ? categories.reduce((max, cat) => categoryStats[cat].total > categoryStats[max].total ? cat : max)
    : 'N/A';

  return (
    <section className="tab-content active">
      <div className="analytics-container">
        {/* Summary Cards */}
        <div className="analytics-summary">
          <div className="analytics-card">
            <h4>Total Spent</h4>
            <p className="analytics-amount">${totalSpent.toFixed(2)}</p>
            <span className="analytics-label">All Time</span>
          </div>
          <div className="analytics-card">
            <h4>Avg per Category</h4>
            <p className="analytics-amount">${avgPerCategory.toFixed(2)}</p>
            <span className="analytics-label">{categories.length} categories</span>
          </div>
          <div className="analytics-card">
            <h4>Top Category</h4>
            <p className="analytics-amount">{topCategory}</p>
            <span className="analytics-label">
              {topCategory !== 'N/A' ? `$${categoryStats[topCategory]?.total.toFixed(2) || '0.00'}` : '$0.00'}
            </span>
          </div>
          <div className="analytics-card">
            <h4>Total Transactions</h4>
            <p className="analytics-amount">{expenseList.length}</p>
            <span className="analytics-label">All expenses</span>
          </div>
        </div>

        {/* Charts */}
        <div className="analytics-charts">
          {/* Spending by Category - Doughnut Chart */}
          <div className="chart-container">
            <h3>Spending by Category</h3>
            <div className="chart-wrapper">
              {categories.length > 0 ? (
                <Doughnut data={categoryChartData} options={chartOptions} />
              ) : (
                <div className="no-data-chart">No expenses to display</div>
              )}
            </div>
          </div>

          {/* Monthly Trends - Bar Chart */}
          <div className="chart-container">
            <h3>6-Month Spending Trend</h3>
            <div className="chart-wrapper">
              <Bar 
                data={monthlyChartData}
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: textColor,
                        callback: function(value) {
                          return '$' + value.toFixed(0);
                        }
                      },
                      grid: { color: borderColor }
                    },
                    x: {
                      ticks: { color: textColor },
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Category Breakdown */}
        {categories.length > 0 && (
          <div className="analytics-table-section">
            <h3>Category Details</h3>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Transactions</th>
                  <th>Total Spent</th>
                  <th>Average</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const catData = categoryStats[cat];
                  const percentage = (catData.total / totalSpent * 100).toFixed(1);
                  const average = (catData.total / catData.count).toFixed(2);
                  return (
                    <tr key={cat}>
                      <td>
                        <span className="category-badge" style={{ backgroundColor: categoryColors[cat] || '#8E8E8E' }}>
                          {cat}
                        </span>
                      </td>
                      <td>{catData.count}</td>
                      <td className="amount-cell">${catData.total.toFixed(2)}</td>
                      <td className="amount-cell">${average}</td>
                      <td><span className="percentage-badge">{percentage}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function ExpenseModal({ editingExpense, onSubmit, onClose }) {
  const [formData, setFormData] = useState(editingExpense || {
    title: '',
    category: 'Food',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option>Food</option>
              <option>Transport</option>
              <option>Bills</option>
              <option>Shopping</option>
              <option>Entertainment</option>
              <option>Utilities</option>
              <option>Healthcare</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount *</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" required />
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3"></textarea>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Delete Expense?</h2>
        <p>This action cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
