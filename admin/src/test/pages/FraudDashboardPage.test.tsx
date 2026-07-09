import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import FraudDashboardPage from '../../pages/FraudDashboardPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockAlerts = {
  data: {
    data: [
      { _id: 'f1', userId: 'u1', userName: 'Quinn', userPhone: '5555555555', rule: 'multiple_accounts', severity: 'critical', description: 'Multiple accounts from same device', evidence: 'IP: 1.2.3.4', status: 'open', score: 95, createdAt: new Date().toISOString(), ipAddress: '1.2.3.4' },
      { _id: 'f2', userId: 'u2', userName: 'Ray', userPhone: '6666666666', rule: 'rapid_login', severity: 'low', description: 'Rapid login attempts', evidence: '5 attempts in 1 minute', status: 'resolved', score: 25, createdAt: new Date().toISOString() },
    ],
  },
};

const mockStats = {
  data: {
    data: {
      totalAlerts: 150, openAlerts: 23, criticalAlerts: 5, resolvedToday: 12,
      alertsBySeverity: [{ severity: 'critical', count: 5 }, { severity: 'high', count: 10 }, { severity: 'medium', count: 30 }, { severity: 'low', count: 105 }],
      topRules: [{ rule: 'multiple_accounts', count: 40 }, { rule: 'rapid_login', count: 25 }],
      alertsByDay: [{ date: new Date().toISOString(), count: 10 }],
    },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn((url: string) => {
    if (url.includes('/stats')) return Promise.resolve(mockStats);
    return Promise.resolve(mockAlerts);
  })},
}));

describe('FraudDashboardPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><FraudDashboardPage /></BrowserRouter>);
    expect(screen.getByText('Fraud Detection Dashboard')).toBeInTheDocument();
  });

  it('shows severity sections', async () => {
    render(<BrowserRouter><FraudDashboardPage /></BrowserRouter>);
    expect(await screen.findByText('Alerts by Severity')).toBeInTheDocument();
    expect(await screen.findByText('Top Rules Triggered')).toBeInTheDocument();
  });

  it('shows fraud alerts table', async () => {
    render(<BrowserRouter><FraudDashboardPage /></BrowserRouter>);
    expect(await screen.findByText('Quinn')).toBeInTheDocument();
    expect(await screen.findByText('Ray')).toBeInTheDocument();
  });

  it('shows severity badges', async () => {
    render(<BrowserRouter><FraudDashboardPage /></BrowserRouter>);
    expect(await screen.findByText('CRITICAL')).toBeInTheDocument();
  });

  it('shows rule names', async () => {
    render(<BrowserRouter><FraudDashboardPage /></BrowserRouter>);
    const rules = await screen.findAllByText('multiple accounts');
    expect(rules.length).toBeGreaterThanOrEqual(1);
  });
});
