import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../../pages/LoginPage';

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/lib/auth', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Auth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows login form with phone input and role selector', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText('Enter registered phone number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('accepts phone number input', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const input = screen.getByPlaceholderText('Enter registered phone number');
    await user.type(input, '9999999999');
    expect(input).toHaveValue('9999999999');
  });

  it('accepts password input', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const input = screen.getByPlaceholderText('Enter admin password');
    await user.type(input, 'adminpass');
    expect(input).toHaveValue('adminpass');
  });

  it('calls login on form submit', async () => {
    mockLogin.mockResolvedValue({ _id: '1', name: 'Admin', phoneNumber: '9999999999', role: 'admin' });
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText('Enter registered phone number'), '9999999999');
    await user.type(screen.getByPlaceholderText('Enter admin password'), 'adminpass');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(mockLogin).toHaveBeenCalledWith('9999999999', 'adminpass');
  });

  it('navigates to dashboard on successful login', async () => {
    mockLogin.mockResolvedValue({ _id: '1', name: 'Admin', phoneNumber: '9999999999', role: 'admin' });
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText('Enter registered phone number'), '9999999999');
    await user.type(screen.getByPlaceholderText('Enter admin password'), 'adminpass');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state during login', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText('Enter registered phone number'), '9999999999');
    await user.type(screen.getByPlaceholderText('Enter admin password'), 'adminpass');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
  });
});
