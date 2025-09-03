import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Simple navigation items for MVP
const navItems = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'employees', name: 'Employees', icon: '👥' },
  { id: 'sites', name: 'Sites', icon: '🏗️' },
  { id: 'users', name: 'Users', icon: '👤' },
  { id: 'expenses', name: 'Expenses', icon: '💸' },
  { id: 'reports', name: 'Reports', icon: '📈' },
]

// MVP Component for each module
function MVPEmployees() {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Smith', position: 'Site Manager', site: 'Alpha Site', status: 'Active' },
    { id: 2, name: 'Sarah Johnson', position: 'Engineer', site: 'Beta Site', status: 'Active' },
    { id: 3, name: 'Mike Davis', position: 'Supervisor', site: 'Alpha Site', status: 'On Leave' },
  ])

  return (
    <div className="mvp-module">
      <h2>Employee Management</h2>
      <div className="mvp-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Site</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.position}</td>
                <td>{emp.site}</td>
                <td><span className={`status ${emp.status.toLowerCase()}`}>{emp.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MVPSites() {
  const sites = [
    { id: 1, name: 'Alpha Construction Site', manager: 'John Smith', progress: 75, status: 'Active' },
    { id: 2, name: 'Beta Development Site', manager: 'Sarah Johnson', progress: 45, status: 'Active' },
    { id: 3, name: 'Gamma Infrastructure', manager: 'Mike Davis', progress: 90, status: 'Completing' },
  ]

  return (
    <div className="mvp-module">
      <h2>Site Management</h2>
      <div className="mvp-grid">
        {sites.map(site => (
          <div key={site.id} className="site-card">
            <h3>{site.name}</h3>
            <p><strong>Manager:</strong> {site.manager}</p>
            <p><strong>Progress:</strong> {site.progress}%</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${site.progress}%` }}></div>
            </div>
            <span className={`status ${site.status.toLowerCase()}`}>{site.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MVPUsers() {
  const users = [
    { id: 1, name: 'System Administrator', email: 'admin@example.com', role: 'Super Admin', active: true },
    { id: 2, name: 'Project Manager', email: 'manager@example.com', role: 'Manager', active: true },
    { id: 3, name: 'Human Resources', email: 'hr@example.com', role: 'HR Manager', active: true },
  ]

  return (
    <div className="mvp-module">
      <h2>User Management</h2>
      <div className="mvp-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td><span className={`status ${user.active ? 'active' : 'inactive'}`}>
                  {user.active ? 'Active' : 'Inactive'}
                </span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MVPExpenses() {
  const expenses = [
    { id: 1, description: 'Office Supplies', amount: 2500, category: 'Office', date: '2024-01-15' },
    { id: 2, description: 'Equipment Rental', amount: 15000, category: 'Equipment', date: '2024-01-14' },
    { id: 3, description: 'Materials', amount: 8500, category: 'Materials', date: '2024-01-13' },
  ]

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div className="mvp-module">
      <h2>Expense Management</h2>
      <div className="expense-summary">
        <div className="total-card">
          <h3>Total Expenses</h3>
          <p className="amount">${total.toLocaleString()}</p>
        </div>
      </div>
      <div className="mvp-table">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td>{expense.description}</td>
                <td>${expense.amount.toLocaleString()}</td>
                <td>{expense.category}</td>
                <td>{expense.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MVPReports() {
  return (
    <div className="mvp-module">
      <h2>Reports</h2>
      <div className="reports-grid">
        <div className="report-card">
          <h3>📊 Employee Report</h3>
          <p>View detailed employee statistics</p>
          <button className="btn-primary">Generate Report</button>
        </div>
        <div className="report-card">
          <h3>🏗️ Site Progress Report</h3>
          <p>Track construction progress across sites</p>
          <button className="btn-primary">Generate Report</button>
        </div>
        <div className="report-card">
          <h3>💰 Financial Report</h3>
          <p>Analyze expenses and revenue</p>
          <button className="btn-primary">Generate Report</button>
        </div>
      </div>
    </div>
  )
}

function MVPOverview() {
  return (
    <div className="mvp-module">
      <h2>Dashboard Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>24</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏗️</div>
          <div className="stat-info">
            <h3>5</h3>
            <p>Active Sites</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💹</div>
          <div className="stat-info">
            <h3>$45,230</h3>
            <p>Monthly Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <h3>$26,000</h3>
            <p>Total Expenses</p>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-icon">👤</span>
            <div className="activity-info">
              <p>New employee added: John Smith</p>
              <small>2 hours ago</small>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-icon">🏗️</span>
            <div className="activity-info">
              <p>Site Alpha construction progress updated</p>
              <small>4 hours ago</small>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-icon">💵</span>
            <div className="activity-info">
              <p>Payroll processed for March</p>
              <small>1 day ago</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MVPDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { legacyUser, logout } = useAuth()

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <MVPOverview />
      case 'employees': return <MVPEmployees />
      case 'sites': return <MVPSites />
      case 'users': return <MVPUsers />
      case 'expenses': return <MVPExpenses />
      case 'reports': return <MVPReports />
      default: return <MVPOverview />
    }
  }

  return (
    <div className="mvp-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          {sidebarOpen && (
            <div className="company-info">
              <h2>🏗️ BuildCorp</h2>
              <p>Management System</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-text">{item.name}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {legacyUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <p className="user-name">{legacyUser?.name || 'User'}</p>
                <p className="user-role">{legacyUser?.role || 'Role'}</p>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="content-header">
          <h1>{navItems.find(item => item.id === activeTab)?.name || 'Dashboard'}</h1>
          <div className="user-welcome">
            Welcome back, {legacyUser?.name}
          </div>
        </header>
        
        <main className="content-body">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
