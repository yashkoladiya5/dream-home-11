import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Input from '../../components/ui/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('handles onChange', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows disabled state', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('shows error state', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('renders with icon', () => {
    render(<Input icon={<span data-testid="input-icon" />} />);
    expect(screen.getByTestId('input-icon')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('renders label and error together', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });
});
