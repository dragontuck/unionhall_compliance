import { BarChart3, FileText, Settings } from 'lucide-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { ReportViewer } from './components/ReportViewer';
import './App.css';

function App() {
  const location = useLocation();
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <BarChart3 size={24} />
            <span>Compliance Manager</span>
          </div>
          <ul className="nav-links">
            <li>
              <Link to="/" className={`nav-link${location.pathname === '/' ? ' active' : ''}`}>
                <Settings size={18} />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/reports" className={`nav-link${location.pathname.startsWith('/reports') ? ' active' : ''}`}>
                <FileText size={18} />
                Reports
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:runId" element={<Reports />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>&copy; 2026 Union Hall Compliance Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
