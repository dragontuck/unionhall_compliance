/**
 * FormField - Reusable presentational component for form inputs
 * Single Responsibility Principle: Only renders a form field
 */

export interface FormFieldProps {
    label: string;
    id: string;
    disabled: boolean;
    children: React.ReactNode;
}

export function FormField({ label, id, disabled, children }: FormFieldProps) {
    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            {children}
        </div>
    );
}
