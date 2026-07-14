import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ApiResponse } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Toggle from '../components/ui/Toggle';
import { Gift, Plus, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  pointsRequired: number;
  stock: number;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

type FormData = {
  title: string;
  description: string;
  imageUrl: string;
  pointsRequired: number;
  stock: number;
  category: string;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  imageUrl: '',
  pointsRequired: 100,
  stock: 0,
  category: 'general',
  isActive: true,
  sortOrder: 0,
};

const categories = [
  { value: 'general', label: 'General' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'exclusive', label: 'Exclusive' },
];

export default function RewardsPage() {
  const [data, setData] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<Reward[]>>('/admin/rewards');
      setData(res.data ?? []);
    } catch {
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: data.length });
    setShowModal(true);
  };

  const openEdit = (reward: Reward) => {
    setEditing(reward);
    setForm({
      title: reward.title || '',
      description: reward.description || '',
      imageUrl: reward.imageUrl || '',
      pointsRequired: reward.pointsRequired ?? 100,
      stock: reward.stock ?? 0,
      category: reward.category || 'general',
      isActive: reward.isActive ?? true,
      sortOrder: reward.sortOrder ?? 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (reward: Reward) => {
    if (!confirm(`Delete reward "${reward.title}"?`)) return;
    try {
      await api.delete(`/admin/rewards/${reward.id}`);
      toast.success('Reward deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (reward: Reward) => {
    try {
      await api.patch(`/admin/rewards/${reward.id}`, { isActive: !reward.isActive });
      setData(prev => prev.map(r => r.id === reward.id ? { ...r, isActive: !r.isActive } : r));
      toast.success(reward.isActive ? 'Reward deactivated' : 'Reward activated');
    } catch {
      toast.error('Failed to toggle');
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.imageUrl.trim()) { toast.error('Image URL is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, pointsRequired: Number(form.pointsRequired), stock: Number(form.stock), sortOrder: Number(form.sortOrder) };
      if (editing) {
        await api.patch(`/admin/rewards/${editing.id}`, payload);
        toast.success('Reward updated');
      } else {
        await api.post('/admin/rewards', payload);
        toast.success('Reward created');
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
      key: 'preview',
      header: 'Preview',
      render: (r: Reward) => (
        <div className="w-24 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-slate-800 border border-slate-700">
          {r.imageUrl ? (
            <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={20} className="text-slate-500" />
          )}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (r: Reward) => (
        <div>
          <p className="text-white font-medium">{r.title}</p>
          {r.description && <p className="text-slate-400 text-xs truncate max-w-[200px]">{r.description}</p>}
        </div>
      ),
    },
    {
      key: 'pointsRequired',
      header: 'Points Required',
      render: (r: Reward) => (
        <span className="text-amber-400 font-mono font-medium flex items-center gap-1">
          <Gift size={14} />{r.pointsRequired.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (r: Reward) => (
        <span className={`font-mono ${r.stock <= 0 ? 'text-red-400' : r.stock < 10 ? 'text-amber-400' : 'text-slate-300'}`}>
          {r.stock}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r: Reward) => <Badge variant="info">{r.category}</Badge>,
    },
    {
      key: 'status',
      header: 'Active',
      render: (r: Reward) => (
        <Toggle checked={r.isActive} onChange={() => handleToggle(r)} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: Reward) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" icon={<Edit3 size={14} />} onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
            Edit
          </Button>
          <Button variant="ghost" icon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); handleDelete(r); }}>
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
          <h1 className="text-2xl font-bold text-white">Rewards Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">Manage redeemable rewards and prizes</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openCreate}>
          Add Reward
        </Button>
      </div>

      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No rewards yet. Create one to populate the catalog."
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Reward' : 'Add Reward'}
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
          <Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Dream11 T-Shirt" />
          <Input label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="A premium branded t-shirt" />
          <Input label="Image URL" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://cdn.example.com/reward.jpg" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Points Required" type="number" min={0} value={String(form.pointsRequired)} onChange={e => setForm(p => ({ ...p, pointsRequired: Number(e.target.value) }))} />
            <Input label="Stock" type="number" min={0} value={String(form.stock)} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              options={categories}
            />
            <Input label="Sort Order" type="number" min={0} value={String(form.sortOrder)} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
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
