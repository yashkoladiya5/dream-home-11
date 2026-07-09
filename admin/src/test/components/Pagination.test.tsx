import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Pagination from '../../components/ui/Pagination';

describe('Pagination', () => {
  it('renders page numbers', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles page change', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} totalPages={5} onPageChange={handleChange} />);
    await user.click(screen.getByText('3'));
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('disables previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    const prevButtons = document.querySelectorAll('button');
    const prevBtn = prevButtons[0];
    expect(prevBtn).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);
    const buttons = document.querySelectorAll('button');
    const nextBtn = buttons[buttons.length - 1];
    expect(nextBtn).toBeDisabled();
  });

  it('returns null when totalPages <= 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows ellipsis for many pages', () => {
    render(<Pagination page={5} totalPages={20} onPageChange={vi.fn()} />);
    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThanOrEqual(1);
  });

  it('highlights active page', () => {
    render(<Pagination page={3} totalPages={7} onPageChange={vi.fn()} />);
    const btn3 = screen.getByText('3');
    expect(btn3.className).toContain('bg-brand-600');
  });

  it('calls next page when clicking next', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} totalPages={5} onPageChange={handleChange} />);
    const buttons = document.querySelectorAll('button');
    const nextBtn = buttons[buttons.length - 1];
    await user.click(nextBtn);
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('calls previous page when clicking prev', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={3} totalPages={5} onPageChange={handleChange} />);
    const prevBtn = document.querySelectorAll('button')[0];
    await user.click(prevBtn);
    expect(handleChange).toHaveBeenCalledWith(2);
  });
});
