import type { Employee, Expedient, MedDocument, BitacoraEntry, ChangeEntry } from '../types';
import { employees as seedEmployees, expedients as seedExpedients, documents as seedDocuments } from '../data/mockData';

const STORAGE_KEY = 'sam-store-v1';

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  role: 'Administrador' | 'Doctora' | 'Enfermera' | 'Auditor';
  planta: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface SystemSettings {
  systemName: string;
  subtitle: string;
  version: string;
  masterPassword: string;
}

interface PersistedState {
  customEmployees: Employee[];
  customExpedients: Expedient[];
  customDocuments: MedDocument[];
  employeeEdits: Record<string, Partial<Employee>>;
  expedientEdits: Record<string, Partial<Expedient>>;
  deletedEmployeeIds: string[];
  deletedExpedientIds: string[];
  deletedDocumentIds: string[];
  bitacora: Record<string, BitacoraEntry[]>;
  changes: Record<string, ChangeEntry[]>;
  settings: SystemSettings;
  users: SystemUser[];
}

const DEFAULT_SETTINGS: SystemSettings = {
  systemName: 'SAM',
  subtitle: 'Sistema de Administración Médica',
  version: '2.0.0',
  masterPassword: 'doctora',
};

const DEFAULT_USERS: SystemUser[] = [
  { id: 'usr-001', username: 'admin',    fullName: 'Administrador del Sistema', role: 'Administrador', planta: '61', active: true,  createdAt: '2024-01-15', lastLogin: '2026-07-28' },
  { id: 'usr-002', username: 'klopez',   fullName: 'Dra. Karina López',         role: 'Doctora',       planta: '61', active: true,  createdAt: '2024-01-20', lastLogin: '2026-07-27' },
  { id: 'usr-003', username: 'mgarcia',  fullName: 'Enf. María García',         role: 'Enfermera',     planta: '63', active: true,  createdAt: '2024-02-01', lastLogin: '2026-07-26' },
  { id: 'usr-004', username: 'rvega',    fullName: 'Roberto Vega',              role: 'Auditor',       planta: '61', active: true,  createdAt: '2024-03-10', lastLogin: '2026-07-20' },
  { id: 'usr-005', username: 'cmendoza', fullName: 'Enf. Claudia Mendoza',      role: 'Enfermera',     planta: '65', active: false, createdAt: '2024-04-05', lastLogin: '2026-06-15' },
];

function getInitialState(): PersistedState {
  return {
    customEmployees: [],
    customExpedients: [],
    customDocuments: [],
    employeeEdits: {},
    expedientEdits: {},
    deletedEmployeeIds: [],
    deletedExpedientIds: [],
    deletedDocumentIds: [],
    bitacora: {},
    changes: {},
    settings: { ...DEFAULT_SETTINGS },
    users: [...DEFAULT_USERS],
  };
}

// --- Load / Save ---

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const base = getInitialState();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...parsed.settings },
      users: parsed.users?.length ? parsed.users : base.users,
    };
  } catch {
    return getInitialState();
  }
}

let state: PersistedState = loadState();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full — keep working in-memory
  }
  listeners.forEach(fn => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  return state;
}

// --- Derived data (merge seed + custom + edits - deletes) ---

export function getEmployees(): Employee[] {
  const deletedSet = new Set(state.deletedEmployeeIds);
  const edited = seedEmployees
    .filter(e => !deletedSet.has(e.id))
    .map(e => state.employeeEdits[e.id] ? { ...e, ...state.employeeEdits[e.id] } : e);
  const custom = state.customEmployees.filter(e => !deletedSet.has(e.id));
  return [...custom, ...edited];
}

export function getExpedients(): Expedient[] {
  const deletedSet = new Set(state.deletedExpedientIds);
  const edited = seedExpedients
    .filter(e => !deletedSet.has(e.id))
    .map(e => state.expedientEdits[e.id] ? { ...e, ...state.expedientEdits[e.id] } : e);
  const custom = state.customExpedients.filter(e => !deletedSet.has(e.id));
  return [...custom, ...edited];
}

export function getDocuments(): MedDocument[] {
  const deletedSet = new Set(state.deletedDocumentIds);
  const base = seedDocuments.filter(d => !deletedSet.has(d.id));
  const custom = state.customDocuments.filter(d => !deletedSet.has(d.id));
  return [...custom, ...base];
}

export function getEmployeeById(id: string): Employee | undefined {
  return getEmployees().find(e => e.id === id);
}

export function getExpedientById(id: string): Expedient | undefined {
  return getExpedients().find(e => e.id === id);
}

// --- Mutations: Employees ---

export function addEmployee(emp: Employee) {
  state = { ...state, customEmployees: [...state.customEmployees, emp] };
  persist();
}

export function updateEmployee(id: string, patch: Partial<Employee>) {
  const all = getEmployees();
  const existing = all.find(e => e.id === id);
  if (!existing) return;
  const isCustom = state.customEmployees.some(e => e.id === id);
  if (isCustom) {
    state = {
      ...state,
      customEmployees: state.customEmployees.map(e => e.id === id ? { ...e, ...patch } : e),
    };
  } else {
    state = {
      ...state,
      employeeEdits: { ...state.employeeEdits, [id]: { ...state.employeeEdits[id], ...patch } },
    };
  }
  persist();
}

export function deleteEmployee(id: string) {
  const isCustom = state.customEmployees.some(e => e.id === id);
  if (isCustom) {
    state = { ...state, customEmployees: state.customEmployees.filter(e => e.id !== id) };
  } else {
    state = { ...state, deletedEmployeeIds: [...state.deletedEmployeeIds, id] };
  }
  persist();
}

// --- Mutations: Expedients ---

export function addExpedient(exp: Expedient) {
  state = { ...state, customExpedients: [...state.customExpedients, exp] };
  persist();
}

export function updateExpedient(id: string, patch: Partial<Expedient>) {
  const isCustom = state.customExpedients.some(e => e.id === id);
  if (isCustom) {
    state = {
      ...state,
      customExpedients: state.customExpedients.map(e => e.id === id ? { ...e, ...patch } : e),
    };
  } else {
    state = {
      ...state,
      expedientEdits: { ...state.expedientEdits, [id]: { ...state.expedientEdits[id], ...patch } },
    };
  }
  persist();
}

export function deleteExpedient(id: string) {
  const isCustom = state.customExpedients.some(e => e.id === id);
  if (isCustom) {
    state = { ...state, customExpedients: state.customExpedients.filter(e => e.id !== id) };
  } else {
    state = { ...state, deletedExpedientIds: [...state.deletedExpedientIds, id] };
  }
  // also clean up documents for this expedient
  const docs = state.customDocuments.filter(d => d.expedientId !== id);
  state = { ...state, customDocuments: docs };
  persist();
}

// --- Mutations: Documents ---

export function addDocument(doc: MedDocument) {
  state = { ...state, customDocuments: [...state.customDocuments, doc] };
  persist();
}

export function addDocuments(docs: MedDocument[]) {
  state = { ...state, customDocuments: [...state.customDocuments, ...docs] };
  persist();
}

export function deleteDocument(id: string) {
  const isCustom = state.customDocuments.some(d => d.id === id);
  if (isCustom) {
    state = { ...state, customDocuments: state.customDocuments.filter(d => d.id !== id) };
  } else {
    state = { ...state, deletedDocumentIds: [...state.deletedDocumentIds, id] };
  }
  persist();
}

// --- Audit log ---

export function getBitacora(expedientId: string): BitacoraEntry[] {
  return state.bitacora[expedientId] ?? [];
}

export function logActionToStore(expedientId: string, entry: BitacoraEntry) {
  const existing = state.bitacora[expedientId] ?? [];
  state = {
    ...state,
    bitacora: { ...state.bitacora, [expedientId]: [entry, ...existing] },
  };
  persist();
}

export function logChangeToStore(entry: ChangeEntry) {
  if (entry.oldValue === entry.newValue) return;
  const existing = state.changes[entry.expedientId] ?? [];
  state = {
    ...state,
    changes: { ...state.changes, [entry.expedientId]: [entry, ...existing] },
  };
  persist();
}

export function getAllBitacoraFromStore(): BitacoraEntry[] {
  const all: BitacoraEntry[] = [];
  for (const entries of Object.values(state.bitacora)) all.push(...entries);
  return all.sort((a, b) => {
    const cmp = (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time);
    return cmp !== 0 ? cmp : b.id.localeCompare(a.id);
  });
}

export function seedBitacoraToStore(expedientId: string, entries: BitacoraEntry[]) {
  state = {
    ...state,
    bitacora: { ...state.bitacora, [expedientId]: entries },
  };
  persist();
}

export function getChangesFromStore(expedientId: string): ChangeEntry[] {
  return state.changes[expedientId] ?? [];
}

// --- Settings ---

export function getSettings(): SystemSettings {
  return state.settings;
}

export function updateSettings(patch: Partial<SystemSettings>) {
  state = { ...state, settings: { ...state.settings, ...patch } };
  persist();
}

// --- Users ---

export function getUsers(): SystemUser[] {
  return state.users;
}

export function addUser(user: SystemUser) {
  state = { ...state, users: [...state.users, user] };
  persist();
}

export function updateUser(id: string, patch: Partial<SystemUser>) {
  state = {
    ...state,
    users: state.users.map(u => u.id === id ? { ...u, ...patch } : u),
  };
  persist();
}

export function deleteUser(id: string) {
  state = { ...state, users: state.users.filter(u => u.id !== id) };
  persist();
}

// --- React binding ---

export { subscribe, getSnapshot };

export function resetStore() {
  state = getInitialState();
  persist();
}
