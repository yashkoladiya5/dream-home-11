import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from '../../pages/DashboardPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockData = {
  data: {
    success: true,
    data: {
      totalUsers: 1500,
      activeUsers: 892,
      runningContests: 12,
      upcomingContests: 5,
      completedContests: 340,
      totalDeposits: 25000000,
      totalPointsEarned: 45000000,
      pendingKycCount: 23,
      openSupportTickets: 7,
      recentUsers: [{ _id: '1', fullName: 'John Doe', phone: '9999999999', currentTier: 'gold', createdAt: new Date().toISOString() }],
      recentTransactions: [{ _id: 't1', user: { fullName: 'Jane Smith' }, type: 'deposit', amount: 5000, createdAt: new Date().toISOString() }],
      compensationStats: { totalPaid: 50000, pending: 12000, thisMonth: 8000 },
    },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockData)) },
}));

describe('DashboardPage', () => {
  it('renders welcome banner', () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
  });

  it('displays stats cards', async () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    expect(await screen.findByText('1500')).toBeInTheDocument();
    expect(await screen.findByText('892')).toBeInTheDocument();
    expect(await screen.findByText('23')).toBeInTheDocument();
  });

  it('displays compensation stats', async () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    expect(await screen.findByText('Compensation Analytics')).toBeInTheDocument();
  });

  it('displays recent users table', async () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  it('displays recent transactions', async () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockRejectedValueOnce(new Error('fail'));
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    expect(await screen.findByText('Failed to load dashboard data')).toBeInTheDocument();
  });

  it('displays "Recent Signups" section', () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    expect(screen.getByText('Recent Signups')).toBeInTheDocument();
  });

  it('displays "Recent Activity Logs" section', () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    expect(screen.getByText('Recent Activity Logs')).toBeInTheDocument();
  });
});
