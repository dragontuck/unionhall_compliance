import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navigation } from './Navigation';
import { Home, Settings } from 'lucide-react';

describe('Navigation Component', () => {
    const defaultProps = {
        appName: 'Compliance',
        appIcon: '📊',
        links: [
            { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
            { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
        ],
    };

    const renderNavigation = (props = defaultProps) => {
        return render(
            <BrowserRouter>
                <Navigation {...props} />
            </BrowserRouter>
        );
    };

    it('should render navigation', () => {
        renderNavigation();

        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
    });

    it('should render navigation links', () => {
        renderNavigation();

        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
    });

    it('should have nav element with correct structure', () => {
        const { container } = renderNavigation();

        const nav = container.querySelector('nav');
        expect(nav).toBeInTheDocument();
    });

    it('should render app name', () => {
        renderNavigation();

        expect(screen.getByText('Compliance')).toBeInTheDocument();
    });
});
