import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Tabs from '../../components/ui/Tabs';

describe('Tabs', () => {
  const tabs = [
    { key: 'tab1', label: 'First Tab', content: <p>Content 1</p> },
    { key: 'tab2', label: 'Second Tab', content: <p>Content 2</p> },
    { key: 'tab3', label: 'Third Tab', content: <p>Content 3</p> },
  ];

  it('renders tab labels', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('Third Tab')).toBeInTheDocument();
  });

  it('shows first tab content by default', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches active tab on click', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    await user.click(screen.getByText('Second Tab'));
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('supports defaultActive prop', () => {
    render(<Tabs tabs={tabs} defaultActive="tab3" />);
    expect(screen.getByText('Content 3')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<Tabs tabs={tabs} />);
    const firstBtn = screen.getByText('First Tab');
    expect(firstBtn.className).toContain('border-brand-500');
  });

  it('switches highlight to clicked tab', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    await user.click(screen.getByText('Second Tab'));
    expect(screen.getByText('Second Tab').className).toContain('border-brand-500');
    expect(screen.getByText('First Tab').className).toContain('border-transparent');
  });
});
