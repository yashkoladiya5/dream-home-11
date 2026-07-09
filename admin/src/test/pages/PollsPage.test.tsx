import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import PollsPage from '../../pages/PollsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 'p1', question: 'Best player?', options: [{ text: 'Player A', count: 50 }, { text: 'Player B', count: 30 }], totalVotes: 80, activeFrom: new Date().toISOString(), activeTo: new Date(Date.now() + 86400000).toISOString(), isActive: true, createdAt: new Date().toISOString() },
      { _id: 'p2', question: 'Favorite sport?', options: [{ text: 'Cricket', count: 100 }, { text: 'Football', count: 60 }], totalVotes: 160, activeFrom: new Date().toISOString(), activeTo: new Date(Date.now() + 86400000).toISOString(), isActive: false, createdAt: new Date().toISOString() },
    ],
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('PollsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><PollsPage /></BrowserRouter>);
    expect(screen.getByText('Polls')).toBeInTheDocument();
  });

  it('renders poll questions', async () => {
    render(<BrowserRouter><PollsPage /></BrowserRouter>);
    expect(await screen.findByText('Best player?')).toBeInTheDocument();
    expect(await screen.findByText('Favorite sport?')).toBeInTheDocument();
  });

  it('shows vote counts', async () => {
    render(<BrowserRouter><PollsPage /></BrowserRouter>);
    expect(await screen.findByText('80')).toBeInTheDocument();
    expect(await screen.findByText('160')).toBeInTheDocument();
  });

  it('shows Add Poll button', () => {
    render(<BrowserRouter><PollsPage /></BrowserRouter>);
    expect(screen.getByText('Add Poll')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({ data: { data: [] } });
    render(<BrowserRouter><PollsPage /></BrowserRouter>);
    expect(await screen.findByText('No polls yet. Create one to start collecting votes.')).toBeInTheDocument();
  });
});
