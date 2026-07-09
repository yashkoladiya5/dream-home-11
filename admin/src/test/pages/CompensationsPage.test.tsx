import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import CompensationsPage from '../../pages/CompensationsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockCompensations = {
  data: {
    data: [
      { _id: 'cp1', contestId: 'c1', contestTitle: 'Mega Contest', userName: 'Oliver', userPhone: '1212121212', entryFee: 100, points: 500, status: 'pending', createdAt: new Date().toISOString() },
      { _id: 'cp2', contestId: 'c2', contestTitle: 'Pool Contest', userName: 'Pat', userPhone: '3434343434', entryFee: 50, points: 200, status: 'processed', createdAt: new Date().toISOString() },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

const mockStats = { data: { data: { total: 50, pending: 10, processed: 38, failed: 2 } } };

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn((url: string) => url.includes('/stats') ? Promise.resolve(mockStats) : Promise.resolve(mockCompensations)) },
}));

describe('CompensationsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><CompensationsPage /></BrowserRouter>);
    expect(screen.getByText('Compensations')).toBeInTheDocument();
  });

  it('renders compensation list', async () => {
    render(<BrowserRouter><CompensationsPage /></BrowserRouter>);
    expect(await screen.findByText('Mega Contest')).toBeInTheDocument();
    expect(await screen.findByText('Pool Contest')).toBeInTheDocument();
  });

  it('shows user names', async () => {
    render(<BrowserRouter><CompensationsPage /></BrowserRouter>);
    expect(await screen.findByText('Oliver')).toBeInTheDocument();
    expect(await screen.findByText('Pat')).toBeInTheDocument();
  });

  it('shows status badges', async () => {
    render(<BrowserRouter><CompensationsPage /></BrowserRouter>);
    expect(await screen.findByText('pending')).toBeInTheDocument();
    expect(await screen.findByText('processed')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(<BrowserRouter><CompensationsPage /></BrowserRouter>);
    expect(screen.getByText('Process All Pending')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValue({ data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
    render(<BrowserRouter><CompensationsPage /></BrowserRouter>);
    expect(await screen.findByText('No compensations found')).toBeInTheDocument();
  });
});
