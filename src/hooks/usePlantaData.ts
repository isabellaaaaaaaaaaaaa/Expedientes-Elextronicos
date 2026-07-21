import { useMemo } from 'react';
import { employees, expedients } from '../data/mockData';
import type { Planta } from '../types';

export function usePlantaData(planta: Planta) {
  return useMemo(() => {
    const plantaEmployees = employees.filter(e => e.planta === planta);
    const plantaEmployeeIds = new Set(plantaEmployees.map(e => e.id));
    const plantaExpedients = expedients.filter(e => plantaEmployeeIds.has(e.employeeId));
    const expedientByEmployee = new Map<string, typeof plantaExpedients>();
    plantaExpedients.forEach(exp => {
      const arr = expedientByEmployee.get(exp.employeeId) ?? [];
      arr.push(exp);
      expedientByEmployee.set(exp.employeeId, arr);
    });
    return {
      plantaEmployees,
      plantaEmployeeIds,
      plantaExpedients,
      getLatestExpedient: (employeeId: string) => {
        const arr = expedientByEmployee.get(employeeId);
        if (!arr || arr.length === 0) return undefined;
        return arr.sort((a, b) => b.year - a.year)[0];
      },
    };
  }, [planta]);
}
