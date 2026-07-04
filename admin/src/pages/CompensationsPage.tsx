import { useState, useEffect, useCallback } from 'react';
import { Download, Play, RefreshCw, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { type ApiResponse } from '../lib/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatsCard from '../components/ui/StatsCard';

interface Compensation {
  _id: string;
  contestId: string;
  contestTitle: string;
  userName: string;
  userPhone: string;
  entryFee: number;
  points: number;
  status: 'pending' | 'processed' | 'failed';
  createdAt: string;
  processedAt?: string;
}

interface CompensationStats {
  total: number;
  pending: number;
  processed: number;
  failed: number;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Failed' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending: 'warning',
  processed: 'success',
  failed: 'error',
};

export default function CompensationsPage() {
  const [compensations, setCompensations] = useState<Compensation[]>([]);
  const [stats, setStats] = useState<CompensationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const limit = 20;

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get<ApiResponse<CompensationStats>>('/admin/compensations/stats');
      setStats(data.data);
    } catch {
      toast.error('Failed to load compensation stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCompensations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (status) params.status = status;

      const { data } = await api.get<ApiResponse<Compensation[]>>('/admin/compensations', { params });
      setCompensations(data.data);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load compensations');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchStats();
    fetchCompensations();
  }, [fetchStats, fetchCompensations]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const handleProcessAll = async () => {
    setProcessing(true);
    try {
      await api.post('/admin/compensations/process-pending');
      toast.success('All pending compensations processed');
      fetchStats();
      fetchCompensations();
    } catch {
      toast.error('Failed to process pending compensations');
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/compensations/export', { responseType: 'blob' });
      const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compensations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const columns = [
    { key: 'contestTitle', header: 'Contest', render: (c: Compensation) => <span className="font-medium text-white">{c.contestTitle}</span> },
    { key: 'userName', header: 'User', render: (c: Compensation) => c.userName },
    { key: 'entryFee', header: 'Entry Fee', render: (c: Compensation) => `₹${c.entryFee.toLocaleString('en-IN')}` },
    { key: 'points', header: 'Points', render: (c: Compensation) => c.points.toLocaleString() },
    {
      key: 'status',
      header: 'Status',
      render: (c: Compensation) => (
        <Badge variant={statusVariant[c.status] ?? 'default'}>{c.status}</Badge>
      ),
    },
    { key: 'createdAt', header: 'Created', render: (c: Compensation) => formatDate(c.createdAt) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compensations</h1>
          <p className="text-sm text-slate-400 mt-1">Manage contest compensations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={fetchCompensations}>
            Refresh
          </Button>
          <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" icon={<Play size={16} />} loading={processing} onClick={handleProcessAll}>
            Process All Pending
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={DollarSign} value={stats?.total ?? 0} label="Total Compensations" loading={statsLoading} />
        <StatsCard icon={Clock} value={stats?.pending ?? 0} label="Pending" loading={statsLoading} />
        <StatsCard icon={CheckCircle} value={stats?.processed ?? 0} label="Processed" loading={statsLoading} />
        <StatsCard icon={XCircle} value={stats?.failed ?? 0} label="Failed" loading={statsLoading} />
      </div>

      <div className="w-full sm:w-44">
        <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      <Table<Compensation>
        columns={columns}
        data={compensations}
        loading={loading}
        emptyMessage="No compensations found"
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
