import { AlertCircle, CheckCircle, X } from 'lucide-react';
import '../styles/Alert.css';

interface AlertProps {
    type: 'success' | 'error';
    children: React.ReactNode;
    onClose?: () => void;
}

export function Alert({ type, children, onClose }: AlertProps) {
    return (
        <div className={`alert alert-${type}`}>
            <div className="alert-content">
                {type === 'success' ? (
                    <CheckCircle size={20} className="alert-icon" />
                ) : (
                    <AlertCircle size={20} className="alert-icon" />
                )}
                {children}
            </div>
            {onClose && (
                <button className="alert-close" onClick={onClose} aria-label="Close alert">
                    <X size={18} />
                </button>
            )}
        </div>
    );
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
    return <p className="alert-description">{children}</p>;
}
