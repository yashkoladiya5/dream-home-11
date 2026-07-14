import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            aria-label={label || props.placeholder || 'Select option'}
            className={`w-full rounded-xl border border-slate-700 bg-slate-800/60 text-slate-100 px-4 pr-10 py-2.5 text-sm appearance-none [-webkit-appearance:none] [-moz-appearance:none] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-300 ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-300">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
            <ChevronDown size={14} className="stroke-[2.5]" />
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
