import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from '../../components/ui/Badge';

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge variant="success">Approved</Badge>);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Active</Badge>);
    const badge = screen.getByText('Active');
    expect(badge.className).toContain('text-emerald-400');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Pending</Badge>);
    const badge = screen.getByText('Pending');
    expect(badge.className).toContain('text-amber-400');
  });

  it('renders with error variant', () => {
    render(<Badge variant="error">Rejected</Badge>);
    const badge = screen.getByText('Rejected');
    expect(badge.className).toContain('text-red-400');
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText('Info');
    expect(badge.className).toContain('text-blue-400');
  });

  it('renders with neutral variant', () => {
    render(<Badge variant="neutral">Neutral</Badge>);
    const badge = screen.getByText('Neutral');
    expect(badge.className).toContain('text-slate-300');
  });

  it('renders with default variant', () => {
    render(<Badge variant="default">Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('text-slate-300');
  });

  it('applies custom className', () => {
    render(<Badge variant="success" className="extra-class">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('extra-class');
  });
});
