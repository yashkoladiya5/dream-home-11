import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Table from '../../components/ui/Table';

interface TestItem {
  _id: string;
  name: string;
  value: number;
}

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'value', header: 'Value' },
];

const data: TestItem[] = [
  { _id: '1', name: 'Alice', value: 100 },
  { _id: '2', name: 'Bob', value: 200 },
];

describe('Table', () => {
  it('renders headers', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders empty message when no data', () => {
    render(<Table columns={columns} data={[]} emptyMessage="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(<Table columns={columns} data={[]} loading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows default empty message', () => {
    render(<Table columns={columns} data={[]} />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders with custom render function', () => {
    const cols = [
      {
        key: 'name',
        header: 'Name',
        render: (item: TestItem) => <span data-testid="custom-name">{item.name.toUpperCase()}</span>,
      },
    ];
    render(<Table columns={cols} data={data} />);
    expect(screen.getByText('ALICE')).toBeInTheDocument();
  });

  it('handles row click', () => {
    const handleClick = vi.fn();
    render(<Table columns={columns} data={data} onRowClick={handleClick} />);
    const rows = document.querySelectorAll('tbody tr');
    (rows[0] as HTMLElement).click();
    expect(handleClick).toHaveBeenCalledWith(data[0]);
  });

  it('renders string values by default', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });
});
