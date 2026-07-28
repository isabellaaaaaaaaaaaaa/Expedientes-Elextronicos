import { useState, useMemo, useEffect } from 'react';
import { FolderOpen, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle, ArrowRight, User, FileText, Activity, ChartBar as BarChart3, Users, Timer, X, Inbox, CalendarPlus, FileClock } from 'lucide-react';
import { employees, expedients, documents } from '../data/mockData';
import type { NavigationPage, AuthUser, Planta, ExpedientListFilter, UserRole } from '../types';
import { EmployeeTable } from '../components/employee/EmployeeTable';
import { EmptyState } from '../components/ui/empty-state';
import { getAllBitacora } from '../lib/auditLog';
import { toast } from 'sonner';

interface DashboardProps {
  user: AuthUser;
  planta: Planta;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number, filter?: ExpedientListFilter) => void;
}


export default function Dashboard({ user, planta: _planta, onNavigate }: DashboardProps) {
  void _planta;
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (!summaryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSummaryOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [summaryOpen]);
  // planta is UI context only; all data shown until persistence-based filtering exists
  const plantaEmployees = useMemo(() => employees, [employees]);
  const allItems = useMemo(() => expedients, [expedients]);

  const totalExpedients = allItems.length;
  const sinRevisar  = allItems.filter(e => e.status === 'Sin revisar').length;
  const enRevision  = allItems.filter(e => e.status === 'En revisión').length;
  const pendiente   = allItems.filter(e => e.status === 'Pendiente de verificación').length;
  const finalizado  = allItems.filter(e => e.status === 'Finalizado').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const roleHonorific = (role: UserRole): string => {
    switch (role) {
      case 'Doctora': return 'Dra.';
      case 'Enfermera': return 'Enfermera';
      case 'Administrador': return 'Admin';
      case 'Auditor': return 'Auditor';
      default: return '';
    }
  };

  const accentMap: Record<string, { iconBg: string; iconText: string }> = {
    blue:   { iconBg: 'bg-red-50',   iconText: 'text-[hsl(355,78%,51%)]' },
    slate:  { iconBg: 'bg-slate-100', iconText: 'text-slate-500' },
    amber:  { iconBg: 'bg-amber-50',  iconText: 'text-amber-600' },
    orange: { iconBg: 'bg-orange-50', iconText: 'text-orange-600' },
    green:  { iconBg: 'bg-green-50',  iconText: 'text-green-600' },
    rose:   { iconBg: 'bg-rose-50',   iconText: 'text-rose-600' },
  };

  // Resumen Ejecutivo — KPIs for supervisors and coordinators
  const executiveSummary = useMemo(() => {
    const totalEmpleados = employees.length;
    const totalExps = expedients.length;
    const finalizados = expedients.filter(e => e.status === 'Finalizado').length;
    const enRev = expedients.filter(e => e.status === 'En revisión').length;
    const sinRev = expedients.filter(e => e.status === 'Sin revisar').length;
    const pendientesVerif = expedients.filter(e => e.status === 'Pendiente de verificación').length;
    const hoy = new Date().toISOString().slice(0, 10);
    const creadosHoy = expedients.filter(e => e.createdAt === hoy).length;

    // Tiempo promedio de digitalización (días entre createdAt y updatedAt)
    const tiempos = expedients
      .map(e => {
        const c = new Date(e.createdAt + 'T00:00:00').getTime();
        const u = new Date(e.updatedAt + 'T00:00:00').getTime();
        return Math.max(0, (u - c) / (1000 * 60 * 60 * 24));
      });
    const tiempoPromedio = tiempos.length
      ? Math.round((tiempos.reduce((s, t) => s + t, 0) / tiempos.length) * 10) / 10
      : 0;

    return [
      { label: 'Total de empleados',              value: totalEmpleados.toLocaleString(),     icon: Users,        accent: 'blue',   hint: 'Plantilla activa' },
      { label: 'Total de expedientes',             value: totalExps.toLocaleString(),          icon: FolderOpen,   accent: 'blue',   hint: 'Registros médicos' },
      { label: 'Expedientes finalizados',          value: finalizados.toLocaleString(),        icon: CheckCircle2, accent: 'green',  hint: 'Completados' },
      { label: 'Expedientes en revisión',          value: enRev.toLocaleString(),              icon: Clock,        accent: 'amber',  hint: 'En proceso' },
      { label: 'Expedientes sin revisar',          value: sinRev.toLocaleString(),             icon: Inbox,        accent: 'slate',  hint: 'Sin iniciar' },
      { label: 'Pendientes de verificación',       value: pendientesVerif.toLocaleString(),    icon: AlertCircle,  accent: 'orange', hint: 'Requieren atención' },
      { label: 'Tiempo prom. de digitalización',   value: `${tiempoPromedio} d`,              icon: Timer,        accent: 'slate',  hint: 'Días de ciclo' },
      { label: 'Expedientes creados hoy',          value: creadosHoy.toLocaleString(),         icon: CalendarPlus, accent: 'blue',   hint: 'Nuevos hoy' },
    ];
  }, []);

  const recentEmployees = [...allItems]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(item => plantaEmployees.find(e => e.id === item.employeeId))
    .filter((emp): emp is typeof employees[0] => Boolean(emp))
    .filter((emp, idx, arr) => arr.findIndex(e => e.id === emp.id) === idx)
    .slice(0, 10);

  // Actividad reciente — merges live audit-log entries with derived activity from data.
  const recentActivity = useMemo(() => {
    type ActItem = {
      ts: number;
      icon: typeof FileText;
      iconBg: string;
      iconText: string;
      text: string;
      sub?: string;
      onClick?: () => void;
    };

    const items: ActItem[] = [];

    // 1. Live audit-log entries from the current session
    const live = getAllBitacora();
    for (const e of live) {
      const ts = new Date(`${e.date}T${e.time}`).getTime();
      const exp = expedients.find(x => x.id === e.expedientId);
      const emp = exp ? employees.find(em => em.id === exp.employeeId) : undefined;
      let icon = FileText;
      let iconBg = 'bg-red-50';
      let iconText = 'text-[hsl(355,78%,51%)]';
      if (e.action.includes('Finali')) { icon = CheckCircle2; iconBg = 'bg-green-50'; iconText = 'text-green-600'; }
      else if (e.action.includes('document') || e.action.includes('Carga')) { icon = FileText; iconBg = 'bg-amber-50'; iconText = 'text-amber-600'; }
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

    // 2. Derived activity from data (creations, finalizations, document uploads)
    const empName = (id: string) => {
      const em = employees.find(x => x.id === id);
      return em ? `${em.firstName} ${em.lastName1}` : undefined;
    };

    for (const e of expedients) {
      const created = new Date(e.createdAt + 'T12:00:00').getTime();
      items.push({
        ts: created,
        icon: FolderOpen,
        iconBg: 'bg-red-50',
        iconText: 'text-[hsl(355,78%,51%)]',
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

    for (const d of documents) {
      items.push({
        ts: new Date(d.uploadDate + 'T12:00:00').getTime(),
        icon: FileText,
        iconBg: 'bg-amber-50',
        iconText: 'text-amber-600',
        text: 'Se cargó un documento',
        sub: d.name,
        onClick: () => onNavigate('documents'),
      });
    }

    // Dedupe by text+sub+ts, sort newest-first, take 10
    const seen = new Set<string>();
    return items
      .sort((a, b) => b.ts - a.ts)
      .filter(i => {
        const key = `${i.ts}|${i.text}|${i.sub ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);
  }, [onNavigate]);

  const bitacoraItems = useMemo(() => {
    return getAllBitacora().slice(0, 12).map(e => {
      const exp = expedients.find(x => x.id === e.expedientId);
      const emp = exp ? employees.find(em => em.id === exp.employeeId) : undefined;
      return {
        ...e,
        employeeName: emp ? `${emp.firstName} ${emp.lastName1}` : undefined,
        onClick: exp ? () => onNavigate('employee-profile', exp.employeeId, undefined, exp.year) : undefined,
      };
    });
  }, [onNavigate]);

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

  return (
    <div className="space-y-8">
      {/* Greeting + Resumen button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {greeting()}, {roleHonorific(user.role)} {user.username}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Bienvenido al sistema de gestión de expedientes médicos</p>
          <p className="text-xs text-slate-300 mt-0.5 capitalize">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setSummaryOpen(true)}
          className="flex items-center gap-2 px-4 h-9 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transition-all flex-shrink-0"
        >
          <BarChart3 size={16} />
          Resumen
        </button>
      </div>

      {/* Resumen Ejecutivo — panel lateral derecho */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={() => setSummaryOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <BarChart3 size={18} className="text-[hsl(355,78%,51%)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Resumen</h3>
                  <p className="text-xs text-slate-400">Indicadores clave del sistema</p>
                </div>
              </div>
              <button
                onClick={() => setSummaryOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                {executiveSummary.map(({ label, value, icon: Icon, accent, hint }) => {
                  const a = accentMap[accent];
                  return (
                    <div key={label} className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-colors">
                      <div className={`w-9 h-9 ${a.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                        <Icon size={16} className={a.iconText} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1 leading-snug">{label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Avance de digitalización — gráfica + indicadores unificados */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-title">Avance de digitalización</p>
            <p className="section-subtitle">Resumen visual del estado de los expedientes</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Lado izquierdo: gráfica de avance */}
          <div className="space-y-5">
            {[
              { label: 'Finalizados',  value: finalizado,  pct: totalExpedients ? (finalizado / totalExpedients) * 100 : 0, bar: 'bg-green-500',  track: 'bg-green-50',  status: 'Finalizado' },
              { label: 'Pendiente',    value: pendiente,   pct: totalExpedients ? (pendiente / totalExpedients) * 100 : 0, bar: 'bg-orange-500', track: 'bg-orange-50', status: 'Pendiente de verificación' },
              { label: 'En revisión',  value: enRevision,   pct: totalExpedients ? (enRevision / totalExpedients) * 100 : 0, bar: 'bg-amber-500',  track: 'bg-amber-50',  status: 'En revisión' },
              { label: 'Sin revisar',  value: sinRevisar,   pct: totalExpedients ? (sinRevisar / totalExpedients) * 100 : 0, bar: 'bg-slate-400',  track: 'bg-slate-100', status: 'Sin revisar' },
            ].map(item => (
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

          {/* Lado derecho: indicadores numéricos */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total de expedientes', value: totalExpedients, icon: FolderOpen,   accent: 'blue',   status: undefined as string | undefined },
              { label: 'Finalizados',          value: finalizado,      icon: CheckCircle2, accent: 'green',  status: 'Finalizado' },
              { label: 'En revisión',          value: enRevision,      icon: Clock,        accent: 'amber',  status: 'En revisión' },
              { label: 'Pendientes de verificación', value: pendiente, icon: AlertCircle,  accent: 'orange', status: 'Pendiente de verificación' },
            ].map(({ label, value, icon: Icon, accent, status }) => {
              const a = accentMap[accent];
              return (
                <button
                  key={label}
                  onClick={() => onNavigate('expedients', undefined, undefined, undefined, status ? { status } : undefined)}
                  className="text-left rounded-xl border border-slate-100 p-4 bg-slate-50/40 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer w-full"
                >
                  <div className={`w-9 h-9 ${a.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon size={16} className={a.iconText} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{value.toLocaleString()}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 leading-snug">{label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[hsl(355,78%,51%)]" />
            <div>
              <p className="section-title">Actividad reciente</p>
              <p className="section-subtitle">Últimas acciones del sistema</p>
            </div>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <EmptyState icon={Activity} title="Sin actividad reciente" description="Aún no se han registrado acciones en el sistema." />
        ) : (
          <>
            <div className="px-6 py-2">
              {recentActivity.slice(0, 5).map((act, idx) => {
                const isLast = idx === 4;
                return (
                  <div key={idx} className="flex gap-3.5 py-3.5">
                    <div className="relative flex flex-col items-center flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full ${act.iconBg} flex items-center justify-center z-10`}>
                        <act.icon size={15} className={act.iconText} />
                      </div>
                      {!isLast && <div className="absolute top-8 bottom-0 w-px bg-slate-100" />}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 pb-1">
                      <p className="text-sm font-semibold text-gray-800">{act.text}</p>
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
            <div className="px-6 py-3 border-t border-slate-100">
              <button
                onClick={() => toast.info('La vista completa de actividad estará disponible próximamente.')}
                className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 transition-colors cursor-not-allowed"
                title="Módulo no disponible"
              >
                Ver toda la actividad <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 4. Recent employees table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="section-title">Empleados recientes</p>
            <p className="section-subtitle">Última actividad en expedientes</p>
          </div>
          <button
            onClick={() => onNavigate('employees')}
            className="text-sm text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1.5 transition-colors"
          >
            Ver todos <ArrowRight size={14} />
          </button>
        </div>

        <EmployeeTable
          items={recentEmployees}
          onNavigate={onNavigate}
          canCreateExpedient={true}
          emptyState={
            <EmptyState icon={User} title="Sin actividad reciente" description="Aún no hay expedientes registrados." compact />
          }
        />
      </div>

      {/* Bitácora */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
            <FileClock size={16} className="text-[hsl(355,78%,51%)]" />
          </div>
          <div>
            <p className="section-title">Bitácora</p>
            <p className="section-subtitle">Historial de acciones importantes</p>
          </div>
        </div>

        {bitacoraItems.length === 0 ? (
          <EmptyState icon={FileClock} title="Sin registros en la bitácora" description="Aquí aparecerán las acciones importantes realizadas en el sistema (creación, edición, finalización de expedientes, etc.)." />
        ) : (
          <div className="px-6 py-2">
            {bitacoraItems.slice(0, 8).map((e, idx) => {
              const isLast = idx === 7;
              return (
                <div key={e.id} className="flex gap-3.5 py-3.5">
                  <div className="relative flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-red-400 flex items-center justify-center z-10">
                      <FileClock size={14} className="text-[hsl(355,78%,51%)]" />
                    </div>
                    {!isLast && <div className="absolute top-8 bottom-0 w-px bg-slate-100" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5 pb-1">
                    <p className="text-sm font-semibold text-gray-800">{e.action}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <User size={11} className="text-slate-400" />
                      <p className="text-xs text-slate-500">{e.user}</p>
                      {e.employeeName && <p className="text-xs text-slate-400">· {e.employeeName}</p>}
                    </div>
                    {e.detail && e.detail !== e.action && (
                      <p className="text-xs text-slate-500 mt-1">{e.detail}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{e.relativeTime ?? `${e.date} · ${e.time}`}</p>
                  </div>
                  {e.onClick && (
                    <button
                      onClick={e.onClick}
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
  );
}
