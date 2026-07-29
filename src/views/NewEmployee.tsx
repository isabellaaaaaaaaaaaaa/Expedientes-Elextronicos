import { useState } from 'react';
import { ArrowLeft, Save, User, Building2, Phone, CircleCheck as CheckCircle2, ChevronRight, Heart, Loader as Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { NavigationPage, Employee } from '../types';
import { addEmployee } from '../lib/store';

interface NewEmployeeProps {
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string) => void;
}

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

const blankEmployee: Omit<Employee, 'id'> = {
  employeeNumber: '',
  firstName: '',
  lastName1: '',
  lastName2: '',
  curp: '',
  rfc: '',
  nss: '',
  gender: 'Masculino',
  birthDate: '',
  phone: '',
  email: '',
  department: '',
  position: '',
  hireDate: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  planta: '61',
  status: 'Activo',
  turno: 'Matutino',
};

export default function NewEmployee({ onNavigate }: NewEmployeeProps) {
  const [form, setForm] = useState<Omit<Employee, 'id'>>(blankEmployee);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Employee, string>>>({});

  const set = (key: keyof Omit<Employee, 'id'>) => (value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof Employee, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'Requerido';
    if (!form.lastName1.trim()) errs.lastName1 = 'Requerido';
    if (!form.employeeNumber.trim()) errs.employeeNumber = 'Requerido';
    if (!form.department.trim()) errs.department = 'Requerido';
    if (!form.position.trim()) errs.position = 'Requerido';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Completa los campos obligatorios', {
        description: 'Revisa los campos marcados en rojo.',
      });
      return;
    }
    setSaving(true);
    const toastId = toast.loading('Registrando empleado...', {
      description: `${form.firstName} ${form.lastName1}`,
    });
    setTimeout(() => {
      const newId = `emp-${Date.now()}`;
      const newEmployee: Employee = { id: newId, ...form };
      addEmployee(newEmployee);
      setNewEmployeeId(newId);
      setSaving(false);
      setSaved(true);
      toast.success('Empleado registrado correctamente', {
        id: toastId,
        description: 'Ya puedes crear su primer expediente médico cuando lo necesites.',
      });
    }, 700);
  };

  const inputClass = (key: keyof Employee) =>
    `input-base ${errors[key] ? 'border-red-300 focus:ring-red-500/15 focus:border-red-400' : ''}`;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <button onClick={() => onNavigate('employees')} className="flex items-center gap-1.5 hover:text-red-500 font-medium transition-colors">
          <ArrowLeft size={13} /> Empleados
        </button>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-600 font-semibold">Nuevo empleado</span>
      </nav>

      <div>
        <h2 className="text-xl font-bold text-gray-900">Registrar empleado</h2>
        <p className="text-sm text-slate-400 mt-1">Tras guardar, podrás crear su primer expediente médico de forma opcional</p>
      </div>

      <div className="space-y-5">
        {/* Datos Personales */}
        <FormSection icon={User} title="Datos Personales">
          <div className="grid grid-cols-2 gap-x-5 gap-y-5">
            <FieldGroup label="Nombre" required>
              <input value={form.firstName} onChange={e => set('firstName')(e.target.value)} placeholder="Nombre(s)" className={inputClass('firstName')} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1.5">{errors.firstName}</p>}
            </FieldGroup>
            <FieldGroup label="Apellido paterno" required>
              <input value={form.lastName1} onChange={e => set('lastName1')(e.target.value)} placeholder="Apellido paterno" className={inputClass('lastName1')} />
              {errors.lastName1 && <p className="text-xs text-red-500 mt-1.5">{errors.lastName1}</p>}
            </FieldGroup>
            <FieldGroup label="Apellido materno">
              <input value={form.lastName2} onChange={e => set('lastName2')(e.target.value)} placeholder="Apellido materno" className="input-base" />
            </FieldGroup>
            <FieldGroup label="Sexo">
              <select value={form.gender} onChange={e => set('gender')(e.target.value)} className="input-base">
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Fecha de nacimiento">
              <input type="date" value={form.birthDate} onChange={e => set('birthDate')(e.target.value)} className="input-base" />
            </FieldGroup>
            <FieldGroup label="CURP">
              <input value={form.curp} onChange={e => set('curp')(e.target.value)} placeholder="CURP" className="input-base" />
            </FieldGroup>
            <FieldGroup label="RFC">
              <input value={form.rfc} onChange={e => set('rfc')(e.target.value)} placeholder="RFC" className="input-base" />
            </FieldGroup>
            <FieldGroup label="NSS">
              <input value={form.nss} onChange={e => set('nss')(e.target.value)} placeholder="Número de Seguridad Social" className="input-base" />
            </FieldGroup>
          </div>
        </FormSection>

        {/* Datos Laborales */}
        <FormSection icon={Building2} title="Datos Laborales">
          <div className="grid grid-cols-2 gap-x-5 gap-y-5">
            <FieldGroup label="No. Empleado" required>
              <input value={form.employeeNumber} onChange={e => set('employeeNumber')(e.target.value)} placeholder="EMP-0000" className={inputClass('employeeNumber')} />
              {errors.employeeNumber && <p className="text-xs text-red-500 mt-1.5">{errors.employeeNumber}</p>}
            </FieldGroup>
            <FieldGroup label="Fecha de ingreso">
              <input type="date" value={form.hireDate} onChange={e => set('hireDate')(e.target.value)} className="input-base" />
            </FieldGroup>
            <FieldGroup label="Departamento" required>
              <input value={form.department} onChange={e => set('department')(e.target.value)} placeholder="Departamento" className={inputClass('department')} />
              {errors.department && <p className="text-xs text-red-500 mt-1.5">{errors.department}</p>}
            </FieldGroup>
            <FieldGroup label="Puesto" required>
              <input value={form.position} onChange={e => set('position')(e.target.value)} placeholder="Puesto" className={inputClass('position')} />
              {errors.position && <p className="text-xs text-red-500 mt-1.5">{errors.position}</p>}
            </FieldGroup>
          </div>
        </FormSection>

        {/* Contacto */}
        <FormSection icon={Phone} title="Contacto">
          <div className="grid grid-cols-2 gap-x-5 gap-y-5">
            <FieldGroup label="Teléfono">
              <input value={form.phone} onChange={e => set('phone')(e.target.value)} placeholder="(55) 0000-0000" className="input-base" />
            </FieldGroup>
            <FieldGroup label="Correo electrónico">
              <input value={form.email} onChange={e => set('email')(e.target.value)} placeholder="correo@empresa.mx" className="input-base" />
            </FieldGroup>
          </div>
        </FormSection>

        {/* Contacto de emergencia */}
        <FormSection icon={Heart} title="Contacto de Emergencia">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-5">
            <FieldGroup label="Nombre">
              <input value={form.emergencyContactName} onChange={e => set('emergencyContactName')(e.target.value)} placeholder="Nombre completo" className="input-base" />
            </FieldGroup>
            <FieldGroup label="Parentesco">
              <input value={form.emergencyContactRelationship} onChange={e => set('emergencyContactRelationship')(e.target.value)} placeholder="Ej. Esposa, Padre" className="input-base" />
            </FieldGroup>
            <FieldGroup label="Teléfono">
              <input value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone')(e.target.value)} placeholder="(55) 0000-0000" className="input-base" />
            </FieldGroup>
          </div>
        </FormSection>

        {/* Actions */}
        <div className="flex items-center justify-between card px-6 py-4">
          {saved ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">Empleado registrado correctamente</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Los campos marcados con * son obligatorios</p>
          )}
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className="flex items-center gap-2 px-6 h-9 bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {saving ? 'Guardando...' : saved ? 'Registrado' : 'Guardar empleado'}
          </button>
        </div>
      </div>

      {/* Optional expedient creation */}
      {saved && newEmployeeId && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Crear primer expediente médico</p>
                <p className="text-xs text-slate-400 mt-0.5">Opcional · Puedes hacerlo más tarde desde el perfil del empleado</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('employees')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 h-9 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm rounded-lg transition-colors"
              >
                Ver empleados
              </button>
              <button
                onClick={() => onNavigate('expedient-form', newEmployeeId, 'new')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
              >
                <FileText size={14} />
                Crear expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormSection({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
          <Icon size={15} className="text-[hsl(355,78%,51%)]" />
        </div>
        <p className="section-title">{title}</p>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}
