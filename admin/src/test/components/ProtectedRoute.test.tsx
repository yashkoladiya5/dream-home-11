import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from '../../components/ProtectedRoute';

const mockIsAuthenticated = vi.fn();
vi.mock('@/lib/auth', () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    mockIsAuthenticated.mockReturnValue(true);
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <p>Protected Content</p>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockIsAuthenticated.mockReturnValue(false);
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <p>Protected Content</p>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when token exists', () => {
    mockIsAuthenticated.mockReturnValue(true);
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="child">Child</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render children when no token', () => {
    mockIsAuthenticated.mockReturnValue(false);
    render(
      <MemoryRouter initialEntries={['/']}>
        <ProtectedRoute>
          <div data-testid="child">Child</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });
});
