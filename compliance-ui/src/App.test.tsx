import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ApiProvider } from './providers';
import { createMockApiClient } from './setupTestUtils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IApiClient } from './services/interfaces/IApiClient';

describe('App Component', () => {
    it('should render without crashing', () => {
        const mockApiClient = createMockApiClient() as unknown as IApiClient;
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, enabled: false } },
        });

        const { container } = render(
            <BrowserRouter>
                <ApiProvider apiClient={mockApiClient}>
                    <QueryClientProvider client={queryClient}>
                        <App />
                    </QueryClientProvider>
                </ApiProvider>
            </BrowserRouter>
        );

        expect(container.querySelector('.app')).toBeInTheDocument();
    });

    it('should render navigation component', () => {
        const mockApiClient = createMockApiClient() as unknown as IApiClient;
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, enabled: false } },
        });

        render(
            <BrowserRouter>
                <ApiProvider apiClient={mockApiClient}>
                    <QueryClientProvider client={queryClient}>
                        <App />
                    </QueryClientProvider>
                </ApiProvider>
            </BrowserRouter>
        );

        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
    });

    it('should render main content area', () => {
        const mockApiClient = createMockApiClient() as unknown as IApiClient;
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, enabled: false } },
        });

        const { container } = render(
            <BrowserRouter>
                <ApiProvider apiClient={mockApiClient}>
                    <QueryClientProvider client={queryClient}>
                        <App />
                    </QueryClientProvider>
                </ApiProvider>
            </BrowserRouter>
        );

        expect(container.querySelector('.main-content')).toBeInTheDocument();
    });

    it('should render footer', () => {
        const mockApiClient = createMockApiClient() as unknown as IApiClient;
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, enabled: false } },
        });

        const { container } = render(
            <BrowserRouter>
                <ApiProvider apiClient={mockApiClient}>
                    <QueryClientProvider client={queryClient}>
                        <App />
                    </QueryClientProvider>
                </ApiProvider>
            </BrowserRouter>
        );

        expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('should have correct structure', () => {
        const mockApiClient = createMockApiClient() as unknown as IApiClient;
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, enabled: false } },
        });

        const { container } = render(
            <BrowserRouter>
                <ApiProvider apiClient={mockApiClient}>
                    <QueryClientProvider client={queryClient}>
                        <App />
                    </QueryClientProvider>
                </ApiProvider>
            </BrowserRouter>
        );

        // Check all main sections exist
        expect(container.querySelector('.app')).toBeInTheDocument();
        expect(container.querySelector('nav')).toBeInTheDocument();
        expect(container.querySelector('main.main-content')).toBeInTheDocument();
        expect(container.querySelector('footer')).toBeInTheDocument();
    });
});
