import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'py-10' : 'py-16',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100',
          compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4',
        )}
      >
        <Icon
          size={compact ? 22 : 28}
          strokeWidth={1.5}
          className="text-slate-300"
        />
      </div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm',
          )}
        >
          {action.icon && <action.icon size={14} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
