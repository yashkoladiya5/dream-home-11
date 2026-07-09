import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SupportPage from '../../pages/SupportPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 's1', userId: 'u1', userName: 'Iris', userPhone: '9999999999', subject: 'Cannot login', message: 'I am unable to login to my account', status: 'open', category: 'technical', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { _id: 's2', userId: 'u2', userName: 'Jack', userPhone: '1010101010', subject: 'Withdrawal issue', message: 'My withdrawal is pending for 3 days', status: 'in_progress', category: 'payment', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)) },
}));

describe('SupportPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><SupportPage /></BrowserRouter>);
    expect(screen.getByText('Support Tickets')).toBeInTheDocument();
  });

  it('renders tickets', async () => {
    render(<BrowserRouter><SupportPage /></BrowserRouter>);
    expect(await screen.findByText('Iris')).toBeInTheDocument();
    expect(await screen.findByText('Jack')).toBeInTheDocument();
  });

  it('shows ticket subjects', async () => {
    render(<BrowserRouter><SupportPage /></BrowserRouter>);
    expect(await screen.findByText('Cannot login')).toBeInTheDocument();
    expect(await screen.findByText('Withdrawal issue')).toBeInTheDocument();
  });

  it('shows status badges', async () => {
    render(<BrowserRouter><SupportPage /></BrowserRouter>);
    expect(await screen.findByText('Open')).toBeInTheDocument();
    const inProgress = screen.getAllByText('In Progress');
    expect(inProgress.length).toBeGreaterThanOrEqual(1);
  });

  it('shows filter selects', () => {
    render(<BrowserRouter><SupportPage /></BrowserRouter>);
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    });
    render(<BrowserRouter><SupportPage /></BrowserRouter>);
    expect(await screen.findByText('No support tickets found')).toBeInTheDocument();
  });
});
