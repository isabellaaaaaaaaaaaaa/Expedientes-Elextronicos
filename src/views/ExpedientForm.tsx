import { useState } from 'react';
import { ArrowLeft, Camera, Save, User, Building2, Phone, FileText, UserCheck, CircleCheck as CheckCircle2, ChevronRight, Plus, Trash2, FolderOpen, Stethoscope, FlaskConical, ClipboardList, Flag, Lock, Upload, Pencil, X, Eye } from 'lucide-react';
import { employees, expedients, documents } from '../data/mockData';
import { getDraft, clearDraft } from '../data/newExpedientDraft';
import CaptureModule from '../components/capture/CaptureModule';
import UnlockModal from '../components/employee/UnlockModal';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { BitacoraPanel, HistorialPanel } from '../components/record/AuditPanels';
import { ExpedientProgress, useExpedientProgress } from '../components/record/ExpedientProgress';
import { PreviewScreen } from '../components/record/PreviewScreen';
import { statusConfig } from '../lib/statusConfig';
import { logAction, logChange } from '../lib/auditLog';
import { EmptyState } from '../components/ui/empty-state';
import type { NavigationPage, Employee, Expedient, EmployeeSnapshot, CapturedItem, DocumentType, MedDocument, ExpedientStatus } from '../types';

interface ExpedientFormProps {
  employeeId: string;
  expedientId: string | null;
  currentUser: { username: string; role: string };
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number) => void;
}

type Tab = 'identificacion' | 'antecedentes' | 'exploracion' | 'resultados' | 'documentos' | 'bitacora' | 'historial';

const statusColor: Record<string, string> = {
  'Finalizado':  'bg-green-50 text-green-700 border-green-200',
  'En revisión': 'bg-amber-50 text-amber-700 border-amber-200',
  'Sin revisar': 'bg-red-50 text-red-600 border-red-200',
};

const docTypeColors: Record<string, string> = {
  'Examen médico':   'bg-blue-50 text-blue-700',
  'Audiometría':     'bg-teal-50 text-teal-700',
  'Espirometría':    'bg-cyan-50 text-cyan-700',
  'Laboratorio':     'bg-violet-50 text-violet-700',
  'Radiografía':     'bg-slate-100 text-slate-600',
  'Consulta médica': 'bg-green-50 text-green-700',
  'Incapacidad':     'bg-orange-50 text-orange-700',
  'Fotografía':      'bg-pink-50 text-pink-700',
  'Otro':            'bg-slate-100 text-slate-600',
};

function FieldGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all text-gray-800 leading-relaxed"
    />
  );
}

function SectionCard({ title, icon: Icon, iconColor, iconBg, children }: {
  title: string; icon: React.ElementType; iconColor: string; iconBg: string; children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={14} className={iconColor} />
        </div>
        <p className="text-sm font-bold text-gray-800">{title}</p>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug truncate">{value}</p>
    </div>
  );
}

type ExpForm = Pick<Expedient, 'year' | 'status' | 'observations' | 'recordType' | 'date' | 'responsibleDoctor'
  | 'laboralAntecedents' | 'pathologicalAntecedents' | 'nonPathologicalAntecedents'
  | 'familyAntecedents' | 'surgicalHistory' | 'allergies' | 'medications'
  | 'weight' | 'height' | 'bmi' | 'bloodPressure' | 'heartRate'
  | 'respiratoryRate' | 'temperature' | 'oxygenSaturation' | 'visualAcuity' | 'physicalExamNotes'
  | 'diagnosis' | 'recommendations' | 'results'>;

function FichaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate" title={value}>{value}</p>
    </div>
  );
}

export default function ExpedientForm({ employeeId, expedientId, currentUser, onNavigate }: ExpedientFormProps) {
  const isAuditor = currentUser.role === 'Auditor';
  const employee = employees.find(e => e.id === employeeId);
  const isNew = !expedientId || expedientId === 'new';
  const existingExpedient = isNew ? null : expedients.find(e => e.id === expedientId);

  const draft = isNew ? getDraft() : null;

  const [activeTab, setActiveTab] = useState<Tab>('identificacion');
  const [empForm, setEmpForm] = useState<Employee>(
    (!isNew && existingExpedient?.employeeSnapshot)
      ? { ...employee, ...existingExpedient.employeeSnapshot } as Employee
      : (employee ?? ({} as Employee))
  );
  const [expForm, setExpForm] = useState<ExpForm>({
    year: existingExpedient?.year ?? draft?.year ?? new Date().getFullYear(),
    status: existingExpedient?.status ?? 'Sin revisar',
    observations: existingExpedient?.observations ?? draft?.observations ?? '',
    recordType: existingExpedient?.recordType ?? draft?.recordType ?? 'Periódico',
    date: existingExpedient?.date ?? draft?.date ?? new Date().toISOString().slice(0, 10),
    responsibleDoctor: existingExpedient?.responsibleDoctor ?? draft?.responsibleDoctor ?? '',
    laboralAntecedents: existingExpedient?.laboralAntecedents ?? '',
    pathologicalAntecedents: existingExpedient?.pathologicalAntecedents ?? '',
    nonPathologicalAntecedents: existingExpedient?.nonPathologicalAntecedents ?? '',
    familyAntecedents: existingExpedient?.familyAntecedents ?? '',
    surgicalHistory: existingExpedient?.surgicalHistory ?? '',
    allergies: existingExpedient?.allergies ?? '',
    medications: existingExpedient?.medications ?? '',
    weight: existingExpedient?.weight ?? '',
    height: existingExpedient?.height ?? '',
    bmi: existingExpedient?.bmi ?? '',
    bloodPressure: existingExpedient?.bloodPressure ?? '',
    heartRate: existingExpedient?.heartRate ?? '',
    respiratoryRate: existingExpedient?.respiratoryRate ?? '',
    temperature: existingExpedient?.temperature ?? '',
    oxygenSaturation: existingExpedient?.oxygenSaturation ?? '',
    visualAcuity: existingExpedient?.visualAcuity ?? '',
    physicalExamNotes: existingExpedient?.physicalExamNotes ?? '',
    diagnosis: existingExpedient?.diagnosis ?? '',
    recommendations: existingExpedient?.recommendations ?? '',
    results: existingExpedient?.results ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editFichaOpen, setEditFichaOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmState, setConfirmState] = useState<{ kind: 'finalize' | 'status' | 'edit-finalized' | null; next?: ExpedientStatus }>({ kind: null });
  const [localDocs, setLocalDocs] = useState<MedDocument[]>(
    isNew ? [] : documents.filter(d => d.expedientId === expedientId),
  );

  if (!employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 text-sm">Empleado no encontrado.</p>
        <button onClick={() => onNavigate('employees')} className="mt-3 text-blue-500 text-sm font-medium hover:underline">Volver</button>
      </div>
    );
  }

  const setEmp = (key: keyof Employee) => (value: string) => {
    setEmpForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const setExpStr = (key: keyof ExpForm) => (value: string) => {
    setExpForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const recalcBmi = (weight: string, height: string) => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      return (w / Math.pow(h / 100, 2)).toFixed(1);
    }
    return '';
  };

  const handleWeightChange = (v: string) => {
    const bmi = recalcBmi(v, expForm.height ?? '');
    setExpForm(f => ({ ...f, weight: v, bmi, }));
    setSaved(false);
  };

  const handleHeightChange = (v: string) => {
    const bmi = recalcBmi(expForm.weight ?? '', v);
    setExpForm(f => ({ ...f, height: v, bmi, }));
    setSaved(false);
  };

  const handleSave = () => {
    if (isNew) Object.assign(employee, empForm);
    if (isNew) {
      const newId = `exp-${Date.now()}`;
      const now = new Date().toISOString().slice(0, 10);
      const snapshot: EmployeeSnapshot = {
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName1: employee.lastName1,
        lastName2: employee.lastName2,
        curp: employee.curp,
        rfc: employee.rfc,
        nss: employee.nss,
        gender: employee.gender,
        birthDate: employee.birthDate,
        position: employee.position,
        department: employee.department,
        hireDate: employee.hireDate,
        emergencyContactName: employee.emergencyContactName,
        emergencyContactRelationship: employee.emergencyContactRelationship,
        emergencyContactPhone: employee.emergencyContactPhone,
        photoDataUrl: employee.photoDataUrl,
      };
      const newExp: Expedient = {
        id: newId,
        employeeId,
        ...expForm,
        employeeSnapshot: snapshot,
        createdAt: now,
        updatedAt: now,
      };
      expedients.push(newExp);
      localDocs.forEach(doc => { doc.expedientId = newId; documents.push(doc); });
      logAction(newId, currentUser.username, 'Creación del expediente');
      logChange(newId, currentUser.username, 'Estado', '', 'Sin revisar');
      clearDraft();
      setSaved(true);
      setTimeout(() => onNavigate('employee-profile', employeeId, undefined, expForm.year), 1200);
    } else if (existingExpedient) {
      const before = { ...existingExpedient };
      Object.assign(existingExpedient, { ...expForm, updatedAt: new Date().toISOString().slice(0, 10) });
      (['recordType', 'date', 'responsibleDoctor', 'observations', 'weight', 'height', 'diagnosis', 'results'] as const).forEach(k => {
        const oldV = String(before[k] ?? ''); const newV = String(existingExpedient[k] ?? '');
        if (oldV !== newV) logChange(existingExpedient.id, currentUser.username, k, oldV, newV);
      });
      logAction(existingExpedient.id, currentUser.username, 'Edición');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCapture = (items: CapturedItem[], docType: DocumentType) => {
    const newDocs: MedDocument[] = items.map((item, i) => ({
      id: `doc-${Date.now()}-${i}`,
      expedientId: expedientId ?? 'pending',
      employeeId,
      name: item.name || `${docType} ${i + 1}`,
      type: docType,
      fileType: item.fileType,
      dataUrl: item.dataUrl,
      uploadedBy: currentUser.username,
      uploadDate: new Date().toISOString().slice(0, 10),
    }));
    setLocalDocs(prev => [...prev, ...newDocs]);
    if (!isNew) {
      newDocs.forEach(d => documents.push(d));
      if (existingExpedient) logAction(existingExpedient.id, currentUser.username, 'Carga de documentos');
    }
    setSaved(false);
  };

  const removeDoc = (id: string) => {
    setLocalDocs(prev => prev.filter(d => d.id !== id));
    const idx = documents.findIndex(d => d.id === id);
    if (idx !== -1) documents.splice(idx, 1);
  };

  const fullName = `${empForm.firstName} ${empForm.lastName1} ${empForm.lastName2}`.trim();
  const isLocked = expForm.status === 'Finalizado';
  const isFinalized = isLocked;
  const isReadOnly = isLocked || isAuditor;
  const hasSnapshot = !isNew && !!existingExpedient?.employeeSnapshot;
  const idReadOnly = isReadOnly || hasSnapshot;
  const { pct, pending: pendingSections } = useExpedientProgress(expForm);
  const progressColor = pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';

  const changeStatus = (next: ExpedientStatus) => {
    if (next === expForm.status) return;
    if (next === 'Finalizado') { setConfirmState({ kind: 'finalize', next }); return; }
    if (expForm.status === 'Finalizado') { setConfirmState({ kind: 'edit-finalized', next }); return; }
    setConfirmState({ kind: 'status', next });
  };

  const applyStatusChange = (next: ExpedientStatus) => {
    const prev = expForm.status;
    setExpForm(f => ({ ...f, status: next }));
    if (existingExpedient) {
      existingExpedient.status = next;
      existingExpedient.updatedAt = new Date().toISOString().slice(0, 10);
      logChange(existingExpedient.id, currentUser.username, 'Estado', prev, next);
      logAction(existingExpedient.id, currentUser.username, 'Cambio de estado');
      if (next === 'Finalizado') logAction(existingExpedient.id, currentUser.username, 'Finalización');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFinalize = () => {
    applyStatusChange('Finalizado');
    setShowPreview(false);
    setConfirmState({ kind: null });
  };

  if (showPreview) {
    return (
      <PreviewScreen
        employee={empForm}
        expedient={expForm}
        docs={localDocs}
        onBack={() => setShowPreview(false)}
        onFinalize={() => setConfirmState({ kind: 'finalize', next: 'Finalizado' })}
      />
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'identificacion', label: 'Identificación' },
    { id: 'antecedentes',   label: 'Antecedentes' },
    { id: 'exploracion',    label: 'Exploración Física' },
    { id: 'resultados',     label: 'Resultados' },
    { id: 'documentos',     label: 'Documentos' },
    ...(isNew ? [] : [
      { id: 'bitacora' as Tab,   label: 'Bitácora' },
      { id: 'historial' as Tab,  label: 'Historial' },
    ]),
  ];

  return (
    <div className="max-w-6xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <button onClick={() => onNavigate('employee-profile', employeeId, undefined, expForm.year)} className="flex items-center gap-1.5 hover:text-blue-500 font-medium transition-colors">
          <ArrowLeft size={13} />
          Regresar
        </button>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-600 font-semibold">
          {expForm.year}
        </span>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-600 font-semibold">
          {isNew ? 'Nuevo registro' : (expForm.recordType || `Expediente ${expForm.year}`)}
        </span>
      </nav>

      {/* ── BARRA DE PROGRESO SUPERIOR ── */}
      {!isFinalized && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-slate-700">Progreso de captura</p>
            <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : 'text-slate-700'}`}>{pct}% completado</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full ${progressColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
          {pendingSections.length > 0 ? (
            <div className="mt-3.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Pendiente:</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {pendingSections.map(p => (
                  <span key={p} className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-green-600 font-semibold mt-3.5">Expediente completo y listo para finalizar</p>
          )}
        </div>
      )}

      {/* ── FICHA DEL REGISTRO (existing records only) ── */}
      {!isNew && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText size={14} className="text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Ficha del registro</p>
            </div>
            {!idReadOnly && (
              <button
                onClick={() => setEditFichaOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Pencil size={12} />
                Editar ficha
              </button>
            )}
          </div>
          <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3">
            <FichaItem label="Tipo de registro" value={expForm.recordType} />
            <FichaItem label="No. de empleado" value={empForm.employeeNumber} />
            <FichaItem label="Empleado" value={fullName} />
            <FichaItem label="Fecha" value={expForm.date} />
            <FichaItem label="Estado" value={expForm.status} />
            <FichaItem label="Médico responsable" value={expForm.responsibleDoctor || '—'} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-4 lg:sticky lg:top-20">
          {/* Photo card */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-16" />
            <div className="px-5 pb-5 -mt-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                {empForm.photoDataUrl ? (
                  <img src={empForm.photoDataUrl} alt={fullName} className="w-full h-full object-cover rounded-[14px]" />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-slate-100 flex flex-col items-center justify-center">
                    <Camera size={22} className="text-slate-400" />
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">Sin foto</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => !isAuditor && setCaptureOpen(true)}
                disabled={isAuditor}
                className="mt-3 flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={13} />
                Importar archivo
              </button>
            </div>
          </div>

          {/* Quick info */}
          <div className="card p-5 space-y-3.5">
            <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-bold border ${statusColor[expForm.status]}`}>
              {expForm.status}
            </span>
            {expForm.recordType && (
              <InfoPill label="Tipo de registro" value={expForm.recordType} />
            )}
            <InfoPill label="No. Empleado"       value={empForm.employeeNumber} />
            <InfoPill label="Nombre completo"    value={fullName || '—'} />
            <InfoPill label="Departamento"       value={empForm.department} />
            <InfoPill label="Puesto"             value={empForm.position} />
            {expForm.date && (
              <InfoPill label="Fecha del registro" value={new Date(expForm.date + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} />
            )}
            {expForm.responsibleDoctor && (
              <InfoPill label="Médico responsable" value={expForm.responsibleDoctor} />
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="space-y-4">
          {/* Tab bar — always clickable, even in read-only mode */}
          <div className="card overflow-hidden">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-4 py-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content — disabled when locked */}
          <div className={isReadOnly ? 'pointer-events-none select-none opacity-75' : ''}>

          {/* ── TAB: Identificación ── */}
          {activeTab === 'identificacion' && (
            <div className="space-y-4">
              {hasSnapshot && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                  <Lock size={13} />
                  Estos datos se copiaron de la Identificación del empleado al crear el registro y no se modifican aunque la información del empleado cambie.
                </div>
              )}
              <div className={idReadOnly ? 'pointer-events-none select-none opacity-80' : ''}>
              {/* Datos del Expediente */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FolderOpen size={14} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Datos del Registro</p>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <FieldGroup label="Tipo de registro" className="col-span-2">
                    <div className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-gray-800 font-medium flex items-center gap-2">
                      <Stethoscope size={14} className="text-blue-500 flex-shrink-0" />
                      {expForm.recordType}
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Fecha">
                    <input type="date" value={expForm.date ?? ''} onChange={e => setExpStr('date')(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800" />
                  </FieldGroup>
                  <FieldGroup label="Médico responsable">
                    <TextInput value={expForm.responsibleDoctor ?? ''} onChange={setExpStr('responsibleDoctor')} placeholder="Nombre del médico" />
                  </FieldGroup>
                  <FieldGroup label="Año">
                    <input type="number" value={expForm.year}
                      onChange={e => { setExpForm(f => ({ ...f, year: parseInt(e.target.value) || f.year })); setSaved(false); }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800" />
                  </FieldGroup>
                  <FieldGroup label="Estado">
                    <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border ${statusColor[expForm.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {expForm.status}
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Observaciones" className="col-span-2">
                    <TextArea value={expForm.observations} onChange={setExpStr('observations')} placeholder="Notas médicas, restricciones, observaciones..." rows={3} />
                  </FieldGroup>
                </div>
              </div>

              {/* Datos Personales */}
              <SectionCard title="Datos Personales" icon={User} iconColor="text-blue-600" iconBg="bg-blue-50">
                <FieldGroup label="Nombre">
                  <TextInput value={empForm.firstName} onChange={setEmp('firstName')} placeholder="Nombre(s)" />
                </FieldGroup>
                <FieldGroup label="Apellido paterno">
                  <TextInput value={empForm.lastName1} onChange={setEmp('lastName1')} placeholder="Apellido paterno" />
                </FieldGroup>
                <FieldGroup label="Apellido materno">
                  <TextInput value={empForm.lastName2} onChange={setEmp('lastName2')} placeholder="Apellido materno" />
                </FieldGroup>
                <FieldGroup label="Sexo">
                  <select value={empForm.gender} onChange={e => setEmp('gender')(e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800">
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </FieldGroup>
                <FieldGroup label="Fecha de nacimiento">
                  <input type="date" value={empForm.birthDate} onChange={e => setEmp('birthDate')(e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800" />
                </FieldGroup>
                <FieldGroup label="CURP">
                  <TextInput value={empForm.curp} onChange={setEmp('curp')} placeholder="CURP" />
                </FieldGroup>
                <FieldGroup label="RFC">
                  <TextInput value={empForm.rfc} onChange={setEmp('rfc')} placeholder="RFC" />
                </FieldGroup>
              </SectionCard>

              {/* Contacto */}
              <SectionCard title="Contacto" icon={Phone} iconColor="text-teal-600" iconBg="bg-teal-50">
                <FieldGroup label="Teléfono">
                  <TextInput value={empForm.phone} onChange={setEmp('phone')} placeholder="(55) 0000-0000" />
                </FieldGroup>
                <FieldGroup label="Correo electrónico">
                  <TextInput value={empForm.email} onChange={setEmp('email')} placeholder="correo@empresa.mx" />
                </FieldGroup>
              </SectionCard>

              {/* Datos Laborales */}
              <SectionCard title="Datos Laborales" icon={Building2} iconColor="text-violet-600" iconBg="bg-violet-50">
                <FieldGroup label="Departamento">
                  <TextInput value={empForm.department} onChange={setEmp('department')} placeholder="Departamento" />
                </FieldGroup>
                <FieldGroup label="Puesto">
                  <TextInput value={empForm.position} onChange={setEmp('position')} placeholder="Puesto" />
                </FieldGroup>
                <FieldGroup label="Fecha de ingreso">
                  <input type="date" value={empForm.hireDate} onChange={e => setEmp('hireDate')(e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800" />
                </FieldGroup>
                <FieldGroup label="No. Empleado">
                  <TextInput value={empForm.employeeNumber} onChange={setEmp('employeeNumber')} placeholder="EMP-0000" />
                </FieldGroup>
              </SectionCard>

              {/* Contacto de Emergencia */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                    <UserCheck size={14} className="text-orange-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Contacto de Emergencia</p>
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                    <FieldGroup label="Nombre">
                      <TextInput value={empForm.emergencyContactName} onChange={setEmp('emergencyContactName')} placeholder="Nombre completo" />
                    </FieldGroup>
                    <FieldGroup label="Parentesco">
                      <TextInput value={empForm.emergencyContactRelationship} onChange={setEmp('emergencyContactRelationship')} placeholder="Ej. Esposa, Padre" />
                    </FieldGroup>
                    <FieldGroup label="Teléfono">
                      <TextInput value={empForm.emergencyContactPhone} onChange={setEmp('emergencyContactPhone')} placeholder="(55) 0000-0000" />
                    </FieldGroup>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* ── TAB: Antecedentes ── */}
          {activeTab === 'antecedentes' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                  <ClipboardList size={14} className="text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Antecedentes</p>
              </div>
              <div className="px-5 py-4 space-y-4">
                {([
                  { key: 'laboralAntecedents',        label: 'Antecedentes laborales',                   placeholder: 'Exposiciones, riesgos ocupacionales, puestos anteriores...' },
                  { key: 'pathologicalAntecedents',    label: 'Antecedentes patológicos',                 placeholder: 'Enfermedades previas, hospitalizaciones, tratamientos...' },
                  { key: 'nonPathologicalAntecedents', label: 'Antecedentes no patológicos',              placeholder: 'Hábitos, estilo de vida, alimentación, actividad física...' },
                  { key: 'familyAntecedents',          label: 'Antecedentes heredofamiliares',            placeholder: 'Enfermedades en familiares directos...' },
                  { key: 'surgicalHistory',            label: 'Cirugías y procedimientos',                placeholder: 'Intervenciones quirúrgicas, procedimientos médicos...' },
                  { key: 'allergies',                  label: 'Alergias',                                 placeholder: 'Medicamentos, alimentos, materiales a los que es alérgico...' },
                  { key: 'medications',                label: 'Medicamentos actuales',                    placeholder: 'Tratamientos farmacológicos en curso, dosis, frecuencia...' },
                ] as const).map(({ key, label, placeholder }) => (
                  <FieldGroup key={key} label={label}>
                    <TextArea value={expForm[key] ?? ''} onChange={setExpStr(key)} placeholder={placeholder} rows={3} />
                  </FieldGroup>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: Exploración Física ── */}
          {activeTab === 'exploracion' && (
            <div className="space-y-4">
              <div className="card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                    <Stethoscope size={14} className="text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Somatometría y Signos Vitales</p>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  <FieldGroup label="Peso (kg)">
                    <TextInput value={expForm.weight ?? ''} onChange={handleWeightChange} placeholder="70.5" />
                  </FieldGroup>
                  <FieldGroup label="Talla (cm)">
                    <TextInput value={expForm.height ?? ''} onChange={handleHeightChange} placeholder="170" />
                  </FieldGroup>
                  <FieldGroup label="IMC (auto)">
                    <input
                      type="text"
                      value={expForm.bmi ?? ''}
                      readOnly
                      placeholder="—"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-gray-600 cursor-not-allowed"
                    />
                  </FieldGroup>
                  <FieldGroup label="Presión arterial">
                    <TextInput value={expForm.bloodPressure ?? ''} onChange={setExpStr('bloodPressure')} placeholder="120/80 mmHg" />
                  </FieldGroup>
                  <FieldGroup label="Freq. cardiaca">
                    <TextInput value={expForm.heartRate ?? ''} onChange={setExpStr('heartRate')} placeholder="72 lpm" />
                  </FieldGroup>
                  <FieldGroup label="Freq. respiratoria">
                    <TextInput value={expForm.respiratoryRate ?? ''} onChange={setExpStr('respiratoryRate')} placeholder="16 rpm" />
                  </FieldGroup>
                  <FieldGroup label="Temperatura (°C)">
                    <TextInput value={expForm.temperature ?? ''} onChange={setExpStr('temperature')} placeholder="36.5" />
                  </FieldGroup>
                  <FieldGroup label="Saturación O₂">
                    <TextInput value={expForm.oxygenSaturation ?? ''} onChange={setExpStr('oxygenSaturation')} placeholder="98%" />
                  </FieldGroup>
                  <FieldGroup label="Agudeza visual">
                    <TextInput value={expForm.visualAcuity ?? ''} onChange={setExpStr('visualAcuity')} placeholder="20/20" />
                  </FieldGroup>
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center">
                    <Stethoscope size={14} className="text-teal-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Exploración por aparatos y sistemas</p>
                </div>
                <div className="px-5 py-4">
                  <FieldGroup label="Notas de exploración física">
                    <TextArea value={expForm.physicalExamNotes ?? ''} onChange={setExpStr('physicalExamNotes')} placeholder="Hallazgos por sistemas: cardiovascular, respiratorio, neurológico, musculoesquelético..." rows={6} />
                  </FieldGroup>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Resultados ── */}
          {activeTab === 'resultados' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
                  <FlaskConical size={14} className="text-violet-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Diagnóstico y Resultados</p>
              </div>
              <div className="px-5 py-4 space-y-4">
                <FieldGroup label="Diagnóstico">
                  <TextArea value={expForm.diagnosis ?? ''} onChange={setExpStr('diagnosis')} placeholder="CIE-10, diagnóstico principal y secundarios..." rows={4} />
                </FieldGroup>
                <FieldGroup label="Resultados de estudios">
                  <TextArea value={expForm.results ?? ''} onChange={setExpStr('results')} placeholder="Resultados de laboratorio, audiometría, espirometría, radiografías..." rows={4} />
                </FieldGroup>
                <FieldGroup label="Recomendaciones y plan de manejo">
                  <TextArea value={expForm.recommendations ?? ''} onChange={setExpStr('recommendations')} placeholder="Tratamiento, referidos, restricciones laborales, seguimiento..." rows={4} />
                </FieldGroup>
              </div>
            </div>
          )}

          {/* ── TAB: Documentos ── */}
          {activeTab === 'documentos' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                    <FileText size={14} className="text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Documentos</p>
                  {localDocs.length > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{localDocs.length}</span>
                  )}
                </div>
                <button
                  onClick={() => !isAuditor && setCaptureOpen(true)}
                  disabled={isAuditor}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Plus size={13} />
                  Importar documentos
                </button>
              </div>
              {localDocs.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Sin documentos adjuntos"
                  description="Usa el módulo de captura para escanear o subir archivos al expediente."
                  action={!isAuditor && !isFinalized ? { label: 'Importar documentos', icon: Plus, onClick: () => setCaptureOpen(true) } : undefined}
                  compact
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {localDocs.map(doc => {
                    const colorClass = docTypeColors[doc.type] ?? docTypeColors['Otro'];
                    return (
                      <div key={doc.id} className="flex items-center gap-3.5 px-5 py-3.5 group hover:bg-slate-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          {doc.fileType === 'image' && doc.dataUrl ? (
                            <img src={doc.dataUrl} alt={doc.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText size={16} className="text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{doc.type}</span>
                            <span className="text-[10px] text-slate-400">{doc.uploadedBy}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeDoc(doc.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bitacora' && existingExpedient && (
            <BitacoraPanel expedientId={existingExpedient.id} />
          )}

          {activeTab === 'historial' && existingExpedient && (
            <HistorialPanel expedientId={existingExpedient.id} />
          )}

          </div>{/* end locked tab content */}

          {/* Progreso de captura (solo editable) */}
          {!isFinalized && !isNew && <ExpedientProgress exp={expForm} />}

          {/* ── LIFECYCLE BAR ── */}
          {isNew ? (
            /* New record — Crear registro + Cancelar */
            <div className="flex items-center justify-between card px-5 py-4">
              {saved ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold">Registro creado correctamente</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">El registro quedará en estado <span className="font-semibold text-slate-600">Sin revisar</span></p>
              )}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onNavigate('employee-profile', employeeId, undefined, expForm.year)}
                  disabled={saved}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saved || isAuditor}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
                >
                  <Save size={15} />
                  Crear registro
                </button>
              </div>
            </div>
          ) : (
            /* Barra de estado unificada para los 4 estados */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`px-5 py-3 border-b flex items-center gap-2.5 ${statusConfig[expForm.status].bar}`}>
                <span className={`w-2 h-2 rounded-full ${statusConfig[expForm.status].solid}`} />
                <p className="text-xs font-bold">{expForm.status}</p>
                {saved && (
                  <div className="ml-auto flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 size={13} />
                    <span className="text-xs font-semibold">Cambios guardados</span>
                  </div>
                )}
              </div>
              <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {isFinalized
                    ? 'Solo lectura — se requiere contraseña de autorización para editar.'
                    : 'Completa los datos y avanza el estado cuando esté listo.'}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {/* Selector de estado con confirmación */}
                  {!isAuditor && !isFinalized && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-semibold">Estado:</span>
                      <select
                        value={expForm.status}
                        onChange={e => changeStatus(e.target.value as ExpedientStatus)}
                        className="px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800"
                      >
                        <option value="Sin revisar">Sin revisar</option>
                        <option value="En revisión">En revisión</option>
                        <option value="Pendiente de verificación">Pendiente de verificación</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                    </div>
                  )}
                  {!isAuditor && !isFinalized && (
                    <button
                      onClick={handleSave}
                      disabled={isAuditor}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Save size={14} />
                      Guardar
                    </button>
                  )}
                  {!isAuditor && !isFinalized && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-sm rounded-xl transition-all"
                    >
                      <Eye size={14} />
                      Vista previa
                    </button>
                  )}
                  {!isAuditor && !isFinalized && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
                    >
                      <Flag size={14} />
                      Finalizar
                    </button>
                  )}
                  {!isAuditor && isFinalized && (
                    <button
                      onClick={() => setUnlockOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex-shrink-0"
                    >
                      <Lock size={14} />
                      Desbloquear
                    </button>
                  )}
                  {!isAuditor && (
                    <button
                      onClick={() => setDeleteOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 text-red-500 font-bold text-sm rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CaptureModule
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onSave={handleCapture}
        uploadedBy={currentUser.username}
      />

      <UnlockModal
        isOpen={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        onUnlock={() => {
          applyStatusChange('En revisión');
          setUnlockOpen(false);
        }}
      />

      {/* Delete confirmation */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-gray-900">¿Deseas eliminar este registro?</p>
            <p className="text-sm text-slate-500 mt-1.5">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (existingExpedient) {
                    const idx = expedients.findIndex(e => e.id === existingExpedient.id);
                    if (idx >= 0) expedients.splice(idx, 1);
                  }
                  onNavigate('employee-profile', employeeId, undefined, expForm.year);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmState.kind === 'finalize'}
        title="Finalizar expediente"
        message="El expediente quedá en estado Finalizado y en modo solo lectura. Cualquier edición posterior requerirá desbloqueo con autorización."
        confirmLabel="Finalizar"
        variant="warning"
        onConfirm={handleFinalize}
        onCancel={() => setConfirmState({ kind: null })}
      />

      <ConfirmDialog
        open={confirmState.kind === 'status'}
        title="Cambiar estado del expediente"
        message={`¿Confirmas cambiar el estado a ${confirmState.next ?? ''}?`}
        confirmLabel="Confirmar"
        variant="primary"
        onConfirm={() => { if (confirmState.next) applyStatusChange(confirmState.next); setConfirmState({ kind: null }); }}
        onCancel={() => setConfirmState({ kind: null })}
      />

      <ConfirmDialog
        open={confirmState.kind === 'edit-finalized'}
        title="Editar expediente finalizado"
        message="Este expediente está finalizado. Cambiar su estado lo reabrirá para edición. ¿Deseas continuar?"
        confirmLabel="Reabrir"
        variant="warning"
        onConfirm={() => { if (confirmState.next) applyStatusChange(confirmState.next); setConfirmState({ kind: null }); }}
        onCancel={() => setConfirmState({ kind: null })}
      />

      {/* Editar ficha modal */}
      {editFichaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditFichaOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Pencil size={14} className="text-blue-600" />
                </div>
                <p className="text-sm font-bold text-gray-800">Editar ficha del registro</p>
              </div>
              <button onClick={() => setEditFichaOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Tipo de registro</label>
                <div className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-gray-800 font-medium flex items-center gap-2">
                  <Stethoscope size={14} className="text-blue-500 flex-shrink-0" />
                  {expForm.recordType}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Fecha del registro</label>
                  <input
                    type="date"
                    value={expForm.date}
                    onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Estado</label>
                  <select
                    value={expForm.status}
                    onChange={e => { const next = e.target.value as ExpedientStatus; setExpForm(f => ({ ...f, status: next })); if (existingExpedient) { logChange(existingExpedient.id, currentUser.username, 'Estado', expForm.status, next); logAction(existingExpedient.id, currentUser.username, 'Cambio de estado'); existingExpedient.status = next; } }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
                  >
                    <option>Sin revisar</option>
                    <option>En revisión</option>
                    <option>Pendiente de verificación</option>
                    <option>Finalizado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Médico responsable</label>
                <input
                  type="text"
                  value={expForm.responsibleDoctor}
                  onChange={e => setExpForm(f => ({ ...f, responsibleDoctor: e.target.value }))}
                  placeholder="Nombre del médico"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => setEditFichaOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (existingExpedient) {
                    existingExpedient.recordType = expForm.recordType;
                    existingExpedient.date = expForm.date;
                    existingExpedient.status = expForm.status;
                    existingExpedient.responsibleDoctor = expForm.responsibleDoctor;
                    existingExpedient.updatedAt = new Date().toISOString().slice(0, 10);
                    logAction(existingExpedient.id, currentUser.username, 'Edición');
                  }
                  setEditFichaOpen(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
              >
                <Save size={14} />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
