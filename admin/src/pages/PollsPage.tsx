import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ApiResponse } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Toggle from '../components/ui/Toggle';
import { Vote, Plus, Edit3, Trash2, BarChart3, Calendar } from 'lucide-react';

interface PollOption {
  text: string;
  count: number;
}

interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  activeFrom: string;
  activeTo: string;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  question: '',
  optionsText: '',
  activeFrom: '',
  activeTo: '',
  isActive: true,
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PollsPage() {
  const [data, setData] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Poll | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<Poll[]>>('/admin/polls');
      setData(res.data ?? []);
    } catch {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (poll: Poll) => {
    setEditing(poll);
    setForm({
      question: poll.question || '',
      optionsText: poll.options?.map(o => o.text).join(', ') || '',
      activeFrom: formatDateTime(poll.activeFrom),
      activeTo: formatDateTime(poll.activeTo),
      isActive: poll.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleDelete = async (poll: Poll) => {
    if (!confirm(`Delete poll "${poll.question}"?`)) return;
    try {
      await api.delete(`/admin/polls/${poll._id}`);
      toast.success('Poll deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (poll: Poll) => {
    try {
      await api.patch(`/admin/polls/${poll._id}`, { isActive: !poll.isActive });
      setData(prev => prev.map(p => p._id === poll._id ? { ...p, isActive: !poll.isActive } : p));
      toast.success(poll.isActive ? 'Poll deactivated' : 'Poll activated');
    } catch {
      toast.error('Failed to toggle');
    }
  };

  const handleSave = async () => {
    if (!form.question.trim()) { toast.error('Question is required'); return; }
    if (!form.optionsText.trim()) { toast.error('At least one option is required'); return; }
    if (!form.activeFrom) { toast.error('Active from date is required'); return; }
    if (!form.activeTo) { toast.error('Active to date is required'); return; }

    const options = form.optionsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(text => ({ text, count: 0 }));

    if (options.length < 2) { toast.error('At least two options are required'); return; }

    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        options,
        activeFrom: new Date(form.activeFrom).toISOString(),
        activeTo: new Date(form.activeTo).toISOString(),
        isActive: form.isActive,
      };

      if (editing) {
        await api.patch(`/admin/polls/${editing._id}`, payload);
        toast.success('Poll updated');
      } else {
        await api.post('/admin/polls', payload);
        toast.success('Poll created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error(editing ? 'Failed to update' : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'question',
      header: 'Question',
      render: (p: Poll) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            <Vote size={16} className="text-brand-400" />
          </div>
          <div>
            <p className="text-white font-medium truncate max-w-xs">{p.question}</p>
            <p className="text-slate-400 text-xs">Created {formatDate(p.createdAt)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'options',
      header: 'Options',
      render: (p: Poll) => <span className="text-slate-300 font-mono">{p.options?.length ?? 0}</span>,
    },
    {
      key: 'totalVotes',
      header: 'Total Votes',
      render: (p: Poll) => (
        <div className="flex items-center gap-1.5">
          <BarChart3 size={14} className="text-slate-500" />
          <span className="text-white font-mono font-medium">{p.totalVotes ?? 0}</span>
        </div>
      ),
    },
    {
      key: 'activePeriod',
      header: 'Active Period',
      render: (p: Poll) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar size={12} className="shrink-0" />
          <span>{formatDate(p.activeFrom)} — {formatDate(p.activeTo)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Active',
      render: (p: Poll) => (
        <Toggle checked={p.isActive} onChange={() => handleToggle(p)} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Poll) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" icon={<Edit3 size={14} />} onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
            Edit
          </Button>
          <Button variant="ghost" icon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); handleDelete(p); }}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Polls</h1>
          <p className="text-slate-400 text-sm mt-1">Create and manage user polls and voting</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openCreate}>
          Add Poll
        </Button>
      </div>

      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No polls yet. Create one to start collecting votes."
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Poll' : 'Add Poll'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Question"
            value={form.question}
            onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
            placeholder="e.g. Who will win the tournament?"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Options</label>
            <textarea
              value={form.optionsText}
              onChange={e => setForm(p => ({ ...p, optionsText: e.target.value }))}
              placeholder="Team A, Team B, Team C"
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
            />
            <p className="text-xs text-slate-500">Separate options with commas</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Active From"
              type="datetime-local"
              value={form.activeFrom}
              onChange={e => setForm(p => ({ ...p, activeFrom: e.target.value }))}
            />
            <Input
              label="Active To"
              type="datetime-local"
              value={form.activeTo}
              onChange={e => setForm(p => ({ ...p, activeTo: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
