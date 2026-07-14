import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, AlertTriangle, Settings, ShieldAlert, Cpu, HeartHandshake } from 'lucide-react';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toggle from '../components/ui/Toggle';
import TagInput from '../components/ui/TagInput';
import Spinner from '../components/ui/Spinner';

interface SystemConfig {
  appName: string;
  appVersion: string;
  apiVersion: string;
  environment: string;
  maintenanceMode: boolean;
  minAppVersionAndroid: string;
  minAppVersionIos: string;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  featureFlags: {
    dailySpinEnabled: boolean;
    pollsEnabled: boolean;
    feedEnabled: boolean;
    chatEnabled: boolean;
    referralEnabled: boolean;
  };
  maxDailyPosts: number;
  maxDailySpins: number;
  supportEmail: string;
  restrictedStates: string[];
}

export default function ConfigPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config');
      const c = data.data;
      setConfig({
        appName: c.appName || '',
        appVersion: c.appVersion || '',
        apiVersion: c.apiVersion || '',
        environment: c.environment || 'production',
        maintenanceMode: c.maintenanceMode ?? false,
        minAppVersionAndroid: c.minAppVersionAndroid || '',
        minAppVersionIos: c.minAppVersionIos || '',
        minWithdrawalAmount: c.minWithdrawalAmount || 0,
        maxWithdrawalAmount: c.maxWithdrawalAmount || 0,
        featureFlags: {
          dailySpinEnabled: c.featureFlags?.dailySpinEnabled ?? true,
          pollsEnabled: c.featureFlags?.pollsEnabled ?? true,
          feedEnabled: c.featureFlags?.feedEnabled ?? true,
          chatEnabled: c.featureFlags?.chatEnabled ?? true,
          referralEnabled: c.featureFlags?.referralEnabled ?? true,
        },
        maxDailyPosts: c.maxDailyPosts || 0,
        maxDailySpins: c.maxDailySpins || 0,
        supportEmail: c.supportEmail || '',
        restrictedStates: c.restrictedStates || [],
      });
    } catch {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    if (!config.appName.trim()) {
      toast.error('App Name is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!config.supportEmail.trim() || !emailRegex.test(config.supportEmail)) {
      toast.error('A valid support email is required');
      return;
    }

    if (config.minWithdrawalAmount < 0) {
      toast.error('Minimum withdrawal amount cannot be negative');
      return;
    }

    if (config.maxWithdrawalAmount < config.minWithdrawalAmount) {
      toast.error('Maximum withdrawal amount cannot be less than minimum');
      return;
    }

    if (config.maxDailySpins < 0) {
      toast.error('Maximum daily spins cannot be negative');
      return;
    }

    if (config.maxDailyPosts < 0) {
      toast.error('Maximum daily posts cannot be negative');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/admin/config', config);
      toast.success('Configuration saved successfully');
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateFlag = (key: keyof SystemConfig['featureFlags'], value: boolean) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            featureFlags: { ...prev.featureFlags, [key]: value },
          }
        : prev
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="py-20 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 max-w-sm mx-auto mt-12 shadow-xl">
        Failed to load configuration
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manage parameters, feature toggle switches, and versions</p>
        </div>
        <Button onClick={handleSave} loading={saving} icon={<Save className="h-4 w-4" />} variant="primary" className="shrink-0">
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: General Configuration */}
        <div className="md:col-span-2 space-y-6">
          {/* General Metadata */}
          <div className="backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Settings size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase">System Parameters</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="App Name"
                value={config.appName}
                onChange={(e) => updateField('appName', e.target.value)}
              />
              <Input
                label="App Version"
                value={config.appVersion}
                onChange={(e) => updateField('appVersion', e.target.value)}
              />
              <Input
                label="API Version"
                value={config.apiVersion}
                onChange={(e) => updateField('apiVersion', e.target.value)}
              />
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-400 uppercase tracking-wide">Environment</label>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-sm text-slate-400 font-mono">
                  {config.environment}
                </div>
              </div>
            </div>
          </div>

          {/* Limits & Parameters */}
          <div className="backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Cpu size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase">Withdrawals & Post Limits</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Min Withdrawal (₹)"
                type="number"
                value={config.minWithdrawalAmount}
                onChange={(e) => updateField('minWithdrawalAmount', Number(e.target.value))}
              />
              <Input
                label="Max Withdrawal (₹)"
                type="number"
                value={config.maxWithdrawalAmount}
                onChange={(e) => updateField('maxWithdrawalAmount', Number(e.target.value))}
              />
              <Input
                label="Max Daily Posts"
                type="number"
                value={config.maxDailyPosts}
                onChange={(e) => updateField('maxDailyPosts', Number(e.target.value))}
              />
              <Input
                label="Max Daily Spins"
                type="number"
                value={config.maxDailySpins}
                onChange={(e) => updateField('maxDailySpins', Number(e.target.value))}
              />
            </div>
          </div>

          {/* App Versions */}
          <div className="backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <ShieldAlert size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase">Minimum App Versions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Min Android Version"
                value={config.minAppVersionAndroid}
                onChange={(e) => updateField('minAppVersionAndroid', e.target.value)}
                placeholder="e.g. 1.2.0"
              />
              <Input
                label="Min iOS Version"
                value={config.minAppVersionIos}
                onChange={(e) => updateField('minAppVersionIos', e.target.value)}
                placeholder="e.g. 1.2.0"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Maintenance & Feature toggles */}
        <div className="md:col-span-1 space-y-6">
          {/* Maintenance Segment */}
          <div className="backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/60 pb-3">Platform State</h3>
            <div className="space-y-3">
              <Toggle
                checked={config.maintenanceMode}
                onChange={(v) => updateField('maintenanceMode', v)}
                label="Maintenance Mode"
              />
              {config.maintenanceMode && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs font-semibold text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  App is in maintenance. Users cannot access matches.
                </div>
              )}
            </div>
          </div>

          {/* Feature Flags */}
          <div className="backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/60 pb-3">Feature Toggles</h3>
            <div className="space-y-4">
              <Toggle
                checked={config.featureFlags.dailySpinEnabled}
                onChange={(v) => updateFlag('dailySpinEnabled', v)}
                label="Daily Spin Enabled"
              />
              <Toggle
                checked={config.featureFlags.pollsEnabled}
                onChange={(v) => updateFlag('pollsEnabled', v)}
                label="Polls Enabled"
              />
              <Toggle
                checked={config.featureFlags.feedEnabled}
                onChange={(v) => updateFlag('feedEnabled', v)}
                label="Feed Enabled"
              />
              <Toggle
                checked={config.featureFlags.chatEnabled}
                onChange={(v) => updateFlag('chatEnabled', v)}
                label="Chat Enabled"
              />
              <Toggle
                checked={config.featureFlags.referralEnabled}
                onChange={(v) => updateFlag('referralEnabled', v)}
                label="Referral Enabled"
              />
            </div>
          </div>

          {/* Support Email & Restricted States */}
          <div className="backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <HeartHandshake size={16} className="text-slate-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Support & Constraints</h3>
            </div>
            <div className="space-y-4">
              <Input
                label="Support Email"
                type="email"
                value={config.supportEmail}
                onChange={(e) => updateField('supportEmail', e.target.value)}
                placeholder="support@example.com"
              />
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Restricted States</label>
                <TagInput
                  tags={config.restrictedStates}
                  onChange={(tags) => updateField('restrictedStates', tags)}
                  placeholder="Add restricted state..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
