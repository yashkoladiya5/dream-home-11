import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Select from '../../components/ui/Select';

const options = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

describe('Select', () => {
  it('renders options', () => {
    render(<Select options={options} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Select label="Status Filter" options={options} />);
    expect(screen.getByText('Status Filter')).toBeInTheDocument();
  });

  it('handles selection change', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Select options={options} onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'active');
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows placeholder option', () => {
    render(<Select options={[{ value: '', label: 'Select...' }]} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Select ref={ref} options={options} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('applies custom className to select', () => {
    render(<Select options={options} className="custom-select" />);
    expect(screen.getByRole('combobox').className).toContain('custom-select');
  });

  it('renders ChevronDown icon', () => {
    const { container } = render(<Select options={options} />);
    const chevron = container.querySelector('.lucide-chevron-down');
    expect(chevron).toBeInTheDocument();
  });

  it('renders label above select', () => {
    render(<Select label="Filter" options={options} />);
    const label = screen.getByText('Filter');
    const select = screen.getByRole('combobox');
    expect(label).toBeInTheDocument();
    expect(select).toBeInTheDocument();
  });
});
