import type { BitacoraEntry, ChangeEntry } from '../types';
import {
  logActionToStore,
  logChangeToStore,
  getBitacora as storeGetBitacora,
  getAllBitacoraFromStore,
  getChangesFromStore,
  seedBitacoraToStore,
  getExpedients,
} from './store';

const nowParts = () => {
  const d = new Date();
  return {
    date: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  };
};

export function logAction(expedientId: string, user: string, action: string, detail?: string) {
  const { date, time } = nowParts();
  const entry: BitacoraEntry = {
    id: `bit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    expedientId,
    user,
    date,
    time,
    action,
    relativeTime: 'Hace un momento',
    detail: detail ?? action,
  };
  logActionToStore(expedientId, entry);
  return entry;
}

export function logChange(
  expedientId: string,
  user: string,
  field: string,
  oldValue: string,
  newValue: string,
) {
  if (oldValue === newValue) return null;
  const { date, time } = nowParts();
  const entry: ChangeEntry = {
    id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    expedientId,
    field,
    oldValue,
    newValue,
    user,
    date,
    time,
  };
  logChangeToStore(entry);
  return entry;
}

export function getBitacora(expedientId: string): BitacoraEntry[] {
  return storeGetBitacora(expedientId);
}

export function getBitacoraByEmployee(expedientIds: string[]): BitacoraEntry[] {
  const all: BitacoraEntry[] = [];
  for (const id of expedientIds) {
    all.push(...storeGetBitacora(id));
  }
  return all.sort((a, b) => {
    const cmp = (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time);
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });
}

export function getAllBitacora(): BitacoraEntry[] {
  return getAllBitacoraFromStore();
}

export function getChanges(expedientId: string): ChangeEntry[] {
  return getChangesFromStore(expedientId);
}

export function getChangesByEmployee(expedientIds: string[]): ChangeEntry[] {
  const all: ChangeEntry[] = [];
  for (const id of expedientIds) {
    all.push(...getChangesFromStore(id));
  }
  return all.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });
}

export function seedBitacora(expedientId: string, entries: BitacoraEntry[]) {
  seedBitacoraToStore(expedientId, entries);
}

export function seedChanges(expedientId: string, entries: ChangeEntry[]) {
  // Changes are not persisted via store; keep in-memory for now
  void expedientId;
  void entries;
}

export function seedSimulatedBitacora(
  expedientId: string,
  entries: { user: string; action: string; detail: string; relativeTime: string }[],
) {
  // Only seed if no existing entries for this expedient (avoid overwriting on refresh)
  if (storeGetBitacora(expedientId).length > 0) return;
  const bitacoraEntries: BitacoraEntry[] = entries.map((e, i) => ({
    id: `bit-seed-${expedientId}-${i}`,
    expedientId,
    user: e.user,
    date: '',
    time: '',
    action: e.action,
    relativeTime: e.relativeTime,
    detail: e.detail,
  }));
  seedBitacoraToStore(expedientId, bitacoraEntries);
}

// Helper to find expedient by id from the store
export function findExpedient(expedientId: string) {
  return getExpedients().find(e => e.id === expedientId);
}
