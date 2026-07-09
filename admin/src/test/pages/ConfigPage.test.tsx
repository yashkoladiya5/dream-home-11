import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ConfigPage from '../../pages/ConfigPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockConfig = {
  data: {
    data: {
      appName: 'DreamHome11',
      appVersion: '2.1.0',
      apiVersion: 'v2',
      environment: 'production',
      maintenanceMode: false,
      minAppVersionAndroid: '1.5.0',
      minAppVersionIos: '1.5.0',
      minWithdrawalAmount: 100,
      maxWithdrawalAmount: 50000,
      featureFlags: { dailySpinEnabled: true, pollsEnabled: true, feedEnabled: false, chatEnabled: true, referralEnabled: true },
      maxDailyPosts: 5,
      maxDailySpins: 3,
      supportEmail: 'support@dreamhome11.com',
      restrictedStates: ['Assam', 'Odisha'],
    },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockConfig)), patch: vi.fn() },
}));

describe('ConfigPage', () => {
  it('renders page title', async () => {
    render(<BrowserRouter><ConfigPage /></BrowserRouter>);
    expect(await screen.findByText('System Settings')).toBeInTheDocument();
  });

  it('displays config form fields', async () => {
    render(<BrowserRouter><ConfigPage /></BrowserRouter>);
    expect(await screen.findByDisplayValue('DreamHome11')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('2.1.0')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('v2')).toBeInTheDocument();
  });

  it('displays environment', async () => {
    render(<BrowserRouter><ConfigPage /></BrowserRouter>);
    expect(await screen.findByText('production')).toBeInTheDocument();
  });

  it('displays feature toggles', async () => {
    render(<BrowserRouter><ConfigPage /></BrowserRouter>);
    expect(await screen.findByText('Daily Spin Enabled')).toBeInTheDocument();
    expect(await screen.findByText('Polls Enabled')).toBeInTheDocument();
    expect(await screen.findByText('Chat Enabled')).toBeInTheDocument();
  });

  it('displays restricted states', async () => {
    render(<BrowserRouter><ConfigPage /></BrowserRouter>);
    expect(await screen.findByText('Assam')).toBeInTheDocument();
    expect(await screen.findByText('Odisha')).toBeInTheDocument();
  });

  it('renders Save Settings button', async () => {
    render(<BrowserRouter><ConfigPage /></BrowserRouter>);
    expect(await screen.findByText('Save Settings')).toBeInTheDocument();
  });

  it('shows loading spinner initially', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockImplementationOnce(() => new Promise(() => {}));
    render(<BrowserRouter><ConfigPage /></BrowserRouter>);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
