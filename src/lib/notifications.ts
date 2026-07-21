import { employees, expedients, documents } from '../data/mockData';
import type { Planta } from '../types';

export interface NotificationCategory {
  id: string;
  label: string;
  count: number;
  icon: 'revision' | 'pendiente' | 'venceHoy' | 'venceSemana' | 'finalizadoHoy' | 'nuevosDocs' | 'nuevosEmpleados';
  action: {
    page: 'expedients' | 'employees' | 'documents';
    statusFilter?: string;
    examDue?: 'today' | 'week';
  };
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function isToday(dateStr: string): boolean {
  return dateStr === todayISO();
}

function isWithinNextDays(dateStr: string, days: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T12:00:00');
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export function computeNotifications(planta: Planta): NotificationCategory[] {
  void planta;
  // planta is UI context only; counts computed over all data until persistence-based filtering exists
  const enRevision = expedients.filter(e => e.status === 'En revisión').length;
  const pendiente = expedients.filter(e => e.status === 'Pendiente de verificación').length;
  const finalizadoHoy = expedients.filter(e => e.status === 'Finalizado' && isToday(e.updatedAt)).length;

  const venceHoy = expedients.filter(e => isToday(e.date)).length;
  const venceSemana = expedients.filter(e => isWithinNextDays(e.date, 7) && !isToday(e.date)).length;

  const nuevosDocs = documents.filter(d => isWithinNextDays(d.uploadDate, 7)).length;
  const nuevosEmpleados = [...employees]
    .filter(e => e.hireDate && isWithinNextDays(e.hireDate, 7))
    .length;

  const cats: NotificationCategory[] = [
    { id: 'revision', label: 'expedientes en revisión', count: enRevision, icon: 'revision', action: { page: 'expedients', statusFilter: 'En revisión' } },
    { id: 'pendiente', label: 'expedientes pendientes de verificación', count: pendiente, icon: 'pendiente', action: { page: 'expedients', statusFilter: 'Pendiente de verificación' } },
    { id: 'venceHoy', label: 'exámenes médicos vencen hoy', count: venceHoy, icon: 'venceHoy', action: { page: 'employees', examDue: 'today' } },
    { id: 'venceSemana', label: 'exámenes médicos vencen esta semana', count: venceSemana, icon: 'venceSemana', action: { page: 'employees', examDue: 'week' } },
    { id: 'finalizadoHoy', label: 'expedientes finalizados hoy', count: finalizadoHoy, icon: 'finalizadoHoy', action: { page: 'expedients', statusFilter: 'Finalizado' } },
    { id: 'nuevosDocs', label: 'nuevos documentos agregados', count: nuevosDocs, icon: 'nuevosDocs', action: { page: 'documents' as const } },
    { id: 'nuevosEmpleados', label: 'nuevos empleados registrados', count: nuevosEmpleados, icon: 'nuevosEmpleados', action: { page: 'employees' } },
  ];

  return cats.filter(c => c.count > 0);
}

export function totalNotifications(cats: NotificationCategory[]): number {
  return cats.reduce((sum, c) => sum + c.count, 0);
}
