import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import WarningsPage from '../../pages/WarningsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 'w1', userId: 'u1', userName: 'Uma', userPhone: '7777777777', level: 1, reason: 'inappropriate_behavior', pointsDeducted: 200, status: 'active', issuedBy: 'adm1', issuedByName: 'Admin', createdAt: new Date().toISOString() },
      { _id: 'w2', userId: 'u2', userName: 'Victor', userPhone: '8888888888', level: 3, reason: 'fraud_suspicion', pointsDeducted: 0, status: 'resolved', issuedBy: 'adm1', issuedByName: 'Admin', resolvedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    ],
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)), post: vi.fn(), patch: vi.fn() },
}));

describe('WarningsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><WarningsPage /></BrowserRouter>);
    expect(screen.getByText('Warnings & Penalties')).toBeInTheDocument();
  });

  it('renders warnings list', async () => {
    render(<BrowserRouter><WarningsPage /></BrowserRouter>);
    expect(await screen.findByText('Uma')).toBeInTheDocument();
    expect(await screen.findByText('Victor')).toBeInTheDocument();
  });

  it('shows level badges', async () => {
    render(<BrowserRouter><WarningsPage /></BrowserRouter>);
    expect(await screen.findByText('L1')).toBeInTheDocument();
    expect(await screen.findByText('L3')).toBeInTheDocument();
  });

  it('shows reasons', async () => {
    render(<BrowserRouter><WarningsPage /></BrowserRouter>);
    expect(await screen.findByText('inappropriate behavior')).toBeInTheDocument();
    expect(await screen.findByText('fraud suspicion')).toBeInTheDocument();
  });

  it('shows Issue Warning button', () => {
    render(<BrowserRouter><WarningsPage /></BrowserRouter>);
    expect(screen.getByText('Issue Warning')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({ data: { data: [] } });
    render(<BrowserRouter><WarningsPage /></BrowserRouter>);
    expect(await screen.findByText('No warnings issued yet.')).toBeInTheDocument();
  });
});
