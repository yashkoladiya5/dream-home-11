import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Layout from '../../components/Layout';

vi.mock('@/lib/auth', () => ({
  getStoredUser: vi.fn(() => ({ name: 'Admin User', role: 'admin' })),
  logout: vi.fn(),
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Layout />
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('renders sidebar navigation', () => {
    renderLayout();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Contests')).toBeInTheDocument();
    expect(screen.getByText('KYC')).toBeInTheDocument();
  });

  it('renders admin console branding', () => {
    renderLayout();
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
  });

  it('renders user name in sidebar', () => {
    renderLayout();
    const names = screen.getAllByText('Admin User');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('renders admin role in sidebar', () => {
    renderLayout();
    const roles = screen.getAllByText('admin');
    expect(roles.length).toBeGreaterThanOrEqual(1);
  });

  it('renders all nav items', () => {
    renderLayout();
    expect(screen.getByText('Prize Homes')).toBeInTheDocument();
    expect(screen.getByText('Banners')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('Withdrawals')).toBeInTheDocument();
  });

  it('renders SYSTEM STATUS', () => {
    renderLayout();
    expect(screen.getByText(/SYSTEM STATUS/)).toBeInTheDocument();
  });

  it('renders logout button', () => {
    renderLayout();
    const logoutBtn = document.querySelector('[title="Logout"]');
    expect(logoutBtn).toBeInTheDocument();
  });

  it('renders version text', () => {
    renderLayout();
    expect(screen.getByText(/V1.2.0/)).toBeInTheDocument();
  });
});
