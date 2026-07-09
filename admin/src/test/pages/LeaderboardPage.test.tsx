import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LeaderboardPage from '../../pages/LeaderboardPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../lib/api', () => ({ default: { post: vi.fn() } }));

describe('LeaderboardPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><LeaderboardPage /></BrowserRouter>);
    expect(screen.getByText('Leaderboard Admin')).toBeInTheDocument();
  });

  it('renders sync section', () => {
    render(<BrowserRouter><LeaderboardPage /></BrowserRouter>);
    expect(screen.getByText('Sync Leaderboard')).toBeInTheDocument();
  });

  it('renders reset section', () => {
    render(<BrowserRouter><LeaderboardPage /></BrowserRouter>);
    expect(screen.getByText('Reset Leaderboard')).toBeInTheDocument();
  });

  it('shows sync buttons', () => {
    render(<BrowserRouter><LeaderboardPage /></BrowserRouter>);
    expect(screen.getByText('Sync Full Leaderboard')).toBeInTheDocument();
  });

  it('shows reset buttons', () => {
    render(<BrowserRouter><LeaderboardPage /></BrowserRouter>);
    expect(screen.getByText('Reset Weekly Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Reset Monthly Leaderboard')).toBeInTheDocument();
  });

  it('shows contest ID input', () => {
    render(<BrowserRouter><LeaderboardPage /></BrowserRouter>);
    expect(screen.getByPlaceholderText('Enter Contest ID')).toBeInTheDocument();
  });
});
