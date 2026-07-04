import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Phone, Loader2 } from 'lucide-react';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    setLoading(true);
    try {
      await login(phoneNumber, role);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="D11" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">
            Dream Home <span className="text-brand-400">11</span>
          </h1>
          <p className="text-slate-400 mt-2">Admin Panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 rounded-2xl border border-slate-800/80 shadow-2xl p-8 space-y-5"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter registered phone number"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="admin" className="bg-slate-900">Admin</option>
              <option value="moderator" className="bg-slate-900">Moderator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
