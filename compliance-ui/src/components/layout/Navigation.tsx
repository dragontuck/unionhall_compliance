/**
 * Navigation - Presentational component for navigation bar
 * Single Responsibility Principle: Only renders navigation UI
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';

export interface NavLink {
    path: string;
    label: string;
    icon: React.ReactNode;
}

export interface NavigationProps {
    links: NavLink[];
    appName: string;
    appIcon: React.ReactNode;
}

export function Navigation({ links, appName, appIcon }: NavigationProps) {
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-brand">
                    {appIcon}
                    <span>{appName}</span>
                </div>
                <ul className="nav-links">
                    {links.map((link) => (
                        <li key={link.path}>
                            <Link
                                to={link.path}
                                className={`nav-link${location.pathname === link.path ? ' active' : ''
                                    }`}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="nav-settings">
                    <button
                        className="settings-btn"
                        onClick={() => setShowDropdown(!showDropdown)}
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                    {showDropdown && (
                        <div className="dropdown-menu">
                            <Link
                                to="/blacklist"
                                className="dropdown-item"
                                onClick={() => setShowDropdown(false)}
                            >
                                Contractor Blacklist
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
