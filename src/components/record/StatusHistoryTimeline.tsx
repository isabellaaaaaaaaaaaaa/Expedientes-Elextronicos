import { ArrowRight, User as UserIcon, Clock, History } from 'lucide-react';
import { getChanges } from '../../lib/auditLog';
import { statusConfig } from '../../lib/statusConfig';
import { EmptyState } from '../ui/empty-state';
import type { ExpedientStatus } from '../../types';

function StatusChip({ status }: { status: string }) {
  const cfg = statusConfig[status as ExpedientStatus];
  if (!cfg) return <span className="text-xs font-semibold text-slate-400">{status || '—'}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.chip}`}>
      <span className={`status-dot ${cfg.dot}`} />
      {status}
    </span>
  );
}

export function StatusHistoryTimeline({ expedientId }: { expedientId: string }) {
  const statusChanges = getChanges(expedientId)
    .filter(c => c.field === 'Estado')
    .sort((a, b) => {
      const cmp = `${b.date} ${b.time ?? ''}`.localeCompare(`${a.date} ${a.time ?? ''}`);
      if (cmp !== 0) return cmp;
      return b.id.localeCompare(a.id);
    });

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
          <History size={14} className="text-blue-600" />
        </div>
        <p className="text-sm font-bold text-gray-800">Historial de cambios de estado</p>
        {statusChanges.length > 0 && (
          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
            {statusChanges.length}
          </span>
        )}
      </div>

      {statusChanges.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin cambios de estado registrados"
          description="El historial aparecerá aquí cuando el expediente cambie de estado."
          compact
        />
      ) : (
        <div className="px-5 py-4">
          <ol className="relative space-y-1 before:content-[''] before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100">
            {statusChanges.map((change, idx) => {
              const isNewest = idx === 0;
              return (
                <li key={change.id} className="relative pl-8 py-2.5 group">
                  <span
                    className={`absolute left-[5px] top-3.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      isNewest ? 'bg-[hsl(355,78%,51%)] border-[hsl(355,78%,51%)]' : 'bg-white border-slate-300'
                    }`}
                  />
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <StatusChip status={change.oldValue || 'Inicial'} />
                    <ArrowRight size={12} className="text-slate-400" />
                    <StatusChip status={change.newValue} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <UserIcon size={11} className="text-slate-400" />
                      {change.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      {change.date}
                      {change.time && <span className="ml-0.5">{change.time}</span>}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
