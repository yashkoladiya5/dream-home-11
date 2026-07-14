import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  Users,
  UserCheck,
  Trophy,
  Clock,
  IndianRupee,
  HeadphonesIcon,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import Table, { Column } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  runningContests: number;
  upcomingContests: number;
  completedContests: number;
  totalDeposits: number;
  totalPointsEarned: number;
  pendingKycCount: number;
  openSupportTickets: number;
  recentUsers: { id: string; fullName: string; phone: string; currentTier: string; createdAt: string }[];
  recentTransactions: { id: string; user: { fullName: string }; type: string; amount: number; createdAt: string }[];
  compensationStats: { totalPaid: number; pending: number; thisMonth: number };
}

const tierBadge: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
  platinum: 'success',
  gold: 'warning',
  silver: 'info',
  bronze: 'neutral',
};

const txTypeBadge: Record<string, 'success' | 'warning' | 'info' | 'error' | 'neutral'> = {
  deposit: 'success',
  withdrawal: 'warning',
  entry_fee: 'error',
  winnings: 'success',
  redemption: 'neutral',
  referral: 'info',
};

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 max-w-md mx-auto mt-12 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
          <RefreshCw size={20} className="animate-spin" />
        </div>
        <p className="text-slate-300 text-sm font-semibold">{error}</p>
        <Button onClick={fetchDashboard} variant="primary">
          Retry Sync
        </Button>
      </div>
    );
  }

  const userCols: Column<DashboardData['recentUsers'][0]>[] = [
    { key: 'fullName', header: 'Name', render: (u) => <span className="font-semibold text-white">{u.fullName || 'Unnamed User'}</span> },
    { key: 'phone', header: 'Phone', render: (u) => <span className="text-slate-400 font-medium">{u.phone || '—'}</span> },
    { 
      key: 'currentTier', 
      header: 'Tier', 
      render: (u) => (
        <Badge variant={tierBadge[u.currentTier?.toLowerCase()] || 'neutral'}>
          {u.currentTier || 'bronze'}
        </Badge>
      ) 
    },
    { key: 'createdAt', header: 'Joined', render: (u) => <span className="text-slate-500 text-xs font-semibold">{formatDate(u.createdAt)}</span> },
  ];

  const txCols: Column<DashboardData['recentTransactions'][0]>[] = [
    { key: 'user', header: 'User', render: (t) => <span className="font-semibold text-white">{t.user?.fullName || '—'}</span> },
    { 
      key: 'type', 
      header: 'Type', 
      render: (t) => (
        <Badge variant={txTypeBadge[t.type] || 'neutral'}>
          {t.type ? t.type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '—'}
        </Badge>
      ) 
    },
    { 
      key: 'amount', 
      header: 'Amount', 
      render: (t) => {
        const isNegative = t.type === 'withdrawal' || t.type === 'entry_fee';
        return (
          <span className={`font-bold tracking-tight ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isNegative ? '-' : '+'}{formatINR(Math.abs(t.amount))}
          </span>
        );
      } 
    },
    { key: 'createdAt', header: 'Date', render: (t) => <span className="text-slate-500 text-xs font-semibold">{formatDate(t.createdAt)}</span> },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900/60 to-slate-950 border border-slate-900 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-brand-500/10 text-brand-400 font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-500/20">SYSTEM ACCESS</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/20">LIVE DATA</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-3 tracking-tight">Welcome back, Administrator</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Here is a high-fidelity summary of operations, user behaviors, and pending tickets.</p>
          </div>
          <Button onClick={fetchDashboard} variant="secondary" className="shrink-0 flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sync Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard icon={Users} value={data?.totalUsers ?? 0} label="Total Users" loading={loading} />
        <StatsCard icon={UserCheck} value={data?.activeUsers ?? 0} label="Active Users" loading={loading} />
        <StatsCard icon={Trophy} value={data?.runningContests ?? 0} label="Running Contests" loading={loading} />
        <StatsCard icon={Clock} value={data?.pendingKycCount ?? 0} label="Pending KYC" loading={loading} />
        <StatsCard icon={IndianRupee} value={data ? formatINR(data.totalDeposits) : '₹0'} label="Total Deposits" loading={loading} />
        <StatsCard icon={HeadphonesIcon} value={data?.openSupportTickets ?? 0} label="Open Tickets" loading={loading} />
      </div>

      {/* Compensation Stats */}
      {data?.compensationStats && (
        <div className="backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/70 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-brand-500" />
            <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase">Compensation Analytics</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="p-5 bg-slate-950/30 rounded-xl border border-slate-800/50 shadow-inner">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Paid</p>
              <p className="text-2xl font-extrabold text-white mt-1.5">{formatINR(data.compensationStats.totalPaid)}</p>
            </div>
            <div className="p-5 bg-slate-950/30 rounded-xl border border-slate-800/50 shadow-inner">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-extrabold text-rose-400 mt-1.5">{formatINR(data.compensationStats.pending)}</p>
            </div>
            <div className="p-5 bg-slate-950/30 rounded-xl border border-slate-800/50 shadow-inner">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">This Month</p>
              <p className="text-2xl font-extrabold text-brand-400 mt-1.5">{formatINR(data.compensationStats.thisMonth)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recent Signups</h2>
          </div>
          <Table columns={userCols} data={data?.recentUsers ?? []} loading={loading} emptyMessage="No recent users" />
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recent Activity Logs</h2>
          </div>
          <Table columns={txCols} data={data?.recentTransactions ?? []} loading={loading} emptyMessage="No recent transactions" />
        </div>
      </div>
    </div>
  );
}
