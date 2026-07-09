import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import PrizeHomesPage from '../../pages/PrizeHomesPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 'ph1', name: 'Dream Villa', description: 'Beautiful villa in Goa', images: ['/villa.jpg'], location: 'Anjuna', city: 'Goa', value: 50000000, bhk: 4, area: '2500', amenities: ['Pool', 'Garden'], isActive: true, featured: true, createdAt: new Date().toISOString() },
      { _id: 'ph2', name: 'Lake House', description: 'Peaceful lake house', images: ['/lake.jpg'], location: 'Udaipur', city: 'Rajasthan', value: 30000000, bhk: 3, area: '1800', amenities: ['Boating'], isActive: false, featured: false, createdAt: new Date().toISOString() },
    ],
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('PrizeHomesPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><PrizeHomesPage /></BrowserRouter>);
    expect(screen.getByText('Prize Homes')).toBeInTheDocument();
  });

  it('renders prize home list', async () => {
    render(<BrowserRouter><PrizeHomesPage /></BrowserRouter>);
    expect(await screen.findByText('Dream Villa')).toBeInTheDocument();
    expect(await screen.findByText('Lake House')).toBeInTheDocument();
  });

  it('shows location info', async () => {
    render(<BrowserRouter><PrizeHomesPage /></BrowserRouter>);
    expect(await screen.findByText(/Anjuna, Goa/)).toBeInTheDocument();
    expect(await screen.findByText(/Udaipur, Rajasthan/)).toBeInTheDocument();
  });

  it('shows BHK info', async () => {
    render(<BrowserRouter><PrizeHomesPage /></BrowserRouter>);
    expect(await screen.findByText('4 BHK')).toBeInTheDocument();
    expect(await screen.findByText('3 BHK')).toBeInTheDocument();
  });

  it('shows status badges', async () => {
    render(<BrowserRouter><PrizeHomesPage /></BrowserRouter>);
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
    expect(await screen.findByText('Featured')).toBeInTheDocument();
  });

  it('shows Add Prize Home button', () => {
    render(<BrowserRouter><PrizeHomesPage /></BrowserRouter>);
    expect(screen.getByText('Add Prize Home')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({ data: { data: [] } });
    render(<BrowserRouter><PrizeHomesPage /></BrowserRouter>);
    expect(await screen.findByText('No prize homes found. Create your first one!')).toBeInTheDocument();
  });
});
