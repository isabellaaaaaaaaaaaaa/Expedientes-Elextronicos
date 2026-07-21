import { FileClock, History, User as UserIcon } from 'lucide-react';
import { getBitacora, getChanges } from '../../lib/auditLog';
import { StatusBadge } from '../../lib/statusConfig';
import { EmptyState } from '../ui/empty-state';

const actionBadge: Record<string, string> = {
  'Creación del expediente': 'bg-blue-50 text-blue-700',
  'Edición': 'bg-slate-100 text-slate-600',
  'Cambio de estado': 'bg-violet-50 text-violet-700',
  'Carga de documentos': 'bg-teal-50 text-teal-700',
  'Descarga de PDF': 'bg-cyan-50 text-cyan-700',
  'Impresión': 'bg-indigo-50 text-indigo-700',
  'Finalización': 'bg-green-50 text-green-700',
};

export function BitacoraPanel({ expedientId }: { expedientId: string }) {
  const entries = getBitacora(expedientId);
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
          <FileClock size={14} className="text-blue-600" />
        </div>
        <p className="text-sm font-bold text-gray-800">Bitácora del expediente</p>
        {entries.length > 0 && (
          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{entries.length}</span>
        )}
      </div>
      {entries.length === 0 ? (
        <EmptyState icon={FileClock} title="Sin actividad registrada" description="Aquí aparecerán las acciones realizadas en este expediente." compact />
      ) : (
        <div className="px-5 py-4">
          <ol className="relative space-y-4 before:content-[''] before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-slate-100">
            {entries.map(e => (
              <li key={e.id} className="relative pl-7">
                <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-400" />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${actionBadge[e.action] ?? 'bg-slate-100 text-slate-600'}`}>
                    {e.action}
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">{e.date} · {e.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <UserIcon size={11} className="text-slate-400" />
                  {e.user}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function HistorialPanel({ expedientId }: { expedientId: string }) {
  const entries = getChanges(expedientId);
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
          <History size={14} className="text-violet-600" />
        </div>
        <p className="text-sm font-bold text-gray-800">Historial de cambios</p>
        {entries.length > 0 && (
          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{entries.length}</span>
        )}
      </div>
      {entries.length === 0 ? (
        <EmptyState icon={History} title="Sin cambios registrados" description="Aquí aparecerán los cambios realizados en este expediente." compact />
      ) : (
        <div className="divide-y divide-slate-50">
          {entries.map(e => (
            <div key={e.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-700">{e.field}</p>
                <span className="text-[11px] text-slate-400">{e.date}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 line-through min-w-0 truncate">{e.oldValue || '—'}</span>
                <span className="text-slate-300">→</span>
                <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold min-w-0 truncate">{e.newValue || '—'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                <UserIcon size={10} /> {e.user}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExpedientStatusPreview({ status }: { status: import('../../types').ExpedientStatus }) {
  return <StatusBadge status={status} size="md" />;
}
