import { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, BarChart3, CalendarClock, Stethoscope } from 'lucide-react';
import type { Expedient, Employee } from '../../types';

interface MedicalIndicatorsProps {
  expedients: Expedient[];
  employees: Employee[];
}

const COLORS = {
  blue: '#3b82f6',
  teal: '#14b8a6',
  amber: '#f59e0b',
  orange: '#f97316',
  rose: '#f43f5e',
  green: '#22c55e',
  slate: '#64748b',
  cyan: '#06b6d4',
};

const PALETTE = [COLORS.blue, COLORS.teal, COLORS.amber, COLORS.orange, COLORS.rose, COLORS.green, COLORS.slate, COLORS.cyan];

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
  'Control crónico degenerativo': 'Control crónico',
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

function isSameDay(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  return d.getFullYear() === ref.getFullYear()
    && d.getMonth() === ref.getMonth()
    && d.getDate() === ref.getDate();
}

function isWithinRange(dateStr: string, start: Date, end: Date): boolean {
  const t = new Date(dateStr + 'T12:00:00').getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function isWithinNextDays(dateStr: string, days: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T12:00:00');
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

const NoData = () => (
  <div className="flex items-center justify-center h-[200px] text-sm text-slate-300">
    Sin datos disponibles
  </div>
);

export function MedicalIndicators({ expedients, employees }: MedicalIndicatorsProps) {
  const consultas = useMemo(
    () => expedients.filter(e => CONSULTA_TYPES.has(e.recordType)),
    [expedients],
  );

  // 1. Consultas realizadas: hoy, semana, mes
  const consultasResumen = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return [
      { label: 'Hoy',        value: consultas.filter(c => isSameDay(c.date, now)).length },
      { label: 'Esta semana', value: consultas.filter(c => isWithinRange(c.date, startOfWeek, now)).length },
      { label: 'Este mes',    value: consultas.filter(c => isWithinRange(c.date, startOfMonth, now)).length },
    ];
  }, [consultas]);

  // 2. Motivos de consulta más frecuentes
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

  // 3. Exámenes próximos a vencer por rango (30, 60, 90 días)
  const examenesVencer = useMemo(() => {
    const examenes = expedients.filter(e =>
      e.recordType === 'Periódico' || e.recordType === 'Examen médico periódico'
    );
    return [
      { label: '30 días', value: examenes.filter(e => isWithinNextDays(e.date, 30)).length },
      { label: '60 días', value: examenes.filter(e => isWithinNextDays(e.date, 60)).length },
      { label: '90 días', value: examenes.filter(e => isWithinNextDays(e.date, 90)).length },
    ];
  }, [expedients]);

  // 4. Empleados monitoreados por departamento
  const empleadosPorDepartamento = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const emp of employees) {
      counts[emp.department] = (counts[emp.department] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, value]) => ({ name, value }));
  }, [employees]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Consultas realizadas */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={16} className="text-blue-500" />
          <p className="section-title">Consultas realizadas</p>
        </div>
        <p className="section-subtitle mb-4">Atenciones médicas por periodo</p>
        {consultasResumen.every(d => d.value === 0) ? <NoData /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={consultasResumen} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Consultas" fill={COLORS.blue} radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 2. Motivos de consulta más frecuentes */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={16} className="text-rose-500" />
          <p className="section-title">Motivos de consulta más frecuentes</p>
        </div>
        <p className="section-subtitle mb-4">Principales causas de atención médica</p>
        {motivosConsulta.length === 0 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={220}>
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
                width={120}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Consultas" fill={COLORS.rose} radius={[0, 4, 4, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 3. Exámenes próximos a vencer */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarClock size={16} className="text-orange-500" />
          <p className="section-title">Exámenes próximos a vencer</p>
        </div>
        <p className="section-subtitle mb-4">Estudios médicos por rango de vencimiento</p>
        {examenesVencer.every(d => d.value === 0) ? <NoData /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={examenesVencer} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Exámenes" fill={COLORS.orange} radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 4. Empleados monitoreados por área */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Stethoscope size={16} className="text-teal-500" />
          <p className="section-title">Empleados monitoreados por área</p>
        </div>
        <p className="section-subtitle mb-4">Distribución por departamento</p>
        {empleadosPorDepartamento.length === 0 ? <NoData /> : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={empleadosPorDepartamento}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {empleadosPorDepartamento.map((_, idx) => (
                    <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center">
              {empleadosPorDepartamento.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                  <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[110px]">{item.name}</span>
                  <span className="text-[11px] font-bold text-slate-400 tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


export { MedicalIndicators }