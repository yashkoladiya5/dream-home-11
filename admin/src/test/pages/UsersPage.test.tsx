import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import UsersPage from '../../pages/UsersPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    success: true,
    data: [
      { _id: '1', fullName: 'Alice Wonder', phone: '1111111111', email: 'alice@test.com', currentTier: 'gold', kycStatus: 'verified', walletBalance: 5000, isActive: true },
      { _id: '2', fullName: 'Bob Builder', phone: '2222222222', email: 'bob@test.com', currentTier: 'bronze', kycStatus: 'pending', walletBalance: 1200, isActive: false },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)) },
}));

describe('UsersPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><UsersPage /></BrowserRouter>);
    expect(screen.getByText('User Profiles')).toBeInTheDocument();
  });

  it('renders user list', async () => {
    render(<BrowserRouter><UsersPage /></BrowserRouter>);
    expect(await screen.findByText('Alice Wonder')).toBeInTheDocument();
    expect(await screen.findByText('Bob Builder')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<BrowserRouter><UsersPage /></BrowserRouter>);
    expect(screen.getByPlaceholderText('Search by name, phone, or email...')).toBeInTheDocument();
  });

  it('renders filter selects', () => {
    render(<BrowserRouter><UsersPage /></BrowserRouter>);
    expect(screen.getByText('All Roles')).toBeInTheDocument();
    expect(screen.getByText('All Status')).toBeInTheDocument();
    expect(screen.getByText('All Tiers')).toBeInTheDocument();
    expect(screen.getByText('All KYC')).toBeInTheDocument();
  });

  it('displays user KYC badges', async () => {
    render(<BrowserRouter><UsersPage /></BrowserRouter>);
    expect(await screen.findByText('Verified')).toBeInTheDocument();
    expect(await screen.findByText('Pending')).toBeInTheDocument();
  });

  it('renders View action buttons', async () => {
    render(<BrowserRouter><UsersPage /></BrowserRouter>);
    const viewButtons = await screen.findAllByText('View');
    expect(viewButtons.length).toBe(2);
  });

  it('shows empty state when filters return no results', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({
      data: { success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } },
    });
    render(<BrowserRouter><UsersPage /></BrowserRouter>);
    expect(await screen.findByText('No users found matching current filters.')).toBeInTheDocument();
  });
});
