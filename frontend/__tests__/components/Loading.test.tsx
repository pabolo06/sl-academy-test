import { render, screen, fireEvent } from '@testing-library/react';
import {
  Spinner,
  LoadingScreen,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  ButtonLoading,
} from '@/components/Loading';

describe('Spinner', () => {
  it('renders with default medium size', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass('h-8', 'w-8');
  });

  it('renders with small size', () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.firstChild).toHaveClass('h-4', 'w-4');
  });

  it('renders with large size', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.firstChild).toHaveClass('h-12', 'w-12');
  });

  it('has animate-spin class', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass('animate-spin');
  });
});

describe('LoadingScreen', () => {
  it('renders default message', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingScreen message="Por favor aguarde..." />);
    expect(screen.getByText('Por favor aguarde...')).toBeInTheDocument();
  });

  it('renders a spinner inside', () => {
    const { container } = render(<LoadingScreen />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has animate-pulse class', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});

describe('SkeletonTable', () => {
  it('renders 5 rows by default', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('.divide-y > div');
    expect(rows).toHaveLength(5);
  });

  it('renders custom row count', () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const rows = container.querySelectorAll('.divide-y > div');
    expect(rows).toHaveLength(3);
  });
});

describe('SkeletonList', () => {
  it('renders 3 items by default', () => {
    const { container } = render(<SkeletonList />);
    const items = container.querySelectorAll('.space-y-4 > div');
    expect(items).toHaveLength(3);
  });

  it('renders custom item count', () => {
    const { container } = render(<SkeletonList items={5} />);
    const items = container.querySelectorAll('.space-y-4 > div');
    expect(items).toHaveLength(5);
  });
});

describe('ButtonLoading', () => {
  it('renders children text', () => {
    render(<ButtonLoading>Salvar</ButtonLoading>);
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    const { container } = render(<ButtonLoading loading>Salvar</ButtonLoading>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('hides spinner when not loading', () => {
    const { container } = render(<ButtonLoading>Salvar</ButtonLoading>);
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('is disabled when loading=true', () => {
    render(<ButtonLoading loading>Salvar</ButtonLoading>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled=true', () => {
    render(<ButtonLoading disabled>Salvar</ButtonLoading>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<ButtonLoading onClick={onClick}>Clique</ButtonLoading>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = jest.fn();
    render(<ButtonLoading disabled onClick={onClick}>Clique</ButtonLoading>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies primary variant classes by default', () => {
    render(<ButtonLoading>Primário</ButtonLoading>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
  });

  it('applies secondary variant classes', () => {
    render(<ButtonLoading variant="secondary">Secundário</ButtonLoading>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-700');
  });

  it('applies danger variant classes', () => {
    render(<ButtonLoading variant="danger">Deletar</ButtonLoading>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('renders as submit type', () => {
    render(<ButtonLoading type="submit">Enviar</ButtonLoading>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders as button type by default', () => {
    render(<ButtonLoading>Botão</ButtonLoading>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
