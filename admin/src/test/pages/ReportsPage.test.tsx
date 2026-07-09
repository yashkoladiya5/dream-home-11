import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ReportsPage from '../../pages/ReportsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../lib/api', () => ({ default: { post: vi.fn() } }));

describe('ReportsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><ReportsPage /></BrowserRouter>);
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders export options', () => {
    render(<BrowserRouter><ReportsPage /></BrowserRouter>);
    expect(screen.getByText('Export Transactions')).toBeInTheDocument();
    expect(screen.getByText('Export Users')).toBeInTheDocument();
  });

  it('shows Export buttons', () => {
    render(<BrowserRouter><ReportsPage /></BrowserRouter>);
    const exportBtns = screen.getAllByText('Export');
    expect(exportBtns.length).toBe(2);
  });

  it('shows descriptions', () => {
    render(<BrowserRouter><ReportsPage /></BrowserRouter>);
    expect(screen.getByText('Download all transaction records as a JSON file.')).toBeInTheDocument();
    expect(screen.getByText('Download all user data as a JSON file.')).toBeInTheDocument();
  });
});
