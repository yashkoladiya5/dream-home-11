import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: { value: number; isPositive: boolean };
  loading?: boolean;
}

export default function StatsCard({ icon: Icon, value, label, trend, loading }: StatsCardProps) {
  if (loading) {
    return (
      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-8 w-24 rounded-lg bg-slate-800 animate-pulse" />
            <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  // Get dynamic colors based on metric labels for premium visual cues
  const getColors = () => {
    const l = label.toLowerCase();
    if (l.includes('deposits')) return { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', glow: 'shadow-emerald-500/5' };
    if (l.includes('kyc')) return { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', glow: 'shadow-amber-500/5' };
    if (l.includes('tickets')) return { bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400', glow: 'shadow-purple-500/5' };
    if (l.includes('active')) return { bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', glow: 'shadow-indigo-500/5' };
    if (l.includes('contests')) return { bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', glow: 'shadow-blue-500/5' };
    return { bg: 'bg-brand-500/10 border-brand-500/20 text-brand-400', glow: 'shadow-brand-500/5' };
  };

  const colors = getColors();

  return (
    <div className={`backdrop-blur-md bg-slate-900/55 rounded-2xl border border-slate-800/70 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/60 hover:shadow-2xl ${colors.glow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
          <p className="text-xs font-semibold text-slate-400 tracking-wide mt-2 uppercase">{label}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors.bg}`}>
          <Icon size={22} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 bg-slate-950/30 w-fit px-2 py-1 rounded-lg border border-slate-800/50">
          {trend.isPositive ? (
            <TrendingUp size={14} className="text-emerald-400" />
          ) : (
            <TrendingDown size={14} className="text-rose-400" />
          )}
          <span
            className={`text-xs font-semibold ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value > 0 ? `+${trend.value}` : trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}
