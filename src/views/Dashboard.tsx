import { useMemo } from 'react';
import {
  FolderOpen,
  CircleCheck as CheckCircle2,
  Clock,
  CircleAlert as AlertCircle,
  ScanLine,
  FileStack,
  Sparkles,
  Timer,
  ArrowRight,
  User,
  Activity,
  Inbox,
} from 'lucide-react';
import type { NavigationPage, AuthUser, Planta, ExpedientListFilter, MedicalRecordType } from '../types';
import { EmptyState } from '../components/ui/empty-state';
import { getAllBitacora } from '../lib/auditLog';
import { useEmployees, useExpedients, useDocuments } from '../hooks/useStore';
import { getEmployees, getExpedients } from '../lib/store';
import { simulateExtraction } from '../lib/extractionSimulation';

interface DashboardProps {
  user: AuthUser;
  planta: Planta;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number, filter?: ExpedientListFilter) => void;
}

type AccentKey = 'blue' | 'slate' | 'amber' | 'orange' | 'green' | 'rose' | 'teal';

const accentMap: Record<AccentKey, { iconBg: string; iconText: string; ring: string }> = {
  blue:   { iconBg: 'bg-blue-50',    iconText: 'text-blue-600',    ring: 'ring-blue-100' },
  slate:  { iconBg: 'bg-slate-100',  iconText: 'text-slate-500',   ring: 'ring-slate-100' },
  amber:  { iconBg: 'bg-amber-50',   iconText: 'text-amber-600',   ring: 'ring-amber-100' },
  orange: { iconBg: 'bg-orange-50',  iconText: 'text-orange-600',  ring: 'ring-orange-100' },
  green:  { iconBg: 'bg-green-50',   iconText: 'text-green-600',   ring: 'ring-green-100' },
  rose:   { iconBg: 'bg-rose-50',    iconText: 'text-rose-600',    ring: 'ring-rose-100' },
  teal:   { iconBg: 'bg-teal-50',    iconText: 'text-teal-600',    ring: 'ring-teal-100' },
};

export default function Dashboard({ user, planta, onNavigate }: DashboardProps) {
  const plantaEmployees = useEmployees(planta);
  const allExpedients = useExpedients(planta);
  const allDocuments = useDocuments(planta);

  const totalExpedients = allExpedients.length;
  const sinRevisar = allExpedients.filter(e => e.status === 'Sin revisar').length;
  const enRevision = allExpedients.filter(e => e.status === 'En revisión').length;
  const pendiente = allExpedients.filter(e => e.status === 'Pendiente de verificación').length;
  const finalizado = allExpedients.filter(e => e.status === 'Finalizado').length;

  const hoy = new Date().toISOString().slice(0, 10);
  const digitalizadosHoy = allDocuments.filter(d => d.uploadDate === hoy).length;
  const documentosProcesados = allDocuments.length;

  const aiConfidence = useMemo(() => {
    const sampleTypes: MedicalRecordType[] = [
      'Examen médico de ingreso',
      'Hoja de consulta',
      'Prueba de antidoping',
      'Hoja de incapacidad',
    ];
    let total = 0;
    let count = 0;
    for (const rt of sampleTypes) {
      for (const f of simulateExtraction(rt)) {
        total += f.confidence;
        count++;
      }
    }
    return count > 0 ? Math.round((total / count) * 100) : 0;
  }, []);

  const tiempoPromedio = useMemo(() => {
    const tiempos = allExpedients.map(e => {
      const c = new Date(e.createdAt + 'T00:00:00').getTime();
      const u = new Date(e.updatedAt + 'T00:00:00').getTime();
      return Math.max(0, (u - c) / (1000 * 60 * 60 * 24));
    });
    return tiempos.length
      ? Math.round((tiempos.reduce((s, t) => s + t, 0) / tiempos.length) * 10) / 10
      : 0;
  }, [allExpedients]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const roleHonorific = (role: string): string => {
    switch (role) {
      case 'Doctora': return 'Dra.';
      case 'Enfermera': return 'Enfermera';
      case 'Administrador': return 'Admin';
      case 'Auditor': return 'Auditor';
      default: return '';
    }
  };

  interface Kpi {
    label: string;
    value: string;
    icon: typeof FolderOpen;
    accent: AccentKey;
    hint: string;
    filter?: { status: string };
    progress?: number;
  }

  const kpis: Kpi[] = [
    { label: 'Total de expedientes',   value: totalExpedients.toLocaleString(),       icon: FolderOpen,   accent: 'blue',   hint: 'Registros médicos', filter: undefined },
    { label: 'Pendientes',             value: pendiente.toLocaleString(),             icon: AlertCircle,  accent: 'orange', hint: 'Requieren atención', filter: { status: 'Pendiente de verificación' } },
    { label: 'En revisión',            value: enRevision.toLocaleString(),            icon: Clock,        accent: 'amber',  hint: 'En proceso', filter: { status: 'En revisión' } },
    { label: 'Finalizados',            value: finalizado.toLocaleString(),            icon: CheckCircle2, accent: 'green',  hint: 'Completados', filter: { status: 'Finalizado' } },
    { label: 'Digitalizados hoy',      value: digitalizadosHoy.toLocaleString(),      icon: ScanLine,     accent: 'rose',   hint: 'Documentos de hoy' },
    { label: 'Documentos procesados',  value: documentosProcesados.toLocaleString(),  icon: FileStack,    accent: 'slate',  hint: 'Acumulado total' },
    { label: 'Confianza de IA',        value: `${aiConfidence}%`,                     icon: Sparkles,     accent: 'teal',   hint: 'Promedio de extracción', progress: aiConfidence },
    { label: 'Tiempo prom. digitaliz.', value: `${tiempoPromedio} d`,                 icon: Timer,        accent: 'slate',  hint: 'Días de ciclo' },
  ];

  const recentActivity = useMemo(() => {
    type ActItem = {
      ts: number;
      icon: typeof FolderOpen;
      iconBg: string;
      iconText: string;
      text: string;
      sub?: string;
      onClick?: () => void;
    };

    const items: ActItem[] = [];

    const live = getAllBitacora();
    for (const e of live) {
      const ts = e.date && e.time
        ? new Date(`${e.date}T${e.time}`).getTime()
        : Date.now();
      const exp = getExpedients().find(x => x.id === e.expedientId);
      const emp = exp ? getEmployees().find(em => em.id === exp.employeeId) : undefined;
      let icon: typeof FolderOpen = FolderOpen;
      let iconBg = 'bg-blue-50';
      let iconText = 'text-blue-600';
      if (e.action.includes('Finali')) { icon = CheckCircle2; iconBg = 'bg-green-50'; iconText = 'text-green-600'; }
      else if (e.action.includes('document') || e.action.includes('Carga')) { icon = FileStack; iconBg = 'bg-amber-50'; iconText = 'text-amber-600'; }
      else if (e.action.includes('estado')) { icon = Clock; iconBg = 'bg-amber-50'; iconText = 'text-amber-600'; }
      else if (e.action.includes('Edición')) { icon = User; iconBg = 'bg-slate-100'; iconText = 'text-slate-500'; }
      items.push({
        ts,
        icon,
        iconBg,
        iconText,
        text: e.action,
        sub: emp ? `${emp.firstName} ${emp.lastName1}` : undefined,
        onClick: exp ? () => onNavigate('employee-profile', exp.employeeId, undefined, exp.year) : undefined,
      });
    }

    const empName = (id: string) => {
      const em = getEmployees().find(x => x.id === id);
      return em ? `${em.firstName} ${em.lastName1}` : undefined;
    };

    for (const e of allExpedients) {
      const created = new Date(e.createdAt + 'T12:00:00').getTime();
      items.push({
        ts: created,
        icon: FolderOpen,
        iconBg: 'bg-blue-50',
        iconText: 'text-blue-600',
        text: 'Se creó un expediente',
        sub: empName(e.employeeId),
        onClick: () => onNavigate('employee-profile', e.employeeId, undefined, e.year),
      });
      if (e.status === 'Finalizado') {
        const upd = new Date(e.updatedAt + 'T12:00:00').getTime();
        if (upd !== created) {
          items.push({
            ts: upd,
            icon: CheckCircle2,
            iconBg: 'bg-green-50',
            iconText: 'text-green-600',
            text: 'Se finalizó un expediente',
            sub: empName(e.employeeId),
            onClick: () => onNavigate('employee-profile', e.employeeId, undefined, e.year),
          });
        }
      }
    }

    for (const d of allDocuments) {
      items.push({
        ts: new Date(d.uploadDate + 'T12:00:00').getTime(),
        icon: FileStack,
        iconBg: 'bg-amber-50',
        iconText: 'text-amber-600',
        text: 'Se cargó un documento',
        sub: d.name,
        onClick: () => onNavigate('expedient-form', d.employeeId, d.expedientId),
      });
    }

    const seen = new Set<string>();
    return items
      .sort((a, b) => b.ts - a.ts)
      .filter(i => {
        const key = `${i.ts}|${i.text}|${i.sub ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [onNavigate, allExpedients, allDocuments]);

  const relativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hace un momento';
    if (mins < 60) return `Hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs} ${hrs === 1 ? 'hora' : 'horas'}`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    const months = Math.floor(days / 30);
    if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    const years = Math.floor(months / 12);
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
  };

  const statusBars = [
    { label: 'Finalizados',  value: finalizado, pct: totalExpedients ? (finalizado / totalExpedients) * 100 : 0, bar: 'bg-green-500',  track: 'bg-green-50',  status: 'Finalizado' },
    { label: 'Pendientes',   value: pendiente,  pct: totalExpedients ? (pendiente / totalExpedients) * 100 : 0, bar: 'bg-orange-500', track: 'bg-orange-50', status: 'Pendiente de verificación' },
    { label: 'En revisión',  value: enRevision, pct: totalExpedients ? (enRevision / totalExpedients) * 100 : 0, bar: 'bg-amber-500',  track: 'bg-amber-50',  status: 'En revisión' },
    { label: 'Sin revisar',  value: sinRevisar, pct: totalExpedients ? (sinRevisar / totalExpedients) * 100 : 0, bar: 'bg-slate-400',  track: 'bg-slate-100', status: 'Sin revisar' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {greeting()}, {roleHonorific(user.role)} {user.username}
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Resumen ejecutivo del área médica · Planta {planta}
        </p>
        <p className="text-xs text-slate-300 mt-0.5 capitalize">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, accent, hint, filter, progress }) => {
          const a = accentMap[accent];
          const clickable = !!filter;
          return (
            <button
              key={label}
              onClick={() => filter && onNavigate('expedients', undefined, undefined, undefined, filter)}
              className={`text-left rounded-2xl border border-slate-100 bg-white p-5 transition-all ${
                clickable ? 'hover:border-slate-300 hover:shadow-md cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${a.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon size={18} className={a.iconText} />
                </div>
                {progress !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</p>
              <p className="text-sm font-semibold text-slate-600 mt-1.5 leading-snug">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
            </button>
          );
        })}
      </div>

      {/* Bottom section: distribution + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Status distribution */}
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-1">
            <p className="section-title">Distribución de expedientes</p>
            <span className="text-xs font-semibold text-slate-400 tabular-nums">{totalExpedients} total</span>
          </div>
          <p className="section-subtitle mb-6">Estado actual de los registros médicos</p>

          <div className="space-y-5">
            {statusBars.map(item => (
              <button
                key={item.label}
                onClick={() => onNavigate('expedients', undefined, undefined, undefined, { status: item.status })}
                className="block w-full text-left group rounded-lg p-1 -m-1 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-400 tabular-nums">{item.value} / {totalExpedients}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${item.track}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${item.bar}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Mini summary stats */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{plantaEmployees.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Empleados activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{sinRevisar}</p>
              <p className="text-xs text-slate-400 mt-0.5">Sin iniciar</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 tabular-nums">
                {totalExpedients ? Math.round((finalizado / totalExpedients) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Tasa de cierre</p>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-[hsl(355,78%,51%)]" />
              <div>
                <p className="section-title">Actividad reciente</p>
                <p className="section-subtitle">Últimas acciones</p>
              </div>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState icon={Inbox} title="Sin actividad reciente" description="Aún no se han registrado acciones." compact />
          ) : (
            <div className="px-5 py-2">
              {recentActivity.map((act, idx) => {
                const isLast = idx === recentActivity.length - 1;
                return (
                  <div key={idx} className="flex gap-3 py-3">
                    <div className="relative flex flex-col items-center flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full ${act.iconBg} flex items-center justify-center z-10`}>
                        <act.icon size={14} className={act.iconText} />
                      </div>
                      {!isLast && <div className="absolute top-8 bottom-0 w-px bg-slate-100" />}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 pb-1">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{act.text}</p>
                      {act.sub && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{act.sub}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{relativeTime(act.ts)}</p>
                    </div>
                    {act.onClick && (
                      <button
                        onClick={act.onClick}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors pt-1 flex-shrink-0"
                      >
                        Ver <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
