import React, { useState, useEffect } from 'react';
import './style.css';

const THEME_KEY = 'expense-tracker-theme';
const API_BASE = '/api/expenses';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [theme, setTheme] = useState('light');
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    sort: 'date-desc'
  });

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Load expenses from API
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Server error: ' + res.status);
      const data = await res.json();
      setExpenses(data);
      setApiError(null);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setApiError('Could not connect to the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update expense');
        const updated = await res.json();
        setExpenses(expenses.map(exp => exp.id === editingId ? updated : exp));
        setEditingId(null);
      } else {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create expense');
        const created = await res.json();
        setExpenses([...expenses, created]);
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Failed to save expense. Please try again.');
    }
    setShowExpenseModal(false);
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
      const res = await fetch(`${API_BASE}/${deleteTargetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      setExpenses(expenses.filter(exp => exp.id !== deleteTargetId));
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense. Please try again.');
    }
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const filteredExpenses = expenses
    .filter(exp => {
      const matchesCategory = filters.category === 'All' || exp.category === filters.category;
      const matchesSearch = exp.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                           exp.description.toLowerCase().includes(filters.search.toLowerCase());
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
    <div className="app-container">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', fontSize: '1.1rem' }}>Loading expenses...</div>
      ) : apiError ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--danger, #e53e3e)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '12px' }}>⚠️ {apiError}</p>
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
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab expenses={expenses} />
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
    </div>
  );
}

function Header({ theme, toggleTheme }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>💰 Smart Expense Tracker</h1>
        <p className="subtitle">Track, analyze and manage your spending intelligently</p>
      </div>
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
        <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
      </button>
    </header>
  );
}

function Navigation({ activeTab, setActiveTab }) {
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
              <div className="no-data">No expenses yet. Add one to get started!</div>
            ) : (
              recentExpenses.map(exp => (
                <div key={exp.id} className="expense-item-small">
                  <div className="expense-item-info">
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

function ExpensesTab({ expenses, filters, setFilters, onEdit, onDelete }) {
  return (
    <section className="tab-content active">
      <div className="expenses-container">
        <div className="filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search expenses..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
          <select
            className="filter-select"
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="All">All Categories</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Shopping">Shopping</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Utilities">Utilities</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Other">Other</option>
          </select>
          <select
            className="filter-select"
            value={filters.sort}
            onChange={(e) => setFilters({...filters, sort: e.target.value})}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

        <div className="expense-list">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <h3>No expenses found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="expense-card">
                <div className="expense-info">
                  <div className="expense-title">{exp.title}</div>
                  <span className="expense-category">{exp.category}</span>
                  <div className="expense-meta">
                    📅 {formatDate(exp.date)}
                  </div>
                  {exp.description && (
                    <div className="expense-description">{exp.description}</div>
                  )}
                </div>
                <div>
                  <div className="expense-amount">${exp.amount.toFixed(2)}</div>
                  <div className="expense-actions">
                    <button className="btn btn-secondary" onClick={() => onEdit(exp.id)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => onDelete(exp.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function AnalyticsTab({ expenses }) {
  const categories = {};
  expenses.forEach(exp => {
    if (!categories[exp.category]) {
      categories[exp.category] = { count: 0, total: 0, items: [] };
    }
    categories[exp.category].count += 1;
    categories[exp.category].total += exp.amount;
    categories[exp.category].items.push(exp.amount);
  });

  const maxAmount = Math.max(...Object.values(categories).map(c => c.total), 1);

  const monthlyData = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyData[monthKey] = 0;
  }
  expenses.forEach(exp => {
    const date = new Date(exp.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (monthKey in monthlyData) {
      monthlyData[monthKey] += exp.amount;
    }
  });
  const maxMonthly = Math.max(...Object.values(monthlyData), 1);

  return (
    <section className="tab-content active">
      <div className="analytics-container">
        <div className="category-breakdown">
          <h3>Spending by Category</h3>
          <div className="chart-container">
            {Object.keys(categories).length === 0 ? (
              <div className="no-data">No expense data available</div>
            ) : (
              <div className="category-list">
                {Object.entries(categories)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([category, data]) => {
                    const percentage = (data.total / maxAmount) * 100;
                    return (
                      <div key={category} className="category-item">
                        <div className="category-label">{category}</div>
                        <div className="category-bar">
                          <div className="category-bar-fill" style={{ width: `${percentage}%` }}>
                            ${data.total.toFixed(2)}
                          </div>
                        </div>
                        <div className="category-amount">${data.total.toFixed(2)}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        <div className="monthly-trends">
          <h3>Monthly Trends</h3>
          <div className="chart-container">
            <div className="category-list">
              {Object.entries(monthlyData).map(([month, amount]) => {
                const percentage = (amount / maxMonthly) * 100;
                return (
                  <div key={month} className="category-item">
                    <div className="category-label">{month}</div>
                    <div className="category-bar">
                      <div className="category-bar-fill" style={{ width: `${percentage}%` }}>
                        {amount > 0 ? `$${amount.toFixed(2)}` : ''}
                      </div>
                    </div>
                    <div className="category-amount">${amount.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="category-table">
          <h3>Category Details</h3>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Total</th>
                <th>Average</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(categories).length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No data</td>
                </tr>
              ) : (
                Object.entries(categories)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([category, data]) => {
                    const average = data.total / data.count;
                    return (
                      <tr key={category}>
                        <td><strong>{category}</strong></td>
                        <td>{data.count}</td>
                        <td>${data.total.toFixed(2)}</td>
                        <td>${average.toFixed(2)}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ExpenseModal({ editingExpense, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: editingExpense?.title || '',
    category: editingExpense?.category || '',
    amount: editingExpense?.amount || '',
    date: editingExpense?.date || new Date().toISOString().split('T')[0],
    description: editingExpense?.description || ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    if (!formData.category) e.category = 'Please select a category';
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = 'Enter a positive amount';
    if (!formData.date) e.date = 'Date is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({ ...formData, amount: parseFloat(formData.amount) });
  };

  return (
    <div className="modal active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              placeholder="e.g., Lunch at cafe"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            {errors.title && <span style={{ color: 'var(--danger, #e53e3e)', fontSize: '0.85rem' }}>{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Select Category</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Bills">Bills</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && <span style={{ color: 'var(--danger, #e53e3e)', fontSize: '0.85rem' }}>{errors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (AUD) *</label>
            <input
              type="number"
              id="amount"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              min="0.01"
              step="0.01"
            />
            {errors.amount && <span style={{ color: 'var(--danger, #e53e3e)', fontSize: '0.85rem' }}>{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
            {errors.date && <span style={{ color: 'var(--danger, #e53e3e)', fontSize: '0.85rem' }}>{errors.date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Add any notes about this expense (optional)"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save Expense</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="modal active" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-content delete-modal-content">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default App;
