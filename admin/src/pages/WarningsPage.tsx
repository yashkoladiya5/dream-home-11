import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ApiResponse, Warning } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import StatusDot from '../components/ui/StatusDot';
import StatsCard from '../components/ui/StatsCard';
import { AlertTriangle, ShieldAlert, Users, Clock } from 'lucide-react';

const warningReasons = [
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'point_farming', label: 'Point Farming' },
  { value: 'multiple_accounts', label: 'Multiple Accounts' },
  { value: 'abusive_language', label: 'Abusive Language' },
  { value: 'rule_violation', label: 'Contest Rule Violation' },
  { value: 'fraud_suspicion', label: 'Fraud Suspicion' },
  { value: 'chargeback', label: 'Payment Chargeback' },
  { value: 'other', label: 'Other' },
];

const emptyForm = { userId: '', reason: 'inappropriate_behavior', notes: '' };

export default function WarningsPage() {
  const [data, setData] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, level3: 0, resolvedToday: 0 });
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selected, setSelected] = useState<Warning | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<Warning[]>>('/admin/warnings');
      const list = res.data ?? [];
      setData(list);
      setStats({
        total: list.length,
        active: list.filter(w => w.status === 'active').length,
        level3: list.filter(w => w.level === 3 && w.status === 'active').length,
        resolvedToday: list.filter(w => w.status === 'resolved' && new Date(w.resolvedAt || '').toDateString() === new Date().toDateString()).length,
      });
    } catch {
      toast.error('Failed to load warnings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleIssue = async () => {
    if (!form.userId.trim()) { toast.error('User ID is required'); return; }
    if (!form.notes.trim()) { toast.error('Notes are required'); return; }
    setSaving(true);
    try {
      await api.post('/admin/warnings', {
        userId: form.userId.trim(),
        level,
        reason: form.reason,
        notes: form.notes.trim(),
      });
      toast.success(`Level ${level} warning issued`);
      setShowIssueModal(false);
      setForm(emptyForm);
      setLevel(1);
      fetchData();
    } catch {
      toast.error('Failed to issue warning');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/admin/warnings/${selected.id}/resolve`);
      toast.success('Warning resolved');
      setShowResolveModal(false);
      setSelected(null);
      fetchData();
    } catch {
      toast.error('Failed to resolve warning');
    } finally {
      setSaving(false);
    }
  };

  const levelColors: Record<number, string> = {
    1: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    2: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    3: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (w: Warning) => (
        <div>
          <p className="text-white font-medium">{w.userName || 'Unknown'}</p>
          <p className="text-slate-400 text-xs">{w.userPhone || w.userId}</p>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      render: (w: Warning) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${levelColors[w.level]}`}>
          L{w.level}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (w: Warning) => (
        <span className="capitalize text-slate-300">{w.reason.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'points',
      header: 'Points Deducted',
      render: (w: Warning) => (
        <span className="text-red-400 font-mono">-{w.pointsDeducted ?? 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (w: Warning) => (
        w.status === 'active'
          ? <StatusDot status="error" label="Active" />
          : w.status === 'expired'
            ? <StatusDot status="warning" label="Expired" />
            : <StatusDot status="active" label="Resolved" />
      ),
    },
    {
      key: 'issuedBy',
      header: 'Issued By',
      render: (w: Warning) => <span className="text-slate-400 text-sm">{w.issuedByName || 'System'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (w: Warning) => (
        w.status === 'active' ? (
          <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setSelected(w); setShowResolveModal(true); }}>
            Resolve
          </Button>
        ) : (
          <span className="text-slate-600 text-sm">—</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Warnings & Penalties</h1>
          <p className="text-slate-400 text-sm mt-1">Issue and manage user warnings</p>
        </div>
        <Button variant="primary" icon={<AlertTriangle size={18} />} onClick={() => setShowIssueModal(true)}>
          Issue Warning
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={AlertTriangle} value={stats.total} label="Total Warnings" />
        <StatsCard icon={ShieldAlert} value={stats.active} label="Active" />
        <StatsCard icon={Users} value={stats.level3} label="Level 3 (Ban Risk)" />
        <StatsCard icon={Clock} value={`+${stats.resolvedToday}`} label="Resolved Today" />
      </div>

      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
        <Table columns={columns} data={data} loading={loading} emptyMessage="No warnings issued yet." />
      </div>

      <Modal
        isOpen={showIssueModal}
        onClose={() => { setShowIssueModal(false); setForm(emptyForm); setLevel(1); }}
        title="Issue Warning"
        actions={
          <>
            <Button variant="secondary" onClick={() => { setShowIssueModal(false); setForm(emptyForm); setLevel(1); }}>Cancel</Button>
            <Button variant="danger" loading={saving} icon={<AlertTriangle size={16} />} onClick={handleIssue}>
              Issue Warning
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="User ID"
            value={form.userId}
            onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}
            placeholder="Enter user's _id"
          />
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Warning Level</label>
            <div className="flex gap-3">
              {([1, 2, 3] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    level === l
                      ? l === 1 ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : l === 2 ? 'bg-orange-400/20 border-orange-400/50 text-orange-300'
                        : 'bg-red-400/20 border-red-400/50 text-red-300'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Level {l}
                  <div className="text-xs mt-0.5 opacity-70">
                    {l === 1 ? '-200 pts' : l === 2 ? '-1000 pts' : 'Account Ban'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Select
            label="Reason"
            value={form.reason}
            onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
            options={warningReasons}
          />
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea
              className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-h-[80px] resize-y"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Describe the violation in detail..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showResolveModal}
        onClose={() => { setShowResolveModal(false); setSelected(null); }}
        title="Resolve Warning"
        actions={
          <>
            <Button variant="secondary" onClick={() => { setShowResolveModal(false); setSelected(null); }}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleResolve}>Resolve Warning</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-300">
              Resolve <span className="text-white font-medium">Level {selected.level}</span> warning for{' '}
              <span className="text-white font-medium">{selected.userName || selected.userId}</span>?
            </p>
            <p className="text-slate-400">Reason: <span className="capitalize">{selected.reason.replace(/_/g, ' ')}</span></p>
            <p className="text-amber-400 text-xs">This will mark the warning as resolved. Points will not be restored.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
