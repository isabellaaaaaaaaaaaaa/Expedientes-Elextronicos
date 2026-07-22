import { FileClock, User as UserIcon } from 'lucide-react';
import { getBitacora } from '../../lib/auditLog';
import { EmptyState } from '../ui/empty-state';

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
          <ol className="relative space-y-5 before:content-[''] before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-slate-100">
            {entries.map(e => (
              <li key={e.id} className="relative pl-7">
                <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-400" />
                <p className="text-[11px] font-bold text-slate-400 mb-1">{e.relativeTime ?? `${e.date} · ${e.time}`}</p>
                <div className="flex items-center gap-1.5">
                  <UserIcon size={12} className="text-slate-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-gray-800">{e.user}</p>
                </div>
                <p className="text-sm text-slate-600 mt-1 ml-4">{e.detail ?? e.action}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
