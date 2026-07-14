import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Users, Gift, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import StatsCard from '../components/ui/StatsCard';
import Spinner from '../components/ui/Spinner';

interface Referral {
  _id: string;
  referrer: { name: string; phone: string };
  referee: { name: string; phone: string };
  reward: number;
  status: 'settled' | 'pending' | 'cancelled';
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  totalReferrers: number;
  totalPayouts: number;
  settled: number;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  settled: 'success',
  pending: 'warning',
  cancelled: 'error',
};

const statusLabel: Record<string, string> = {
  settled: 'Settled',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit };
      const response = await api.get('/admin/referrals', { params });
      const data = response.data;
      setReferrals(
        (data.data || []).map((r: any) => ({
          _id: r._id || r.id,
          referrer: {
            name: r.referrer?.fullName || 'Unknown',
            phone: r.referrer?.phoneNumber || r.referrer?.phone || '—',
          },
          referee: {
            name: r.referee?.fullName || 'Unknown',
            phone: r.referee?.phoneNumber || r.referee?.phone || '—',
          },
          reward: (r.signupReward || 0) + (r.kycReward || 0),
          status: r.status,
          createdAt: r.createdAt,
        }))
      );
      setTotalPages(data.pagination?.totalPages ?? 1);
      setStats({
        totalReferrals: data.stats?.totalReferrals ?? data.pagination?.total ?? 0,
        totalReferrers: data.stats?.totalReferrers ?? 0,
        totalPayouts: data.stats?.totalPayouts ?? 0,
        settled: data.stats?.settledCount ?? 0,
      });
    } catch {
      setError('Failed to load referrals');
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const columns = [
    {
      key: 'referrer',
      header: 'Referrer',
      render: (r: Referral) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{r.referrer?.name || 'Unknown'}</span>
          <span className="text-xs text-slate-400">{r.referrer?.phone || '—'}</span>
        </div>
      ),
    },
    {
      key: 'referee',
      header: 'Referee',
      render: (r: Referral) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{r.referee?.name || 'Unknown'}</span>
          <span className="text-xs text-slate-400">{r.referee?.phone || '—'}</span>
        </div>
      ),
    },
    {
      key: 'reward',
      header: 'Reward',
      render: (r: Referral) => (
        <span className="font-bold text-white tracking-tight">{formatINR(r.reward)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: Referral) => (
        <Badge variant={statusVariant[r.status] ?? 'default'}>
          {statusLabel[r.status] ?? r.status}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Date', render: (r: Referral) => <span className="text-slate-400 text-sm">{formatDate(r.createdAt)}</span> },
  ];

  if (error && !loading && referrals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Referrals</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Track and manage user referral activity</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Gift size={48} className="mb-3 opacity-50" />
          <p className="text-lg font-medium text-slate-400">Failed to Load Referrals</p>
          <p className="text-sm mt-1 mb-4">{error}</p>
          <button
            onClick={fetchReferrals}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Referrals</h1>
        <p className="text-sm text-slate-400 mt-1">Track and manage user referral activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users} value={stats?.totalReferrals ?? 0} label="Total Referrals" loading={loading} />
        <StatsCard icon={Gift} value={stats?.totalReferrers ?? 0} label="Total Referrers" loading={loading} />
        <StatsCard icon={TrendingUp} value={stats ? formatINR(stats.totalPayouts) : 0} label="Total Payouts" loading={loading} />
        <StatsCard icon={CheckCircle} value={stats?.settled ?? 0} label="Settled" loading={loading} />
      </div>

      {loading && referrals.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Clock size={48} className="mb-3 opacity-50" />
          <p className="text-lg font-medium text-slate-400">No Referrals Yet</p>
          <p className="text-sm mt-1">Referral data will appear here once users start referring others.</p>
        </div>
      ) : (
        <>
          <Table<Referral>
            columns={columns}
            data={referrals}
            loading={loading}
            emptyMessage="No referrals found"
          />

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
