import { useState, useMemo } from 'react';
import { FolderOpen, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle, ArrowRight, User, FileText, UserPlus, FileSpreadsheet, Search, Activity, Inbox, ChartBar as BarChart3, Users, Timer, Upload, X } from 'lucide-react';
import { employees, expedients, documents } from '../data/mockData';
import type { NavigationPage, AuthUser, Planta, ExpedientListFilter, UserRole } from '../types';
import { EmployeeTable, avatarColors, getInitials } from '../components/employee/EmployeeTable';
import { EmptyState } from '../components/ui/empty-state';
import { getAllBitacora } from '../lib/auditLog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '../components/ui/sheet';

interface DashboardProps {
  user: AuthUser;
  planta: Planta;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number, filter?: ExpedientListFilter) => void;
}


export default function Dashboard({ user, planta: _planta, onNavigate }: DashboardProps) {
  void _planta;
  const [search, setSearch] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);

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
    blue:   { iconBg: 'bg-blue-50',   iconText: 'text-blue-600' },
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
    const pendientesVerif = expedients.filter(e => e.status === 'Pendiente de verificación').length;

    // Tiempo promedio de captura (días entre createdAt y updatedAt)
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
      { label: 'Total de empleados',           value: totalEmpleados.toLocaleString(),     icon: Users,             accent: 'blue',   hint: 'Plantilla activa' },
      { label: 'Total de expedientes',          value: totalExps.toLocaleString(),          icon: FolderOpen,        accent: 'blue',   hint: 'Registros médicos' },
      { label: 'Expedientes finalizados',       value: finalizados.toLocaleString(),        icon: CheckCircle2,      accent: 'green',  hint: 'Completados' },
      { label: 'Expedientes en revisión',       value: enRev.toLocaleString(),              icon: Clock,             accent: 'amber',  hint: 'En proceso' },
      { label: 'Pendientes de verificación',    value: pendientesVerif.toLocaleString(),    icon: AlertCircle,       accent: 'orange', hint: 'Requieren atención' },
      { label: 'Tiempo prom. de captura',       value: `${tiempoPromedio} d`,              icon: Timer,             accent: 'slate',  hint: 'Días de ciclo' },
    ];
  }, []);

  // Mi bandeja de trabajo — accesos rápidos del sistema
  const bandejaItems = [
    { label: 'Nuevo empleado',  icon: UserPlus,        accent: 'blue',  onClick: () => onNavigate('new-employee') },
    { label: 'Subir documentos', icon: Upload,          accent: 'blue',  onClick: () => onNavigate('documents') },
    { label: 'Exportar Excel',   icon: FileSpreadsheet, accent: 'green', onClick: () => onNavigate('employees') },
  ];

  const filtered = !search.trim() ? [] : plantaEmployees.filter(emp => {
    const q = search.toLowerCase();
    return (
      emp.employeeNumber.toLowerCase().includes(q) ||
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName1.toLowerCase().includes(q) ||
      emp.lastName2.toLowerCase().includes(q) ||
      emp.curp.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q)
    );
  });

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
      let iconBg = 'bg-blue-50';
      let iconText = 'text-blue-600';
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
            {greeting()}, {roleHonorific(user.role)} {user.username} <span className="inline-block">👋</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Bienvenido al sistema de gestión de expedientes médicos</p>
          <p className="text-xs text-slate-300 mt-0.5 capitalize">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setSummaryOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm transition-all flex-shrink-0"
        >
          <BarChart3 size={16} />
          Resumen
        </button>
      </div>

      {/* Resumen drawer */}
      <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-lg font-bold text-gray-900">Resumen</SheetTitle>
            <SheetDescription className="text-sm text-slate-400">Indicadores clave</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4">
            {executiveSummary.map(({ label, value, icon: Icon, accent, hint }) => {
              const a = accentMap[accent];
              return (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5"
                >
                  <div className={`w-10 h-10 ${a.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={18} className={a.iconText} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1.5 leading-snug">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mi bandeja de trabajo — accesos rápidos */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Inbox size={18} className="text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Mi bandeja de trabajo</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4 ml-7">Accesos rápidos del sistema</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {bandejaItems.map(({ label, icon: Icon, accent, onClick }) => {
            const a = accentMap[accent];
            return (
              <button
                key={label}
                onClick={onClick}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4 text-left hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className={`w-11 h-11 ${a.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={a.iconText} />
                </div>
                <p className="flex-1 text-sm font-bold text-gray-900">{label}</p>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </div>

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
              { label: 'Finalizados',  value: finalizado,  pct: totalExpedients ? (finalizado / totalExpedients) * 100 : 0, bar: 'bg-green-500',  track: 'bg-green-50' },
              { label: 'Pendiente',    value: pendiente,   pct: totalExpedients ? (pendiente / totalExpedients) * 100 : 0, bar: 'bg-orange-500', track: 'bg-orange-50' },
              { label: 'En revisión',  value: enRevision,   pct: totalExpedients ? (enRevision / totalExpedients) * 100 : 0, bar: 'bg-amber-500',  track: 'bg-amber-50' },
              { label: 'Sin revisar',  value: sinRevisar,   pct: totalExpedients ? (sinRevisar / totalExpedients) * 100 : 0, bar: 'bg-slate-400',  track: 'bg-slate-100' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-400 tabular-nums">{item.value} / {totalExpedients}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${item.track}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${item.bar}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Lado derecho: indicadores numéricos */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total de expedientes', value: totalExpedients, icon: FolderOpen,   accent: 'blue' },
              { label: 'Finalizados',          value: finalizado,      icon: CheckCircle2, accent: 'green' },
              { label: 'En revisión',          value: enRevision,      icon: Clock,        accent: 'amber' },
              { label: 'Pendientes de verificación', value: pendiente, icon: AlertCircle,  accent: 'orange' },
            ].map(({ label, value, icon: Icon, accent }) => {
              const a = accentMap[accent];
              return (
                <div key={label} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40">
                  <div className={`w-9 h-9 ${a.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon size={16} className={a.iconText} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{value.toLocaleString()}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 leading-snug">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
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
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-1 flex-shrink-0"
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
                onClick={() => onNavigate('configuracion')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
              >
                Ver toda la actividad <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick search */}
      <div className="card p-6">
        <p className="section-title">Búsqueda rápida</p>
        <p className="section-subtitle">Localiza un empleado por nombre, número o CURP</p>
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Número de empleado, nombre, apellido o CURP..."
            className="input-base pl-11"
          />
        </div>

        {search.trim() && filtered.length > 0 && (
          <div className="mt-4 divide-y divide-slate-50">
            {filtered.slice(0, 5).map((emp, idx) => {
              const colorClass = avatarColors[idx % avatarColors.length];
              return (
                <button
                  key={emp.id}
                  onClick={() => onNavigate('employee-profile', emp.id)}
                  className="w-full flex items-center gap-3 py-3 hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0 text-[11px] font-bold`}>
                    {getInitials(emp.firstName, emp.lastName1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{emp.firstName} {emp.lastName1}</p>
                    <p className="text-xs text-slate-400">{emp.employeeNumber} · {emp.department}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </button>
              );
            })}
          </div>
        )}

        {search.trim() && filtered.length === 0 && (
          <div className="mt-4">
            <EmptyState
              icon={Search}
              title={`Sin resultados para "${search}"`}
              description="Prueba con otro nombre, número de empleado o CURP."
              action={{ label: 'Limpiar búsqueda', icon: X, onClick: () => setSearch('') }}
              compact
            />
          </div>
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
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
          >
            Ver todos <ArrowRight size={14} />
          </button>
        </div>

        <EmployeeTable
          items={recentEmployees}
          onNavigate={onNavigate}
          canCreateExpedient={false}
          emptyState={
            <EmptyState icon={User} title="Sin actividad reciente" description="Aún no hay expedientes registrados." compact />
          }
        />
      </div>

    </div>
  );
}
