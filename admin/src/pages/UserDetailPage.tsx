import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, User } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';

interface UserData {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  currentTier: string;
  isActive: boolean;
  state: string;
  contestCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

const tierBadge: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  platinum: 'success',
  gold: 'warning',
  silver: 'info',
  bronze: 'neutral',
};

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentTier, setCurrentTier] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [state, setState] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/users/${id}`);
        const u = res.data.data;
        setUser(u);
        setFullName(u.fullName || '');
        setEmail(u.email || '');
        setCurrentTier(u.currentTier || 'bronze');
        setIsActive(u.isActive);
        setState(u.state || '');
      } catch {
        toast.error('Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}`, {
        fullName,
        email,
        currentTier,
        isActive,
        state,
      });
      toast.success('User updated successfully');
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 max-w-sm mx-auto mt-12 shadow-xl">
        User not found
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/users')}
          className="rounded-xl p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/40 border border-slate-800/60 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Edit Profile</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">User Account / {user.id}</p>
        </div>
      </div>

      {/* Split Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User Summary Card & Metrics */}
        <div className="md:col-span-1 space-y-6">
          {/* Summary Card */}
          <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-6 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-brand-gradient" />
            <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-300 font-semibold shadow-inner mt-2">
              <User size={30} />
            </div>
            <h2 className="text-lg font-bold text-white mt-4">{fullName || 'Unnamed User'}</h2>
            <p className="text-xs text-slate-500 font-semibold tracking-wide font-mono mt-1">{user.phone}</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant={tierBadge[currentTier?.toLowerCase()] || 'neutral'}>{currentTier}</Badge>
              <Badge variant={isActive ? 'success' : 'error'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Activity Overview</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-950/20 rounded-xl p-3 border border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contests Joined</span>
                <p className="text-lg font-bold text-white mt-1">{user.contestCount}</p>
              </div>
              <div className="bg-slate-950/20 rounded-xl p-3 border border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Deposits</span>
                <p className="text-lg font-bold text-emerald-400 mt-1">{formatINR(user.totalDeposits)}</p>
              </div>
              <div className="bg-slate-950/20 rounded-xl p-3 border border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Withdrawals</span>
                <p className="text-lg font-bold text-rose-400 mt-1">{formatINR(user.totalWithdrawals)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Edit Profile Form */}
        <div className="md:col-span-2">
          <div className="backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Profile Configurations</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="User Full Name"
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <Select
                label="User Loyalty Tier"
                options={[
                  { value: 'bronze', label: 'Bronze' },
                  { value: 'silver', label: 'Silver' },
                  { value: 'gold', label: 'Gold' },
                  { value: 'platinum', label: 'Platinum' },
                ]}
                value={currentTier.toLowerCase()}
                onChange={(e) => setCurrentTier(e.target.value)}
              />
              <Select
                label="Location State"
                options={[
                  { value: '', label: 'Select State' },
                  { value: 'Maharashtra', label: 'Maharashtra' },
                  { value: 'Gujarat', label: 'Gujarat' },
                  { value: 'Delhi', label: 'Delhi' },
                  { value: 'Karnataka', label: 'Karnataka' },
                  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                  { value: 'Assam', label: 'Assam' },
                  { value: 'Odisha', label: 'Odisha' },
                  { value: 'Telangana', label: 'Telangana' },
                ]}
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <Select
                label="Account Status"
                options={[
                  { value: 'true', label: 'Active / Allowed Login' },
                  { value: 'false', label: 'Suspended / Inactive' },
                ]}
                value={String(isActive)}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/60">
              <Button
                onClick={handleSave}
                loading={saving}
                icon={<Save className="h-4 w-4" />}
                variant="primary"
              >
                Save Profile Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
