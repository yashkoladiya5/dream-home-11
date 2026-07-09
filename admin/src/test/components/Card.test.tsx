import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from '../../components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="My Card"><p>Content</p></Card>);
    expect(screen.getByText('My Card')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(<Card><p>Content</p></Card>);
    expect(screen.queryByText('My Card')).not.toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(<Card actions={<button>Action</button>}><p>Content</p></Card>);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-card"><p>Content</p></Card>);
    const card = screen.getByText('Content').parentElement!;
    expect(card.className).toContain('custom-card');
  });

  it('renders title and actions simultaneously', () => {
    render(<Card title="Title" actions={<span data-testid="action" />}><p>Content</p></Card>);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByTestId('action')).toBeInTheDocument();
  });
});
