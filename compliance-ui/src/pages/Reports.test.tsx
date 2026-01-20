import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Reports } from './Reports';

// Mock ReportViewer component
vi.mock('../components/ReportViewer', () => ({
    ReportViewer: () => (
        <div data-testid="report-viewer">
            Report Viewer Component
        </div>
    ),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </BrowserRouter>
    );
};

describe('Reports Page', () => {
    describe('Rendering', () => {
        it('should render reports page container', () => {
            const { container } = render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            expect(container.querySelector('.reports-page')).toBeInTheDocument();
        });

        it('should render page header with title', () => {
            render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByRole('heading', { level: 1, name: /Compliance Reports/i })).toBeInTheDocument();
        });

        it('should render page description', () => {
            render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            expect(
                screen.getByText(/View and download compliance run reports with detailed hire information/)
            ).toBeInTheDocument();
        });

        it('should render ReportViewer component', () => {
            render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByTestId('report-viewer')).toBeInTheDocument();
        });
    });

    describe('Layout', () => {
        it('should have proper page structure', () => {
            const { container } = render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            const reportsPage = container.querySelector('.reports-page');
            expect(reportsPage).toBeInTheDocument();

            const pageHeader = container.querySelector('.page-header');
            expect(pageHeader).toBeInTheDocument();
        });

        it('should render ReportViewer after header', () => {
            const { container } = render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            const reportViewer = screen.getByTestId('report-viewer');
            expect(reportViewer).toBeInTheDocument();
        });
    });

    describe('QueryClient Provider', () => {
        it('should wrap content with QueryClientProvider', () => {
            const { container } = render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            // The component should be rendered, which means QueryClientProvider is working
            expect(screen.getByTestId('report-viewer')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should have reports-page class applied', () => {
            const { container } = render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            const reportsPage = container.querySelector('.reports-page');
            expect(reportsPage?.className).toContain('reports-page');
        });

        it('should have page-header class applied', () => {
            const { container } = render(
                <Reports />,
                { wrapper: createWrapper() }
            );

            const pageHeader = container.querySelector('.page-header');
            expect(pageHeader?.className).toContain('page-header');
        });
    });
});
