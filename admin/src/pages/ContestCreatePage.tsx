import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { ArrowLeft, Save, Trash2, Plus } from 'lucide-react';

interface PrizeTier {
  fromRank: number;
  toRank: number;
  prize: string;
  prizeType: 'cash' | 'physical' | 'points';
}

interface ContestForm {
  title: string;
  type: 'normal' | 'mega' | 'home' | 'private';
  entryFee: number;
  maxSlots: number;
  minSlotsRequired: number;
  prize: string;
  rules: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  prizeTiers: PrizeTier[];
}

const contestTypes = [
  { value: 'normal', label: 'Normal' },
  { value: 'mega', label: 'Mega' },
  { value: 'home', label: 'Home' },
  { value: 'private', label: 'Private' },
];

const defaultForm: ContestForm = {
  title: '',
  type: 'normal',
  entryFee: 0,
  maxSlots: 100,
  minSlotsRequired: 50,
  prize: '',
  rules: 'Entry fee non-refundable. Winners announced after contest ends. Prizes subject to TDS as per applicable laws.',
  startTime: '',
  endTime: '',
  isActive: true,
  prizeTiers: [],
};

export default function ContestCreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<ContestForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      setFetching(true);
      api.get(`/admin/contests/${id}`)
        .then(({ data }) => {
          if (data.success) {
            const c = data.data;
            setForm({
              title: c.title || '',
              type: c.type || 'normal',
              entryFee: c.entryFee || 0,
              maxSlots: c.maxSlots || 100,
              minSlotsRequired: c.minSlotsRequired || Math.ceil((c.maxSlots || 100) * 0.5),
              prize: c.prize || '',
              rules: c.rules || defaultForm.rules,
              startTime: c.startTime ? c.startTime.slice(0, 16) : '',
              endTime: c.endTime ? c.endTime.slice(0, 16) : '',
              isActive: c.isActive ?? true,
              prizeTiers: c.prizeTiers || [],
            });
          }
        })
        .catch(() => toast.error('Failed to load contest'))
        .finally(() => setFetching(false));
    }
  }, [id]);

  const update = <K extends keyof ContestForm>(key: K, value: ContestForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.entryFee < 0) errs.entryFee = 'Entry fee cannot be negative';
    if (form.maxSlots < 2) errs.maxSlots = 'Minimum 2 slots required';
    if (form.minSlotsRequired < 1) errs.minSlotsRequired = 'Minimum 1 participant required';
    if (form.minSlotsRequired > form.maxSlots) errs.minSlotsRequired = 'Cannot exceed max slots';
    if (!form.startTime) errs.startTime = 'Start time required';
    if (!form.endTime) errs.endTime = 'End time required';
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      errs.endTime = 'End time must be after start time';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };

      if (isEdit) {
        await api.patch(`/admin/contests/${id}`, payload);
        toast.success('Contest updated successfully');
      } else {
        await api.post('/admin/contests', payload);
        toast.success('Contest created successfully');
      }
      navigate('/contests');
    } catch {
      toast.error(isEdit ? 'Failed to update contest' : 'Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  const addPrizeTier = () => {
    const nextRank = form.prizeTiers.length > 0
      ? Math.max(...form.prizeTiers.map(t => t.toRank)) + 1
      : 1;
    setForm(prev => ({
      ...prev,
      prizeTiers: [...prev.prizeTiers, { fromRank: nextRank, toRank: nextRank, prize: '', prizeType: 'cash' }],
    }));
  };

  const updatePrizeTier = (index: number, data: Partial<PrizeTier>) => {
    setForm(prev => ({
      ...prev,
      prizeTiers: prev.prizeTiers.map((t, i) => i === index ? { ...t, ...data } : t),
    }));
  };

  const removePrizeTier = (index: number) => {
    setForm(prev => ({ ...prev, prizeTiers: prev.prizeTiers.filter((_, i) => i !== index) }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/contests')}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit Contest' : 'Create Contest'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isEdit ? 'Modify contest details and settings' : 'Set up a new prediction contest'}
          </p>
        </div>
      </div>

      <Card title="Basic Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Contest Title"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              error={errors.title}
              placeholder="e.g. Mega Cricket Prediction #42"
            />
          </div>
          <Select
            label="Contest Type"
            value={form.type}
            onChange={e => update('type', e.target.value as ContestForm['type'])}
            options={contestTypes}
          />
          <Input
            label="Entry Fee (₹)"
            type="number"
            min={0}
            value={String(form.entryFee)}
            onChange={e => update('entryFee', Number(e.target.value))}
            error={errors.entryFee}
          />
          <Input
            label="Max Slots"
            type="number"
            min={2}
            value={String(form.maxSlots)}
            onChange={e => update('maxSlots', Number(e.target.value))}
            error={errors.maxSlots}
          />
          <Input
            label="Min Participants Required"
            type="number"
            min={1}
            value={String(form.minSlotsRequired)}
            onChange={e => update('minSlotsRequired', Number(e.target.value))}
            error={errors.minSlotsRequired}
          />
          <Input
            label="Prize Description"
            value={form.prize}
            onChange={e => update('prize', e.target.value)}
            placeholder="e.g. ₹10,00,000 Grand Prize"
          />
          <div className="md:col-span-2">
            <Input
              label="Rules & Terms"
              value={form.rules}
              onChange={e => update('rules', e.target.value)}
              placeholder="Contest rules and terms"
            />
          </div>
        </div>
      </Card>

      <Card title="Schedule">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="datetime-local"
            value={form.startTime}
            onChange={e => update('startTime', e.target.value)}
            error={errors.startTime}
          />
          <Input
            label="End Time"
            type="datetime-local"
            value={form.endTime}
            onChange={e => update('endTime', e.target.value)}
            error={errors.endTime}
          />
        </div>
        {form.startTime && form.endTime && (
          <p className="text-sm text-slate-400 mt-2">
            Duration: {Math.round((new Date(form.endTime).getTime() - new Date(form.startTime).getTime()) / 86400000)} days
            {form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime) && (
              <span className="text-red-400 ml-2">(Invalid: end must be after start)</span>
            )}
          </p>
        )}
      </Card>

      <Card
        title="Prize Tiers"
        actions={
          <Button variant="secondary" icon={<Plus size={16} />} onClick={addPrizeTier}>
            Add Tier
          </Button>
        }
      >
        {form.prizeTiers.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">
            No prize tiers defined. Click "Add Tier" to set up prize distribution.
          </p>
        ) : (
          <div className="space-y-3">
            {form.prizeTiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 text-sm font-mono w-8">#{i + 1}</span>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Input
                    label="From Rank"
                    type="number"
                    min={1}
                    value={String(tier.fromRank)}
                    onChange={e => updatePrizeTier(i, { fromRank: Number(e.target.value) })}
                  />
                  <Input
                    label="To Rank"
                    type="number"
                    min={1}
                    value={String(tier.toRank)}
                    onChange={e => updatePrizeTier(i, { toRank: Number(e.target.value) })}
                  />
                  <Input
                    label="Prize"
                    value={tier.prize}
                    onChange={e => updatePrizeTier(i, { prize: e.target.value })}
                    placeholder="e.g. ₹5,00,000"
                  />
                  <Select
                    label="Type"
                    value={tier.prizeType}
                    onChange={e => updatePrizeTier(i, { prizeType: e.target.value as PrizeTier['prizeType'] })}
                    options={[
                      { value: 'cash', label: 'Cash' },
                      { value: 'physical', label: 'Physical' },
                      { value: 'points', label: 'Points' },
                    ]}
                  />
                </div>
                <Button variant="ghost" onClick={() => removePrizeTier(i)} className="mt-5">
                  <Trash2 size={16} className="text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <Button variant="secondary" onClick={() => navigate('/contests')}>Cancel</Button>
        <Button variant="primary" loading={loading} icon={<Save size={18} />} onClick={handleSubmit}>
          {isEdit ? 'Update Contest' : 'Create Contest'}
        </Button>
      </div>
    </div>
  );
}
