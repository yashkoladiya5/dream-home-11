import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import AuditLogsPage from '../../pages/AuditLogsPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const mockResponse = {
  data: {
    data: [
      { _id: 'a1', adminId: 'adm1', adminName: 'Sam Admin', action: 'APPROVE_KYC', target: 'u1', targetType: 'user', ip: '192.168.1.1', details: '{"reason":"verified"}', createdAt: new Date().toISOString() },
      { _id: 'a2', adminId: 'adm2', adminName: 'Taylor Admin', action: 'UPDATE_CONFIG', target: 'config_1', targetType: 'config', ip: '192.168.1.2', details: '{"field":"maintenanceMode"}', createdAt: new Date().toISOString() },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve(mockResponse)) },
}));

describe('AuditLogsPage', () => {
  it('renders page title', () => {
    render(<BrowserRouter><AuditLogsPage /></BrowserRouter>);
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('renders audit log entries', async () => {
    render(<BrowserRouter><AuditLogsPage /></BrowserRouter>);
    expect(await screen.findByText('Sam Admin')).toBeInTheDocument();
    expect(await screen.findByText('Taylor Admin')).toBeInTheDocument();
  });

  it('shows action badges', async () => {
    render(<BrowserRouter><AuditLogsPage /></BrowserRouter>);
    const approveKyc = screen.getAllByText('Approve KYC');
    expect(approveKyc.length).toBeGreaterThanOrEqual(1);
    const updateConfig = screen.getAllByText('Update Config');
    expect(updateConfig.length).toBeGreaterThanOrEqual(1);
  });

  it('shows filter select', () => {
    render(<BrowserRouter><AuditLogsPage /></BrowserRouter>);
    expect(screen.getByText('All Actions')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const apiMod = await import('../../lib/api');
    vi.mocked(apiMod.default.get).mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    });
    render(<BrowserRouter><AuditLogsPage /></BrowserRouter>);
    expect(await screen.findByText('No audit logs found')).toBeInTheDocument();
  });
});
