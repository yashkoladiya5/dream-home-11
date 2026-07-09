import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import NotificationsPage from '../../pages/NotificationsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../lib/api', () => ({ default: { post: vi.fn() } }));

describe('NotificationsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><NotificationsPage /></BrowserRouter>);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders tabs', () => {
    render(<BrowserRouter><NotificationsPage /></BrowserRouter>);
    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    expect(screen.getByText('SMS Broadcast')).toBeInTheDocument();
  });

  it('shows push notification form by default', () => {
    render(<BrowserRouter><NotificationsPage /></BrowserRouter>);
    expect(screen.getByPlaceholderText('Notification title')).toBeInTheDocument();
    expect(screen.getByText('Send Push Notification')).toBeInTheDocument();
  });

  it('shows SMS broadcast form when tab clicked', async () => {
    const user = (await import('@testing-library/user-event')).default;
    render(<BrowserRouter><NotificationsPage /></BrowserRouter>);
    await user.click(screen.getByText('SMS Broadcast'));
    expect(screen.getByText('Send SMS')).toBeInTheDocument();
  });

  it('disables send button when title and message empty', () => {
    render(<BrowserRouter><NotificationsPage /></BrowserRouter>);
    const sendBtn = screen.getByText('Send Push Notification');
    expect(sendBtn.closest('button')).toBeDisabled();
  });
});
