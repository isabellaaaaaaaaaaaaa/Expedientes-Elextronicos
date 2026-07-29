import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ChartPie as PieChartIcon, ChartBar as BarChart3, Activity, FileStack, Stethoscope } from 'lucide-react';
import type { Expedient, Employee } from '../../types';

interface MedicalIndicatorsProps {
  expedients: Expedient[];
  employees: Employee[];
}

const COLORS = {
  blue:   '#3b82f6',
  teal:   '#14b8a6',
  amber:  '#f59e0b',
  orange: '#f97316',
  rose:   '#f43f5e',
  green:  '#22c55e',
  slate:  '#64748b',
  cyan:   '#06b6d4',
};

const PALETTE = [COLORS.blue, COLORS.teal, COLORS.amber, COLORS.orange, COLORS.rose, COLORS.green, COLORS.slate, COLORS.cyan];

const CATEGORY_MAP: Record<string, string> = {
  'Examen médico de ingreso': 'Exámenes de ingreso',
  'Examen médico periódico': 'Exámenes periódicos',
  'Examen médico de promoción': 'Exámenes periódicos',
  'Examen médico de reingreso': 'Exámenes de ingreso',
  'Examen médico de retiro': 'Exámenes de retiro',
  'Ingreso': 'Exámenes de ingreso',
  'Periódico': 'Exámenes periódicos',
  'Hoja de consulta': 'Consultas',
  'Consulta médica': 'Consultas',
  'Nota médica': 'Consultas',
  'Control crónico degenerativo': 'Consultas',
  'Control prenatal': 'Control prenatal',
  'Carnet de control prenatal': 'Control prenatal',
  'Hoja de incapacidad': 'Incapacidades',
  'Incapacidad': 'Incapacidades',
  'Valoración post incapacidad': 'Incapacidades',
  'Reporte de primeros auxilios': 'Primeros auxilios',
  'Primeros auxilios': 'Primeros auxilios',
  'Informe de investigación de primeros auxilios del supervisor': 'Primeros auxilios',
  'Prueba de antidoping': 'Antidoping',
  'Antidoping': 'Antidoping',
  'Monitoreo de salud': 'Monitoreo de salud',
  'Declaración de consentimiento bajo información': 'Otros',
  'Listado de verificación del expediente médico': 'Otros',
  'Memorándum de notificación de embarazo': 'Control prenatal',
  'Alcoholimetría': 'Antidoping',
  'Laboratorio': 'Estudios',
  'Radiografía': 'Estudios',
  'Otro': 'Otros',
};

const CONSULTA_TYPES = new Set<string>([
  'Hoja de consulta',
  'Consulta médica',
  'Nota médica',
  'Control crónico degenerativo',
  'Control prenatal',
  'Monitoreo de salud',
]);

const CONSULTA_LABELS: Record<string, string> = {
  'Hoja de consulta': 'Consulta general',
  'Consulta médica': 'Consulta médica',
  'Nota médica': 'Nota médica',
  'Control crónico degenerativo': 'Control crónico degenerativo',
  'Control prenatal': 'Control prenatal',
  'Monitoreo de salud': 'Monitoreo de salud',
};

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  padding: '8px 12px',
  color: '#334155',
};

const axisStyle = { fontSize: 11, fill: '#94a3b8' };

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getLast7Days(): { label: string; key: string }[] {
  const days: { label: string; key: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      label: `${DAY_LABELS[d.getDay()]} ${d.getDate()}`,
      key: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

function getLast6Weeks(): { label: string; start: number; end: number }[] {
  const weeks: { label: string; start: number; end: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 5; i >= 0; i--) {
    const end = new Date(today);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    weeks.push({
      label: i === 0 ? 'Actual' : `Hace ${i} sem`,
      start: start.getTime(),
      end: end.getTime(),
    });
  }
  return weeks;
}

function getLast8Months(): { label: string; key: string }[] {
  const months: { label: string; key: string }[] = [];
  const today = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      label: `${MONTH_LABELS[d.getMonth()]}`,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return months;
}

function dateToMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function dateToTime(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getTime();
}

export function MedicalIndicators({ expedients, employees }: MedicalIndicatorsProps) {
  const consultas = useMemo(
    () => expedients.filter(e => CONSULTA_TYPES.has(e.recordType)),
    [expedients],
  );

  const consultasPorDia = useMemo(() => {
    const days = getLast7Days();
    return days.map(({ label, key }) => ({
      label,
      consultas: consultas.filter(c => c.date === key).length,
    }));
  }, [consultas]);

  const consultasPorSemana = useMemo(() => {
    const weeks = getLast6Weeks();
    return weeks.map(({ label, start, end }) => ({
      label,
      consultas: consultas.filter(c => {
        const t = dateToTime(c.date);
        return t >= start && t <= end + 86400000;
      }).length,
    }));
  }, [consultas]);

  const tendenciaMensual = useMemo(() => {
    const months = getLast8Months();
    return months.map(({ label, key }) => ({
      label,
      consultas: consultas.filter(c => dateToMonthKey(c.date) === key).length,
    }));
  }, [consultas]);

  const expedientesPorMes = useMemo(() => {
    const months = getLast8Months();
    return months.map(({ label, key }) => ({
      label,
      expedientes: expedients.filter(e => dateToMonthKey(e.createdAt) === key).length,
    }));
  }, [expedients]);

  const distribucionTipos = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of expedients) {
      const cat = CATEGORY_MAP[e.recordType] ?? 'Otros';
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [expedients]);

  const motivosConsulta = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of consultas) {
      const label = CONSULTA_LABELS[c.recordType] ?? c.recordType;
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [consultas]);

  const consultasPorDepartamento = useMemo(() => {
    const empDept = new Map(employees.map(e => [e.id, e.department]));
    const counts: Record<string, number> = {};
    for (const c of consultas) {
      const dept = empDept.get(c.employeeId) ?? 'Sin departamento';
      counts[dept] = (counts[dept] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [consultas, employees]);

  const isEmpty = (data: { value?: number; consultas?: number; expedientes?: number }[]) =>
    data.every(d => (d.value ?? d.consultas ?? d.expedientes ?? 0) === 0);

  const NoData = () => (
    <div className="flex items-center justify-center h-[180px] text-sm text-slate-300">
      Sin datos disponibles
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Row 1: Monthly trend (line) + Type distribution (donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tendencia mensual de consultas */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-blue-500" />
            <p className="section-title">Tendencia mensual de consultas</p>
          </div>
          <p className="section-subtitle mb-4">Evolución de consultas médicas en los últimos 8 meses</p>
          {isEmpty(tendenciaMensual) ? <NoData /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tendenciaMensual} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="consultas"
                  name="Consultas"
                  stroke={COLORS.blue}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS.blue, r: 4 }}
                  activeDot={{ r: 6, fill: COLORS.blue }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución de tipos de atención (donut) */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <PieChartIcon size={16} className="text-teal-500" />
            <p className="section-title">Tipos de atención</p>
          </div>
          <p className="section-subtitle mb-4">Distribución de servicios médicos</p>
          {distribucionTipos.length === 0 ? <NoData /> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={distribucionTipos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {distribucionTipos.map((_, idx) => (
                      <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center">
                {distribucionTipos.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                    <span className="text-[11px] font-semibold text-slate-600">{item.name}</span>
                    <span className="text-[11px] font-bold text-slate-400 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Consultas por día (bar) + Consultas por semana (bar) + Expedientes por mes (area) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultas por día */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-amber-500" />
            <p className="section-title">Consultas por día</p>
          </div>
          <p className="section-subtitle mb-4">Últimos 7 días</p>
          {isEmpty(consultasPorDia) ? <NoData /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={consultasPorDia} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="consultas" name="Consultas" fill={COLORS.amber} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Consultas por semana */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-orange-500" />
            <p className="section-title">Consultas por semana</p>
          </div>
          <p className="section-subtitle mb-4">Últimas 6 semanas</p>
          {isEmpty(consultasPorSemana) ? <NoData /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={consultasPorSemana} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="consultas" name="Consultas" fill={COLORS.orange} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expedientes creados por mes (area) */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <FileStack size={16} className="text-blue-500" />
            <p className="section-title">Expedientes por mes</p>
          </div>
          <p className="section-subtitle mb-4">Creación de registros mensual</p>
          {isEmpty(expedientesPorMes) ? <NoData /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={expedientesPorMes} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-expedientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="expedientes"
                  name="Expedientes"
                  stroke={COLORS.blue}
                  strokeWidth={2.5}
                  fill="url(#grad-expedientes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Motivos de consulta (horizontal bar) + Consultas por departamento (pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Motivos de consulta más frecuentes */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-rose-500" />
            <p className="section-title">Motivos de consulta más frecuentes</p>
          </div>
          <p className="section-subtitle mb-4">Principales razones de atención médica</p>
          {motivosConsulta.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={motivosConsulta}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ ...axisStyle, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Consultas" fill={COLORS.rose} radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Consultas por departamento (pie) */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope size={16} className="text-teal-500" />
            <p className="section-title">Consultas por departamento</p>
          </div>
          <p className="section-subtitle mb-4">Atenciones médicas por área</p>
          {consultasPorDepartamento.length === 0 ? <NoData /> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={consultasPorDepartamento}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {consultasPorDepartamento.map((_, idx) => (
                      <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center">
                {consultasPorDepartamento.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                    <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[100px]">{item.name}</span>
                    <span className="text-[11px] font-bold text-slate-400 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
