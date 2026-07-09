import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ReferralsPage from '../../pages/ReferralsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockReferrals = {
  data: {
    data: [
      { _id: 'r1', referrer: { name: 'Kim', phone: '1111111111' }, referee: { name: 'Lee', phone: '2222222222' }, reward: 100, status: 'settled', createdAt: new Date().toISOString() },
      { _id: 'r2', referrer: { name: 'Max', phone: '3333333333' }, referee: { name: 'Nina', phone: '4444444444' }, reward: 50, status: 'pending', createdAt: new Date().toISOString() },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

const mockStats = { data: { data: { totalReferrals: 100, totalReferrers: 45, totalPayouts: 25000, settled: 80 } } };

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn((url: string) => url.includes('/stats') ? Promise.resolve(mockStats) : Promise.resolve(mockReferrals)) },
}));

describe('ReferralsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><ReferralsPage /></BrowserRouter>);
    expect(screen.getByText('Referrals')).toBeInTheDocument();
  });

  it('renders referrals list', async () => {
    render(<BrowserRouter><ReferralsPage /></BrowserRouter>);
    expect(await screen.findByText('Kim')).toBeInTheDocument();
    expect(await screen.findByText('Max')).toBeInTheDocument();
  });

  it('shows referee names', async () => {
    render(<BrowserRouter><ReferralsPage /></BrowserRouter>);
    expect(await screen.findByText('Lee')).toBeInTheDocument();
    expect(await screen.findByText('Nina')).toBeInTheDocument();
  });

  it('shows status badges', async () => {
    render(<BrowserRouter><ReferralsPage /></BrowserRouter>);
    const settled = await screen.findAllByText('Settled');
    expect(settled.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('Pending')).toBeInTheDocument();
  });

  it('shows empty state when no referrals', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValue({ data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
    render(<BrowserRouter><ReferralsPage /></BrowserRouter>);
    expect(await screen.findByText('No Referrals Yet')).toBeInTheDocument();
  });
});
