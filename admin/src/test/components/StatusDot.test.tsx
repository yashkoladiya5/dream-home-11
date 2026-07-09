import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusDot from '../../components/ui/StatusDot';

describe('StatusDot', () => {
  it('renders with active status', () => {
    const { container } = render(<StatusDot status="active" />);
    const dot = container.querySelector('.status-dot');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('status-active');
  });

  it('renders with warning status', () => {
    const { container } = render(<StatusDot status="warning" />);
    const dot = container.querySelector('.status-dot');
    expect(dot?.className).toContain('status-warning');
  });

  it('renders with error status', () => {
    const { container } = render(<StatusDot status="error" />);
    const dot = container.querySelector('.status-dot');
    expect(dot?.className).toContain('status-error');
  });

  it('renders with inactive status', () => {
    const { container } = render(<StatusDot status="inactive" />);
    const dot = container.querySelector('.status-dot');
    expect(dot?.className).toContain('status-inactive');
  });

  it('renders label when provided', () => {
    render(<StatusDot status="active" label="Online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    render(<StatusDot status="active" />);
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
  });
});
