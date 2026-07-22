import { useState } from 'react';
import { ArrowLeft, Plus, Folder, ChevronRight, FolderOpen, Pencil, Check, X, Phone, Mail, Heart, Calendar, Layers, User as UserIcon } from 'lucide-react';
import { employees, expedients, documents } from '../data/mockData';
import type { NavigationPage, AuthUser, Employee } from '../types';
import { StatusBadge } from '../lib/statusConfig';
import RecordActionsMenu from '../components/record/RecordActionsMenu';
import { EmptyState } from '../components/ui/empty-state';


interface EmployeeProfileProps {
  employeeId: string;
  user: AuthUser;
  initialYear?: number;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number) => void;
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function IdField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
      />
    </div>
  );
}

export default function EmployeeProfile({ employeeId, user, initialYear, onNavigate }: EmployeeProfileProps) {
  const employee = employees.find(e => e.id === employeeId);
  const isAuditor = user.role === 'Auditor';
  const [openYear, setOpenYear] = useState<number | null>(initialYear ?? null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Omit<Employee, 'id'> | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderYear, setNewFolderYear] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'perfil'>('perfil');
  const [extraYears, setExtraYears] = useState<number[]>([]);

  const handleCreateFolder = () => {
    const year = Number(newFolderYear);
    if (!year || year < 1900 || year > 2100 || years.includes(year)) return;
    setExtraYears(prev => [...prev, year]);
    setShowFolderDialog(false);
    setNewFolderYear('');
  };

  if (!employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 text-sm">Empleado no encontrado.</p>
        <button onClick={() => onNavigate('employees')} className="mt-3 text-blue-500 text-sm font-medium hover:underline">Volver</button>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName1} ${employee.lastName2}`.trim();
  const empExpedients = expedients.filter(e => e.employeeId === employeeId);
  const relatedExpedients = [...empExpedients].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.date.localeCompare(b.date);
  });

  // Antigüedad
  const antiguedadYears = (() => {
    const d = new Date(employee.hireDate + 'T12:00:00');
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    return Math.max(0, now.getFullYear() - d.getFullYear());
  })();

  // Último examen médico y próximo examen (periódico anual)
  const sortedByDate = [...empExpedients].sort((a, b) => b.date.localeCompare(a.date));
  const lastExam = sortedByDate[0];
  const lastExamDate = lastExam?.date ? new Date(lastExam.date + 'T12:00:00') : null;
  const nextExamDate = (() => {
    if (!lastExamDate) return null;
    const d = new Date(lastExamDate);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  })();

  // Estado del expediente actual (más reciente)
  const currentExpStatus = lastExam?.status ?? null;

  const byYear: Record<number, typeof empExpedients> = {};
  empExpedients.forEach(exp => {
    if (!byYear[exp.year]) byYear[exp.year] = [];
    byYear[exp.year].push(exp);
  });
  extraYears.forEach(y => { if (!byYear[y]) byYear[y] = []; });
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('employees')}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-500 font-medium transition-colors"
      >
        <ArrowLeft size={14} /> Empleados
      </button>

      {/* Tab bar */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200/60 rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'perfil' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <UserIcon size={14} /> Perfil
        </button>
      </div>

      {activeTab === 'perfil' && (
      <>
      {/* ── 1. IDENTIFICACIÓN ── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="section-title">Información General</p>
          {!isAuditor && !editMode && (
            <button
              onClick={() => {
                const { id, ...rest } = employee;
                setEditForm(rest);
                setEditMode(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Pencil size={12} /> Editar identificación
            </button>
          )}
          {editMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditMode(false); setEditForm(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={12} /> Cancelar
              </button>
              <button
                onClick={() => {
                  if (editForm) {
                    Object.assign(employee, editForm);
                    employee.photoDataUrl = editForm.photoDataUrl;
                  }
                  setEditMode(false);
                  setEditForm(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                <Check size={12} /> Guardar
              </button>
            </div>
          )}
        </div>

        {editMode && editForm ? (
          <div className="px-6 py-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {editForm.photoDataUrl
                    ? <img src={editForm.photoDataUrl} alt={fullName} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-blue-600">{getInitials(editForm.firstName, editForm.lastName1)}</span>
                  }
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                <EditField label="No. Empleado" value={editForm.employeeNumber} onChange={v => setEditForm(f => f ? { ...f, employeeNumber: v } : f)} />
                <EditField label="Nombre(s)" value={editForm.firstName} onChange={v => setEditForm(f => f ? { ...f, firstName: v } : f)} />
                <EditField label="Apellido paterno" value={editForm.lastName1} onChange={v => setEditForm(f => f ? { ...f, lastName1: v } : f)} />
                <EditField label="Apellido materno" value={editForm.lastName2} onChange={v => setEditForm(f => f ? { ...f, lastName2: v } : f)} />
                <EditField label="CURP" value={editForm.curp} onChange={v => setEditForm(f => f ? { ...f, curp: v } : f)} />
                <EditField label="RFC" value={editForm.rfc} onChange={v => setEditForm(f => f ? { ...f, rfc: v } : f)} />
                <EditField label="NSS" value={editForm.nss} onChange={v => setEditForm(f => f ? { ...f, nss: v } : f)} />
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Sexo</label>
                  <select value={editForm.gender} onChange={e => setEditForm(f => f ? { ...f, gender: e.target.value as Employee['gender'] } : f)} className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800">
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Fecha de nacimiento</label>
                  <input type="date" value={editForm.birthDate} onChange={e => setEditForm(f => f ? { ...f, birthDate: e.target.value } : f)} className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800" />
                </div>
                <EditField label="Puesto" value={editForm.position} onChange={v => setEditForm(f => f ? { ...f, position: v } : f)} />
                <EditField label="Departamento" value={editForm.department} onChange={v => setEditForm(f => f ? { ...f, department: v } : f)} />
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Fecha de ingreso</label>
                  <input type="date" value={editForm.hireDate} onChange={e => setEditForm(f => f ? { ...f, hireDate: e.target.value } : f)} className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800" />
                </div>
              </div>
            </div>

            {/* Emergency contact edit */}
            <div className="border-t border-slate-50 pt-4">
              <p className="text-xs font-bold text-slate-500 mb-3">Contacto de emergencia</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                <EditField label="Nombre" value={editForm.emergencyContactName} onChange={v => setEditForm(f => f ? { ...f, emergencyContactName: v } : f)} />
                <EditField label="Parentesco" value={editForm.emergencyContactRelationship} onChange={v => setEditForm(f => f ? { ...f, emergencyContactRelationship: v } : f)} />
                <EditField label="Teléfono" value={editForm.emergencyContactPhone} onChange={v => setEditForm(f => f ? { ...f, emergencyContactPhone: v } : f)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {employee.photoDataUrl
                    ? <img src={employee.photoDataUrl} alt={fullName} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-blue-600">{getInitials(employee.firstName, employee.lastName1)}</span>
                  }
                </div>
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-900">{fullName}</p>
                <p className="text-sm text-slate-400 mt-0.5">{employee.position} · {employee.department}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {employee.phone && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone size={12} className="text-slate-400" /> {employee.phone}
                    </span>
                  )}
                  {employee.email && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail size={12} className="text-slate-400" /> {employee.email}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                    <Calendar size={11} /> Planta {employee.planta}
                  </span>
                </div>
              </div>
            </div>

            {/* Información General */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4">
              <IdField label="No. Empleado" value={employee.employeeNumber} />
              <IdField label="CURP" value={employee.curp} />
              <IdField label="RFC" value={employee.rfc} />
              <IdField label="NSS" value={employee.nss} />
              <IdField label="Sexo" value={employee.gender} />
              <IdField label="Fecha de nacimiento" value={new Date(employee.birthDate + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} />
              <IdField label="Departamento" value={employee.department} />
              <IdField label="Puesto" value={employee.position} />
              <IdField label="Planta" value={employee.planta} />
              <IdField label="Fecha de ingreso" value={new Date(employee.hireDate + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} />
              <IdField label="Antigüedad" value={`${antiguedadYears} año${antiguedadYears !== 1 ? 's' : ''}`} />
              <IdField label="Último examen médico" value={lastExamDate ? lastExamDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
              <IdField label="Próximo examen" value={nextExamDate ? nextExamDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado del expediente actual</p>
                <div className="mt-1">{currentExpStatus ? <StatusBadge status={currentExpStatus} /> : <p className="text-sm font-semibold text-gray-800">—</p>}</div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5"><Heart size={12} className="text-red-400" /> Contacto de emergencia</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
                <IdField label="Nombre" value={employee.emergencyContactName} />
                <IdField label="Parentesco" value={employee.emergencyContactRelationship} />
                <IdField label="Teléfono" value={employee.emergencyContactPhone} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. HISTORIAL ── */}
      {openYear === null ? (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="section-title">Historial</p>
              <p className="section-subtitle">
                {years.length > 0
                  ? `${years.length} carpeta${years.length !== 1 ? 's' : ''} · ${empExpedients.length} registro${empExpedients.length !== 1 ? 's' : ''}`
                  : 'Sin carpetas'}
              </p>
            </div>
          </div>

          {years.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Aún no hay carpetas"
              description="Crea una carpeta por año para organizar los expedientes del empleado."
              action={!isAuditor ? { label: 'Nueva carpeta', icon: Plus, onClick: () => { setNewFolderYear(''); setShowFolderDialog(true); } } : undefined}
            />
          ) : (
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {years.map(year => {
                  const yearExps = byYear[year];
                  return (
                    <button
                      key={year}
                      onClick={() => setOpenYear(year)}
                      className="group bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 text-left transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                          <Folder size={20} className="text-blue-600" />
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{year}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{yearExps.length} registro{yearExps.length !== 1 ? 's' : ''}</p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-blue-500 font-semibold">
                        Ver registros
                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Nueva carpeta button at the end */}
              {!isAuditor && (
                <button
                  onClick={() => { setNewFolderYear(''); setShowFolderDialog(true); }}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-2xl text-slate-400 hover:text-blue-500 text-sm font-bold transition-all"
                >
                  <Plus size={16} /> Nueva carpeta
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── AL ABRIR UN AÑO: lista de registros ── */
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenYear(null)}
                className="flex items-center gap-1.5 hover:text-blue-500 font-medium transition-colors text-sm text-slate-400"
              >
                <ArrowLeft size={13} /> Carpetas
              </button>
              <ChevronRight size={11} className="text-slate-300" />
              <span className="text-sm font-bold text-gray-900">{openYear}</span>
            </div>
            {!isAuditor && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('record-type-select', employeeId, undefined, openYear ?? undefined)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Plus size={13} /> Nuevo registro
                </button>
              </div>
            )}
          </div>

          {(byYear[openYear] ?? []).length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={`Sin registros en ${openYear}`}
              description="Aún no se han creado registros médicos para esta carpeta."
              action={!isAuditor ? { label: 'Nuevo registro', icon: Plus, onClick: () => onNavigate('record-type-select', employeeId, undefined, openYear ?? undefined) } : undefined}
              compact
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {(byYear[openYear] ?? []).map(exp => {
                const formattedDate = exp.date
                  ? new Date(exp.date + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : String(exp.year);
                return (
                  <div
                    key={exp.id}
                    onClick={() => onNavigate('expedient-form', employeeId, exp.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/20 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                        <FolderOpen size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {exp.recordType}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formattedDate}{exp.responsibleDoctor ? ` · ${exp.responsibleDoctor}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                      <StatusBadge status={exp.status} />
                      <RecordActionsMenu employee={employee} expedient={exp} documents={documents} user={user.username} onPrintPreview={(empId, expId) => onNavigate('print-preview', empId, expId)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 3. EXPEDIENTES RELACIONADOS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={18} className="text-blue-600" />
          <p className="section-title">Expedientes relacionados</p>
        </div>
        <p className="text-sm text-slate-400 mb-4 ml-7">
          {relatedExpedients.length} registro{relatedExpedients.length !== 1 ? 's' : ''} · cronológico
        </p>

        {relatedExpedients.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Este empleado aún no tiene expedientes"
            description="Crea el primer registro médico para este empleado."
            action={!isAuditor ? { label: 'Crear expediente', icon: Plus, onClick: () => onNavigate('record-type-select', employeeId) } : undefined}
            compact
          />
        ) : (
          <div className="flex flex-col">
            {relatedExpedients.map((exp, idx) => (
              <button
                key={exp.id}
                onClick={() => onNavigate('expedient-form', employeeId, exp.id)}
                className={`group flex items-center gap-4 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors ${
                  idx !== relatedExpedients.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FolderOpen size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{exp.recordType}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(exp.date + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="hidden sm:block text-sm font-bold text-slate-500 tabular-nums">{exp.year}</div>
                <StatusBadge status={exp.status} />
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      </>)}

      {/* Dialog: Crear carpeta del expediente */}
      {showFolderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowFolderDialog(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-gray-900">Crear carpeta del expediente</p>
            <p className="text-xs text-slate-400 mt-1">Ingresa el año para la nueva carpeta.</p>
            <div className="mt-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Año</label>
              <input
                type="number"
                autoFocus
                value={newFolderYear}
                onChange={e => setNewFolderYear(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
                placeholder="2027"
                min="1900"
                max="2100"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
              />
              {showFolderDialog && newFolderYear && years.includes(Number(newFolderYear)) && (
                <p className="text-xs text-red-500 mt-1.5">Ya existe una carpeta para este año.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowFolderDialog(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderYear || Number(newFolderYear) < 1900 || Number(newFolderYear) > 2100 || years.includes(Number(newFolderYear))}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
