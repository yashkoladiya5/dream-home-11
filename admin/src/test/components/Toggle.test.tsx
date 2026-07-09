import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Toggle from '../../components/ui/Toggle';

describe('Toggle', () => {
  it('renders unchecked by default', () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    const btn = screen.getByRole('switch');
    expect(btn).toHaveAttribute('aria-checked', 'false');
  });

  it('renders checked state', () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);
    const btn = screen.getByRole('switch');
    expect(btn).toHaveAttribute('aria-checked', 'true');
  });

  it('handles toggle click', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle checked={false} onChange={handleChange} />);
    await user.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renders label when provided', () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Enable Feature" />);
    expect(screen.getByText('Enable Feature')).toBeInTheDocument();
  });

  it('does not call onChange when disabled', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle checked={false} onChange={handleChange} disabled />);
    await user.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies disabled styles', () => {
    render(<Toggle checked={false} onChange={vi.fn()} disabled />);
    const btn = screen.getByRole('switch');
    expect(btn).toBeDisabled();
  });

  it('calls onChange with false when toggling off', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle checked={true} onChange={handleChange} />);
    await user.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });
});
