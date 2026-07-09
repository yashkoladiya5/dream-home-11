import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Users } from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard icon={Users} value="1,234" label="Total Users" />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(<StatsCard icon={Users} value="0" label="Loading" loading />);
    const pulseDivs = container.querySelectorAll('.animate-pulse');
    expect(pulseDivs.length).toBeGreaterThan(0);
  });

  it('shows positive trend indicator', () => {
    render(<StatsCard icon={Users} value="100" label="Users" trend={{ value: 12, isPositive: true }} />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('shows negative trend indicator', () => {
    render(<StatsCard icon={Users} value="100" label="Users" trend={{ value: 5, isPositive: false }} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('does not show trend when not provided', () => {
    render(<StatsCard icon={Users} value="100" label="Users" />);
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('renders with numeric value', () => {
    render(<StatsCard icon={Users} value={42} label="Count" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('applies dynamic color based on deposits label', () => {
    render(<StatsCard icon={Users} value="500" label="Total Deposits" />);
    const iconContainer = document.querySelector('.w-12.h-12.rounded-xl');
    expect(iconContainer?.className).toContain('emerald');
  });

  it('applies dynamic color based on kyc label', () => {
    render(<StatsCard icon={Users} value="10" label="Pending KYC" />);
    const iconContainer = document.querySelector('.w-12.h-12.rounded-xl');
    expect(iconContainer?.className).toContain('amber');
  });

  it('applies dynamic color based on tickets label', () => {
    render(<StatsCard icon={Users} value="5" label="Open Tickets" />);
    const iconContainer = document.querySelector('.w-12.h-12.rounded-xl');
    expect(iconContainer?.className).toContain('purple');
  });
});
