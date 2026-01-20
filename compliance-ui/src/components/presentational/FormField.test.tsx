import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField Component', () => {
    describe('Rendering', () => {
        it('should render form group container', () => {
            const { container } = render(
                <FormField label="Email" id="email" disabled={false}>
                    <input type="text" id="email" />
                </FormField>
            );

            expect(container.querySelector('.form-group')).toBeInTheDocument();
        });

        it('should render label with correct text', () => {
            render(
                <FormField label="Email Address" id="email" disabled={false}>
                    <input type="text" id="email" />
                </FormField>
            );

            const label = screen.getByText('Email Address');
            expect(label).toBeInTheDocument();
            expect(label.tagName.toLowerCase()).toBe('label');
        });

        it('should render children elements', () => {
            render(
                <FormField label="Username" id="username" disabled={false}>
                    <input type="text" id="username" placeholder="Enter username" />
                </FormField>
            );

            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });

        it('should associate label with input via id', () => {
            render(
                <FormField label="Password" id="password" disabled={false}>
                    <input type="password" id="password" />
                </FormField>
            );

            const label = screen.getByText('Password') as HTMLLabelElement;
            expect(label.htmlFor).toBe('password');
        });
    });

    describe('Child Elements', () => {
        it('should render single input child', () => {
            render(
                <FormField label="Name" id="name" disabled={false}>
                    <input type="text" id="name" />
                </FormField>
            );

            expect(screen.getByDisplayValue('')).toBeInTheDocument();
        });

        it('should render select element as child', () => {
            render(
                <FormField label="Country" id="country" disabled={false}>
                    <select id="country">
                        <option>USA</option>
                        <option>Canada</option>
                    </select>
                </FormField>
            );

            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        it('should render textarea as child', () => {
            render(
                <FormField label="Comments" id="comments" disabled={false}>
                    <textarea id="comments" />
                </FormField>
            );

            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('should render multiple children', () => {
            render(
                <FormField label="Options" id="options" disabled={false}>
                    <input type="text" id="options" />
                    <span>Helper text</span>
                </FormField>
            );

            expect(screen.getByDisplayValue('')).toBeInTheDocument();
            expect(screen.getByText('Helper text')).toBeInTheDocument();
        });

        it('should render complex nested structure', () => {
            render(
                <FormField label="Address" id="address" disabled={false}>
                    <div>
                        <input type="text" id="address" placeholder="Street" />
                        <input type="text" placeholder="City" />
                    </div>
                </FormField>
            );

            expect(screen.getByPlaceholderText('Street')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
        });
    });

    describe('Disabled State', () => {
        it('should accept disabled prop', () => {
            const { container, rerender } = render(
                <FormField label="Test" id="test" disabled={false}>
                    <input type="text" id="test" />
                </FormField>
            );

            // The component accepts the disabled prop but doesn't use it directly
            // This is for parent component control
            expect(container.querySelector('.form-group')).toBeInTheDocument();

            // Should still render with disabled=true
            rerender(
                <FormField label="Test" id="test" disabled={true}>
                    <input type="text" id="test" />
                </FormField>
            );

            expect(container.querySelector('.form-group')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should have form-group class', () => {
            const { container } = render(
                <FormField label="Test" id="test" disabled={false}>
                    <input type="text" id="test" />
                </FormField>
            );

            const formGroup = container.querySelector('.form-group');
            expect(formGroup?.className).toContain('form-group');
        });

        it('should render label and children in correct order', () => {
            const { container } = render(
                <FormField label="Email" id="email" disabled={false}>
                    <input type="text" id="email" />
                </FormField>
            );

            const formGroup = container.querySelector('.form-group');
            const children = formGroup?.children;

            expect(children?.[0].tagName.toLowerCase()).toBe('label');
            expect(children?.[1].tagName.toLowerCase()).toBe('input');
        });
    });

    describe('Accessibility', () => {
        it('should have proper label htmlFor attribute', () => {
            render(
                <FormField label="Test Input" id="test-input" disabled={false}>
                    <input type="text" id="test-input" />
                </FormField>
            );

            const label = screen.getByText('Test Input') as HTMLLabelElement;
            expect(label.htmlFor).toBe('test-input');
        });

        it('should support screen readers', () => {
            const { container } = render(
                <FormField label="Accessible Field" id="accessible" disabled={false}>
                    <input type="text" id="accessible" />
                </FormField>
            );

            const label = screen.getByText('Accessible Field') as HTMLLabelElement;
            const input = screen.getByDisplayValue('');

            // Label should be properly associated with input
            expect(label.htmlFor).toBeTruthy();
            expect(input).toHaveAttribute('id');
        });

        it('should work with labeled inputs', () => {
            render(
                <FormField label="Search" id="search" disabled={false}>
                    <input type="search" id="search" aria-label="Search field" />
                </FormField>
            );

            expect(screen.getByLabelText('Search field')).toBeInTheDocument();
        });
    });

    describe('Different Input Types', () => {
        it('should work with text input', () => {
            render(
                <FormField label="Text" id="text" disabled={false}>
                    <input type="text" id="text" />
                </FormField>
            );

            expect(screen.getByDisplayValue('')).toBeInTheDocument();
        });

        it('should work with email input', () => {
            render(
                <FormField label="Email" id="email" disabled={false}>
                    <input type="email" id="email" />
                </FormField>
            );

            expect(screen.getByDisplayValue('')).toBeInTheDocument();
        });

        it('should work with date input', () => {
            render(
                <FormField label="Date" id="date" disabled={false}>
                    <input type="date" id="date" />
                </FormField>
            );

            expect(screen.getByDisplayValue('')).toBeInTheDocument();
        });

        it('should work with checkbox', () => {
            render(
                <FormField label="Agree" id="agree" disabled={false}>
                    <input type="checkbox" id="agree" />
                </FormField>
            );

            expect(screen.getByRole('checkbox')).toBeInTheDocument();
        });

        it('should work with radio button', () => {
            render(
                <FormField label="Option" id="option" disabled={false}>
                    <input type="radio" id="option" />
                </FormField>
            );

            expect(screen.getByRole('radio')).toBeInTheDocument();
        });
    });
});
