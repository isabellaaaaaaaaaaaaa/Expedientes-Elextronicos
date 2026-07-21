import { ArrowLeft, FileText, ClipboardList, Stethoscope, Activity, FlaskConical, MessageSquare, FolderOpen, Printer, CheckCircle2, Pencil } from 'lucide-react';
import type { Employee, Expedient, MedDocument } from '../../types';
import { StatusBadge } from '../../lib/statusConfig';

interface PreviewScreenProps {
  employee: Employee;
  expedient: Partial<Expedient>;
  docs: MedDocument[];
  onBack: () => void;
  onFinalize: () => void;
}

function DocSection({ number, title, icon: Icon, children }: {
  number: number; title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="break-inside-avoid border-b border-slate-200 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0 print:border-slate-300">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xs font-bold text-slate-300 tabular-nums">{String(number).padStart(2, '0')}</span>
        <Icon size={15} className="text-slate-400" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5 break-words">{value || '—'}</p>
    </div>
  );
}

function DocItem({ d }: { d: MedDocument }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <FileText size={14} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
        <p className="text-[11px] text-slate-400">{d.type} · {d.uploadDate}</p>
      </div>
    </div>
  );
}

export function PreviewScreen({ employee, expedient: exp, docs, onBack, onFinalize }: PreviewScreenProps) {
  const fullName = `${employee.firstName} ${employee.lastName1} ${employee.lastName2}`.trim();
  const audiometryDocs = docs.filter(d => d.type === 'Audiometría');
  const otherDocs = docs.filter(d => d.type !== 'Audiometría');
  const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <style>{`@media print { @page { margin: 1.5cm; } body { background: white; } }`}</style>

      {/* Action bar — hidden when printing */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-500 font-medium transition-colors">
          <ArrowLeft size={14} /> Seguir editando
        </button>
        <div className="flex items-center gap-2.5">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition-colors">
            <Printer size={14} /> Imprimir
          </button>
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition-colors">
            <Pencil size={14} /> Editar expediente
          </button>
          <button onClick={onFinalize} className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm">
            <CheckCircle2 size={16} /> Finalizar expediente
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden print:shadow-none print:border-0 print:rounded-none">

        {/* Document header */}
        <div className="px-8 py-6 border-b-2 border-slate-800 print:border-slate-400">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expediente Médico Ocupacional</p>
              <h1 className="text-xl font-bold text-gray-900 mt-1">{exp.recordType ?? 'Expediente'}</h1>
              <p className="text-xs text-slate-500 mt-1">
                Folio: <span className="font-semibold text-slate-700">{exp.year ?? '—'}-{employee.employeeNumber}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Fecha de emisión</p>
              <p className="text-sm font-semibold text-gray-700">{today}</p>
              {exp.status && <div className="mt-2"><StatusBadge status={exp.status} size="md" /></div>}
            </div>
          </div>
        </div>

        {/* Document body */}
        <div className="px-8 py-6">

          {/* Patient info banner */}
          <div className="bg-slate-50 rounded-xl px-5 py-4 mb-6 print:bg-transparent print:border print:border-slate-200">
            <div className="flex items-center gap-4">
              {employee.photoDataUrl ? (
                <img src={employee.photoDataUrl} alt={fullName} className="w-14 h-14 rounded-xl object-cover border border-slate-200 print:border-slate-300" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center print:border-slate-300">
                  <FileText size={20} className="text-slate-300" />
                </div>
              )}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2">
                <FieldRow label="Empleado" value={fullName} />
                <FieldRow label="No. Empleado" value={employee.employeeNumber} />
                <FieldRow label="Departamento" value={employee.department} />
                <FieldRow label="Puesto" value={employee.position} />
              </div>
            </div>
          </div>

          {/* 01. Información general */}
          <DocSection number={1} title="Información general" icon={FolderOpen}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-3">
              <FieldRow label="Tipo de registro" value={exp.recordType ?? ''} />
              <FieldRow label="Fecha del estudio" value={exp.date ?? ''} />
              <FieldRow label="Año" value={String(exp.year ?? '')} />
              <FieldRow label="Médico responsable" value={exp.responsibleDoctor ?? ''} />
            </div>
          </DocSection>

          {/* 02. Antecedentes */}
          <DocSection number={2} title="Antecedentes" icon={ClipboardList}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
              <FieldRow label="Laborales" value={exp.laboralAntecedents ?? ''} />
              <FieldRow label="Patológicos" value={exp.pathologicalAntecedents ?? ''} />
              <FieldRow label="No patológicos" value={exp.nonPathologicalAntecedents ?? ''} />
              <FieldRow label="Heredofamiliares" value={exp.familyAntecedents ?? ''} />
              <FieldRow label="Cirugías" value={exp.surgicalHistory ?? ''} />
              <FieldRow label="Alergias" value={exp.allergies ?? ''} />
              <FieldRow label="Medicamentos" value={exp.medications ?? ''} />
            </div>
          </DocSection>

          {/* 03. Exploración física */}
          <DocSection number={3} title="Exploración física" icon={Stethoscope}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-3">
              <FieldRow label="Peso" value={exp.weight ?? ''} />
              <FieldRow label="Talla" value={exp.height ?? ''} />
              <FieldRow label="IMC" value={exp.bmi ?? ''} />
              <FieldRow label="Presión arterial" value={exp.bloodPressure ?? ''} />
              <FieldRow label="Freq. cardiaca" value={exp.heartRate ?? ''} />
              <FieldRow label="Freq. respiratoria" value={exp.respiratoryRate ?? ''} />
              <FieldRow label="Temperatura" value={exp.temperature ?? ''} />
              <FieldRow label="Saturación O₂" value={exp.oxygenSaturation ?? ''} />
              <FieldRow label="Agudeza visual" value={exp.visualAcuity ?? ''} />
            </div>
            {exp.physicalExamNotes && (
              <div className="mt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notas de exploración</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exp.physicalExamNotes}</p>
              </div>
            )}
          </DocSection>

          {/* 04. Audiometría */}
          <DocSection number={4} title="Audiometría" icon={Activity}>
            {exp.results && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resultados de estudios</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exp.results}</p>
              </div>
            )}
            {audiometryDocs.length > 0 ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Documentos de audiometría</p>
                {audiometryDocs.map(d => <DocItem key={d.id} d={d} />)}
              </div>
            ) : !exp.results ? (
              <p className="text-sm text-slate-400">Sin estudios audiométricos registrados.</p>
            ) : null}
          </DocSection>

          {/* 05. Diagnóstico */}
          <DocSection number={5} title="Diagnóstico" icon={FlaskConical}>
            <div className="grid grid-cols-1 gap-y-3">
              <FieldRow label="Diagnóstico" value={exp.diagnosis ?? ''} />
              <FieldRow label="Recomendaciones" value={exp.recommendations ?? ''} />
            </div>
          </DocSection>

          {/* 06. Observaciones */}
          <DocSection number={6} title="Observaciones" icon={MessageSquare}>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exp.observations || '—'}</p>
          </DocSection>

          {/* 07. Documentos */}
          <DocSection number={7} title="Documentos" icon={FolderOpen}>
            {otherDocs.length === 0 ? (
              <p className="text-sm text-slate-400">Sin documentos adjuntos.</p>
            ) : (
              <div>{otherDocs.map(d => <DocItem key={d.id} d={d} />)}</div>
            )}
          </DocSection>

          {/* Signature area */}
          <div className="mt-8 pt-6 border-t border-slate-200 print:border-slate-300 break-inside-avoid">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-b border-slate-300 pb-1 mb-2 print:border-slate-400" />
                <p className="text-xs font-semibold text-gray-700">{exp.responsibleDoctor || 'Médico responsable'}</p>
                <p className="text-[10px] text-slate-400">Firma del médico</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-300 pb-1 mb-2 print:border-slate-400" />
                <p className="text-xs font-semibold text-gray-700">{fullName}</p>
                <p className="text-[10px] text-slate-400">Empleado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar — hidden when printing */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <p className="text-xs text-slate-500">Al finalizar, el expediente quedará en modo solo lectura y cualquier edición posterior requerirá desbloqueo.</p>
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition-colors">
            <Pencil size={14} /> Editar expediente
          </button>
          <button onClick={onFinalize} className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm">
            <CheckCircle2 size={16} /> Finalizar expediente
          </button>
        </div>
      </div>
    </div>
  );
}
