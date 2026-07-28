import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown, X, Check } from 'lucide-react';
import { Checkbox } from './checkbox';
import type { SortDir } from '../../hooks/useTable';

export function TableCheckbox({
  checked,
  indeterminate,
  onChange,
  className = '',
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Checkbox
        checked={checked ? true : indeterminate ? 'indeterminate' : false}
        onCheckedChange={onChange}
        className="data-[state=indeterminate]:bg-[hsl(355,78%,51%)] data-[state=indeterminate]:border-[hsl(355,78%,51%)]"
      />
    </div>
  );
}

export function SortableHeader<K extends string = string>({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onSort,
  className = '',
  align = 'left',
}: {
  label: string;
  sortKey: K;
  currentSortKey?: K;
  currentSortDir?: SortDir;
  onSort?: (key: K) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  if (!onSort) {
    return <th className={className}>{label}</th>;
  }
  const isActive = currentSortKey === sortKey;
  const alignCls = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <th
      className={`cursor-pointer select-none hover:text-slate-600 transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className={`inline-flex items-center gap-1 ${alignCls}`}>
        {label}
        {isActive ? (
          currentSortDir === 'asc' ? <ChevronUp size={11} className="text-[hsl(355,78%,51%)]" /> : <ChevronDown size={11} className="text-[hsl(355,78%,51%)]" />
        ) : (
          <ChevronUp size={11} className="text-slate-300 opacity-40" />
        )}
      </span>
    </th>
  );
}

export interface BulkAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  actions,
  onClear,
}: {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[hsl(355,78%,51%)]/5 border border-[hsl(355,78%,51%)]/20 rounded-xl mb-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[hsl(355,78%,51%)] text-white rounded-lg text-xs font-bold flex-shrink-0">
          <Check size={12} strokeWidth={3} /> {selectedCount}
        </div>
        <span className="text-sm font-semibold text-slate-700 truncate">
          {selectedCount === 1 ? '1 registro seleccionado' : `${selectedCount} registros seleccionados`}
        </span>
        <span className="text-xs text-slate-400 hidden sm:inline">de {totalCount}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions.map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-lg transition-colors ${
              action.variant === 'danger'
                ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
        <button onClick={onClear} className="flex items-center gap-1 px-2 h-8 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Limpiar selección">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

export function PaginationFooter({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  selectedCount = 0,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  selectedCount?: number;
}) {
  if (totalItems <= pageSize) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  const pageButtons: number[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pageButtons.push(i);
  } else if (currentPage < 4) {
    for (let i = 0; i < 7; i++) pageButtons.push(i);
  } else if (currentPage >= totalPages - 4) {
    for (let i = totalPages - 7; i < totalPages; i++) pageButtons.push(i);
  } else {
    for (let i = currentPage - 3; i <= currentPage + 3; i++) pageButtons.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50/30">
      <p className="text-xs text-slate-400">
        Mostrando <span className="font-bold text-gray-700">{startItem}-{endItem}</span> de{' '}
        <span className="font-bold text-gray-700">{totalItems}</span>
        {selectedCount > 0 && <span className="text-[hsl(355,78%,51%)] font-semibold ml-1.5">· {selectedCount} seleccionados</span>}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronUp size={16} className="-rotate-90" />
        </button>
        {pageButtons.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors ${pageNum === currentPage ? 'bg-[hsl(355,78%,51%)] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {pageNum + 1}
          </button>
        ))}
        <button onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronUp size={16} className="rotate-90" />
        </button>
      </div>
    </div>
  );
}
