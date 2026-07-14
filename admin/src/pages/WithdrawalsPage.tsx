import { useState, useEffect, useCallback } from 'react';
import { Search, Banknote, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { type ApiResponse } from '../lib/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatsCard from '../components/ui/StatsCard';

interface WithdrawalEntry {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  bankAccount?: string;
  ifscCode?: string;
  upiId?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

interface WithdrawalStats {
  totalRequests: number;
  pending: number;
  approvedToday: number;
  totalAmount: number;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function WithdrawalsPage() {
  const [entries, setEntries] = useState<WithdrawalEntry[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('');
  const limit = 20;

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WithdrawalEntry | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedUserId = useDebounce(userId, 400);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get<ApiResponse<WithdrawalStats>>('/admin/withdrawals/stats');
      setStats(data.data);
    } catch {
      // silently fail for stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (debouncedUserId) params.userId = debouncedUserId;
      if (status) params.status = status;

      const { data } = await api.get<ApiResponse<WithdrawalEntry[]>>('/admin/withdrawals', { params });
      setEntries(data.data);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedUserId, status]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    setPage(1);
  }, [debouncedUserId, status]);

  const handleApprove = async () => {
    if (!selectedEntry) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/withdrawals/${selectedEntry.id}/approve`);
      toast.success('Withdrawal approved successfully');
      setShowApproveModal(false);
      setSelectedEntry(null);
      fetchEntries();
      fetchStats();
    } catch {
      toast.error('Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEntry || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/withdrawals/${selectedEntry.id}/reject`, { reason: rejectReason.trim() });
      toast.success('Withdrawal rejected');
      setShowRejectModal(false);
      setSelectedEntry(null);
      setRejectReason('');
      fetchEntries();
      fetchStats();
    } catch {
      toast.error('Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (entry: WithdrawalEntry) => {
    setSelectedEntry(entry);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const columns = [
    {
      key: 'userName',
      header: 'User Profile',
      render: (e: WithdrawalEntry) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{e.userName || 'Unnamed User'}</span>
          <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{e.userId}</span>
        </div>
      ),
    },
    { key: 'userPhone', header: 'Phone', render: (e: WithdrawalEntry) => <span className="text-slate-400 font-medium">{e.userPhone || '—'}</span> },
    {
      key: 'amount',
      header: 'Amount',
      render: (e: WithdrawalEntry) => (
        <span className="text-emerald-400 font-bold text-sm">{formatAmount(e.amount)}</span>
      ),
    },
    {
      key: 'bankDetails',
      header: 'Bank / UPI',
      render: (e: WithdrawalEntry) => (
        <div className="flex flex-col gap-0.5">
          {e.upiId ? (
            <span className="text-xs text-slate-300 font-medium">{e.upiId}</span>
          ) : (
            <>
              {e.bankAccount && (
                <span className="text-xs text-slate-300 font-mono">••••{e.bankAccount?.slice(-4) ?? 'XXXX'}</span>
              )}
              {e.ifscCode && (
                <span className="text-[10px] text-slate-500 font-mono">{e.ifscCode}</span>
              )}
            </>
          )}
          {!e.bankAccount && !e.upiId && <span className="text-slate-500 text-xs">—</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e: WithdrawalEntry) => (
        <Badge variant={statusVariant[e.status] ?? 'default'}>
          {statusLabel[e.status] ?? e.status}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Date', render: (e: WithdrawalEntry) => <span className="text-slate-500 text-xs font-semibold">{formatDate(e.createdAt)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (e: WithdrawalEntry) =>
        e.status === 'pending' ? (
          <div className="flex gap-1.5 justify-end" onClick={(ev) => ev.stopPropagation()}>
            <button
              onClick={() => {
                setSelectedEntry(e);
                setShowApproveModal(true);
              }}
              className="p-2 rounded-xl text-emerald-400 hover:text-white bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 shadow-sm"
              title="Approve"
            >
              <CheckCircle size={14} />
            </button>
            <button
              onClick={() => openRejectModal(e)}
              className="p-2 rounded-xl text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30 transition-all duration-300 shadow-sm"
              title="Reject"
            >
              <XCircle size={14} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Withdrawal Requests</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Approve or reject user withdrawal requests</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={() => { fetchEntries(); fetchStats(); }} className="shrink-0">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Banknote}
          value={statsLoading ? '—' : (stats?.totalRequests ?? 0)}
          label="Total Requests"
          loading={statsLoading}
        />
        <StatsCard
          icon={Clock}
          value={statsLoading ? '—' : (stats?.pending ?? 0)}
          label="Pending"
          loading={statsLoading}
        />
        <StatsCard
          icon={CheckCircle}
          value={statsLoading ? '—' : (stats?.approvedToday ?? 0)}
          label="Approved Today"
          loading={statsLoading}
        />
        <StatsCard
          icon={Banknote}
          value={statsLoading ? '—' : formatAmount(stats?.totalAmount ?? 0)}
          label="Total Amount"
          loading={statsLoading}
        />
      </div>

      {/* Filter panel */}
      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by User ID..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <Table<WithdrawalEntry>
        columns={columns}
        data={entries}
        loading={loading}
        emptyMessage="No withdrawal requests found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end pt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Approve Dialog */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedEntry(null);
        }}
        title="Approve Withdrawal"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedEntry(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" loading={actionLoading} onClick={handleApprove}>
              Approve Withdrawal
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-semibold text-emerald-400">
            <AlertCircle size={16} />
            This will release the funds to the user's account.
          </div>
          <p className="text-sm text-slate-300">
            Are you sure you want to approve <strong className="text-emerald-400">{formatAmount(selectedEntry?.amount ?? 0)}</strong> withdrawal for <strong className="text-white">{selectedEntry?.userName}</strong>?
          </p>
        </div>
      </Modal>

      {/* Reject Dialog */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedEntry(null);
          setRejectReason('');
        }}
        title="Reject Withdrawal"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedEntry(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              disabled={!rejectReason.trim()}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs font-semibold text-rose-400">
            <AlertCircle size={16} />
            This will reject the withdrawal request and notify the user.
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Rejection Reason</label>
            <textarea
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              placeholder="e.g. Insufficient balance or incorrect bank details"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
