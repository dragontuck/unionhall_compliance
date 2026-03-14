import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer Component', () => {
    const copyrightText = `© ${new Date().getFullYear()} All rights reserved.`;

    it('should render footer', () => {
        render(<Footer copyrightText={copyrightText} />);

        const footer = screen.getByRole('contentinfo');
        expect(footer).toBeInTheDocument();
    });

    it('should render copyright year', () => {
        render(<Footer copyrightText={copyrightText} />);

        const year = new Date().getFullYear().toString();
        const text = screen.getByText(new RegExp(year));
        expect(text).toBeInTheDocument();
    });

    it('should have footer element with correct class', () => {
        const { container } = render(<Footer copyrightText={copyrightText} />);

        const footer = container.querySelector('footer');
        expect(footer).toBeInTheDocument();
    });
});
