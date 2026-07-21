import { type ReactNode } from 'react';
import { TriangleAlert as AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

const variantStyles: Record<string, { btn: string; iconBg: string; icon: string }> = {
  danger:  { btn: 'bg-red-500 hover:bg-red-600',      iconBg: 'bg-red-50',  icon: 'text-red-500' },
  warning: { btn: 'bg-amber-500 hover:bg-amber-600',  iconBg: 'bg-amber-50', icon: 'text-amber-500' },
  primary: { btn: 'bg-blue-500 hover:bg-blue-600',    iconBg: 'bg-blue-50', icon: 'text-blue-500' },
};

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  variant = 'primary', onConfirm, onCancel, children,
}: ConfirmDialogProps) {
  if (!open) return null;
  const s = variantStyles[variant];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in-0 zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle size={18} className={s.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900">{title}</p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
            <X size={15} />
          </button>
        </div>
        {children && <div className="mt-4">{children}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors ${s.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
