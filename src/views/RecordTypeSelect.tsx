import { useState } from 'react';
import {
  ArrowLeft, ChevronRight, Stethoscope, ClipboardList, HeartPulse,
  FlaskConical, Baby, FileText, UserPlus, RefreshCw, UserMinus,
  Activity, FilePlus2, ShieldPlus, ShieldAlert, Pill, FileSignature,
  ListChecks, Baby as BabyIcon, Mail, X, type LucideIcon,
} from 'lucide-react';
import { employees } from '../data/mockData';
import { saveDraft } from '../data/newExpedientDraft';
import type { NavigationPage, MedicalRecordType, RecordTypeCategory } from '../types';
import { EmptyState } from '../components/ui/empty-state';

interface RecordTypeSelectProps {
  employeeId: string;
  year?: number;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number) => void;
}

const categories: RecordTypeCategory[] = [
  {
    name: 'Exámenes médicos',
    types: [
      'Examen médico de ingreso',
      'Examen médico periódico',
      'Examen médico de promoción',
      'Examen médico de reingreso',
      'Examen médico de retiro',
    ],
  },
  {
    name: 'Consultas y seguimiento',
    types: [
      'Hoja de consulta',
      'Monitoreo de salud',
      'Hoja de incapacidad',
      'Valoración post incapacidad',
    ],
  },
  {
    name: 'Primeros auxilios',
    types: [
      'Reporte de primeros auxilios',
      'Informe de investigación de primeros auxilios del supervisor',
    ],
  },
  {
    name: 'Pruebas y formatos',
    types: [
      'Prueba de antidoping',
      'Declaración de consentimiento bajo información',
      'Listado de verificación del expediente médico',
    ],
  },
  {
    name: 'Salud materna',
    types: [
      'Carnet de control prenatal',
      'Memorándum de notificación de embarazo',
    ],
  },
];

const typeIcons: Record<MedicalRecordType, LucideIcon> = {
  'Examen médico de ingreso': UserPlus,
  'Examen médico periódico': Stethoscope,
  'Examen médico de promoción': Activity,
  'Examen médico de reingreso': RefreshCw,
  'Examen médico de retiro': UserMinus,
  'Hoja de consulta': ClipboardList,
  'Monitoreo de salud': HeartPulse,
  'Hoja de incapacidad': FilePlus2,
  'Valoración post incapacidad': ShieldPlus,
  'Reporte de primeros auxilios': ShieldAlert,
  'Informe de investigación de primeros auxilios del supervisor': FileText,
  'Prueba de antidoping': Pill,
  'Declaración de consentimiento bajo información': FileSignature,
  'Listado de verificación del expediente médico': ListChecks,
  'Carnet de control prenatal': Baby,
  'Memorándum de notificación de embarazo': Mail,
  // Legacy
  'Ingreso': UserPlus,
  'Periódico': Stethoscope,
  'Nota médica': FileText,
  'Primeros auxilios': ShieldAlert,
  'Alcoholimetría': Pill,
  'Laboratorio': FlaskConical,
  'Radiografía': FileText,
  'Incapacidad': FilePlus2,
  'Otro': FileText,
  'Consulta médica': ClipboardList,
  'Control crónico degenerativo': HeartPulse,
  'Control prenatal': BabyIcon,
  'Antidoping': Pill,
};

const categoryStyles: Record<string, { bg: string; fg: string; ring: string }> = {
  'Exámenes médicos':       { bg: 'bg-blue-50',    fg: 'text-blue-600',    ring: 'hover:border-blue-300 hover:bg-blue-50' },
  'Consultas y seguimiento':{ bg: 'bg-teal-50',    fg: 'text-teal-600',    ring: 'hover:border-teal-300 hover:bg-teal-50' },
  'Primeros auxilios':      { bg: 'bg-red-50',     fg: 'text-red-500',     ring: 'hover:border-red-300 hover:bg-red-50' },
  'Pruebas y formatos':     { bg: 'bg-violet-50',  fg: 'text-violet-600',  ring: 'hover:border-violet-300 hover:bg-violet-50' },
  'Salud materna':          { bg: 'bg-pink-50',    fg: 'text-pink-500',    ring: 'hover:border-pink-300 hover:bg-pink-50' },
};

export default function RecordTypeSelect({ employeeId, year, onNavigate }: RecordTypeSelectProps) {
  const employee = employees.find(e => e.id === employeeId);
  const [query, setQuery] = useState('');

  if (!employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 text-sm">Empleado no encontrado.</p>
        <button onClick={() => onNavigate('employees')} className="mt-3 text-blue-500 text-sm font-medium hover:underline">Volver</button>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName1} ${employee.lastName2}`.trim();
  const effectiveYear = year ?? new Date().getFullYear();

  const handleSelect = (type: MedicalRecordType) => {
    saveDraft({
      recordType: type,
      date: new Date().toISOString().slice(0, 10),
      responsibleDoctor: '',
      observations: '',
      year: effectiveYear,
    });
    onNavigate('expedient-form', employeeId, 'new', effectiveYear);
  };

  const filteredCategories = categories
    .map(cat => ({
      ...cat,
      types: cat.types.filter(t => t.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter(cat => cat.types.length > 0);

  return (
    <div className="max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 flex-wrap">
        <button
          onClick={() => onNavigate('employee-profile', employeeId, undefined, effectiveYear)}
          className="flex items-center gap-1.5 hover:text-blue-500 font-medium transition-colors"
        >
          <ArrowLeft size={13} />
          {fullName}
        </button>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-600 font-semibold">{effectiveYear}</span>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-600 font-semibold">Nuevo registro</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Selecciona el tipo de registro</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Elige el tipo de registro médico para <span className="font-semibold text-slate-600">{fullName}</span>
          </p>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar tipo de registro..."
          className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800 w-full sm:w-64"
        />
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {filteredCategories.map(cat => {
          const style = categoryStyles[cat.name] ?? categoryStyles['Pruebas y formatos'];
          return (
            <div key={cat.name}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-1.5 h-5 rounded-full ${style.fg.replace('text-', 'bg-')}`} />
                <h3 className="text-sm font-bold text-gray-800">{cat.name}</h3>
                <span className="text-xs text-slate-300 font-medium">{cat.types.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.types.map(type => {
                  const Icon = typeIcons[type] ?? FileText;
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelect(type)}
                      className={`group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl transition-all text-left ${style.ring}`}
                    >
                      <div className={`w-10 h-10 ${style.bg} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                        <Icon size={18} className={style.fg} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-bold text-gray-800 leading-snug">{type}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{cat.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="card">
            <EmptyState
              icon={FileText}
              title="No se encontraron tipos de registro"
              description="Intenta con otro término de búsqueda."
              action={query ? { label: 'Limpiar búsqueda', icon: X, onClick: () => setQuery('') } : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
