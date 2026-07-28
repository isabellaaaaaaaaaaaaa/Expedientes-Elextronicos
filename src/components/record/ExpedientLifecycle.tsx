import { Check } from 'lucide-react';
import { EXPEDIENT_STATUSES, statusConfig } from '../../lib/statusConfig';
import type { ExpedientStatus } from '../../types';

const STEP_DESCRIPTIONS: Record<ExpedientStatus, string> = {
  'Sin revisar': 'Expediente creado, pendiente de revisión',
  'En revisión': 'Revisión médica en progreso',
  'Pendiente de verificación': 'En espera de validación',
  'Finalizado': 'Expediente completado y bloqueado',
};

export function ExpedientLifecycle({ currentStatus }: { currentStatus: ExpedientStatus }) {
  const currentIndex = EXPEDIENT_STATUSES.indexOf(currentStatus);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
          <span className="text-[hsl(355,78%,51%)] text-sm font-bold">↻</span>
        </div>
        <p className="text-sm font-bold text-gray-800">Ciclo de vida del expediente</p>
      </div>
      <div className="px-5 py-6">
        <div className="flex items-center">
          {EXPEDIENT_STATUSES.map((status, idx) => {
            const cfg = statusConfig[status];
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isLast = idx === EXPEDIENT_STATUSES.length - 1;

            return (
              <div key={status} className="flex items-center flex-1 last:flex-none">
                {/* Step circle + label */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ minWidth: '80px' }}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCurrent
                        ? `${cfg.solid} text-white shadow-lg ring-4 ring-offset-2 ${cfg.dot.replace('bg-', 'ring-')}/20`
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={16} strokeWidth={3} />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-[11px] font-bold leading-tight transition-colors ${
                        isCurrent ? 'text-gray-900' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {status}
                    </p>
                    <p
                      className={`text-[9px] mt-0.5 leading-tight max-w-[90px] ${
                        isCurrent ? 'text-slate-500' : 'text-slate-300'
                      }`}
                    >
                      {STEP_DESCRIPTIONS[status]}
                    </p>
                  </div>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full overflow-hidden bg-slate-100">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500 w-full' : isCurrent ? `${cfg.solid} w-1/2` : 'bg-transparent w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current status banner */}
        <div className={`mt-5 px-4 py-3 rounded-xl border ${statusConfig[currentStatus].bar} flex items-center gap-3`}>
          <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[currentStatus].solid}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">Estado actual: {currentStatus}</p>
            <p className="text-[11px] opacity-80 mt-0.5">{STEP_DESCRIPTIONS[currentStatus]}</p>
          </div>
          {currentStatus === 'Finalizado' && (
            <span className="text-[10px] font-bold px-2 py-1 bg-white/60 rounded-lg">Bloqueado</span>
          )}
        </div>
      </div>
    </div>
  );
}
