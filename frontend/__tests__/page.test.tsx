/**
 * Unit tests for Landing Page (frontend/app/page.tsx)
 *
 * Tests verify the current landing page rendering, including:
 * - Hero headline and subtitle
 * - CTA buttons (Médico / Gestor) with correct hrefs
 * - Feature cards
 * - Footer links
 * - Responsive layout structure
 */

import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Landing Page', () => {
  describe('Hero section', () => {
    it('renders the main headline', () => {
      render(<Home />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1.textContent).toMatch(/Educa[çc][ãa]o M[ée]dica/i);
    });

    it('renders the subtitle paragraph', () => {
      render(<Home />);
      expect(
        screen.getByText(/Plataforma completa para hospitais/i)
      ).toBeInTheDocument();
    });
  });

  describe('CTA buttons', () => {
    it('renders the Médico login link', () => {
      render(<Home />);
      const link = screen.getByRole('link', { name: /Médico/i });
      expect(link).toBeInTheDocument();
    });

    it('Médico link points to /login?role=doctor', () => {
      render(<Home />);
      const link = screen.getByRole('link', { name: /Médico/i });
      expect(link).toHaveAttribute('href', '/login?role=doctor');
    });

    it('renders the Gestor login link', () => {
      render(<Home />);
      const link = screen.getByRole('link', { name: /Gestor/i });
      expect(link).toBeInTheDocument();
    });

    it('Gestor link points to /login?role=manager', () => {
      render(<Home />);
      const link = screen.getByRole('link', { name: /Gestor/i });
      expect(link).toHaveAttribute('href', '/login?role=manager');
    });

    it('renders both buttons inside a flex container', () => {
      const { container } = render(<Home />);
      const flexRow = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(flexRow).toBeInTheDocument();
    });
  });

  describe('Features section', () => {
    it('renders "Trilhas Médicas" feature card', () => {
      render(<Home />);
      expect(screen.getByText('Trilhas Médicas')).toBeInTheDocument();
    });

    it('renders "Indicadores" feature card', () => {
      render(<Home />);
      expect(screen.getByText('Indicadores')).toBeInTheDocument();
    });

    it('renders "Assistente IA" feature card', () => {
      render(<Home />);
      expect(screen.getByText('Assistente IA')).toBeInTheDocument();
    });

    it('renders "Tudo que você precisa" section heading', () => {
      render(<Home />);
      expect(screen.getByText('Tudo que você precisa')).toBeInTheDocument();
    });
  });

  describe('Footer links', () => {
    it('renders a Termos link', () => {
      render(<Home />);
      const links = screen.getAllByRole('link', { name: /Termos/i });
      expect(links.length).toBeGreaterThan(0);
    });

    it('renders a Privacidade link', () => {
      render(<Home />);
      const links = screen.getAllByRole('link', { name: /Privacidade/i });
      expect(links.length).toBeGreaterThan(0);
    });

    it('Termos link points to /terms', () => {
      render(<Home />);
      const links = screen.getAllByRole('link', { name: /Termos/i });
      const termsLink = links.find((l) => l.getAttribute('href') === '/terms');
      expect(termsLink).toBeDefined();
    });

    it('Privacidade link points to /privacy', () => {
      render(<Home />);
      const links = screen.getAllByRole('link', { name: /Privacidade/i });
      const privacyLink = links.find((l) => l.getAttribute('href') === '/privacy');
      expect(privacyLink).toBeDefined();
    });
  });

  describe('Page does not contain removed elements', () => {
    it('does not have a link to /docs', () => {
      const { container } = render(<Home />);
      const docsLinks = container.querySelectorAll('a[href*="/docs"]');
      expect(docsLinks).toHaveLength(0);
    });
  });
});
