import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({ isOpen, open, onClose, title, children, actions }: ModalProps) {
  const visible = isOpen ?? open ?? false;
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop overlay */}
      <div className="fixed inset-0 transition-opacity" onClick={onClose} />
      
      {/* Modal Dialog Card */}
      <div role="dialog" aria-modal="true" aria-label={title} className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg my-auto border border-slate-800/80 flex flex-col max-h-[85vh] overflow-hidden animate-fade-in-up">
        {/* Header (Sticky) */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 shrink-0">
          <h3 className="text-base font-bold text-white leading-none">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/40 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1 scrollbar-thin text-slate-300">
          {children}
        </div>
        
        {/* Footer Actions (Sticky) */}
        {actions && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800/60 bg-slate-950/30 rounded-b-2xl shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
