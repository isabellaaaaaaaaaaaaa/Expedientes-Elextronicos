import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Search, Plus, Eye, Pencil, FileDown, Printer, MoveVertical,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { expedients } from '../../data/mockData';
import { exportExpedienteToPDF, printExpediente } from '../../lib/exportUtils';
import { EmptyState } from '../ui/empty-state';
import type { NavigationPage, Employee, EmployeeStatus } from '../../types';

export type SortKey = 'name' | 'employeeNumber' | 'department' | 'lastRecord';
export type SortDir = 'asc' | 'desc';

export const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700',
];

export const statusDot: Record<string, string> = {
  'Finalizado':  'bg-green-500',
  'En revisión': 'bg-amber-500',
  'Sin revisar': 'bg-red-500',
};

export const empStatusConfig: Record<EmployeeStatus, string> = {
  'Activo': 'bg-green-50 text-green-700 border border-green-100',
  'Baja': 'bg-slate-100 text-slate-500 border border-slate-200',
  'Incapacidad': 'bg-orange-50 text-orange-700 border border-orange-100',
};

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

export function getLatestExpedient(empId: string) {
  const empExps = expedients
    .filter(e => e.employeeId === empId)
    .sort((a, b) => (b.year - a.year) || b.date.localeCompare(a.date));
  return empExps[0] ?? null;
}

export function sortEmployees(items: Employee[], sortKey: SortKey, sortDir: SortDir): Employee[] {
  return [...items].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name': cmp = `${a.firstName} ${a.lastName1}`.localeCompare(`${b.firstName} ${b.lastName1}`); break;
      case 'employeeNumber': cmp = a.employeeNumber.localeCompare(b.employeeNumber); break;
      case 'department': cmp = a.department.localeCompare(b.department); break;
      case 'lastRecord': {
        const la = getLatestExpedient(a.id);
        const lb = getLatestExpedient(b.id);
        cmp = (lb?.date ?? '').localeCompare(la?.date ?? '');
        break;
      }
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

function EmployeeRowActions({
  emp, onNavigate,
}: {
  emp: Employee;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="flex items-center justify-end gap-1" ref={ref}>
      <button
        onClick={() => onNavigate('record-type-select', emp.id)}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Nuevo expediente"
      >
        <Plus size={15} />
      </button>
      <button
        onClick={() => onNavigate('employee-profile', emp.id)}
        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        title="Ver"
      >
        <Eye size={15} />
      </button>
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Más acciones"
        >
          <MoveVertical size={15} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 animate-in fade-in-0 zoom-in-95 duration-100">
            <button
              onClick={() => { onNavigate('new-employee', emp.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
            >
              <Pencil size={15} className="text-slate-400" />
              Editar empleado
            </button>
            <button
              onClick={() => { exportExpedienteToPDF(emp, expedients, []); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
            >
              <FileDown size={15} className="text-slate-400" />
              Descargar PDF
            </button>
            <button
              onClick={() => { printExpediente(emp, expedients, []); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
            >
              <Printer size={15} className="text-slate-400" />
              Imprimir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface EmployeeTableProps {
  items: Employee[];
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string) => void;
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSortChange?: (key: SortKey) => void;
  emptyState?: ReactNode;
}

export function EmployeeTable({
  items, onNavigate, sortKey, sortDir, onSortChange, emptyState,
}: EmployeeTableProps) {
  const sortable = !!onSortChange;
  const sortCls = 'cursor-pointer select-none hover:text-slate-600 transition-colors';

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={11} className="text-slate-300 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="text-blue-500" />
      : <ChevronDown size={11} className="text-blue-500" />;
  };

  const onHeaderClick = (key: SortKey) => sortable ? () => onSortChange!(key) : undefined;

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className={sortable ? sortCls : ''} onClick={onHeaderClick('name')}>
              <span className="inline-flex items-center gap-1">Empleado {sortable && <SortIcon col="name" />}</span>
            </th>
            <th className={`hidden md:table-cell ${sortable ? sortCls : ''}`} onClick={onHeaderClick('employeeNumber')}>
              <span className="inline-flex items-center gap-1">No. Empleado {sortable && <SortIcon col="employeeNumber" />}</span>
            </th>
            <th className={`hidden lg:table-cell ${sortable ? sortCls : ''}`} onClick={onHeaderClick('department')}>
              <span className="inline-flex items-center gap-1">Departamento {sortable && <SortIcon col="department" />}</span>
            </th>
            <th className="hidden xl:table-cell">Puesto</th>
            <th className="hidden lg:table-cell">Estatus</th>
            <th className={`hidden lg:table-cell ${sortable ? sortCls : ''}`} onClick={onHeaderClick('lastRecord')}>
              <span className="inline-flex items-center gap-1">Último registro {sortable && <SortIcon col="lastRecord" />}</span>
            </th>
            <th className="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-16 text-center">
                {emptyState ?? (
                  <EmptyState
                    icon={Search}
                    title="Sin resultados"
                    description="Ajusta los términos de búsqueda o filtros."
                    compact
                  />
                )}
              </td>
            </tr>
          ) : (
            items.map((emp, idx) => {
              const latestExp = getLatestExpedient(emp.id);
              const recStatus = latestExp?.status ?? null;
              const colorClass = avatarColors[idx % avatarColors.length];
              const empStatus = emp.status as EmployeeStatus;
              return (
                <tr key={emp.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
                        {getInitials(emp.firstName, emp.lastName1)}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => onNavigate('employee-profile', emp.id)}
                          className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 hover:underline transition-colors text-left"
                        >
                          {emp.firstName} {emp.lastName1} {emp.lastName2}
                        </button>
                        <p className="text-xs text-slate-400 truncate">{emp.curp}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className="text-sm text-slate-600 font-medium tabular-nums">{emp.employeeNumber}</span>
                  </td>
                  <td className="hidden lg:table-cell">
                    <span className="text-sm text-slate-600">{emp.department}</span>
                  </td>
                  <td className="hidden xl:table-cell">
                    <span className="text-sm text-slate-500">{emp.position}</span>
                  </td>
                  <td className="hidden lg:table-cell">
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold ${empStatusConfig[empStatus]}`}>
                      {empStatus}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell">
                    {recStatus && latestExp ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <span className={`status-dot ${statusDot[recStatus] ?? 'bg-slate-300'}`} />
                          {recStatus}
                        </span>
                        <span className="text-xs text-slate-400">{latestExp.date}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">Sin registros</span>
                    )}
                  </td>
                  <td className="text-right">
                    <EmployeeRowActions emp={emp} onNavigate={onNavigate} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
