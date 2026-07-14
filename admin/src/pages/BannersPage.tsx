import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ApiResponse, Banner } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Toggle from '../components/ui/Toggle';
import { Plus, Edit3, Trash2, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react';

type FormLinkType = 'none' | 'contest' | 'prize_home' | 'web';

const emptyForm = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  linkType: 'none' as FormLinkType,
  linkId: '',
  isActive: true,
  order: 0,
  bgColor: '#121826',
};

export default function BannersPage() {
  const [data, setData] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<Banner[]>>('/admin/banners');
      setData((res.data ?? []).sort((a, b) => a.order - b.order));
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: data.length });
    setShowModal(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      linkType: (banner.linkType as FormLinkType) || 'none',
      linkId: banner.linkId || '',
      isActive: banner.isActive ?? true,
      order: banner.order ?? 0,
      bgColor: banner.bgColor || '#121826',
    });
    setShowModal(true);
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`Delete banner "${banner.title}"?`)) return;
    try {
      await api.delete(`/admin/banners/${banner.id}`);
      toast.success('Banner deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleReorder = async (banner: Banner, direction: 'up' | 'down') => {
    const sorted = [...data].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(b => b.id === banner.id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const updated = [...sorted];
    const temp = updated[idx].order;
    updated[idx] = { ...updated[idx], order: updated[swapIdx].order };
    updated[swapIdx] = { ...updated[swapIdx], order: temp };

    try {
      await api.post('/admin/banners/reorder', {
        bannerId: banner.id,
        newOrder: updated[idx].order,
        swapWithId: updated[swapIdx].id,
        swapWithOrder: updated[swapIdx].order,
      });
      setData(updated);
      toast.success('Banner reordered');
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const handleToggle = async (banner: Banner) => {
    try {
      await api.patch(`/admin/banners/${banner.id}`, { isActive: !banner.isActive });
      setData(prev => prev.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
      toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated');
    } catch {
      toast.error('Failed to toggle');
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.imageUrl.trim()) { toast.error('Image URL is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, order: Number(form.order) };
      if (editing) {
        await api.patch(`/admin/banners/${editing.id}`, payload);
        toast.success('Banner updated');
      } else {
        await api.post('/admin/banners', payload);
        toast.success('Banner created');
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
      render: (b: Banner) => (
        <div
          className="w-24 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-slate-800 border border-slate-700"
          style={{ backgroundColor: b.bgColor || '#1e293b' }}
        >
          {b.imageUrl ? (
            <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={20} className="text-slate-500" />
          )}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (b: Banner) => (
        <div>
          <p className="text-white font-medium">{b.title}</p>
          {b.subtitle && <p className="text-slate-400 text-xs">{b.subtitle}</p>}
        </div>
      ),
    },
    { key: 'order', header: 'Order', render: (b: Banner) => <span className="text-slate-400 font-mono">{b.order}</span> },
    {
      key: 'link',
      header: 'Link',
      render: (b: Banner) => <Badge variant={b.linkType !== 'none' ? 'info' : 'neutral'}>{b.linkType ?? 'none'}</Badge>,
    },
    {
      key: 'status',
      header: 'Active',
      render: (b: Banner) => (
        <Toggle checked={b.isActive} onChange={() => handleToggle(b)} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b: Banner) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleReorder(b, 'up'); }}>
            <MoveUp size={14} className="text-slate-400" />
          </Button>
          <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleReorder(b, 'down'); }}>
            <MoveDown size={14} className="text-slate-400" />
          </Button>
          <Button variant="ghost" icon={<Edit3 size={14} />} onClick={(e) => { e.stopPropagation(); openEdit(b); }}>
            Edit
          </Button>
          <Button variant="ghost" icon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); handleDelete(b); }}>
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
          <h1 className="text-2xl font-bold text-white">Banners</h1>
          <p className="text-slate-400 text-sm mt-1">Manage home screen banners and carousel items</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openCreate}>
          Add Banner
        </Button>
      </div>

      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No banners yet. Create one to display on the home screen."
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Banner' : 'Add Banner'}
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
          <Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Mega Contest Live!" />
          <Input label="Subtitle" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="e.g. Win your dream home" />
          <Input label="Image URL" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://cdn.example.com/banner.jpg" />
          <Input label="Background Color" value={form.bgColor} onChange={e => setForm(p => ({ ...p, bgColor: e.target.value }))} placeholder="#121826" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Link Type"
              value={form.linkType}
              onChange={e => setForm(p => ({ ...p,         linkType: e.target.value as FormLinkType }))}
              options={[
                { value: 'none', label: 'No Link' },
                { value: 'contest', label: 'Contest' },
                { value: 'prize_home', label: 'Prize Home' },
                { value: 'web', label: 'External URL' },
              ]}
            />
            <Input label="Link ID / URL" value={form.linkId} onChange={e => setForm(p => ({ ...p, linkId: e.target.value }))} placeholder="Contest ID or full URL" />
          </div>
          <Input label="Order" type="number" min={0} value={String(form.order)} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} />
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
