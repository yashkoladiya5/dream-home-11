import { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw, Search, Banknote, CreditCard, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { type ApiResponse } from '../lib/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: 'deposit' | 'withdrawal' | 'refund' | 'payout' | 'bonus' | 'fee';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  createdAt: string;
}

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'refund', label: 'Refund' },
  { value: 'payout', label: 'Payout' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'fee', label: 'Fee' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
};

const typeIcon: Record<string, React.ReactNode> = {
  deposit: <ArrowDownLeft size={14} className="text-emerald-400" />,
  withdrawal: <ArrowUpRight size={14} className="text-rose-400" />,
  refund: <Banknote size={14} className="text-blue-400" />,
  payout: <Landmark size={14} className="text-amber-400" />,
  bonus: <CreditCard size={14} className="text-violet-400" />,
  fee: <Wallet size={14} className="text-slate-400" />,
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransactions: 0,
    totalVolume: 0,
  });
  const limit = 20;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (type) params.type = type;
      if (status) params.status = status;
      if (search) params.search = search;

      const { data } = await api.get<ApiResponse<Transaction[]>>('/admin/transactions', { params });
      setTransactions(data.data);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, type, status, search]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<any>>('/admin/transactions/stats');
      if (data.data) {
        setStats(data.data);
      }
    } catch {
      // Fail silently for stats
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [fetchTransactions, fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [type, status]);

  const formatAmount = (amount: number, type: string) => {
    const formatted = `₹${amount.toLocaleString('en-IN')}`;
    if (type === 'deposit' || type === 'refund' || type === 'bonus') {
      return <span className="text-emerald-400">{formatted}</span>;
    }
    return <span className="text-rose-400">-{formatted}</span>;
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

  const columns = [
    {
      key: 'id',
      header: 'Transaction ID',
      render: (t: Transaction) => (
        <span className="font-mono text-xs text-slate-400">{t.id?.slice(-8) ?? ''}</span>
      ),
    },
    {
      key: 'userName',
      header: 'User',
      render: (t: Transaction) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">{t.userName}</span>
          <span className="text-xs text-slate-500">{t.userPhone}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (t: Transaction) => (
        <div className="flex items-center gap-2">
          {typeIcon[t.type] ?? <Wallet size={14} className="text-slate-400" />}
          <span className="capitalize text-slate-200">{t.type}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t: Transaction) => formatAmount(t.amount, t.type),
    },
    {
      key: 'description',
      header: 'Description',
      render: (t: Transaction) => (
        <span className="text-slate-400 text-sm max-w-xs truncate block">{t.description}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Transaction) => (
        <Badge variant={statusVariant[t.status] ?? 'neutral'}>{t.status}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (t: Transaction) => (
        <span className="text-slate-400 text-xs whitespace-nowrap">{formatDate(t.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-slate-400 mt-1">Manage all transactions and payments</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={fetchTransactions}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <ArrowDownLeft size={18} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">₹{(stats.totalDeposits || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">Total Deposits</p>
        </div>
        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <ArrowUpRight size={18} className="text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">₹{(stats.totalWithdrawals || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">Total Withdrawals</p>
        </div>
        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Wallet size={18} className="text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pendingTransactions}</p>
          <p className="text-xs text-slate-500 mt-1">Pending Transactions</p>
        </div>
        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Banknote size={18} className="text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">₹{(stats.totalVolume || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">Total Volume</p>
        </div>
      </div>

      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-48">
            <Input
              placeholder="Search user or ID..."
              icon={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select options={typeOptions} value={type} onChange={(e) => setType(e.target.value)} />
          </div>
          <div className="w-full sm:w-40">
            <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </div>
      </div>

      <Table<Transaction>
        columns={columns}
        data={transactions}
        loading={loading}
        emptyMessage="No transactions found"
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
