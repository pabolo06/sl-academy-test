import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Suppress React error boundary console.error output in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

function ThrowError({ message = 'Erro de teste' }: { message?: string }) {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Conteúdo normal</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Ocorreu um erro inesperado. Por favor, tente novamente.')).toBeInTheDocument();
  });

  it('displays the error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Mensagem de erro personalizada" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Mensagem de erro personalizada')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback personalizado</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Fallback personalizado')).toBeInTheDocument();
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });

  it('shows "Tentar Novamente" and "Voltar" buttons on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });

  it('resets error state when "Tentar Novamente" is clicked', () => {
    let shouldThrow = true;

    function MaybeThrow() {
      if (shouldThrow) throw new Error('Erro temporário');
      return <div>Recuperado com sucesso</div>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Tentar Novamente'));

    expect(screen.getByText('Recuperado com sucesso')).toBeInTheDocument();
  });

  it('does not render children after error without reset', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
        <div>Não deve aparecer</div>
      </ErrorBoundary>
    );
    expect(screen.queryByText('Não deve aparecer')).not.toBeInTheDocument();
  });
});
