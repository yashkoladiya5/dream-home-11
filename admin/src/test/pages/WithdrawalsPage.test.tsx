import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import WithdrawalsPage from '../../pages/WithdrawalsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockEntries = {
  data: {
    data: [
      { _id: 'w1', userId: 'u1', userName: 'Eve', userPhone: '5555555555', amount: 5000, bankAccount: '1234567890', ifscCode: 'SBIN001', status: 'pending', createdAt: new Date().toISOString() },
      { _id: 'w2', userId: 'u2', userName: 'Frank', userPhone: '6666666666', amount: 10000, upiId: 'frank@upi', status: 'approved', createdAt: new Date().toISOString() },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

const mockStats = { data: { data: { totalRequests: 50, pending: 10, approvedToday: 5, totalAmount: 500000 } } };

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn((url: string) => url.includes('/stats') ? Promise.resolve(mockStats) : Promise.resolve(mockEntries)) },
}));

describe('WithdrawalsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><WithdrawalsPage /></BrowserRouter>);
    expect(screen.getByText('Withdrawal Requests')).toBeInTheDocument();
  });

  it('renders withdrawal entries', async () => {
    render(<BrowserRouter><WithdrawalsPage /></BrowserRouter>);
    expect(await screen.findByText('Eve')).toBeInTheDocument();
    expect(await screen.findByText('Frank')).toBeInTheDocument();
  });

  it('displays status badges', async () => {
    render(<BrowserRouter><WithdrawalsPage /></BrowserRouter>);
    expect(await screen.findByText('Pending')).toBeInTheDocument();
    const approved = screen.getAllByText('Approved');
    expect(approved.length).toBeGreaterThanOrEqual(1);
  });

  it('shows search input', () => {
    render(<BrowserRouter><WithdrawalsPage /></BrowserRouter>);
    expect(screen.getByPlaceholderText('Search by User ID...')).toBeInTheDocument();
  });

  it('shows UPI ID for UPI payments', async () => {
    render(<BrowserRouter><WithdrawalsPage /></BrowserRouter>);
    expect(await screen.findByText('frank@upi')).toBeInTheDocument();
  });

  it('shows empty state when no entries', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValue({ data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
    render(<BrowserRouter><WithdrawalsPage /></BrowserRouter>);
    expect(await screen.findByText('No withdrawal requests found')).toBeInTheDocument();
  });
});
