/**
 * Unit tests for Landing Page (frontend/app/page.tsx)
 * 
 * Tests verify the rendering of the dual login landing page including:
 * - Title and subtitle display
 * - Presence of both login buttons
 * - Absence of documentation button
 * - Navigation links
 * - Accessibility attributes
 * - Styling classes
 */

import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Landing Page', () => {
  describe('Content Rendering', () => {
    it('should render the title "SL Academy Platform"', () => {
      render(<Home />);
      const title = screen.getByRole('heading', { name: /SL Academy Platform/i });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('SL Academy Platform');
    });

    it('should render the subtitle', () => {
      render(<Home />);
      const subtitle = screen.getByText(/B2B Hospital Education and Management Platform/i);
      expect(subtitle).toBeInTheDocument();
    });

    it('should render both login buttons', () => {
      render(<Home />);
      const managerButton = screen.getByRole('link', { name: /Login para Gestores/i });
      const doctorButton = screen.getByRole('link', { name: /Login para Médicos/i });
      
      expect(managerButton).toBeInTheDocument();
      expect(doctorButton).toBeInTheDocument();
    });

    it('should not render a documentation button', () => {
      render(<Home />);
      const documentationButton = screen.queryByText(/documentation/i);
      const documentationLink = screen.queryByRole('link', { name: /documentation/i });
      
      expect(documentationButton).not.toBeInTheDocument();
      expect(documentationLink).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have correct href for manager login button', () => {
      render(<Home />);
      const managerButton = screen.getByRole('link', { name: /Login para Gestores/i });
      expect(managerButton).toHaveAttribute('href', '/login?role=manager');
    });

    it('should have correct href for doctor login button', () => {
      render(<Home />);
      const doctorButton = screen.getByRole('link', { name: /Login para Médicos/i });
      expect(doctorButton).toHaveAttribute('href', '/login?role=doctor');
    });

    it('should not have any link to /docs route', () => {
      const { container } = render(<Home />);
      const docsLinks = container.querySelectorAll('a[href*="/docs"]');
      expect(docsLinks).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for manager login button', () => {
      render(<Home />);
      const managerButton = screen.getByRole('link', { name: /Login para Gestores/i });
      expect(managerButton).toHaveAttribute('aria-label', 'Login para Gestores');
    });

    it('should have aria-label for doctor login button', () => {
      render(<Home />);
      const doctorButton = screen.getByRole('link', { name: /Login para Médicos/i });
      expect(doctorButton).toHaveAttribute('aria-label', 'Login para Médicos');
    });

    it('should have focus ring classes on buttons', () => {
      render(<Home />);
      const managerButton = screen.getByRole('link', { name: /Login para Gestores/i });
      const doctorButton = screen.getByRole('link', { name: /Login para Médicos/i });
      
      expect(managerButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2');
      expect(doctorButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2');
    });
  });

  describe('Styling', () => {
    it('should have primary color classes on buttons', () => {
      render(<Home />);
      const managerButton = screen.getByRole('link', { name: /Login para Gestores/i });
      const doctorButton = screen.getByRole('link', { name: /Login para Médicos/i });
      
      expect(managerButton).toHaveClass('bg-primary', 'text-primary-foreground');
      expect(doctorButton).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should have hover effect classes on buttons', () => {
      render(<Home />);
      const managerButton = screen.getByRole('link', { name: /Login para Gestores/i });
      const doctorButton = screen.getByRole('link', { name: /Login para Médicos/i });
      
      expect(managerButton).toHaveClass('hover:opacity-90', 'transition-opacity');
      expect(doctorButton).toHaveClass('hover:opacity-90', 'transition-opacity');
    });

    it('should have responsive layout classes', () => {
      const { container } = render(<Home />);
      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-4');
    });
  });
});
