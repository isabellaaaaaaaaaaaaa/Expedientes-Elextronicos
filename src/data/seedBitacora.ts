import { seedSimulatedBitacora } from '../lib/auditLog';

export function seedAllBitacora() {
  seedSimulatedBitacora('exp-001', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 2 horas' },
    { user: 'Enfermera María', action: 'Carga de documentos', detail: 'Agregó un documento', relativeTime: 'Hace 1 hora' },
    { user: 'Dra. Karian', action: 'Cambio de estado', detail: 'Cambió el estado a En revisión', relativeTime: 'Hace 45 minutos' },
    { user: 'Dra. Karian', action: 'Descarga de PDF', detail: 'Descargó el PDF', relativeTime: 'Hace 30 minutos' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 20 minutos' },
  ]);

  seedSimulatedBitacora('exp-002', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 1 día' },
    { user: 'Dra. Karian', action: 'Cambio de estado', detail: 'Cambió el estado a En revisión', relativeTime: 'Hace 22 horas' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 20 horas' },
  ]);

  seedSimulatedBitacora('exp-003', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 2 días' },
    { user: 'Enfermera María', action: 'Carga de documentos', detail: 'Agregó un documento', relativeTime: 'Hace 2 días' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 1 día' },
  ]);

  seedSimulatedBitacora('exp-004', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 3 horas' },
    { user: 'Enfermera García', action: 'Carga de documentos', detail: 'Agregó un documento', relativeTime: 'Hace 2 horas' },
    { user: 'Dra. Karian', action: 'Cambio de estado', detail: 'Cambió el estado a En revisión', relativeTime: 'Hace 1 hora' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 40 minutos' },
  ]);

  seedSimulatedBitacora('exp-005', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 1 día' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 20 horas' },
  ]);

  seedSimulatedBitacora('exp-006', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 5 minutos' },
    { user: 'Enfermera María', action: 'Carga de documentos', detail: 'Agregó un documento', relativeTime: 'Hace 10 minutos' },
    { user: 'Dra. Karian', action: 'Cambio de estado', detail: 'Cambió el estado a En revisión', relativeTime: 'Hace 20 minutos' },
  ]);

  seedSimulatedBitacora('exp-007', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 1 día' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 22 horas' },
  ]);

  seedSimulatedBitacora('exp-008', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 5 minutos' },
  ]);

  seedSimulatedBitacora('exp-009', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 3 horas' },
    { user: 'Dra. Karian', action: 'Cambio de estado', detail: 'Cambió el estado a En revisión', relativeTime: 'Hace 2 horas' },
  ]);

  seedSimulatedBitacora('exp-010', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 2 días' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 1 día' },
  ]);

  seedSimulatedBitacora('exp-011', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 6 horas' },
    { user: 'Enfermera María', action: 'Carga de documentos', detail: 'Agregó un documento', relativeTime: 'Hace 5 horas' },
    { user: 'Dra. Karian', action: 'Impresión', detail: 'Realizó la impresión', relativeTime: 'Hace 4 horas' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 3 horas' },
  ]);

  seedSimulatedBitacora('exp-012', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 1 día' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 22 horas' },
  ]);

  seedSimulatedBitacora('exp-013', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 10 minutos' },
    { user: 'Enfermera María', action: 'Carga de documentos', detail: 'Agregó un documento', relativeTime: 'Hace 5 minutos' },
    { user: 'Dra. Karian', action: 'Cambio de estado', detail: 'Cambió el estado a En revisión', relativeTime: 'Hace 3 minutos' },
  ]);

  seedSimulatedBitacora('exp-014', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 1 día' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 20 horas' },
  ]);

  seedSimulatedBitacora('exp-015', [
    { user: 'Dra. Karian', action: 'Creación del expediente', detail: 'Creó el expediente', relativeTime: 'Hace 2 días' },
    { user: 'Dra. Karian', action: 'Finalización', detail: 'Finalizó el expediente', relativeTime: 'Hace 1 día' },
  ]);
}
