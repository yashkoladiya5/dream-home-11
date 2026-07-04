interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export default function Card({ title, children, className = '', actions }: CardProps) {
  return (
    <div className={`admin-card p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
