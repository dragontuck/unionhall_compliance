/**
 * Navigation - Presentational component for navigation bar
 * Single Responsibility Principle: Only renders navigation UI
 */

import { BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

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
            </div>
        </nav>
    );
}
