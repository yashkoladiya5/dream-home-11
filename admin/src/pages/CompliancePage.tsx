import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface ComplianceSettings {
  minimumAge: number;
  requireKycForWithdrawal: boolean;
  restrictedStates: string[];
  tosVersion: string;
  privacyPolicyVersion: string;
  cookieConsentRequired: boolean;
  dataRetentionDays: number;
  gdprContactEmail: string;
  ageVerificationRequired: boolean;
}

interface ConsentLog {
  id: string;
  userId: string;
  userName: string;
  consentType: string;
  accepted: boolean;
  acceptedAt: string;
  ipAddress: string;
}

interface DeletionRequest {
  id: string;
  userId: string;
  userName: string;
  requestedAt: string;
  status: string;
}

export default function CompliancePage() {
  const [settings, setSettings] = useState<ComplianceSettings>({
    minimumAge: 18,
    requireKycForWithdrawal: true,
    restrictedStates: ['Assam', 'Odisha', 'Telangana'],
    tosVersion: '1.0',
    privacyPolicyVersion: '1.0',
    cookieConsentRequired: true,
    dataRetentionDays: 90,
    gdprContactEmail: 'privacy@dreamhome11.com',
    ageVerificationRequired: true,
  });
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'consent' | 'deletions'>('settings');

  useEffect(() => {
    Promise.all([
      api.get('/admin/compliance/settings').then(r => setSettings(r.data.data)).catch(() => {}),
      api.get('/admin/compliance/consent-logs').then(r => setConsentLogs(r.data.data?.records || [])).catch(() => {}),
      api.get('/admin/compliance/deletion-requests').then(r => setDeletionRequests(r.data.data?.requests || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.put('/admin/compliance/settings', settings);
      toast.success('Compliance settings saved');
    } catch {
      toast.error('Failed to save compliance settings');
    }
  };

  const handleApproveDeletion = async (id: string) => {
    try {
      await api.post(`/admin/compliance/deletion-requests/${id}/approve`);
      toast.success('Deletion request approved');
      setDeletionRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    } catch {
      toast.error('Failed to approve deletion request');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;

  return (
    <div className="p-6 text-slate-100">
      <h1 className="text-2xl font-bold text-white mb-6">Compliance Settings</h1>

      <div className="flex gap-2 mb-6">
        {(['settings', 'consent', 'deletions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200 border border-slate-700/50'
            }`}
          >
            {tab === 'settings' ? 'Settings' : tab === 'consent' ? 'Consent Logs' : 'Deletion Requests'}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Minimum Age</label>
              <input
                type="number"
                value={settings.minimumAge}
                onChange={e => setSettings({ ...settings, minimumAge: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 px-3 py-2.5 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Data Retention (days)</label>
              <input
                type="number"
                value={settings.dataRetentionDays}
                onChange={e => setSettings({ ...settings, dataRetentionDays: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 px-3 py-2.5 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">ToS Version</label>
              <input
                type="text"
                value={settings.tosVersion}
                onChange={e => setSettings({ ...settings, tosVersion: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 px-3 py-2.5 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Privacy Policy Version</label>
              <input
                type="text"
                value={settings.privacyPolicyVersion}
                onChange={e => setSettings({ ...settings, privacyPolicyVersion: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 px-3 py-2.5 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">GDPR Contact Email</label>
              <input
                type="email"
                value={settings.gdprContactEmail}
                onChange={e => setSettings({ ...settings, gdprContactEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 px-3 py-2.5 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Restricted States</label>
              <input
                type="text"
                value={settings.restrictedStates.join(', ')}
                onChange={e => setSettings({ ...settings, restrictedStates: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 px-3 py-2.5 transition-colors"
                placeholder="Comma-separated state names"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.requireKycForWithdrawal}
                onChange={e => setSettings({ ...settings, requireKycForWithdrawal: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800/50 text-brand-600 focus:ring-brand-500 focus:ring-offset-slate-900 h-4 w-4 transition-colors"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">Require KYC for Withdrawal</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.cookieConsentRequired}
                onChange={e => setSettings({ ...settings, cookieConsentRequired: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800/50 text-brand-600 focus:ring-brand-500 focus:ring-offset-slate-900 h-4 w-4 transition-colors"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">Require Cookie Consent</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.ageVerificationRequired}
                onChange={e => setSettings({ ...settings, ageVerificationRequired: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800/50 text-brand-600 focus:ring-brand-500 focus:ring-offset-slate-900 h-4 w-4 transition-colors"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">Require Age Verification</span>
            </label>
          </div>

          <button
            onClick={handleSave}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-lg shadow-brand-600/20"
          >
            Save Settings
          </button>
        </div>
      )}

      {activeTab === 'consent' && (
        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-slate-800/30">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Consent Type</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {consentLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-200">{log.userName}</td>
                  <td className="px-4 py-3 text-sm capitalize text-slate-300">{log.consentType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      log.accepted 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.accepted ? 'Accepted' : 'Rejected'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{new Date(log.acceptedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{log.ipAddress}</td>
                </tr>
              ))}
              {consentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No consent logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'deletions' && (
        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-slate-800/30">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Requested</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {deletionRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-200">{req.userName}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{new Date(req.requestedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      req.status === 'pending' || req.status === 'pending_approval'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : req.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(req.status === 'pending' || req.status === 'pending_approval') && (
                      <button
                        onClick={() => handleApproveDeletion(req.id)}
                        className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {deletionRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No deletion requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
