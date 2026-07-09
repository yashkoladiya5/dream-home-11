import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ContestsPage from '../../pages/ContestsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 'c1', title: 'Mega Contest', entryFee: 100, totalPrize: 12000000, maxSlots: 1000, filledSlots: 750, status: 'running', type: 'mega', startTime: new Date().toISOString(), endTime: new Date().toISOString(), createdAt: new Date().toISOString() },
      { _id: 'c2', title: 'Head to Head', entryFee: 50, totalPrize: 100, maxSlots: 2, filledSlots: 2, status: 'completed', type: 'head-to-head', startTime: new Date().toISOString(), endTime: new Date().toISOString(), createdAt: new Date().toISOString() },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)) },
}));

describe('ContestsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><ContestsPage /></BrowserRouter>);
    expect(screen.getByText('Contests')).toBeInTheDocument();
  });

  it('renders contest list', async () => {
    render(<BrowserRouter><ContestsPage /></BrowserRouter>);
    expect(await screen.findByText('Mega Contest')).toBeInTheDocument();
    expect(await screen.findByText('Head to Head')).toBeInTheDocument();
  });

  it('renders search and filter inputs', () => {
    render(<BrowserRouter><ContestsPage /></BrowserRouter>);
    expect(screen.getByPlaceholderText('Search contests...')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('All Types')).toBeInTheDocument();
  });

  it('renders slot information', async () => {
    render(<BrowserRouter><ContestsPage /></BrowserRouter>);
    expect(await screen.findByText('750/1000')).toBeInTheDocument();
    expect(await screen.findByText('2/2')).toBeInTheDocument();
  });

  it('shows empty state when no contests', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    });
    render(<BrowserRouter><ContestsPage /></BrowserRouter>);
    expect(await screen.findByText('No contests found')).toBeInTheDocument();
  });
});
