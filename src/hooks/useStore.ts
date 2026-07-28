import { useSyncExternalStore, useMemo } from 'react';
import {
  subscribe,
  getSnapshot,
  getEmployees,
  getExpedients,
  getDocuments,
  getEmployeeById,
  getExpedientById,
  getBitacora,
  getAllBitacoraFromStore,
  getChangesFromStore,
  getSettings,
  getUsers,
} from '../lib/store';
import type { Planta, Employee, Expedient, MedDocument } from '../types';

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useEmployees(planta?: Planta): Employee[] {
  useStore();
  const all = getEmployees();
  return useMemo(
    () => (planta ? all.filter(e => e.planta === planta) : all),
    [all, planta],
  );
}

export function useExpedients(planta?: Planta): Expedient[] {
  useStore();
  const all = getExpedients();
  return useMemo(() => {
    if (!planta) return all;
    const plantaEmployeeIds = new Set(
      getEmployees().filter(e => e.planta === planta).map(e => e.id),
    );
    return all.filter(e => plantaEmployeeIds.has(e.employeeId));
  }, [all, planta]);
}

export function useDocuments(planta?: Planta): MedDocument[] {
  useStore();
  const all = getDocuments();
  return useMemo(() => {
    if (!planta) return all;
    const plantaEmployeeIds = new Set(
      getEmployees().filter(e => e.planta === planta).map(e => e.id),
    );
    return all.filter(d => plantaEmployeeIds.has(d.employeeId));
  }, [all, planta]);
}

export function useEmployee(id: string | null | undefined): Employee | undefined {
  useStore();
  return useMemo(() => (id ? getEmployeeById(id) : undefined), [id]);
}

export function useExpedient(id: string | null | undefined): Expedient | undefined {
  useStore();
  return useMemo(() => (id ? getExpedientById(id) : undefined), [id]);
}

export function useBitacora(expedientId: string) {
  useStore();
  return useMemo(() => getBitacora(expedientId), [expedientId]);
}

export function useAllBitacora() {
  useStore();
  return useMemo(() => getAllBitacoraFromStore(), []);
}

export function useChanges(expedientId: string) {
  useStore();
  return useMemo(() => getChangesFromStore(expedientId), [expedientId]);
}

export function useSettings() {
  useStore();
  return useMemo(() => getSettings(), []);
}

export function useUsers() {
  useStore();
  return useMemo(() => getUsers(), []);
}
