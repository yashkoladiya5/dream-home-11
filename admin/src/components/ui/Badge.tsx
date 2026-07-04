interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'default';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-700 text-slate-300 border-slate-600',
  default: 'bg-slate-700 text-slate-300 border-slate-600',
};

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
