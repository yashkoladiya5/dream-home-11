import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { type ApiResponse, type Contest } from '../lib/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'running', label: 'Running' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'mega', label: 'Mega' },
  { value: 'head-to-head', label: 'Head-to-Head' },
  { value: 'mega-pool', label: 'Mega Pool' },
  { value: 'private', label: 'Private' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  running: 'success',
  upcoming: 'info',
  completed: 'neutral',
  cancelled: 'error',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function ContestsPage() {
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const limit = 20;

  const debouncedSearch = useDebounce(search, 400);

  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      if (type) params.type = type;

      const { data } = await api.get<ApiResponse<Contest[]>>('/admin/contests', { params });
      setContests(data.data);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load contests');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, type]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, type]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const columns = [
    { key: 'title', header: 'Title', render: (c: Contest) => <span className="font-medium text-white">{c.title}</span> },
    { key: 'entryFee', header: 'Entry Fee', render: (c: Contest) => formatCurrency(c.entryFee) },
    { key: 'totalPrize', header: 'Prize', render: (c: Contest) => formatCurrency(c.totalPrize) },
    {
      key: 'slots',
      header: 'Slots',
      render: (c: Contest) => (
        <span>
          {c.filledSlots}/{c.maxSlots}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Contest) => (
        <Badge variant={statusVariant[c.status] ?? 'neutral'}>{c.status}</Badge>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (c: Contest) => (
        <span className="capitalize">{c.type.replace(/-/g, ' ')}</span>
      ),
    },
    { key: 'startTime', header: 'Start Time', render: (c: Contest) => formatDate(c.startTime) },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (c: Contest) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/contests/${c.id}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-300"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contests</h1>
          <p className="text-sm text-slate-400 mt-1">Manage all contests</p>
        </div>
        <Button variant="secondary" onClick={fetchContests}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search contests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        <div className="w-full sm:w-44">
          <Select options={typeOptions} value={type} onChange={(e) => setType(e.target.value)} />
        </div>
      </div>

      <Table<Contest>
        columns={columns}
        data={contests}
        loading={loading}
        onRowClick={(c) => navigate(`/contests/${c.id}`)}
        emptyMessage="No contests found"
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
