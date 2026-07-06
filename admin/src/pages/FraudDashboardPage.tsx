import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ApiResponse, FraudAlert, FraudStats } from '../lib/api';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import StatsCard from '../components/ui/StatsCard';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { AlertTriangle, ShieldAlert, Activity, CheckCircle, Search, Eye } from 'lucide-react';

const severityBadge: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const statusColors: Record<string, string> = {
  open: 'text-red-400 bg-red-400/10',
  investigating: 'text-amber-400 bg-amber-400/10',
  resolved: 'text-emerald-400 bg-emerald-400/10',
  dismissed: 'text-slate-400 bg-slate-400/10',
};

export default function FraudDashboardPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<FraudAlert | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const [alertsRes, statsRes] = await Promise.all([
        api.get<ApiResponse<FraudAlert[]>>(`/admin/fraud/alerts?${params}`),
        api.get<ApiResponse<FraudStats>>('/admin/fraud/stats'),
      ]);

      setAlerts(alertsRes.data.data ?? []);
      setStats(statsRes.data.data ?? null);
    } catch {
      toast.error('Failed to load fraud data');
    } finally {
      setLoading(false);
    }
  }, [search, severityFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (alert: FraudAlert, action: 'investigating' | 'resolved' | 'dismissed') => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/fraud/alerts/${alert._id}/resolve`, { status: action });
      toast.success(`Alert ${action}`);
      setShowDetail(false);
      setSelected(null);
      fetchData();
    } catch {
      toast.error('Failed to update alert');
    } finally {
      setActionLoading(false);
    }
  };

  const severityChart = stats?.alertsBySeverity ?? [];
  const topRules = stats?.topRules ?? [];
  const alertsByDay = stats?.alertsByDay ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fraud Detection Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor and investigate suspicious activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={AlertTriangle} value={stats?.totalAlerts ?? 0} label="Total Alerts" loading={loading} />
        <StatsCard icon={Activity} value={stats?.openAlerts ?? 0} label="Open" loading={loading} />
        <StatsCard icon={ShieldAlert} value={stats?.criticalAlerts ?? 0} label="Critical" loading={loading} />
        <StatsCard icon={CheckCircle} value={`+${stats?.resolvedToday ?? 0}`} label="Resolved Today" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Alerts by Severity</h3>
          {severityChart.length > 0 ? (
            <div className="space-y-3">
              {severityChart.map(s => {
                const total = severityChart.reduce((sum, x) => sum + x.count, 0);
                const pct = total > 0 ? (s.count / total) * 100 : 0;
                return (
                  <div key={s.severity}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-slate-300">{s.severity}</span>
                      <span className="text-slate-400 font-mono">{s.count}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.severity === 'critical' ? 'bg-red-500'
                            : s.severity === 'high' ? 'bg-orange-500'
                            : s.severity === 'medium' ? 'bg-amber-500'
                            : 'bg-slate-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No data</p>
          )}
        </div>

        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Top Rules Triggered</h3>
          {topRules.length > 0 ? (
            <div className="space-y-2">
              {topRules.slice(0, 6).map(r => (
                <div key={r.rule} className="flex justify-between items-center py-1.5 border-b border-slate-800/50 last:border-0">
                  <span className="text-sm text-slate-300 capitalize">{r.rule.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-slate-400 font-mono">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No rules triggered</p>
          )}
        </div>

        <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Alerts (Last 7 Days)</h3>
          {alertsByDay.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {alertsByDay.map(d => {
                const max = Math.max(...alertsByDay.map(x => x.count), 1);
                const h = (d.count / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500 font-mono">{d.count}</span>
                    <div
                      className="w-full rounded-t bg-brand-600/60 hover:bg-brand-600/80 transition-colors min-h-[4px]"
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                    <span className="text-[10px] text-slate-600">
                      {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No data</p>
          )}
        </div>
      </div>

      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">Fraud Alerts</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-48 pl-9 pr-3 py-1.5 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                placeholder="Search user..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Severity' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'investigating', label: 'Investigating' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'dismissed', label: 'Dismissed' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <ShieldAlert size={48} className="mb-3 opacity-50" />
            <p className="text-lg font-medium">No Fraud Alerts</p>
            <p className="text-sm mt-1">All clear! No suspicious activity detected.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detected</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {alerts.map(alert => (
                  <tr
                    key={alert._id}
                    className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                    onClick={() => { setSelected(alert); setShowDetail(true); }}
                  >
                    <td className="px-4 py-3">
                      <Badge variant={severityBadge[alert.severity] || 'info'}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{alert.userName || 'Unknown'}</p>
                      <p className="text-slate-400 text-xs">{alert.userPhone || alert.userId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-sm capitalize">{alert.rule.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              alert.score >= 80 ? 'bg-red-500' : alert.score >= 50 ? 'bg-amber-500' : 'bg-slate-500'
                            }`}
                            style={{ width: `${Math.min(alert.score, 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-400 text-xs font-mono">{alert.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[alert.status] || ''}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {new Date(alert.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" icon={<Eye size={14} />}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelected(null); }}
        title="Fraud Alert Details"
        actions={
          selected && selected.status !== 'resolved' && selected.status !== 'dismissed' ? (
            <div className="flex gap-2 w-full">
              <Button variant="secondary" onClick={() => handleAction(selected!, 'investigating')} loading={actionLoading}>
                Mark Investigating
              </Button>
              <Button variant="primary" onClick={() => handleAction(selected!, 'resolved')} loading={actionLoading}>
                Resolve
              </Button>
              <Button variant="ghost" onClick={() => handleAction(selected!, 'dismissed')} loading={actionLoading}>
                Dismiss
              </Button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs">User</p>
                <p className="text-white font-medium">{selected.userName || 'Unknown'}</p>
                <p className="text-slate-400 text-xs">{selected.userPhone}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">User ID</p>
                <p className="text-white font-mono text-xs">{selected.userId}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Severity</p>
                <Badge variant={severityBadge[selected.severity] || 'info'}>{selected.severity.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Fraud Score</p>
                <span className={`font-mono ${selected.score >= 80 ? 'text-red-400' : selected.score >= 50 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {selected.score}/100
                </span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-xs mb-1">Rule Triggered</p>
              <p className="text-white capitalize">{selected.rule.replace(/_/g, ' ')}</p>
            </div>

            <div>
              <p className="text-slate-400 text-xs mb-1">Description</p>
              <p className="text-slate-300 text-sm bg-slate-800/50 rounded-xl p-3">{selected.description}</p>
            </div>

            <div>
              <p className="text-slate-400 text-xs mb-1">Evidence</p>
              <p className="text-slate-300 text-sm bg-slate-800/50 rounded-xl p-3 font-mono text-xs">{selected.evidence}</p>
            </div>

            {selected.ipAddress && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">IP Address</p>
                  <p className="text-slate-300 font-mono">{selected.ipAddress}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Device ID</p>
                  <p className="text-slate-300 font-mono">{selected.deviceId || '—'}</p>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500">
              Detected: {new Date(selected.createdAt).toLocaleString('en-IN')}
              {selected.resolvedAt && ` | Resolved: ${new Date(selected.resolvedAt).toLocaleString('en-IN')}`}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
