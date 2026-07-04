import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api, { AuditLog } from '../lib/api';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'UPDATE_USER', label: 'Update User' },
  { value: 'UPDATE_CONFIG', label: 'Update Config' },
  { value: 'APPROVE_KYC', label: 'Approve KYC' },
  { value: 'REJECT_KYC', label: 'Reject KYC' },
  { value: 'COMPENSATE_CONTEST', label: 'Compensate Contest' },
  { value: 'BROADCAST_NOTIFICATION', label: 'Broadcast Notification' },
  { value: 'SUBMIT_KYC', label: 'Submit KYC' },
  { value: 'WITHDRAWAL_REQUEST', label: 'Withdrawal Request' },
  { value: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { value: 'POINTS_EARNED', label: 'Points Earned' },
];

const actionVariant: Record<string, 'info' | 'success' | 'error' | 'warning' | 'neutral'> = {
  UPDATE_USER: 'info',
  UPDATE_CONFIG: 'info',
  APPROVE_KYC: 'success',
  REJECT_KYC: 'error',
  COMPENSATE_CONTEST: 'warning',
  BROADCAST_NOTIFICATION: 'info',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [action, setAction] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, action]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (action) params.set('action', action);
      const { data } = await api.get(`/admin/audit-logs?${params}`);
      setLogs(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatAction = (act: string) => {
    if (!act) return '—';
    return act
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Track all admin actions and system events</p>
      </div>

      <div className="w-56">
        <Select
          options={ACTION_OPTIONS}
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
        />
      </div>

      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>Admin User</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Target ID</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}>
                      <div className="h-4 bg-slate-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr
                    key={log._id}
                    className="cursor-pointer"
                    onClick={() => toggleExpand(log._id)}
                  >
                    <td className="w-8">
                      {expandedId === log._id ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </td>
                    <td className="font-medium text-white">{log.adminName}</td>
                    <td>
                      <Badge variant={actionVariant[log.action] || 'neutral'}>
                        {formatAction(log.action)}
                      </Badge>
                    </td>
                    <td className="text-slate-400">{log.targetType}</td>
                    <td className="text-slate-500 font-mono text-xs">{log.target}</td>
                    <td className="text-slate-500 font-mono text-xs">{log.ip}</td>
                    <td className="text-slate-500 text-xs" title={new Date(log.createdAt).toLocaleString()}>
                      {formatTime(log.createdAt)}
                    </td>
                  </tr>
                  {expandedId === log._id && (
                    <tr key={`${log._id}-details`}>
                      <td colSpan={7} className="bg-slate-800 px-8 py-4">
                        <p className="text-xs font-medium text-slate-500 mb-2">Metadata</p>
                        <pre className="text-xs text-slate-300 bg-slate-800 rounded-lg border border-slate-700 p-3 overflow-auto max-h-48">
                          {log.details ? JSON.stringify(JSON.parse(log.details), null, 2) : 'No metadata'}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
