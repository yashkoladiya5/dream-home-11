import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';

vi.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster" />,
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/auth', () => ({
  isAuthenticated: () => true,
  getStoredUser: () => ({ name: 'Admin', role: 'admin' }),
  logout: vi.fn(),
}));

vi.mock('@/pages/DashboardPage', () => ({
  default: () => <div data-testid="page-dashboard">Dashboard Page</div>,
}));

vi.mock('@/pages/UsersPage', () => ({
  default: () => <div data-testid="page-users">Users Page</div>,
}));

vi.mock('@/pages/KycPage', () => ({
  default: () => <div data-testid="page-kyc">KYC Page</div>,
}));

vi.mock('@/pages/ContestsPage', () => ({
  default: () => <div data-testid="page-contests">Contests Page</div>,
}));

vi.mock('@/pages/ConfigPage', () => ({
  default: () => <div data-testid="page-config">Config Page</div>,
}));

vi.mock('@/pages/WithdrawalsPage', () => ({
  default: () => <div data-testid="page-withdrawals">Withdrawals Page</div>,
}));

vi.mock('@/pages/PaymentsPage', () => ({
  default: () => <div data-testid="page-payments">Payments Page</div>,
}));

vi.mock('@/pages/SupportPage', () => ({
  default: () => <div data-testid="page-support">Support Page</div>,
}));

vi.mock('@/pages/BannersPage', () => ({
  default: () => <div data-testid="page-banners">Banners Page</div>,
}));

vi.mock('@/pages/NotificationsPage', () => ({
  default: () => <div data-testid="page-notifications">Notifications Page</div>,
}));

vi.mock('@/pages/ReportsPage', () => ({
  default: () => <div data-testid="page-reports">Reports Page</div>,
}));

vi.mock('@/pages/LeaderboardPage', () => ({
  default: () => <div data-testid="page-leaderboard">Leaderboard Page</div>,
}));

vi.mock('@/pages/RewardsPage', () => ({
  default: () => <div data-testid="page-rewards">Rewards Page</div>,
}));

vi.mock('@/pages/CompensationsPage', () => ({
  default: () => <div data-testid="page-compensations">Compensations Page</div>,
}));

vi.mock('@/pages/FraudDashboardPage', () => ({
  default: () => <div data-testid="page-fraud">Fraud Page</div>,
}));

vi.mock('@/pages/PrizeHomesPage', () => ({
  default: () => <div data-testid="page-prize-homes">Prize Homes Page</div>,
}));

vi.mock('@/pages/AuditLogsPage', () => ({
  default: () => <div data-testid="page-audit-logs">Audit Logs Page</div>,
}));

vi.mock('@/pages/WarningsPage', () => ({
  default: () => <div data-testid="page-warnings">Warnings Page</div>,
}));

vi.mock('@/pages/ReferralsPage', () => ({
  default: () => <div data-testid="page-referrals">Referrals Page</div>,
}));

vi.mock('@/pages/PollsPage', () => ({
  default: () => <div data-testid="page-polls">Polls Page</div>,
}));

vi.mock('@/pages/LoginPage', () => ({
  default: () => <div data-testid="page-login">Login Page</div>,
}));

const renderApp = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('Navigation', () => {
  it('renders dashboard at /dashboard', () => {
    renderApp('/dashboard');
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });

  it('renders users at /users', () => {
    renderApp('/users');
    expect(screen.getByTestId('page-users')).toBeInTheDocument();
  });

  it('renders kyc at /kyc', () => {
    renderApp('/kyc');
    expect(screen.getByTestId('page-kyc')).toBeInTheDocument();
  });

  it('renders contests at /contests', () => {
    renderApp('/contests');
    expect(screen.getByTestId('page-contests')).toBeInTheDocument();
  });

  it('renders config at /config', () => {
    renderApp('/config');
    expect(screen.getByTestId('page-config')).toBeInTheDocument();
  });

  it('renders withdrawals at /withdrawals', () => {
    renderApp('/withdrawals');
    expect(screen.getByTestId('page-withdrawals')).toBeInTheDocument();
  });

  it('renders payments at /payments', () => {
    renderApp('/payments');
    expect(screen.getByTestId('page-payments')).toBeInTheDocument();
  });

  it('renders support at /support', () => {
    renderApp('/support');
    expect(screen.getByTestId('page-support')).toBeInTheDocument();
  });

  it('renders banners at /banners', () => {
    renderApp('/banners');
    expect(screen.getByTestId('page-banners')).toBeInTheDocument();
  });

  it('renders notifications at /notifications', () => {
    renderApp('/notifications');
    expect(screen.getByTestId('page-notifications')).toBeInTheDocument();
  });

  it('renders reports at /reports', () => {
    renderApp('/reports');
    expect(screen.getByTestId('page-reports')).toBeInTheDocument();
  });

  it('renders leaderboard at /leaderboard', () => {
    renderApp('/leaderboard');
    expect(screen.getByTestId('page-leaderboard')).toBeInTheDocument();
  });

  it('renders rewards at /rewards', () => {
    renderApp('/rewards');
    expect(screen.getByTestId('page-rewards')).toBeInTheDocument();
  });

  it('renders compensations at /compensations', () => {
    renderApp('/compensations');
    expect(screen.getByTestId('page-compensations')).toBeInTheDocument();
  });

  it('renders fraud at /fraud', () => {
    renderApp('/fraud');
    expect(screen.getByTestId('page-fraud')).toBeInTheDocument();
  });

  it('renders prize-homes at /prize-homes', () => {
    renderApp('/prize-homes');
    expect(screen.getByTestId('page-prize-homes')).toBeInTheDocument();
  });

  it('renders audit-logs at /audit-logs', () => {
    renderApp('/audit-logs');
    expect(screen.getByTestId('page-audit-logs')).toBeInTheDocument();
  });

  it('renders warnings at /warnings', () => {
    renderApp('/warnings');
    expect(screen.getByTestId('page-warnings')).toBeInTheDocument();
  });

  it('renders referrals at /referrals', () => {
    renderApp('/referrals');
    expect(screen.getByTestId('page-referrals')).toBeInTheDocument();
  });

  it('renders polls at /polls', () => {
    renderApp('/polls');
    expect(screen.getByTestId('page-polls')).toBeInTheDocument();
  });

  it('redirects / to /dashboard', () => {
    renderApp('/');
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });

  it('redirects unknown routes to /dashboard', () => {
    renderApp('/unknown');
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });
});
