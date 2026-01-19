/**
 * App - Main application component
 * Composition: Uses layout and page components
 * Open/Closed Principle: Easily extensible for new routes
 */

import { BarChart3, Settings, FileText } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import { Navigation, Footer } from './components/layout';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import type { NavLink } from './components/layout';
import './App.css';

const NAV_LINKS: NavLink[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: <Settings size={18} />,
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: <FileText size={18} />,
  },
];

const APP_CONFIG = {
  name: 'Compliance Manager',
  icon: <BarChart3 size={24} />,
  copyright: '© 2026 Union Hall Compliance Management System. All rights reserved.',
};

function App() {
  return (
    <div className="app">
      <Navigation links={NAV_LINKS} appName={APP_CONFIG.name} appIcon={APP_CONFIG.icon} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:runId" element={<Reports />} />
        </Routes>
      </main>

      <Footer copyrightText={APP_CONFIG.copyright} />
    </div>
  );
}

export default App;
