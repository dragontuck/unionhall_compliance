/**
 * Footer - Presentational component for footer
 * Single Responsibility Principle: Only renders footer UI
 */

export interface FooterProps {
    copyrightText: string;
}

export function Footer({ copyrightText }: FooterProps) {
    return (
        <footer className="footer">
            <p>{copyrightText}</p>
        </footer>
    );
}
