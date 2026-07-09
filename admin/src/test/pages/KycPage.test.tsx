import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import KycPage from '../../pages/KycPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 'k1', userId: 'u1', userName: 'Charlie', userPhone: '3333333333', documentType: 'aadhaar', documentUrl: '/doc.jpg', status: 'pending', submittedAt: new Date().toISOString(), aadhaarNumber: '1234-5678-9012' },
      { _id: 'k2', userId: 'u2', userName: 'Diana', userPhone: '4444444444', documentType: 'pan', documentUrl: '/pan.jpg', status: 'approved', submittedAt: new Date().toISOString(), panNumber: 'ABCDE1234F' },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)) },
}));

describe('KycPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><KycPage /></BrowserRouter>);
    expect(screen.getByText('KYC Submissions')).toBeInTheDocument();
  });

  it('renders filter inputs', () => {
    render(<BrowserRouter><KycPage /></BrowserRouter>);
    expect(screen.getByPlaceholderText('Search by User ID...')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('renders KYC entries', async () => {
    render(<BrowserRouter><KycPage /></BrowserRouter>);
    expect(await screen.findByText('Charlie')).toBeInTheDocument();
    expect(await screen.findByText('Diana')).toBeInTheDocument();
  });

  it('shows status badges', async () => {
    render(<BrowserRouter><KycPage /></BrowserRouter>);
    expect(await screen.findByText('Pending')).toBeInTheDocument();
    const verified = screen.getAllByText('Verified');
    expect(verified.length).toBeGreaterThanOrEqual(1);
  });

  it('shows View Details buttons', async () => {
    render(<BrowserRouter><KycPage /></BrowserRouter>);
    const viewBtns = await screen.findAllByText('View Details');
    expect(viewBtns.length).toBe(2);
  });

  it('shows empty state when no entries', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    });
    render(<BrowserRouter><KycPage /></BrowserRouter>);
    expect(await screen.findByText('No KYC submissions found')).toBeInTheDocument();
  });
});
