import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ApiResponse, PrizeHome } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { Plus, Edit3, Trash2, Image as ImageIcon, Search } from 'lucide-react';

const emptyForm = {
  name: '',
  description: '',
  location: '',
  city: '',
  value: 0,
  bhk: 3,
  area: '',
  amenities: '',
  images: '',
  isActive: true,
  featured: false,
};

export default function PrizeHomesPage() {
  const [data, setData] = useState<PrizeHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PrizeHome | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const { data: res } = await api.get<ApiResponse<PrizeHome[]>>(`/admin/prize-homes?${params}`);
      setData(res.data ?? []);
    } catch {
      toast.error('Failed to load prize homes');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (home: PrizeHome) => {
    setEditing(home);
    setForm({
      name: home.name || '',
      description: home.description || '',
      location: home.location || '',
      city: home.city || '',
      value: home.value || 0,
      bhk: home.bhk || 3,
      area: home.area || '',
      amenities: (home.amenities ?? []).join(', '),
      images: (home.images ?? []).join(', '),
      isActive: home.isActive ?? true,
      featured: home.featured ?? false,
    });
    setShowModal(true);
  };

  const handleDelete = async (home: PrizeHome) => {
    if (!confirm(`Delete "${home.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/prize-homes/${home.id}`);
      toast.success('Prize home deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images: form.images.split(',').map(s => s.trim()).filter(Boolean),
        value: Number(form.value),
        bhk: Number(form.bhk),
      };

      if (editing) {
        await api.patch(`/admin/prize-homes/${editing.id}`, payload);
        toast.success('Prize home updated');
      } else {
        await api.post('/admin/prize-homes', payload);
        toast.success('Prize home created');
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
      key: 'image',
      header: '',
      render: (h: PrizeHome) => (
        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden">
          {h.images?.[0] ? (
            <img src={h.images[0]} alt={h.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={20} className="text-slate-500" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (h: PrizeHome) => (
        <div>
          <p className="text-white font-medium">{h.name}</p>
          <p className="text-slate-400 text-xs">{h.location}, {h.city}</p>
        </div>
      ),
    },
    { key: 'bhk', header: 'BHK', render: (h: PrizeHome) => <span className="text-slate-300">{h.bhk ?? '-'} BHK</span> },
    {
      key: 'value',
      header: 'Value',
      render: (h: PrizeHome) => <span className="text-emerald-400 font-mono">₹{(h.value ?? 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (h: PrizeHome) => (
        <div className="flex gap-1">
          {h.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="error">Inactive</Badge>}
          {h.featured && <Badge variant="warning">Featured</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (h: PrizeHome) => (
        <div className="flex gap-2">
          <Button variant="ghost" icon={<Edit3 size={14} />} onClick={(e) => { e.stopPropagation(); openEdit(h); }}>
            Edit
          </Button>
          <Button variant="ghost" icon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); handleDelete(h); }}>
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
          <h1 className="text-2xl font-bold text-white">Prize Homes</h1>
          <p className="text-slate-400 text-sm mt-1">Manage dream home catalog</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openCreate}>
          Add Prize Home
        </Button>
      </div>

      <div className="flex gap-3 items-center backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            placeholder="Search prize homes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
        <Table columns={columns} data={data} loading={loading} emptyMessage="No prize homes found. Create your first one!" />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Prize Home' : 'Add Prize Home'}
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
          <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Dream Villa, Goa" />
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-h-[80px] resize-y"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Home description and highlights"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Anjuna" />
            <Input label="City" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Goa" />
            <Input label="Value (₹)" type="number" value={String(form.value)} onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))} />
            <Input label="BHK" type="number" min={1} max={10} value={String(form.bhk)} onChange={e => setForm(p => ({ ...p, bhk: Number(e.target.value) }))} />
            <Input label="Area (sq.ft)" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} placeholder="e.g. 2500" />
          </div>
          <Input
            label="Amenities (comma-separated)"
            value={form.amenities}
            onChange={e => setForm(p => ({ ...p, amenities: e.target.value }))}
            placeholder="Pool, Garden, Garage, Security"
          />
          <Input
            label="Image URLs (comma-separated)"
            value={form.images}
            onChange={e => setForm(p => ({ ...p, images: e.target.value }))}
            placeholder="https://cdn.example.com/img1.jpg, https://..."
          />
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="rounded" />
              Featured
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
