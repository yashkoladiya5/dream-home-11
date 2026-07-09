import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';

vi.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster" />,
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
}));

vi.mock('@/components/Layout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    default: () => <div data-testid="layout"><Outlet /></div>,
  };
});

vi.mock('@/pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login</div>,
}));

vi.mock('@/pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

describe('App', () => {
  it('renders Toaster', () => {
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>);
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('renders LoginPage at /login', () => {
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders ProtectedRoute and Layout for authenticated routes', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('redirects / to /dashboard', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
  });

  it('renders DashboardPage at /dashboard', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('renders routes for all main pages', () => {
    const { unmount } = render(<MemoryRouter initialEntries={['/users']}><App /></MemoryRouter>);
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    unmount();
  });

  it('redirects unknown routes to /dashboard', () => {
    render(<MemoryRouter initialEntries={['/unknown-route']}><App /></MemoryRouter>);
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
  });
});
