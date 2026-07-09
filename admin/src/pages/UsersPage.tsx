import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { type ApiResponse } from '../lib/api';
import { Search, Eye } from 'lucide-react';
import Table, { Column } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';

interface User {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  currentTier: string;
  kycStatus: string;
  walletBalance: number;
  isActive: boolean;
}

const tierBadge: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  platinum: 'success',
  gold: 'warning',
  silver: 'info',
  bronze: 'neutral',
};

const kycBadge: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
  verified: 'success',
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
  not_submitted: 'neutral',
};

const kycLabel: Record<string, string> = {
  verified: 'Verified',
  approved: 'Verified',
  rejected: 'Rejected',
  pending: 'Pending',
  not_submitted: 'Not Submitted',
};

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<ApiResponse<User[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const page = Number(searchParams.get('page')) || 1;
  const role = searchParams.get('role') || '';
  const isActive = searchParams.get('isActive') || '';
  const tier = searchParams.get('tier') || '';
  const kycStatus = searchParams.get('kycStatus') || '';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      if (isActive) params.set('isActive', isActive);
      if (tier) params.set('tier', tier);
      if (kycStatus) params.set('kycStatus', kycStatus);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setData(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, isActive, tier, kycStatus]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      header: 'Name',
      render: (u) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{u.fullName || 'Unnamed User'}</span>
          <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{u._id}</span>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (u) => <span className="text-slate-400 font-medium">{u.phone || '—'}</span> },
    { key: 'email', header: 'Email', className: 'hidden md:table-cell', render: (u) => <span className="text-slate-400 text-xs">{u.email || '—'}</span> },
    {
      key: 'currentTier',
      header: 'Tier',
      render: (u) => (
        <Badge variant={tierBadge[u.currentTier?.toLowerCase()] || 'neutral'}>
          {u.currentTier ? u.currentTier.charAt(0).toUpperCase() + u.currentTier.slice(1).toLowerCase() : 'Bronze'}
        </Badge>
      ),
    },
    {
      key: 'kycStatus',
      header: 'KYC Status',
      render: (u) => (
        <Badge variant={kycBadge[u.kycStatus?.toLowerCase()] || 'neutral'}>
          {kycLabel[u.kycStatus?.toLowerCase()] || u.kycStatus || 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'walletBalance',
      header: 'INR Balance',
      render: (u) => <span className="font-bold text-white tracking-tight">{formatINR(u.walletBalance)}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${u.isActive ? 'active' : 'inactive'}`} />
          <span className={u.isActive ? 'text-emerald-400 font-semibold text-xs' : 'text-slate-500 font-semibold text-xs'}>
            {u.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/users/${u._id}`);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-400 hover:text-white bg-brand-500/5 hover:bg-brand-500/10 border border-brand-500/10 hover:border-brand-500/30 transition-all duration-300 shadow-sm"
        >
          <Eye size={12} />
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">User Profiles</h1>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manage user status, wallet balances, and KYC indicators</p>
      </div>

      {/* Filter panel */}
      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, phone, or email..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateParam('search', e.target.value);
              }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select
              options={[
                { value: '', label: 'All Roles' },
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
                { value: 'moderator', label: 'Moderator' },
              ]}
              value={role}
              onChange={(e) => updateParam('role', e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              value={isActive}
              onChange={(e) => updateParam('isActive', e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'All Tiers' },
                { value: 'bronze', label: 'Bronze' },
                { value: 'silver', label: 'Silver' },
                { value: 'gold', label: 'Gold' },
                { value: 'platinum', label: 'Platinum' },
              ]}
              value={tier}
              onChange={(e) => updateParam('tier', e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'All KYC' },
                { value: 'pending', label: 'Pending' },
                { value: 'verified', label: 'Verified' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={kycStatus}
              onChange={(e) => updateParam('kycStatus', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users table */}
      <Table 
        columns={columns} 
        data={data?.data ?? []} 
        loading={loading} 
        onRowClick={(u) => navigate(`/users/${u._id}`)}
        emptyMessage="No users found matching current filters." 
      />

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-end pt-2">
          <Pagination
            page={page}
            totalPages={data.pagination.totalPages}
            onPageChange={(p) => updateParam('page', String(p))}
          />
        </div>
      )}
    </div>
  );
}
