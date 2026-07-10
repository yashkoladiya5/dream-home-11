import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
  secondary: 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-slate-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-700 focus:ring-slate-500',
};

export default function Button({
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  children,
  className = '',
  ariaLabel,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {!loading && icon}
      {children}
    </button>
  );
}
