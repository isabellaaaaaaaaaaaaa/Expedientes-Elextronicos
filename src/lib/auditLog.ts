import type { BitacoraEntry, ChangeEntry } from '../types';

const bitacoraStore: Record<string, BitacoraEntry[]> = {};
const changeStore: Record<string, ChangeEntry[]> = {};

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
  (bitacoraStore[expedientId] ??= []).unshift(entry);
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
  const { date } = nowParts();
  const entry: ChangeEntry = {
    id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    expedientId,
    field,
    oldValue,
    newValue,
    user,
    date,
  };
  (changeStore[expedientId] ??= []).unshift(entry);
  return entry;
}

export function getBitacora(expedientId: string): BitacoraEntry[] {
  return bitacoraStore[expedientId] ?? [];
}

export function getBitacoraByEmployee(expedientIds: string[]): BitacoraEntry[] {
  const all: BitacoraEntry[] = [];
  for (const id of expedientIds) {
    if (bitacoraStore[id]) all.push(...bitacoraStore[id]);
  }
  return all.sort((a, b) => {
    const cmp = (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time);
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });
}

export function getAllBitacora(): BitacoraEntry[] {
  const all: BitacoraEntry[] = [];
  for (const ids of Object.keys(bitacoraStore)) {
    all.push(...bitacoraStore[ids]);
  }
  return all.sort((a, b) => {
    const cmp = (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time);
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });
}

export function getChanges(expedientId: string): ChangeEntry[] {
  return changeStore[expedientId] ?? [];
}

export function getChangesByEmployee(expedientIds: string[]): ChangeEntry[] {
  const all: ChangeEntry[] = [];
  for (const id of expedientIds) {
    if (changeStore[id]) all.push(...changeStore[id]);
  }
  return all.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });
}

export function seedBitacora(expedientId: string, entries: BitacoraEntry[]) {
  bitacoraStore[expedientId] = [...entries].sort((a, b) =>
    (b.date + b.time).localeCompare(a.date + a.time),
  );
}

export function seedChanges(expedientId: string, entries: ChangeEntry[]) {
  changeStore[expedientId] = [...entries].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function seedSimulatedBitacora(
  expedientId: string,
  entries: { user: string; action: string; detail: string; relativeTime: string }[],
) {
  bitacoraStore[expedientId] = entries.map((e, i) => ({
    id: `bit-seed-${expedientId}-${i}`,
    expedientId,
    user: e.user,
    date: '',
    time: '',
    action: e.action,
    relativeTime: e.relativeTime,
    detail: e.detail,
  }));
}
