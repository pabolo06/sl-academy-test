import { render, screen } from '@testing-library/react';
import { FormField, Input, Textarea, Select } from '@/components/FormField';

describe('FormField', () => {
  it('renders the label text', () => {
    render(
      <FormField label="Nome">
        <input />
      </FormField>
    );
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('renders required asterisk when required=true', () => {
    render(
      <FormField label="Email" required>
        <input />
      </FormField>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not render asterisk when required is not set', () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>
    );
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders error message when error prop is provided', () => {
    render(
      <FormField label="Email" error="Email inválido">
        <input />
      </FormField>
    );
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });

  it('does not render error message when error is not set', () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>
    );
    expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
  });

  it('renders children inside the field', () => {
    render(
      <FormField label="Campo">
        <input data-testid="field-input" />
      </FormField>
    );
    expect(screen.getByTestId('field-input')).toBeInTheDocument();
  });

  it('associates label with htmlFor', () => {
    render(
      <FormField label="Nome" htmlFor="name-field">
        <input id="name-field" />
      </FormField>
    );
    const label = screen.getByText('Nome').closest('label');
    expect(label).toHaveAttribute('for', 'name-field');
  });
});

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies error border classes when error=true', () => {
    render(<Input error />);
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('applies normal border classes when error is not set', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toHaveClass('border-gray-700');
  });

  it('forwards placeholder prop', () => {
    render(<Input placeholder="Digite aqui" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Digite aqui');
  });

  it('forwards type prop', () => {
    render(<Input type="email" data-testid="email-input" />);
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
  });
});

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies error border classes when error=true', () => {
    render(<Textarea error />);
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('applies normal border when error is not set', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveClass('border-gray-700');
  });

  it('forwards rows prop', () => {
    render(<Textarea rows={5} data-testid="ta" />);
    expect(screen.getByTestId('ta')).toHaveAttribute('rows', '5');
  });
});

describe('Select', () => {
  it('renders a select element with children', () => {
    render(
      <Select>
        <option value="a">Opção A</option>
        <option value="b">Opção B</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Opção A')).toBeInTheDocument();
    expect(screen.getByText('Opção B')).toBeInTheDocument();
  });

  it('applies error border classes when error=true', () => {
    render(
      <Select error>
        <option>A</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500');
  });

  it('applies normal border when error is not set', () => {
    render(
      <Select>
        <option>A</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('border-gray-700');
  });
});
