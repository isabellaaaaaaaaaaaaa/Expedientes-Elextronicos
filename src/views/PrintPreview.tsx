import { ArrowLeft, Printer, FileDown, Building2 } from 'lucide-react';
import { employees, expedients, documents } from '../data/mockData';
import { exportRegistroToPDF } from '../lib/exportUtils';
import { StatusBadge } from '../lib/statusConfig';
import type { AuthUser, NavigationPage } from '../types';

interface PrintPreviewProps {
  employeeId: string;
  expedientId: string;
  user: AuthUser;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number) => void;
}

function DocRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <p className="w-44 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex-shrink-0 pt-0.5">{label}</p>
      <p className="text-sm text-gray-800 break-words flex-1">{value || '—'}</p>
    </div>
  );
}

function DocRowOpt({ label, value }: { label: string; value: string | undefined }) {
  return <DocRow label={label} value={value ?? ''} />;
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-section">
      <h3 className="print-section-title">{title}</h3>
      <div className="print-section-body">{children}</div>
    </section>
  );
}

export default function PrintPreview({ employeeId, expedientId, user, onNavigate }: PrintPreviewProps) {
  const employee = employees.find(e => e.id === employeeId);
  const expedient = expedients.find(e => e.id === expedientId);

  if (!employee || !expedient) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 text-sm">Expediente no encontrado.</p>
        <button onClick={() => onNavigate('expedients')} className="mt-3 text-blue-500 text-sm font-medium hover:underline">Volver</button>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName1} ${employee.lastName2}`.trim();
  const docs = documents.filter(d => d.expedientId === expedientId);
  const examDate = new Date(expedient.date + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => exportRegistroToPDF(employee, expedient);

  const handleBack = () => onNavigate('employee-profile', employeeId, undefined, expedient.year);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Toolbar */}
      <div className="print-toolbar flex items-center justify-between gap-3 flex-wrap card px-4 py-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={15} /> Regresar
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            <FileDown size={15} className="text-slate-500" /> Descargar PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200"
          >
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {/* A4 document sheet */}
      <div className="print-sheet bg-white rounded-2xl border border-slate-200 shadow-sm mx-auto">
        {/* Official letterhead */}
        <header className="print-header">
          <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg tracking-tight">
                N
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 leading-tight">NEXTEER</p>
                <p className="text-[11px] text-slate-500 leading-tight">Área Médica Empresarial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento</p>
              <p className="text-sm font-bold text-gray-900">EXPEDIENTE MÉDICO</p>
            </div>
          </div>

          <div className="text-center pt-4">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Expediente Médico del Empleado</h1>
            <p className="text-xs text-slate-500 mt-1">{expedient.recordType} · Año {expedient.year}</p>
          </div>
        </header>

        {/* Employee info grid */}
        <section className="print-info">
          <h3 className="print-section-title">Información del Empleado</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            <DocRow label="Nombre" value={fullName} />
            <DocRow label="No. Empleado" value={employee.employeeNumber} />
            <DocRow label="Departamento" value={employee.department} />
            <DocRow label="Puesto" value={employee.position} />
            <DocRow label="Planta" value={`Planta ${employee.planta}`} />
            <DocRow label="Fecha del examen" value={examDate} />
            <DocRowOpt label="Tipo de expediente" value={expedient.recordType} />
            <DocRowOpt label="Médico responsable" value={expedient.responsibleDoctor} />
            <div className="flex items-center gap-3 py-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">Estado</p>
              <StatusBadge status={expedient.status} size="sm" />
            </div>
          </div>
        </section>

        {/* Expedient sections */}
        <PrintSection title="Datos Generales">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <DocRowOpt label="Tipo de registro" value={expedient.recordType} />
            <DocRow label="Fecha" value={examDate} />
            <DocRow label="Año" value={String(expedient.year)} />
            <DocRowOpt label="Médico responsable" value={expedient.responsibleDoctor} />
          </div>
        </PrintSection>

        <PrintSection title="Antecedentes">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <DocRowOpt label="Laborales" value={expedient.laboralAntecedents} />
            <DocRowOpt label="Patológicos" value={expedient.pathologicalAntecedents} />
            <DocRowOpt label="No patológicos" value={expedient.nonPathologicalAntecedents} />
            <DocRowOpt label="Heredofamiliares" value={expedient.familyAntecedents} />
            <DocRowOpt label="Cirugías" value={expedient.surgicalHistory} />
            <DocRowOpt label="Alergias" value={expedient.allergies} />
            <DocRowOpt label="Medicamentos" value={expedient.medications} />
          </div>
        </PrintSection>

        <PrintSection title="Exploración Física">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
            <DocRowOpt label="Peso" value={expedient.weight} />
            <DocRowOpt label="Talla" value={expedient.height} />
            <DocRowOpt label="IMC" value={expedient.bmi} />
            <DocRowOpt label="Presión arterial" value={expedient.bloodPressure} />
            <DocRowOpt label="Freq. cardiaca" value={expedient.heartRate} />
            <DocRowOpt label="Freq. respiratoria" value={expedient.respiratoryRate} />
            <DocRowOpt label="Temperatura" value={expedient.temperature} />
            <DocRowOpt label="Saturación O₂" value={expedient.oxygenSaturation} />
          </div>
          <div className="mt-3">
            <DocRowOpt label="Agudeza visual" value={expedient.visualAcuity} />
            <DocRowOpt label="Notas de exploración" value={expedient.physicalExamNotes} />
          </div>
        </PrintSection>

        <PrintSection title="Diagnóstico">
          <DocRowOpt label="Resultados de estudios" value={expedient.results} />
          <DocRowOpt label="Diagnóstico" value={expedient.diagnosis} />
          <DocRowOpt label="Recomendaciones" value={expedient.recommendations} />
        </PrintSection>

        <PrintSection title="Observaciones">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{(expedient.observations ?? '') || '—'}</p>
        </PrintSection>

        <PrintSection title="Documentos Adjuntos">
          {docs.length === 0 ? (
            <p className="text-sm text-slate-400">Sin documentos adjuntos</p>
          ) : (
            <ul className="space-y-1.5">
              {docs.map(d => (
                <li key={d.id} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                  {d.name} <span className="text-xs text-slate-400">· {d.type}</span>
                </li>
              ))}
            </ul>
          )}
        </PrintSection>

        {/* Signature footer */}
        <footer className="print-footer">
          <div className="grid grid-cols-2 gap-12 pt-10">
            <div className="text-center">
              <div className="border-t border-slate-400 pt-1.5 mx-8" />
              <p className="text-xs text-slate-600 mt-1">Médico Responsable</p>
              <p className="text-[11px] text-slate-400">{expedient.responsibleDoctor || '—'}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 pt-1.5 mx-8" />
              <p className="text-xs text-slate-600 mt-1">Empleado</p>
              <p className="text-[11px] text-slate-400">{fullName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-8 mt-8 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <Building2 size={11} /> Generado por MedExpedient · Planta {user.planta}
            </p>
            <p className="text-[10px] text-slate-400">
              {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
