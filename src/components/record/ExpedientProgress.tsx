import { useMemo } from 'react';
import type { Expedient } from '../../types';

interface ProgressData {
  pct: number;
  done: string[];
  pending: string[];
}

const SECTIONS: { key: string; label: string; check: (e: Partial<Expedient>) => boolean }[] = [
  { key: 'identificacion', label: 'Identificación', check: e => !!(e.recordType && e.date && e.responsibleDoctor) },
  { key: 'antecedentes',   label: 'Antecedentes',   check: e => !!(e.laboralAntecedents || e.pathologicalAntecedents || e.familyAntecedents || e.allergies) },
  { key: 'exploracion',    label: 'Exploración física', check: e => !!(e.weight || e.height || e.bloodPressure || e.heartRate || e.physicalExamNotes) },
  { key: 'estudios',       label: 'Estudios y resultados', check: e => !!(e.results) },
  { key: 'diagnosticos',   label: 'Diagnósticos', check: e => !!(e.diagnosis) },
  { key: 'observaciones',  label: 'Observaciones', check: e => !!(e.recommendations || e.observations) },
];

export function useExpedientProgress(exp: Partial<Expedient>): ProgressData {
  return useMemo(() => {
    const done = SECTIONS.filter(s => s.check(exp)).map(s => s.label);
    const pending = SECTIONS.filter(s => !s.check(exp)).map(s => s.label);
    const pct = Math.round((done.length / SECTIONS.length) * 100);
    return { pct, done, pending };
  }, [exp]);
}

export function ExpedientProgress({ exp }: { exp: Partial<Expedient> }) {
  const { pct, pending } = useExpedientProgress(exp);
  const complete = pct === 100;
  const color = complete ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-700">Progreso de captura</p>
        <span className={`text-sm font-bold ${complete ? 'text-green-600' : 'text-slate-700'}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {pending.length > 0 ? (
        <div className="mt-3.5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Secciones pendientes</p>
          <div className="flex flex-wrap gap-1.5">
            {pending.map(p => (
              <span key={p} className="inline-flex items-center text-[11px] px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-green-600 font-semibold mt-3.5">Expediente completo y listo para finalizar</p>
      )}
    </div>
  );
}
