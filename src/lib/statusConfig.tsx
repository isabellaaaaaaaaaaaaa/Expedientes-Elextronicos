import type { ExpedientStatus } from '../types';

export const EXPEDIENT_STATUSES: ExpedientStatus[] = [
  'Sin revisar',
  'En revisión',
  'Pendiente de verificación',
  'Finalizado',
];

interface StatusStyle {
  dot: string;
  chip: string;
  bar: string;
  solid: string;
}

export const statusConfig: Record<ExpedientStatus, StatusStyle> = {
  'Sin revisar': {
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-600 border-slate-200',
    bar: 'bg-slate-50 border-slate-100 text-slate-700',
    solid: 'bg-slate-400',
  },
  'En revisión': {
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-100',
    bar: 'bg-amber-50 border-amber-100 text-amber-700',
    solid: 'bg-amber-400',
  },
  'Pendiente de verificación': {
    dot: 'bg-orange-500',
    chip: 'bg-orange-50 text-orange-700 border-orange-100',
    bar: 'bg-orange-50 border-orange-100 text-orange-700',
    solid: 'bg-orange-400',
  },
  'Finalizado': {
    dot: 'bg-green-500',
    chip: 'bg-green-50 text-green-700 border-green-100',
    bar: 'bg-green-50 border-green-100 text-green-700',
    solid: 'bg-green-500',
  },
};

export function StatusBadge({ status, size = 'sm' }: { status: ExpedientStatus; size?: 'sm' | 'md' }) {
  const cfg = statusConfig[status];
  const pad = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 ${pad} rounded-full font-semibold border ${cfg.chip}`}>
      <span className={`status-dot ${cfg.dot}`} />
      {status}
    </span>
  );
}
