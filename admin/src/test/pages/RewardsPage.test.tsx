import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import RewardsPage from '../../pages/RewardsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 'rw1', title: 'Dream11 T-Shirt', description: 'Premium cotton t-shirt', imageUrl: '/tshirt.jpg', pointsRequired: 500, stock: 50, category: 'merchandise', isActive: true, sortOrder: 1, createdAt: new Date().toISOString() },
      { _id: 'rw2', title: '₹100 Voucher', description: 'Amazon gift voucher', imageUrl: '/voucher.jpg', pointsRequired: 200, stock: 0, category: 'voucher', isActive: true, sortOrder: 2, createdAt: new Date().toISOString() },
    ],
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('RewardsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><RewardsPage /></BrowserRouter>);
    expect(screen.getByText('Rewards Catalog')).toBeInTheDocument();
  });

  it('renders rewards list', async () => {
    render(<BrowserRouter><RewardsPage /></BrowserRouter>);
    expect(await screen.findByText('Dream11 T-Shirt')).toBeInTheDocument();
    expect(await screen.findByText('₹100 Voucher')).toBeInTheDocument();
  });

  it('shows point requirements', async () => {
    render(<BrowserRouter><RewardsPage /></BrowserRouter>);
    expect(await screen.findByText('500')).toBeInTheDocument();
    expect(await screen.findByText('200')).toBeInTheDocument();
  });

  it('shows Add Reward button', () => {
    render(<BrowserRouter><RewardsPage /></BrowserRouter>);
    expect(screen.getByText('Add Reward')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({ data: { data: [] } });
    render(<BrowserRouter><RewardsPage /></BrowserRouter>);
    expect(await screen.findByText('No rewards yet. Create one to populate the catalog.')).toBeInTheDocument();
  });
});
