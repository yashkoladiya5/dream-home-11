import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Spinner from '../../components/ui/Spinner';

describe('Spinner', () => {
  it('renders with default size', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
  });

  it('renders with sm size', () => {
    const { container } = render(<Spinner size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
  });

  it('renders with md size', () => {
    const { container } = render(<Spinner size="md" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
  });

  it('renders with lg size', () => {
    const { container } = render(<Spinner size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '40');
  });

  it('renders with numeric size', () => {
    const { container } = render(<Spinner size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="my-custom-class" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('my-custom-class');
  });

  it('has animate-spin class on svg', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });
});
