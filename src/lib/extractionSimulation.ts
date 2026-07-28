import type { MedicalRecordType } from '../types';

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  category: 'auto' | 'low-confidence';
}

const FIELD_TEMPLATES: Record<string, { label: string; generator: () => string; baseConfidence: number }> = {
  employeeName: { label: 'Nombre del empleado', generator: () => 'GARCIA MENDOZA JUAN CARLOS', baseConfidence: 0.97 },
  employeeNumber: { label: 'Número de empleado', generator: () => 'EMP-' + String(Math.floor(1000 + Math.random() * 9000)), baseConfidence: 0.95 },
  curp: { label: 'CURP', generator: () => 'GAMC' + Math.floor(Math.random() * 9000 + 1000) + 'H' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0') + '12', baseConfidence: 0.88 },
  rfc: { label: 'RFC', generator: () => 'GAMC' + String(Math.floor(Math.random() * 900000 + 100000)).slice(0, 6) + 'XX1', baseConfidence: 0.91 },
  nss: { label: 'NSS', generator: () => String(Math.floor(10000000000 + Math.random() * 89999999999)), baseConfidence: 0.84 },
  date: { label: 'Fecha del estudio', generator: () => '2026-07-' + String(Math.floor(1 + Math.random() * 28)).padStart(2, '0'), baseConfidence: 0.93 },
  doctorName: { label: 'Médico responsable', generator: () => 'Dr. Roberto Sánchez Martínez', baseConfidence: 0.96 },
  diagnosis: { label: 'Diagnóstico', generator: () => 'Sano, sin hallazgos patológicos', baseConfidence: 0.72 },
  observations: { label: 'Observaciones', generator: () => 'Paciente se encuentra en buenas condiciones de salud', baseConfidence: 0.68 },
  bloodPressure: { label: 'Presión arterial', generator: () => '120/80 mmHg', baseConfidence: 0.89 },
  weight: { label: 'Peso (kg)', generator: () => String(Math.floor(60 + Math.random() * 30)) + ' kg', baseConfidence: 0.90 },
  height: { label: 'Estatura (cm)', generator: () => String(Math.floor(160 + Math.random() * 25)) + ' cm', baseConfidence: 0.90 },
  glucose: { label: 'Glucosa (mg/dL)', generator: () => String(Math.floor(80 + Math.random() * 40)) + ' mg/dL', baseConfidence: 0.86 },
  drugResult: { label: 'Resultado antidoping', generator: () => 'Negativo', baseConfidence: 0.94 },
  signature: { label: 'Firma del paciente', generator: () => 'Detectada', baseConfidence: 0.81 },
  department: { label: 'Departamento', generator: () => 'Producción', baseConfidence: 0.78 },
  position: { label: 'Puesto', generator: () => 'Operador de línea', baseConfidence: 0.76 },
  company: { label: 'Empresa', generator: () => 'Nexteer Automotive', baseConfidence: 0.98 },
  clinic: { label: 'Clínica', generator: () => 'Consultorio Médico Planta 61', baseConfidence: 0.97 },
  folio: { label: 'Folio', generator: () => 'F-' + String(Math.floor(10000 + Math.random() * 90000)), baseConfidence: 0.82 },
  incapacityDays: { label: 'Días de incapacidad', generator: () => String(Math.floor(1 + Math.random() * 5)) + ' día(s)', baseConfidence: 0.74 },
  injuryType: { label: 'Tipo de lesión', generator: () => 'Herida leve en mano derecha', baseConfidence: 0.65 },
  cause: { label: 'Causa', generator: () => 'Manipulación de herramienta sin EPP', baseConfidence: 0.61 },
  pregnancyWeek: { label: 'Semana de gestación', generator: () => String(Math.floor(8 + Math.random() * 20)) + ' semanas', baseConfidence: 0.70 },
};

const RECORD_TYPE_FIELDS: Record<string, string[]> = {
  'Examen médico de ingreso':      ['employeeName', 'employeeNumber', 'curp', 'rfc', 'date', 'doctorName', 'bloodPressure', 'weight', 'height', 'glucose', 'diagnosis', 'observations', 'signature', 'company', 'clinic', 'folio'],
  'Examen médico periódico':       ['employeeName', 'employeeNumber', 'date', 'doctorName', 'bloodPressure', 'weight', 'height', 'glucose', 'diagnosis', 'observations', 'signature', 'clinic', 'folio'],
  'Examen médico de promoción':    ['employeeName', 'employeeNumber', 'date', 'doctorName', 'department', 'position', 'bloodPressure', 'weight', 'height', 'diagnosis', 'observations', 'signature', 'clinic', 'folio'],
  'Examen médico de retiro':       ['employeeName', 'employeeNumber', 'curp', 'rfc', 'nss', 'date', 'doctorName', 'bloodPressure', 'weight', 'height', 'diagnosis', 'observations', 'signature', 'company', 'clinic', 'folio'],
  'Examen médico de reingreso':    ['employeeName', 'employeeNumber', 'date', 'doctorName', 'bloodPressure', 'weight', 'height', 'glucose', 'diagnosis', 'observations', 'signature', 'clinic', 'folio'],
  'Declaración de consentimiento bajo información': ['employeeName', 'employeeNumber', 'date', 'doctorName', 'signature', 'clinic', 'folio', 'observations'],
  'Prueba de antidoping':          ['employeeName', 'employeeNumber', 'date', 'doctorName', 'drugResult', 'observations', 'signature', 'clinic', 'folio'],
  'Monitoreo de salud':            ['employeeName', 'employeeNumber', 'date', 'doctorName', 'bloodPressure', 'weight', 'height', 'glucose', 'observations', 'signature', 'clinic', 'folio'],
  'Hoja de incapacidad':           ['employeeName', 'employeeNumber', 'date', 'doctorName', 'incapacityDays', 'diagnosis', 'observations', 'signature', 'clinic', 'folio'],
  'Hoja de consulta':              ['employeeName', 'employeeNumber', 'date', 'doctorName', 'diagnosis', 'observations', 'bloodPressure', 'weight', 'height', 'signature', 'clinic', 'folio'],
  'Valoración post incapacidad':   ['employeeName', 'employeeNumber', 'date', 'doctorName', 'diagnosis', 'observations', 'bloodPressure', 'weight', 'height', 'signature', 'clinic', 'folio'],
  'Carnet de control prenatal':    ['employeeName', 'employeeNumber', 'date', 'doctorName', 'pregnancyWeek', 'bloodPressure', 'weight', 'observations', 'signature', 'clinic', 'folio'],
  'Memorándum de notificación de embarazo': ['employeeName', 'employeeNumber', 'date', 'pregnancyWeek', 'department', 'position', 'observations', 'signature', 'company', 'folio'],
  'Listado de verificación del expediente médico': ['employeeName', 'employeeNumber', 'date', 'doctorName', 'clinic', 'folio', 'observations'],
  'Reporte de primeros auxilios':  ['employeeName', 'employeeNumber', 'date', 'doctorName', 'injuryType', 'cause', 'observations', 'signature', 'clinic', 'folio'],
  'Informe de investigación de primeros auxilios del supervisor': ['employeeName', 'employeeNumber', 'date', 'injuryType', 'cause', 'department', 'position', 'observations', 'signature', 'company', 'folio'],
};

const LOW_CONFIDENCE_VARIANCE = 0.15;

export function simulateExtraction(recordType: MedicalRecordType): ExtractedField[] {
  const fieldKeys = RECORD_TYPE_FIELDS[recordType] ?? RECORD_TYPE_FIELDS['Hoja de consulta'];
  return fieldKeys.map(key => {
    const template = FIELD_TEMPLATES[key];
    if (!template) {
      return {
        key,
        label: key,
        value: 'N/D',
        confidence: 0.5,
        category: 'low-confidence' as const,
      };
    }
    const confidence = Math.max(0.3, Math.min(0.99, template.baseConfidence + (Math.random() - 0.5) * LOW_CONFIDENCE_VARIANCE));
    return {
      key,
      label: template.label,
      value: template.generator(),
      confidence,
      category: confidence < 0.75 ? 'low-confidence' : 'auto',
    };
  });
}

export const HIGH_CONFIDENCE_THRESHOLD = 0.75;
