import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import BannersPage from '../../pages/BannersPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 'b1', title: 'Summer Sale', subtitle: 'Get 50% off', imageUrl: '/summer.jpg', linkType: 'contest', linkId: 'c1', isActive: true, order: 1, bgColor: '#121826', createdAt: new Date().toISOString() },
      { _id: 'b2', title: 'New Feature', subtitle: 'Try it now', imageUrl: '/feature.jpg', linkType: 'none', linkId: '', isActive: false, order: 2, bgColor: '#121826', createdAt: new Date().toISOString() },
    ],
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('BannersPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><BannersPage /></BrowserRouter>);
    expect(screen.getByText('Banners')).toBeInTheDocument();
  });

  it('renders banner list', async () => {
    render(<BrowserRouter><BannersPage /></BrowserRouter>);
    expect(await screen.findByText('Summer Sale')).toBeInTheDocument();
    expect(await screen.findByText('New Feature')).toBeInTheDocument();
  });

  it('shows subtitles', async () => {
    render(<BrowserRouter><BannersPage /></BrowserRouter>);
    expect(await screen.findByText('Get 50% off')).toBeInTheDocument();
  });

  it('shows Add Banner button', () => {
    render(<BrowserRouter><BannersPage /></BrowserRouter>);
    expect(screen.getByText('Add Banner')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({ data: { data: [] } });
    render(<BrowserRouter><BannersPage /></BrowserRouter>);
    expect(await screen.findByText('No banners yet. Create one to display on the home screen.')).toBeInTheDocument();
  });
});
