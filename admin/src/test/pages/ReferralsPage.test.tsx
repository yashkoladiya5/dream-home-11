import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ReferralsPage from '../../pages/ReferralsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockReferralsResponse = {
  data: {
    success: true,
    data: [
      { id: 'r1', _id: 'r1', referrer: { fullName: 'Kim', phoneNumber: '1111111111', phone: '1111111111' }, referee: { fullName: 'Lee', phoneNumber: '2222222222', phone: '2222222222' }, signupReward: 100, kycReward: 0, status: 'settled', createdAt: new Date().toISOString() },
      { id: 'r2', _id: 'r2', referrer: { fullName: 'Max', phoneNumber: '3333333333', phone: '3333333333' }, referee: { fullName: 'Nina', phoneNumber: '4444444444', phone: '4444444444' }, signupReward: 50, kycReward: 0, status: 'pending', createdAt: new Date().toISOString() },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    stats: { totalReferrals: 100, totalReferrers: 45, totalPayouts: 25000, settledCount: 80 },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockReferralsResponse)) },
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
    vi.mocked(apiMod.default.get).mockResolvedValue({
      data: { success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, stats: { totalReferrals: 0, totalReferrers: 0, totalPayouts: 0, settledCount: 0 } },
    } as any);
    render(<BrowserRouter><ReferralsPage /></BrowserRouter>);
    expect(await screen.findByText('No Referrals Yet')).toBeInTheDocument();
  });
});
