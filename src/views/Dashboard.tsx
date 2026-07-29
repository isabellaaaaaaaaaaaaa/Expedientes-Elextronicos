import { useMemo } from 'react';
import {
  FolderOpen,
  CircleAlert,
  Clock,
  CircleCheck,
  ArrowRight,
  Activity,
  Inbox,
  Users,
  FileText,
  Settings,
  UserPlus,
  FileUp,
  ScrollText,
} from 'lucide-react';
import type { NavigationPage, AuthUser, Planta, ExpedientListFilter, ExpedientStatus } from '../types';
import { EmptyState } from '../components/ui/empty-state';
import { EmployeeTable, sortEmployees } from '../components/employee/EmployeeTable';
import { getAllBitacora } from '../lib/auditLog';
import { getEmployees, getExpedients } from '../lib/store';
import { useEmployees, useExpedients } from '../hooks/useStore';
import { can } from '../lib/permissions';
import { statusConfig } from '../lib/statusConfig';

interface DashboardProps {
  user: AuthUser;
  planta: Planta;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number, filter?: ExpedientListFilter) => void;
}

interface StatCard {
  label: string;
  value: number;
  icon: typeof FolderOpen;
  iconBg: string;
  iconText: string;
  filter?: ExpedientListFilter;
}

export default function Dashboard({ user, planta, onNavigate }: DashboardProps) {
  const plantaEmployees = useEmployees(planta);
  const allExpedients = useExpedients(planta);

  const total = allExpedients.length;
  const sinRevisar = allExpedients.filter(e => e.status === 'Sin revisar').length;
  const enRevision = allExpedients.filter(e => e.status === 'En revisión').length;
  const finalizado = allExpedients.filter(e => e.status === 'Finalizado').length;

  const stats: StatCard[] = [
    { label: 'Total de expedientes', value: total,      icon: FolderOpen,  iconBg: 'bg-blue-50',   iconText: 'text-blue-600',   filter: undefined },
    { label: 'Sin revisar',         value: sinRevisar,  icon: CircleAlert,  iconBg: 'bg-slate-100', iconText: 'text-slate-500',  filter: { status: 'Sin revisar' } },
    { label: 'En revisión',          value: enRevision, icon: Clock,        iconBg: 'bg-amber-50',  iconText: 'text-amber-600',  filter: { status: 'En revisión' } },
    { label: 'Finalizados',         value: finalizado, icon: CircleCheck,  iconBg: 'bg-green-50',  iconText: 'text-green-600',  filter: { status: 'Finalizado' } },
  ];

  const progressPct = total > 0 ? Math.round((finalizado / total) * 100) : 0;

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
      if (e.action.includes('Finali')) { icon = CircleCheck; iconBg = 'bg-green-50'; iconText = 'text-green-600'; }
      else if (e.action.includes('document') || e.action.includes('Carga')) { icon = FileText; iconBg = 'bg-amber-50'; iconText = 'text-amber-600'; }
      else if (e.action.includes('estado')) { icon = Clock; iconBg = 'bg-amber-50'; iconText = 'text-amber-600'; }
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
            icon: CircleCheck,
            iconBg: 'bg-green-50',
            iconText: 'text-green-600',
            text: 'Se finalizó un expediente',
            sub: empName(e.employeeId),
            onClick: () => onNavigate('employee-profile', e.employeeId, undefined, e.year),
          });
        }
      }
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
  }, [onNavigate, allExpedients]);

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

  const sortedEmployees = useMemo(() => {
    const items = plantaEmployees.slice(0, 5);
    return sortEmployees(items, 'lastRecord', 'desc');
  }, [plantaEmployees]);

  const quickAccess: { label: string; icon: typeof FolderOpen; page: NavigationPage; show: boolean }[] = [
    { label: 'Empleados',        icon: Users,     page: 'employees',         show: can(user.role, 'view_employees') },
    { label: 'Expedientes',      icon: FileText,  page: 'expedients',         show: can(user.role, 'view_expedients') },
    { label: 'Nuevo empleado',   icon: UserPlus,  page: 'new-employee',       show: can(user.role, 'create_employee') },
    { label: 'Digitalizar',      icon: FileUp,    page: 'expedients',         show: can(user.role, 'digitalize_documents') },
    { label: 'Bitácora',         icon: ScrollText, page: 'bitacora',          show: can(user.role, 'view_bitacora') },
    { label: 'Configuración',    icon: Settings,  page: 'configuracion',     show: can(user.role, 'configure_system') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {greeting()}, {roleHonorific(user.role)} {user.username}
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Resumen del área médica · Planta {planta}
        </p>
        <p className="text-xs text-slate-300 mt-0.5 capitalize">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Top row: progress chart (left) + stat cards (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Progress chart */}
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-1">
            <p className="section-title">Avance de expedientes</p>
            <span className="text-xs font-semibold text-slate-400 tabular-nums">{total} total</span>
          </div>
          <p className="section-subtitle mb-6">Progreso de revisión y finalización</p>

          {/* Big progress ring */}
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10"
                  className="text-green-500 transition-all duration-700"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPct / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 tabular-nums">{progressPct}%</span>
                <span className="text-xs text-slate-400 font-semibold mt-0.5">Completado</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {([
                { label: 'Finalizados',  value: finalizado, status: 'Finalizado' as ExpedientStatus },
                { label: 'En revisión',  value: enRevision,  status: 'En revisión' as ExpedientStatus },
                { label: 'Sin revisar',  value: sinRevisar,  status: 'Sin revisar' as ExpedientStatus },
              ]).map(item => {
                const cfg = statusConfig[item.status];
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <button
                    key={item.label}
                    onClick={() => onNavigate('expedients', undefined, undefined, undefined, { status: item.status })}
                    className="block w-full text-left group rounded-lg p-1 -m-1 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                        <span className={`status-dot ${cfg.dot}`} />
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-400 tabular-nums">{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${cfg.solid}`} style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {stats.map(({ label, value, icon: Icon, iconBg, iconText, filter }) => {
            const clickable = !!filter;
            return (
              <button
                key={label}
                onClick={() => filter && onNavigate('expedients', undefined, undefined, undefined, filter)}
                className={`text-left rounded-2xl border border-slate-100 bg-white p-5 transition-all ${
                  clickable ? 'hover:border-slate-300 hover:shadow-md cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={18} className={iconText} />
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">{value.toLocaleString()}</p>
                <p className="text-sm font-semibold text-slate-600 mt-1.5 leading-snug">{label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card overflow-hidden">
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-[hsl(355,78%,51%)]" />
            <div>
              <p className="section-title">Actividad reciente</p>
              <p className="section-subtitle">Últimas acciones registradas</p>
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

      {/* Employees table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="section-title">Empleados</p>
            <p className="section-subtitle">Registros recientes</p>
          </div>
          <button
            onClick={() => onNavigate('employees')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
          >
            Ver todos <ArrowRight size={12} />
          </button>
        </div>
        <EmployeeTable
          items={sortedEmployees}
          onNavigate={onNavigate}
          sortKey="lastRecord"
          sortDir="desc"
          canCreateExpedient={can(user.role, 'create_expedient')}
          emptyState={
            <EmptyState
              icon={Users}
              title="Sin empleados"
              description="No hay empleados registrados en esta planta."
              compact
            />
          }
        />
      </div>

      {/* Quick access */}
      <div className="card p-6">
        <p className="section-title">Accesos rápidos</p>
        <p className="section-subtitle mb-5">Navegación directa</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickAccess.filter(a => a.show).map(({ label, icon: Icon, page }) => (
            <button
              key={label}
              onClick={() => onNavigate(page)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                <Icon size={20} className="text-slate-500 group-hover:text-red-600 transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
