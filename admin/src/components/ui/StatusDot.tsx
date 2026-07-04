interface StatusDotProps {
  status: 'active' | 'warning' | 'error' | 'inactive';
  label?: string;
}

export default function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`status-dot status-${status}`} />
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </span>
  );
}
