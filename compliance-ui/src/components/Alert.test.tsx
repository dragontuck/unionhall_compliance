import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert, AlertDescription } from './Alert';

describe('Alert Component', () => {
    describe('Success Alert', () => {
        it('should render success alert with CheckCircle icon', () => {
            render(
                <Alert type="success">
                    Operation was successful
                </Alert>
            );

            const alert = screen.getByText('Operation was successful');
            expect(alert).toBeInTheDocument();

            // Check for the alert container
            const alertContainer = alert.closest('.alert');
            expect(alertContainer).toHaveClass('alert-success');
        });

        it('should render success alert with correct styling', () => {
            const { container } = render(
                <Alert type="success">
                    Success message
                </Alert>
            );

            const alertDiv = container.querySelector('.alert-success');
            expect(alertDiv).toBeInTheDocument();
        });
    });

    describe('Error Alert', () => {
        it('should render error alert with AlertCircle icon', () => {
            render(
                <Alert type="error">
                    An error occurred
                </Alert>
            );

            const alert = screen.getByText('An error occurred');
            expect(alert).toBeInTheDocument();

            const alertContainer = alert.closest('.alert');
            expect(alertContainer).toHaveClass('alert-error');
        });

        it('should render error alert with correct styling', () => {
            const { container } = render(
                <Alert type="error">
                    Error message
                </Alert>
            );

            const alertDiv = container.querySelector('.alert-error');
            expect(alertDiv).toBeInTheDocument();
        });
    });

    describe('Close Button', () => {
        it('should render close button when onClose is provided', () => {
            const onClose = vi.fn();
            render(
                <Alert type="success" onClose={onClose}>
                    Message with close button
                </Alert>
            );

            const closeButton = screen.getByLabelText('Close alert');
            expect(closeButton).toBeInTheDocument();
        });

        it('should not render close button when onClose is not provided', () => {
            render(
                <Alert type="success">
                    Message without close button
                </Alert>
            );

            const closeButton = screen.queryByLabelText('Close alert');
            expect(closeButton).not.toBeInTheDocument();
        });

        it('should call onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            const user = userEvent.setup();
            render(
                <Alert type="success" onClose={onClose}>
                    Message
                </Alert>
            );

            const closeButton = screen.getByLabelText('Close alert');
            await user.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Alert Content', () => {
        it('should render children correctly', () => {
            render(
                <Alert type="success">
                    <strong>Bold text</strong> and normal text
                </Alert>
            );

            expect(screen.getByText('Bold text')).toBeInTheDocument();
            expect(screen.getByText(/and normal text/)).toBeInTheDocument();
        });

        it('should render with AlertDescription component', () => {
            render(
                <Alert type="error">
                    <AlertDescription>
                        This is a detailed error description
                    </AlertDescription>
                </Alert>
            );

            expect(screen.getByText('This is a detailed error description')).toBeInTheDocument();
        });
    });

    describe('AlertDescription Component', () => {
        it('should render description text', () => {
            render(
                <AlertDescription>
                    Detailed message content
                </AlertDescription>
            );

            expect(screen.getByText('Detailed message content')).toBeInTheDocument();
        });

        it('should have correct class name', () => {
            const { container } = render(
                <AlertDescription>
                    Description
                </AlertDescription>
            );

            const description = container.querySelector('.alert-description');
            expect(description).toBeInTheDocument();
        });

        it('should render with complex children', () => {
            render(
                <AlertDescription>
                    <div>
                        <p>Error Code: 500</p>
                        <p>Status: Failed</p>
                    </div>
                </AlertDescription>
            );

            expect(screen.getByText('Error Code: 500')).toBeInTheDocument();
            expect(screen.getByText('Status: Failed')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper aria attributes on close button', () => {
            render(
                <Alert type="success" onClose={vi.fn()}>
                    Message
                </Alert>
            );

            const closeButton = screen.getByLabelText('Close alert');
            expect(closeButton).toHaveAttribute('aria-label', 'Close alert');
        });

        it('should have semantic structure', () => {
            const { container } = render(
                <Alert type="error">
                    Error message
                </Alert>
            );

            const alertContainer = container.querySelector('.alert-content');
            expect(alertContainer).toBeInTheDocument();
        });
    });

    describe('Multiple Alerts', () => {
        it('should render multiple different alerts', () => {
            render(
                <>
                    <Alert type="success">Success message</Alert>
                    <Alert type="error">Error message</Alert>
                </>
            );

            expect(screen.getByText('Success message')).toBeInTheDocument();
            expect(screen.getByText('Error message')).toBeInTheDocument();
        });
    });
});
