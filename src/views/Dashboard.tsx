import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Activity,
  Inbox,
  Users,
  FileText,
  Settings,
  UserPlus,
  ScrollText,
  ShieldCheck,
  FolderOpen,
  CircleCheck,
  CalendarClock,
  Stethoscope,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { NavigationPage, AuthUser, Planta, ExpedientListFilter, MedicalRecordType } from '../types';
import { EmptyState } from '../components/ui/empty-state';
import { EmployeeTable, sortEmployees } from '../components/employee/EmployeeTable';
import { getAllBitacora } from '../lib/auditLog';
import { getEmployees, getExpedients } from '../lib/store';
import { useEmployees, useExpedients, useDocuments } from '../hooks/useStore';
import { can } from '../lib/permissions';
import { SystemStatusDrawer } from '../components/dashboard/SystemStatusDrawer';
import { MedicalIndicators } from '../components/dashboard/MedicalIndicators';
import { simulateExtraction } from '../lib/extractionSimulation';

interface DashboardProps {
  user: AuthUser;
  planta: Planta;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number, filter?: ExpedientListFilter) => void;
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  'Periódico': 'Examen periódico',
  'Ingreso': 'Examen de ingreso',
  'Antidoping': 'Prueba antidoping',
  'Consulta médica': 'Consulta médica',
  'Control crónico degenerativo': 'Control crónico',
  'Control prenatal': 'Control prenatal',
  'Primeros auxilios': 'Primeros auxilios',
  'Nota médica': 'Nota médica',
  'Incapacidad': 'Incapacidad',
};

export default function Dashboard({ user, planta, onNavigate }: DashboardProps) {
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
  const plantaEmployees = useEmployees(planta);
  const allExpedients = useExpedients(planta);
  const allDocuments = useDocuments(planta);

  const total = allExpedients.length;
  const sinRevisar = allExpedients.filter(e => e.status === 'Sin revisar').length;
  const enRevision = allExpedients.filter(e => e.status === 'En revisión').length;
  const finalizado = allExpedients.filter(e => e.status === 'Finalizado').length;

  const todayISO = new Date().toISOString().slice(0, 10);
  const isWithinNextDays = (dateStr: string, days: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T12:00:00');
    const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= days;
  };

  const examenesHoy = allExpedients.filter(e => e.date === todayISO).length;
  const examenesSemana = allExpedients.filter(e => isWithinNextDays(e.date, 7) && e.date !== todayISO).length;

  const recordTypeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of allExpedients) {
      const label = RECORD_TYPE_LABELS[e.recordType] ?? e.recordType;
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [allExpedients]);

  const departmentDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const emp of plantaEmployees) {
      counts[emp.department] = (counts[emp.department] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [plantaEmployees]);

  const recentActivity = useMemo(() => {
    type ActItem = {
      ts: number;
      icon: LucideIcon;
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
      let icon: LucideIcon = FolderOpen;
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

  const aiConfidence = useMemo(() => {
    const sampleTypes: MedicalRecordType[] = [
      'Examen médico de ingreso',
      'Hoja de consulta',
      'Prueba de antidoping',
      'Hoja de incapacidad',
    ];
    let sum = 0;
    let count = 0;
    for (const rt of sampleTypes) {
      for (const f of simulateExtraction(rt)) {
        sum += f.confidence;
        count++;
      }
    }
    return count > 0 ? Math.round((sum / count) * 100) : 0;
  }, []);

  const tiempoPromedio = useMemo(() => {
    const tiempos = allExpedients.map(e => {
      const c = new Date(e.createdAt + 'T00:00:00').getTime();
      const u = new Date(e.updatedAt + 'T00:00:00').getTime();
      return Math.max(0, (u - c) / (1000 * 60 * 60 * 24));
    });
    return tiempos.length
      ? `${Math.round((tiempos.reduce((s, t) => s + t, 0) / tiempos.length) * 10) / 10} d`
      : '0 d';
  }, [allExpedients]);

  const digitalizadosHoy = allDocuments.filter(d => d.uploadDate === todayISO).length;

  const systemStatusData = {
    totalExpedients: total,
    digitalizadosHoy,
    documentosProcesados: allDocuments.length,
    aiConfidence,
    tiempoPromedio,
    finalizados: finalizado,
    enRevision,
    sinRevisar,
  };

  const quickAccess: { label: string; icon: LucideIcon; page: NavigationPage; show: boolean }[] = [
    { label: 'Empleados',      icon: Users,       page: 'employees',     show: can(user.role, 'view_employees') },
    { label: 'Expedientes',    icon: FileText,    page: 'expedients',    show: can(user.role, 'view_expedients') },
    { label: 'Nuevo empleado', icon: UserPlus,    page: 'new-employee',  show: can(user.role, 'create_employee') },
    { label: 'Bitácora',       icon: ScrollText,  page: 'bitacora',      show: can(user.role, 'view_bitacora') },
    { label: 'Configuración',  icon: Settings,    page: 'configuracion', show: can(user.role, 'configure_system') },
  ];

  const recordTypeColors = ['bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500', 'bg-slate-400'];
  const deptColors = ['bg-blue-400', 'bg-teal-400', 'bg-amber-400', 'bg-orange-400', 'bg-rose-400'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {greeting()}, {roleHonorific(user.role)} {user.username}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestión médica ocupacional · Planta {planta}
          </p>
          <p className="text-xs text-slate-300 mt-0.5 capitalize">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setSystemStatusOpen(true)}
          className="flex items-center gap-2 px-4 h-9 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex-shrink-0"
        >
          <ShieldCheck size={15} />
          <span className="hidden sm:inline">Estado del Sistema</span>
          <span className="sm:hidden">Sistema</span>
        </button>
      </div>

      {/* 1. Accesos rápidos */}
      <div className="card p-6">
        <p className="section-title">Accesos rápidos</p>
        <p className="section-subtitle mb-5">Navegación directa</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* 2. Empleados recientes */}
      <div className="card overflow-hidden">
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="section-title">Empleados recientes</p>
            <p className="section-subtitle">Registros con actividad reciente</p>
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

      {/* 3. Reportes e indicadores */}
      <div className="space-y-6">
        {/* New medical charts */}
        <MedicalIndicators expedients={allExpedients} employees={plantaEmployees} />

        {/* Existing distributions + alerts (preserved) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Record type distribution */}
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <p className="section-title">Distribución por tipo de estudio</p>
              <span className="text-xs font-semibold text-slate-400 tabular-nums">{total} total</span>
            </div>
            <p className="section-subtitle mb-5">Frecuencia de estudios médicos realizados</p>

            <div className="space-y-3.5">
              {recordTypeDist.map(([label, count], idx) => {
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-600">{label}</span>
                      <span className="text-sm font-semibold text-slate-400 tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${recordTypeColors[idx % recordTypeColors.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {recordTypeDist.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">Sin datos disponibles</p>
              )}
            </div>
          </div>

          {/* Exam alerts + department */}
          <div className="space-y-6">
            {/* Exam due alerts */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-1">
                <CalendarClock size={16} className="text-orange-500" />
                <p className="section-title">Exámenes próximos</p>
              </div>
              <p className="section-subtitle mb-4">Vencimientos de estudios médicos</p>

              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('employees', undefined, undefined, undefined, { examDue: 'today' })}
                  className="w-full flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3.5 hover:bg-orange-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                      <CalendarClock size={16} className="text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-orange-900">Vencen hoy</p>
                      <p className="text-xs text-orange-600 mt-0.5">Requieren atención inmediata</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-orange-700 tabular-nums">{examenesHoy}</span>
                </button>

                <button
                  onClick={() => onNavigate('employees', undefined, undefined, undefined, { examDue: 'week' })}
                  className="w-full flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3.5 hover:bg-amber-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-amber-900">Esta semana</p>
                      <p className="text-xs text-amber-600 mt-0.5">Programar revisión</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-amber-700 tabular-nums">{examenesSemana}</span>
                </button>
              </div>
            </div>

            {/* Department distribution */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope size={16} className="text-teal-500" />
                <p className="section-title">Por departamento</p>
              </div>
              <p className="section-subtitle mb-4">Empleados monitoreados por área</p>

              <div className="space-y-3">
                {departmentDist.map(([label, count], idx) => {
                  const pct = plantaEmployees.length > 0 ? (count / plantaEmployees.length) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 truncate">{label}</span>
                        <span className="text-xs font-semibold text-slate-400 tabular-nums">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${deptColors[idx % deptColors.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {departmentDist.length === 0 && (
                  <p className="text-sm text-slate-400 py-2 text-center">Sin datos disponibles</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Actividad reciente */}
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

      <SystemStatusDrawer
        open={systemStatusOpen}
        onClose={() => setSystemStatusOpen(false)}
        data={systemStatusData}
      />
    </div>
  );
}
