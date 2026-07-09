import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '../../pages/LoginPage';

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('renders login form', () => {
    renderLoginPage();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Dream Home')).toBeInTheDocument();
  });

  it('has phone input', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText('Enter registered phone number')).toBeInTheDocument();
  });

  it('has login button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });
});
