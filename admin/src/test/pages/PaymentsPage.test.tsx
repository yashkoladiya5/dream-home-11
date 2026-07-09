import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import PaymentsPage from '../../pages/PaymentsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 't1', userId: 'u1', userName: 'Grace', userPhone: '7777777777', type: 'deposit', amount: 1000, description: 'Wallet deposit', status: 'completed', createdAt: new Date().toISOString() },
      { _id: 't2', userId: 'u2', userName: 'Henry', userPhone: '8888888888', type: 'withdrawal', amount: 500, description: 'Bank withdrawal', status: 'pending', createdAt: new Date().toISOString() },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)) },
}));

describe('PaymentsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><PaymentsPage /></BrowserRouter>);
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('renders transaction entries', async () => {
    render(<BrowserRouter><PaymentsPage /></BrowserRouter>);
    expect(await screen.findByText('Grace')).toBeInTheDocument();
    expect(await screen.findByText('Henry')).toBeInTheDocument();
  });

  it('shows transaction types', async () => {
    render(<BrowserRouter><PaymentsPage /></BrowserRouter>);
    expect(await screen.findByText('deposit')).toBeInTheDocument();
    expect(await screen.findByText('withdrawal')).toBeInTheDocument();
  });

  it('shows status badges', async () => {
    render(<BrowserRouter><PaymentsPage /></BrowserRouter>);
    expect(await screen.findByText('completed')).toBeInTheDocument();
    expect(await screen.findByText('pending')).toBeInTheDocument();
  });

  it('shows filter selects', () => {
    render(<BrowserRouter><PaymentsPage /></BrowserRouter>);
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    });
    render(<BrowserRouter><PaymentsPage /></BrowserRouter>);
    expect(await screen.findByText('No transactions found')).toBeInTheDocument();
  });
});
