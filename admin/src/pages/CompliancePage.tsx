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
      api.get('/admin/compliance/settings').then(r => setSettings(r.data)).catch(() => {}),
      api.get('/admin/compliance/consent-logs').then(r => setConsentLogs(r.data.consentLogs || [])).catch(() => {}),
      api.get('/admin/compliance/deletion-requests').then(r => setDeletionRequests(r.data.requests || [])).catch(() => {}),
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Compliance Settings</h1>

      <div className="flex gap-2 mb-6">
        {(['settings', 'consent', 'deletions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'settings' ? 'Settings' : tab === 'consent' ? 'Consent Logs' : 'Deletion Requests'}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Age</label>
              <input
                type="number"
                value={settings.minimumAge}
                onChange={e => setSettings({ ...settings, minimumAge: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention (days)</label>
              <input
                type="number"
                value={settings.dataRetentionDays}
                onChange={e => setSettings({ ...settings, dataRetentionDays: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ToS Version</label>
              <input
                type="text"
                value={settings.tosVersion}
                onChange={e => setSettings({ ...settings, tosVersion: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy Version</label>
              <input
                type="text"
                value={settings.privacyPolicyVersion}
                onChange={e => setSettings({ ...settings, privacyPolicyVersion: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GDPR Contact Email</label>
              <input
                type="email"
                value={settings.gdprContactEmail}
                onChange={e => setSettings({ ...settings, gdprContactEmail: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restricted States</label>
              <input
                type="text"
                value={settings.restrictedStates.join(', ')}
                onChange={e => setSettings({ ...settings, restrictedStates: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Comma-separated state names"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.requireKycForWithdrawal}
                onChange={e => setSettings({ ...settings, requireKycForWithdrawal: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Require KYC for Withdrawal</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.cookieConsentRequired}
                onChange={e => setSettings({ ...settings, cookieConsentRequired: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Require Cookie Consent</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.ageVerificationRequired}
                onChange={e => setSettings({ ...settings, ageVerificationRequired: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Require Age Verification</span>
            </label>
          </div>

          <button
            onClick={handleSave}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700"
          >
            Save Settings
          </button>
        </div>
      )}

      {activeTab === 'consent' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consent Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {consentLogs.map(log => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-sm">{log.userName}</td>
                  <td className="px-4 py-3 text-sm capitalize">{log.consentType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      log.accepted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.accepted ? 'Accepted' : 'Rejected'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{new Date(log.acceptedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{log.ipAddress}</td>
                </tr>
              ))}
              {consentLogs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No consent logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'deletions' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deletionRequests.map(req => (
                <tr key={req.id}>
                  <td className="px-4 py-3 text-sm">{req.userName}</td>
                  <td className="px-4 py-3 text-sm">{new Date(req.requestedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleApproveDeletion(req.id)}
                        className="text-brand-600 hover:text-brand-800 text-sm font-medium"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {deletionRequests.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No deletion requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
