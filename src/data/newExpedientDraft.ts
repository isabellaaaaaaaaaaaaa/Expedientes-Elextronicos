import type { MedicalRecordType } from '../types';

export interface ExpedientDraft {
  recordType: MedicalRecordType;
  date: string;
  responsibleDoctor: string;
  observations: string;
  year?: number;
}

let current: ExpedientDraft | null = null;

export const saveDraft = (d: ExpedientDraft) => { current = { ...d }; };
export const getDraft = (): ExpedientDraft | null => current;
export const clearDraft = () => { current = null; };
