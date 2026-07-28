import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, ChevronRight, Check, X, Upload, FileText, Image as ImageIcon,
  Loader2, ZoomIn, Trash2, ScanText, Cpu, Eye, AlertTriangle, ClipboardCheck,
  Save, Send, Flag, CircleCheck as CheckCircle2, Stethoscope, ClipboardList, HeartPulse,
  FlaskConical, Baby, UserPlus, RefreshCw, UserMinus, Activity, FilePlus2, ShieldPlus,
  ShieldAlert, Pill, FileSignature, ListChecks, Mail, Search,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { NavigationPage, MedicalRecordType, RecordTypeCategory, EmployeeSnapshot, Expedient, AuthUser } from '../types';
import { useEmployee } from '../hooks/useStore';
import { addExpedient, addDocuments } from '../lib/store';
import { logAction, logChange } from '../lib/auditLog';
import { simulateExtraction, type ExtractedField, HIGH_CONFIDENCE_THRESHOLD } from '../lib/extractionSimulation';
import { EmptyState } from '../components/ui/empty-state';

interface DigitalizationWizardProps {
  employeeId: string;
  year?: number;
  currentUser: AuthUser;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number) => void;
}

const STEPS = [
  { id: 'type', label: 'Tipo de expediente', icon: FileText },
  { id: 'upload', label: 'Subir documento', icon: Upload },
  { id: 'ocr', label: 'Procesamiento OCR', icon: ScanText },
  { id: 'docai', label: 'Document AI', icon: Cpu },
  { id: 'preview', label: 'Vista previa', icon: Eye },
  { id: 'fields', label: 'Campos detectados', icon: ClipboardCheck },
  { id: 'low-confidence', label: 'Baja confianza', icon: AlertTriangle },
  { id: 'validation', label: 'Validación manual', icon: ClipboardCheck },
  { id: 'draft', label: 'Guardar borrador', icon: Save },
  { id: 'review', label: 'Enviar a revisión', icon: Send },
  { id: 'finalize', label: 'Finalizar', icon: Flag },
] as const;

type StepStatus = 'pending' | 'active' | 'completed';

const categories: RecordTypeCategory[] = [
  {
    name: 'Exámenes médicos',
    types: [
      'Examen médico de ingreso',
      'Examen médico periódico',
      'Examen médico de promoción',
      'Examen médico de retiro',
      'Examen médico de reingreso',
    ],
  },
  {
    name: 'Consultas y seguimiento',
    types: ['Hoja de consulta', 'Monitoreo de salud', 'Hoja de incapacidad', 'Valoración post incapacidad'],
  },
  {
    name: 'Primeros auxilios',
    types: ['Reporte de primeros auxilios', 'Informe de investigación de primeros auxilios del supervisor'],
  },
  {
    name: 'Pruebas y formatos',
    types: ['Prueba de antidoping', 'Declaración de consentimiento bajo información', 'Listado de verificación del expediente médico'],
  },
  {
    name: 'Salud materna',
    types: ['Carnet de control prenatal', 'Memorándum de notificación de embarazo'],
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
  'Ingreso': UserPlus, 'Periódico': Stethoscope, 'Nota médica': FileText,
  'Primeros auxilios': ShieldAlert, 'Alcoholimetría': Pill, 'Laboratorio': FlaskConical,
  'Radiografía': FileText, 'Incapacidad': FilePlus2, 'Otro': FileText,
  'Consulta médica': ClipboardList, 'Control crónico degenerativo': HeartPulse,
  'Control prenatal': Baby, 'Antidoping': Pill,
};

const categoryStyles: Record<string, { bg: string; fg: string; ring: string }> = {
  'Exámenes médicos':        { bg: 'bg-red-50',    fg: 'text-[hsl(355,78%,51%)]', ring: 'hover:border-red-300 hover:bg-red-50' },
  'Consultas y seguimiento': { bg: 'bg-teal-50',   fg: 'text-teal-600',   ring: 'hover:border-teal-300 hover:bg-teal-50' },
  'Primeros auxilios':       { bg: 'bg-orange-50', fg: 'text-orange-600', ring: 'hover:border-orange-300 hover:bg-orange-50' },
  'Pruebas y formatos':      { bg: 'bg-amber-50',  fg: 'text-amber-600',  ring: 'hover:border-amber-300 hover:bg-amber-50' },
  'Salud materna':           { bg: 'bg-pink-50',   fg: 'text-pink-500',   ring: 'hover:border-pink-300 hover:bg-pink-50' },
};

interface UploadedFile {
  id: string;
  name: string;
  dataUrl: string;
  fileType: 'pdf' | 'image';
}

export default function DigitalizationWizard({ employeeId, year, currentUser, onNavigate }: DigitalizationWizardProps) {
  const employee = useEmployee(employeeId);
  const effectiveYear = year ?? new Date().getFullYear();

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<MedicalRecordType | null>(null);
  const [typeQuery, setTypeQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [docaiProgress, setDocaiProgress] = useState(0);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [validatedFields, setValidatedFields] = useState<Record<string, string>>({});
  const [reviewedLowConfidence, setReviewedLowConfidence] = useState<Set<string>>(new Set());
  const [draftSaved, setDraftSaved] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 text-sm">Empleado no encontrado.</p>
        <button onClick={() => onNavigate('employees')} className="mt-3 text-red-500 text-sm font-medium hover:underline">Volver</button>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName1} ${employee.lastName2}`.trim();
  const currentStep = STEPS[stepIndex];

  const getStepStatus = (idx: number): StepStatus => {
    if (idx < stepIndex) return 'completed';
    if (idx === stepIndex) return 'active';
    return 'pending';
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1);
  };
  const goPrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleSelectType = (type: MedicalRecordType) => {
    setSelectedType(type);
    setStepIndex(1);
    toast.success('Tipo de expediente seleccionado', { description: type });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        setUploadedFiles(prev => [...prev, {
          id: `file-${Date.now()}-${file.name}`,
          name: file.name,
          dataUrl,
          fileType: isPdf ? 'pdf' : 'image',
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => setUploadedFiles(prev => prev.filter(f => f.id !== id));

  const startOcr = () => {
    setOcrProgress(0);
    const interval = setInterval(() => {
      setOcrProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 5;
      });
    }, 80);
    goNext();
  };

  const startDocAI = () => {
    setDocaiProgress(0);
    const interval = setInterval(() => {
      setDocaiProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          if (selectedType) {
            const fields = simulateExtraction(selectedType);
            setExtractedFields(fields);
            const initial: Record<string, string> = {};
            fields.forEach(f => { initial[f.key] = f.value; });
            setValidatedFields(initial);
          }
          return 100;
        }
        return p + 4;
      });
    }, 100);
    goNext();
  };

  const lowConfidenceFields = extractedFields.filter(f => f.confidence < HIGH_CONFIDENCE_THRESHOLD);
  const highConfidenceFields = extractedFields.filter(f => f.confidence >= HIGH_CONFIDENCE_THRESHOLD);
  const allLowConfidenceReviewed = lowConfidenceFields.length === 0 || lowConfidenceFields.every(f => reviewedLowConfidence.has(f.key));

  const markLowConfidenceReviewed = (key: string) => {
    setReviewedLowConfidence(prev => new Set([...prev, key]));
  };

  const handleSaveDraft = () => {
    setSaving(true);
    const toastId = toast.loading('Guardando borrador...');
    setTimeout(() => {
      setSaving(false);
      setDraftSaved(true);
      toast.success('Borrador guardado', { id: toastId, description: 'Puedes continuar más tarde.' });
      goNext();
    }, 800);
  };

  const handleSendReview = () => {
    setSaving(true);
    const toastId = toast.loading('Enviando a revisión...');
    setTimeout(() => {
      setSaving(false);
      setReviewSent(true);
      toast.success('Expediente enviado a revisión', { id: toastId, description: 'Un auditor validará la información.' });
      goNext();
    }, 800);
  };

  const handleFinalize = () => {
    setSaving(true);
    const toastId = toast.loading('Finalizando expediente...');
    setTimeout(() => {
      if (!selectedType || !employee) return;
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
      const observations = validatedFields['observations'] ?? '';
      const newExp: Expedient = {
        id: newId,
        employeeId,
        recordType: selectedType,
        year: effectiveYear,
        date: validatedFields['date'] ?? now,
        responsibleDoctor: validatedFields['doctorName'] ?? '',
        observations,
        diagnosis: validatedFields['diagnosis'] ?? '',
        results: '',
        weight: validatedFields['weight'] ?? '',
        height: validatedFields['height'] ?? '',
        status: 'Finalizado',
        employeeSnapshot: snapshot,
        createdAt: now,
        updatedAt: now,
      };
      addExpedient(newExp);
      const docs = uploadedFiles.map((f, i) => ({
        id: `doc-${Date.now()}-${i}`,
        expedientId: newId,
        employeeId,
        name: f.name,
        type: selectedType as any,
        fileType: f.fileType,
        dataUrl: f.dataUrl,
        uploadedBy: currentUser.username,
        uploadDate: now,
      }));
      addDocuments(docs as any);
      logAction(newId, currentUser.username, 'Creación del expediente', 'Expediente creado mediante digitalización');
      logAction(newId, currentUser.username, 'Finalización', 'Expediente finalizado tras validación médica');
      logChange(newId, currentUser.username, 'Estado', '', 'Finalizado');
      setSaving(false);
      setFinalized(true);
      toast.success('Expediente finalizado correctamente', {
        id: toastId,
        description: `${selectedType} · ${effectiveYear}`,
      });
    }, 1000);
  };

  const filteredCategories = categories
    .map(cat => ({ ...cat, types: cat.types.filter(t => t.toLowerCase().includes(typeQuery.toLowerCase())) }))
    .filter(cat => cat.types.length > 0);

  return (
    <div className="max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 flex-wrap mb-4">
        <button onClick={() => onNavigate('employee-profile', employeeId, undefined, effectiveYear)} className="flex items-center gap-1.5 hover:text-red-500 font-medium transition-colors">
          <ArrowLeft size={13} /> {fullName}
        </button>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-600 font-semibold">{effectiveYear}</span>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-600 font-semibold">Digitalización</span>
      </nav>

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Digitalización de expediente</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Proceso completo de captura, extracción y validación para <span className="font-semibold text-slate-600">{fullName}</span>
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex items-center gap-0 min-w-max">
          {STEPS.map((step, idx) => {
            const status = getStepStatus(idx);
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5 w-[88px] flex-shrink-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'active'
                        ? 'bg-[hsl(355,78%,51%)] text-white shadow-md shadow-red-500/20 ring-4 ring-red-500/10'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {status === 'completed' ? <Check size={16} strokeWidth={3} /> : <Icon size={15} />}
                  </div>
                  <p className={`text-[10px] font-semibold text-center leading-tight ${
                    status === 'active' ? 'text-[hsl(355,78%,51%)]' : status === 'completed' ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 w-6 mt-[-20px] rounded-full transition-colors ${
                    status === 'completed' ? 'bg-green-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
        {/* STEP 0: Select type */}
        {currentStep.id === 'type' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Selecciona el tipo de expediente</h3>
                <p className="text-sm text-slate-400 mt-0.5">Elige el tipo de documento médico a digitalizar</p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={typeQuery}
                  onChange={e => setTypeQuery(e.target.value)}
                  placeholder="Buscar tipo..."
                  className="pl-8 pr-3 h-9 text-sm bg-slate-100/70 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-red-500/15 transition-all w-full sm:w-56"
                />
              </div>
            </div>
            <div className="space-y-6">
              {filteredCategories.map(cat => {
                const style = categoryStyles[cat.name] ?? categoryStyles['Pruebas y formatos'];
                return (
                  <div key={cat.name}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-1.5 h-5 rounded-full ${style.fg.replace('text-', 'bg-')}`} />
                      <h4 className="text-sm font-bold text-gray-800">{cat.name}</h4>
                      <span className="text-xs text-slate-300 font-medium">{cat.types.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cat.types.map(type => {
                        const Icon = typeIcons[type] ?? FileText;
                        return (
                          <button
                            key={type}
                            onClick={() => handleSelectType(type)}
                            className={`group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl transition-all text-left ${style.ring} ${selectedType === type ? 'border-[hsl(355,78%,51%)] ring-2 ring-red-500/15' : ''}`}
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
                  <EmptyState icon={FileText} title="No se encontraron tipos de registro" description="Intenta con otro término de búsqueda." action={typeQuery ? { label: 'Limpiar búsqueda', icon: X, onClick: () => setTypeQuery('') } : undefined} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Upload */}
        {currentStep.id === 'upload' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Subir documento</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Sube el documento físico escaneado para <span className="font-semibold text-slate-600">{selectedType}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50/60 rounded-lg border border-red-100">
              <FileText size={14} className="text-[hsl(355,78%,51%)]" />
              <span className="text-xs font-semibold text-slate-600">Tipo seleccionado: {selectedType}</span>
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="w-full border-2 border-dashed border-slate-200 hover:border-red-300 hover:bg-red-50/30 rounded-xl p-12 text-center transition-all group"
            >
              <Upload size={32} className="mx-auto text-slate-300 group-hover:text-red-400 mb-3 transition-colors" />
              <p className="text-sm font-semibold text-slate-500 group-hover:text-[hsl(355,78%,51%)] transition-colors">Toca o arrastra archivos aquí</p>
              <p className="text-xs text-slate-400 mt-1">Formatos permitidos: PDF, JPG, PNG</p>
            </button>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archivos subidos ({uploadedFiles.length})</p>
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {file.fileType === 'image' ? <ImageIcon size={16} className="text-slate-400" /> : <FileText size={16} className="text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-400">{file.fileType.toUpperCase()}</p>
                    </div>
                    {file.fileType === 'image' && (
                      <button onClick={() => setPreviewUrl(file.dataUrl)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-colors">
                        <ZoomIn size={14} />
                      </button>
                    )}
                    <button onClick={() => removeFile(file.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: OCR Processing */}
        {currentStep.id === 'ocr' && (
          <ProcessingStep
            title="Procesamiento OCR"
            subtitle="Reconocimiento óptico de caracteres en el documento"
            icon={ScanText}
            progress={ocrProgress}
            steps={[
              { label: 'Preprocesamiento de imagen', done: ocrProgress >= 25 },
              { label: 'Detección de regiones de texto', done: ocrProgress >= 50 },
              { label: 'Reconocimiento de caracteres', done: ocrProgress >= 75 },
              { label: 'Estructuración de texto extraído', done: ocrProgress >= 100 },
            ]}
            onComplete={startDocAI}
            autoAdvance
          />
        )}

        {/* STEP 3: Document AI */}
        {currentStep.id === 'docai' && (
          <ProcessingStep
            title="Procesamiento con Document AI"
            subtitle="Análisis inteligente y extracción estructurada de campos médicos"
            icon={Cpu}
            progress={docaiProgress}
            steps={[
              { label: 'Clasificación del documento', done: docaiProgress >= 20 },
              { label: 'Detección de entidades médicas', done: docaiProgress >= 40 },
              { label: 'Extracción de campos estructurados', done: docaiProgress >= 60 },
              { label: 'Cálculo de puntajes de confianza', done: docaiProgress >= 80 },
              { label: 'Generación de resultados estructurados', done: docaiProgress >= 100 },
            ]}
            onComplete={goNext}
            autoAdvance
          />
        )}

        {/* STEP 4: Preview extracted data */}
        {currentStep.id === 'preview' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Vista previa de datos extraídos</h3>
              <p className="text-sm text-slate-400 mt-0.5">Revisa los datos que el sistema identificó del documento</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento original</p>
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-[3/4] flex items-center justify-center relative">
                  {uploadedFiles[0]?.fileType === 'image' ? (
                    <img src={uploadedFiles[0].dataUrl} alt="Documento" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <FileText size={48} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">{uploadedFiles[0]?.name ?? 'Sin archivo'}</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-semibold">ORIGINAL</div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumen de extracción</p>
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Campos extraídos</span>
                    <span className="text-sm font-bold text-gray-900">{extractedFields.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Alta confianza</span>
                    <span className="text-sm font-bold text-green-600">{highConfidenceFields.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Baja confianza</span>
                    <span className="text-sm font-bold text-amber-600">{lowConfidenceFields.length}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400">Confianza promedio</span>
                      <span className="text-xs font-bold text-gray-700">
                        {extractedFields.length > 0 ? Math.round(extractedFields.reduce((s, f) => s + f.confidence, 0) / extractedFields.length * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${extractedFields.length > 0 ? Math.round(extractedFields.reduce((s, f) => s + f.confidence, 0) / extractedFields.length * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Detected fields */}
        {currentStep.id === 'fields' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Campos detectados</h3>
              <p className="text-sm text-slate-400 mt-0.5">Todos los campos identificados por Document AI con su nivel de confianza</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extractedFields.map(field => (
                <FieldCard key={field.key} field={field} />
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Low confidence fields */}
        {currentStep.id === 'low-confidence' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Campos con baja confianza</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Estos campos requieren revisión. Marca cada uno como revisado para continuar.
              </p>
            </div>
            {lowConfidenceFields.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No hay campos con baja confianza</p>
                <p className="text-xs text-slate-400 mt-1">Todos los campos superan el umbral de confianza ({Math.round(HIGH_CONFIDENCE_THRESHOLD * 100)}%)</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowConfidenceFields.map(field => {
                  const reviewed = reviewedLowConfidence.has(field.key);
                  return (
                    <div key={field.key} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${reviewed ? 'bg-green-50/50 border-green-200' : 'bg-amber-50/40 border-amber-200'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-700">{field.label}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${reviewed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {Math.round(field.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{field.value}</p>
                      </div>
                      <button
                        onClick={() => markLowConfidenceReviewed(field.key)}
                        disabled={reviewed}
                        className={`flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-lg transition-colors ${reviewed ? 'bg-green-100 text-green-700 cursor-default' : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'}`}
                      >
                        {reviewed ? <><Check size={12} /> Revisado</> : <><AlertTriangle size={12} /> Marcar revisado</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Manual validation */}
        {currentStep.id === 'validation' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Validación manual por personal médico</h3>
              <p className="text-sm text-slate-400 mt-0.5">Corrige o confirma los valores extraídos antes de guardar</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extractedFields.map(field => (
                <div key={field.key} className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600">{field.label}</label>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${field.confidence >= HIGH_CONFIDENCE_THRESHOLD ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {Math.round(field.confidence * 100)}%
                    </span>
                  </div>
                  <input
                    type="text"
                    value={validatedFields[field.key] ?? ''}
                    onChange={e => setValidatedFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className={`w-full px-3 h-9 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/15 focus:border-red-400 focus:bg-white transition-all ${
                      field.confidence < HIGH_CONFIDENCE_THRESHOLD ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: Save draft */}
        {currentStep.id === 'draft' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Guardar borrador</h3>
              <p className="text-sm text-slate-400 mt-0.5">El expediente se guardará como borrador para revisión posterior</p>
            </div>
            <div className={`rounded-xl border p-6 text-center transition-all ${draftSaved ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              {draftSaved ? (
                <>
                  <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Borrador guardado correctamente</p>
                  <p className="text-xs text-slate-400 mt-1">El expediente está disponible para continuar el proceso</p>
                </>
              ) : (
                <>
                  <Save size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-500">El borrador incluirá todos los datos validados</p>
                  <p className="text-xs text-slate-400 mt-1">{Object.keys(validatedFields).length} campos listos para guardar</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 9: Send to review */}
        {currentStep.id === 'review' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Enviar a revisión</h3>
              <p className="text-sm text-slate-400 mt-0.5">El expediente será enviado al auditor para su validación final</p>
            </div>
            <div className={`rounded-xl border p-6 text-center transition-all ${reviewSent ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              {reviewSent ? (
                <>
                  <Send size={40} className="mx-auto text-blue-500 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Expediente enviado a revisión</p>
                  <p className="text-xs text-slate-400 mt-1">El auditor recibirá una notificación para validar este expediente</p>
                </>
              ) : (
                <>
                  <Send size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Confirma el envío a revisión</p>
                  <p className="text-xs text-slate-400 mt-1">Un auditor validará la información antes de finalizar</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 10: Finalize */}
        {currentStep.id === 'finalize' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Finalizar expediente</h3>
              <p className="text-sm text-slate-400 mt-0.5">El expediente se guardará como finalizado y quedará bloqueado para edición</p>
            </div>
            <div className={`rounded-xl border p-6 text-center transition-all ${finalized ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              {finalized ? (
                <>
                  <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3" />
                  <p className="text-base font-bold text-slate-700">Expediente finalizado correctamente</p>
                  <p className="text-sm text-slate-500 mt-1">{selectedType} · {effectiveYear}</p>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    <button onClick={() => onNavigate('employee-profile', employeeId, undefined, effectiveYear)} className="px-4 h-9 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-colors">
                      Ver expediente del empleado
                    </button>
                    <button onClick={() => onNavigate('expedients')} className="px-4 h-9 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
                      Ir a lista de expedientes
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Flag size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Al finalizar, el expediente quedará bloqueado</p>
                  <p className="text-xs text-slate-400 mt-1">{uploadedFiles.length} documento(s) · {extractedFields.length} campos validados</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={goPrev}
          disabled={stepIndex === 0 || saving}
          className="flex items-center gap-1.5 px-4 h-10 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <ArrowLeft size={15} /> Anterior
        </button>

        <p className="text-xs text-slate-400 hidden sm:block">Paso {stepIndex + 1} de {STEPS.length}</p>

        <div className="flex items-center gap-2">
          {currentStep.id === 'upload' && uploadedFiles.length > 0 && (
            <button onClick={startOcr} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-colors shadow-sm">
              Iniciar OCR <ArrowRight size={15} />
            </button>
          )}
          {currentStep.id === 'preview' && (
            <button onClick={goNext} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-colors shadow-sm">
              Ver campos detectados <ArrowRight size={15} />
            </button>
          )}
          {currentStep.id === 'fields' && (
            <button onClick={goNext} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-colors shadow-sm">
              Continuar <ArrowRight size={15} />
            </button>
          )}
          {currentStep.id === 'low-confidence' && (
            <button
              onClick={goNext}
              disabled={!allLowConfidenceReviewed}
              className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              {allLowConfidenceReviewed ? 'Continuar a validación' : 'Revisa todos los campos'} <ArrowRight size={15} />
            </button>
          )}
          {currentStep.id === 'validation' && (
            <button onClick={goNext} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-colors shadow-sm">
              Continuar <ArrowRight size={15} />
            </button>
          )}
          {currentStep.id === 'draft' && !draftSaved && (
            <button onClick={handleSaveDraft} disabled={saving} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] disabled:opacity-60 rounded-lg transition-colors shadow-sm">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>
          )}
          {currentStep.id === 'draft' && draftSaved && (
            <button onClick={goNext} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-colors shadow-sm">
              Enviar a revisión <ArrowRight size={15} />
            </button>
          )}
          {currentStep.id === 'review' && !reviewSent && (
            <button onClick={handleSendReview} disabled={saving} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-60 rounded-lg transition-colors shadow-sm">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {saving ? 'Enviando...' : 'Enviar a revisión'}
            </button>
          )}
          {currentStep.id === 'review' && reviewSent && (
            <button onClick={goNext} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-colors shadow-sm">
              Finalizar <ArrowRight size={15} />
            </button>
          )}
          {currentStep.id === 'finalize' && !finalized && (
            <button onClick={handleFinalize} disabled={saving} className="flex items-center gap-1.5 px-5 h-10 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-60 rounded-lg transition-colors shadow-sm">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />} {saving ? 'Finalizando...' : 'Finalizar expediente'}
            </button>
          )}
        </div>
      </div>

      {/* Full-screen preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors" onClick={() => setPreviewUrl(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function FieldCard({ field }: { field: ExtractedField }) {
  const isHigh = field.confidence >= HIGH_CONFIDENCE_THRESHOLD;
  return (
    <div className={`p-4 rounded-xl border transition-all ${isHigh ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-600">{field.label}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isHigh ? 'bg-green-50 text-green-600' : 'bg-amber-100 text-amber-700'}`}>
          {Math.round(field.confidence * 100)}%
        </span>
      </div>
      <p className="text-sm text-slate-700 font-medium">{field.value}</p>
      <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isHigh ? 'bg-green-500' : 'bg-amber-400'}`}
          style={{ width: `${Math.round(field.confidence * 100)}%` }}
        />
      </div>
    </div>
  );
}

interface ProcessingStepProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  progress: number;
  steps: { label: string; done: boolean }[];
  onComplete: () => void;
  autoAdvance?: boolean;
}

function ProcessingStep({ title, subtitle, icon: _Icon, progress, steps, onComplete, autoAdvance }: ProcessingStepProps) {
  const calledRef = useRef(false);
  useEffect(() => {
    if (progress >= 100 && autoAdvance && !calledRef.current) {
      calledRef.current = true;
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [progress, autoAdvance, onComplete]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex flex-col items-center py-6">
        <div className="relative w-24 h-24 mb-5">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="hsl(355,78%,51%)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
              className="transition-all duration-200"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {progress < 100 ? (
              <Loader2 size={24} className="animate-spin text-[hsl(355,78%,51%)]" />
            ) : (
              <Check size={28} className="text-green-500" strokeWidth={3} />
            )}
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{progress}%</p>
        <p className="text-xs text-slate-400 mt-0.5">{progress < 100 ? 'Procesando...' : 'Completado'}</p>
      </div>
      <div className="space-y-2.5 max-w-md mx-auto w-full">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${s.done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
              {s.done ? <Check size={12} strokeWidth={3} /> : <Loader2 size={11} className={s.done ? '' : 'animate-spin'} />}
            </div>
            <p className={`text-sm transition-colors ${s.done ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
