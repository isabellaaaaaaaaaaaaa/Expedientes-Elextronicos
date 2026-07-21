export type NavigationPage =
  | 'dashboard'
  | 'employees'
  | 'employee-profile'
  | 'capture-expedient'
  | 'expedient-form'
  | 'record-type-select'
  | 'expedients'
  | 'documents'
  | 'new-employee'
  | 'new-expedient'
  | 'print-preview'
  | 'usuarios'
  | 'configuracion';

export type MedicalRecordType =
  // Exámenes médicos
  | 'Examen médico de ingreso'
  | 'Examen médico periódico'
  | 'Examen médico de promoción'
  | 'Examen médico de reingreso'
  | 'Examen médico de retiro'
  // Consultas y seguimiento
  | 'Hoja de consulta'
  | 'Monitoreo de salud'
  | 'Hoja de incapacidad'
  | 'Valoración post incapacidad'
  // Primeros auxilios
  | 'Reporte de primeros auxilios'
  | 'Informe de investigación de primeros auxilios del supervisor'
  // Pruebas y formatos
  | 'Prueba de antidoping'
  | 'Declaración de consentimiento bajo información'
  | 'Listado de verificación del expediente médico'
  // Salud materna
  | 'Carnet de control prenatal'
  | 'Memorándum de notificación de embarazo'
  // Legacy types kept for existing mock data
  | 'Ingreso'
  | 'Periódico'
  | 'Nota médica'
  | 'Primeros auxilios'
  | 'Alcoholimetría'
  | 'Laboratorio'
  | 'Radiografía'
  | 'Incapacidad'
  | 'Otro'
  | 'Consulta médica'
  | 'Control crónico degenerativo'
  | 'Control prenatal'
  | 'Antidoping';

export interface RecordTypeCategory {
  name: string;
  types: MedicalRecordType[];
}

export type ConsultaType =
  | 'Consulta general'
  | 'Consulta de ingreso'
  | 'Consulta periódica'
  | 'Control crónico degenerativo'
  | 'Control prenatal'
  | 'Urgencia'
  | 'Seguimiento'
  | 'Alcoholimetría'
  | 'Antidoping'
  | 'Primeros auxilios'
  | 'Otro';

export type EstudioType =
  | 'Laboratorio'
  | 'Radiografía'
  | 'Audiometría'
  | 'Espirometría'
  | 'Electrocardiograma'
  | 'Otro';

export type UserRole = 'Administrador' | 'Doctora' | 'Enfermera' | 'Auditor';
export type ExpedientStatus = 'Sin revisar' | 'En revisión' | 'Pendiente de verificación' | 'Finalizado';

export interface BitacoraEntry {
  id: string;
  expedientId: string;
  user: string;
  date: string;
  time: string;
  action: string;
}

export interface ChangeEntry {
  id: string;
  expedientId: string;
  field: string;
  oldValue: string;
  newValue: string;
  user: string;
  date: string;
}

export type DocumentType =
  | 'Examen médico'
  | 'Audiometría'
  | 'Espirometría'
  | 'Laboratorio'
  | 'Radiografía'
  | 'Consulta médica'
  | 'Incapacidad'
  | 'Fotografía'
  | 'Otro';

export type Planta = '61' | '63' | '65' | '66' | '68';
export type EmployeeStatus = 'Activo' | 'Baja' | 'Incapacidad';
export type Turno = 'Matutino' | 'Vespertino' | 'Nocturno' | 'Mixto';

export const PLANTAS: Planta[] = ['61', '63', '65', '66', '68'];

export interface ExpedientListFilter {
  status?: string;
  examDue?: 'today' | 'week';
}

export interface AuthUser {
  username: string;
  role: UserRole;
  planta: Planta;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName1: string;
  lastName2: string;
  curp: string;
  rfc: string;
  nss: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  birthDate: string;
  phone: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  photoDataUrl?: string;
  planta: Planta;
  status: EmployeeStatus;
  turno: Turno;
}

export interface Consulta {
  id: string;
  employeeId: string;
  fecha: string;
  tipo: ConsultaType;
  medicoResponsable: string;
  observaciones: string;
  diagnostico: string;
  tratamiento: string;
  status: ExpedientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotaMedica {
  id: string;
  employeeId: string;
  fecha: string;
  tipo: string;
  contenido: string;
  medicoResponsable: string;
  status: ExpedientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Estudio {
  id: string;
  employeeId: string;
  nombre: string;
  tipo: EstudioType;
  fecha: string;
  fileType: 'pdf' | 'image';
  dataUrl: string;
  subidoPor: string;
}

export interface FotoEmpleado {
  id: string;
  employeeId: string;
  descripcion: string;
  fecha: string;
  dataUrl: string;
}

export interface EmployeeSnapshot {
  employeeNumber: string;
  firstName: string;
  lastName1: string;
  lastName2: string;
  curp: string;
  rfc: string;
  nss: string;
  gender: string;
  birthDate: string;
  position: string;
  department: string;
  hireDate: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  photoDataUrl?: string;
}

export interface Expedient {
  id: string;
  employeeId: string;
  year: number;
  recordType: MedicalRecordType;
  date: string;
  responsibleDoctor: string;
  status: ExpedientStatus;
  observations: string;
  employeeSnapshot?: EmployeeSnapshot;
  laboralAntecedents?: string;
  pathologicalAntecedents?: string;
  nonPathologicalAntecedents?: string;
  familyAntecedents?: string;
  surgicalHistory?: string;
  allergies?: string;
  medications?: string;
  weight?: string;
  height?: string;
  bmi?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
  visualAcuity?: string;
  physicalExamNotes?: string;
  diagnosis?: string;
  recommendations?: string;
  results?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedDocument {
  id: string;
  expedientId: string;
  employeeId: string;
  name: string;
  type: DocumentType;
  fileType: 'image' | 'pdf';
  dataUrl: string;
  uploadedBy: string;
  uploadDate: string;
}

export interface CapturedItem {
  id: string;
  dataUrl: string;
  fileType: 'image' | 'pdf';
  name: string;
}

