import { useState, useMemo } from 'react';
import {
  Search,
  UserPlus, FileSpreadsheet,
  ChevronLeft, ChevronRight,
  Filter, X, Factory, ArrowLeft,
} from 'lucide-react';
import { employees, expedients } from '../data/mockData';
import type { NavigationPage, AuthUser, Planta, EmployeeStatus, Turno } from '../types';
import { getLatestExpedient as tableGetLatestExpedient } from '../components/employee/EmployeeTable';
import { exportEmployeesToExcel } from '../lib/exportUtils';
import {
  EmployeeTable, getLatestExpedient, sortEmployees,
  getInitials, statusDot,
  type SortKey, type SortDir,
} from '../components/employee/EmployeeTable';
import { EmptyState } from '../components/ui/empty-state';

interface EmployeesProps {
  user: AuthUser;
  planta: Planta;
  examDue?: 'today' | 'week' | null;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string) => void;
}

const STATUSES: EmployeeStatus[] = ['Activo', 'Baja', 'Incapacidad'];
const TURNOS: Turno[] = ['Matutino', 'Vespertino', 'Nocturno', 'Mixto'];
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021];
const PAGE_SIZE = 50;

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}
function isWithinNextDays(dateStr: string, days: number): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T12:00:00');
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export default function Employees({ planta, examDue, onNavigate }: EmployeesProps) {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterExamDate, setFilterExamDate] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterTurno, setFilterTurno] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  // planta is UI context only; filtering by planta is deferred until persistence exists
  const departments = useMemo(
    () => Array.from(new Set(employees.map(e => e.department))).sort(),
    [employees],
  );
  const positions = useMemo(
    () => Array.from(new Set(employees.map(e => e.position))).sort(),
    [employees],
  );

  const filtered = useMemo(() => {
    let result = employees.filter(emp => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          emp.employeeNumber.toLowerCase().includes(q) ||
          emp.firstName.toLowerCase().includes(q) ||
          emp.lastName1.toLowerCase().includes(q) ||
          emp.curp.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filterDept && emp.department !== filterDept) return false;
      if (filterPosition && emp.position !== filterPosition) return false;
      if (filterStatus && emp.status !== filterStatus) return false;
      if (filterTurno && emp.turno !== filterTurno) return false;
      if (filterGender && emp.gender !== filterGender) return false;
      if (filterYear) {
        const latest = tableGetLatestExpedient(emp.id);
        if (!latest || String(latest.year) !== filterYear) return false;
      }
      if (filterExamDate) {
        const latest = tableGetLatestExpedient(emp.id);
        if (!latest || latest.date < filterExamDate) return false;
      }
      // examDue notification pre-filter
      if (examDue) {
        const latest = tableGetLatestExpedient(emp.id);
        if (!latest) return false;
        if (examDue === 'today' && !isToday(latest.date)) return false;
        if (examDue === 'week' && !(isWithinNextDays(latest.date, 7) && !isToday(latest.date))) return false;
      }
      return true;
    });

    result = sortEmployees(result, sortKey, sortDir);

    return result;
  }, [employees, search, filterDept, filterPosition, filterStatus, filterYear, filterExamDate, filterGender, filterTurno, examDue, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const hasFilters = !!(filterDept || filterPosition || filterStatus || filterYear || filterExamDate || filterGender || filterTurno);

  const clearFilters = () => {
    setFilterDept(''); setFilterPosition('');
    setFilterStatus(''); setFilterYear(''); setFilterExamDate('');
    setFilterGender(''); setFilterTurno('');
    setSearch('');
    setPage(0);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleExportExcel = () => exportEmployeesToExcel(filtered, expedients, planta);

  const singleResult = filtered.length === 1 ? filtered[0] : null;

  return (
    <div className="max-w-6xl space-y-6">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al Dashboard
      </button>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            Empleados
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold">
              <Factory size={11} /> Planta {planta}
            </span>
            {examDue && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
                {examDue === 'today' ? 'Vencen hoy' : 'Vencen esta semana'}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            <span className="font-bold text-gray-700">{pageItems.length}</span> de{' '}
            <span className="font-bold text-gray-700">{filtered.length.toLocaleString()}</span> empleados
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <FileSpreadsheet size={15} className="text-green-600" />
            Exportar
          </button>
          <button
            onClick={() => onNavigate('new-employee')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            <UserPlus size={15} />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Buscar por número, nombre, apellido o CURP..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-slate-200 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors border flex-shrink-0 ${
              showFilters || hasFilters
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={15} />
            Filtros
            {hasFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-[10px] rounded-full font-bold">
                {[filterDept, filterPosition, filterStatus, filterYear, filterExamDate, filterGender, filterTurno].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <FilterSelect label="Departamento" value={filterDept} onChange={setFilterDept} options={departments.map(d => ({ value: d, label: d }))} />
              <FilterSelect label="Puesto" value={filterPosition} onChange={setFilterPosition} options={positions.map(p => ({ value: p, label: p }))} />
              <FilterSelect label="Estatus" value={filterStatus} onChange={setFilterStatus} options={STATUSES.map(s => ({ value: s, label: s }))} />
              <FilterSelect label="Año últ. expediente" value={filterYear} onChange={setFilterYear} options={YEARS.map(y => ({ value: String(y), label: String(y) }))} />
              <FilterSelect label="Sexo" value={filterGender} onChange={setFilterGender} options={[{ value: 'Masculino', label: 'Masculino' }, { value: 'Femenino', label: 'Femenino' }]} />
              <FilterSelect label="Turno" value={filterTurno} onChange={setFilterTurno} options={TURNOS.map(t => ({ value: t, label: t }))} />
              <div>
                <label className="input-label">Fecha últ. examen (desde)</label>
                <input
                  type="date"
                  value={filterExamDate}
                  onChange={e => { setFilterExamDate(e.target.value); setPage(0); }}
                  className="input-base text-sm"
                />
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">
                <X size={13} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Single result card */}
      {singleResult && (() => {
        const emp = singleResult;
        const latestExp = getLatestExpedient(emp.id);
        const status = latestExp?.status ?? 'Sin revisar';
        return (
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-12" />
            <div className="px-6 pb-5 -mt-6 flex items-end gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                {emp.photoDataUrl ? (
                  <img src={emp.photoDataUrl} alt="" className="w-full h-full object-cover rounded-[12px]" />
                ) : (
                  <span className="text-base font-bold text-blue-600">{getInitials(emp.firstName, emp.lastName1)}</span>
                )}
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-base font-bold text-gray-900">{emp.firstName} {emp.lastName1} {emp.lastName2}</p>
                  <span className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600">
                    <span className={`status-dot ${statusDot[status] ?? 'bg-slate-300'}`} />
                    {status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{emp.employeeNumber} · Planta {emp.planta} · {emp.department}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Table */}
      <div className="card overflow-hidden">
        <EmployeeTable
          items={pageItems}
          onNavigate={onNavigate}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={toggleSort}
          emptyState={
            <EmptyState
              icon={Search}
              title={hasFilters || search.trim() ? 'Sin resultados' : 'No hay empleados registrados'}
              description={hasFilters || search.trim() ? 'Ajusta los términos de búsqueda o filtros para encontrar empleados.' : 'Comienza registrando al primer empleado de la planta.'}
              action={hasFilters || search.trim()
                ? { label: 'Limpiar filtros', icon: X, onClick: clearFilters }
                : { label: 'Nuevo Empleado', icon: UserPlus, onClick: () => onNavigate('new-employee') }
              }
            />
          }
        />

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-400">
              Página <span className="font-bold text-gray-700">{currentPage + 1}</span> de <span className="font-bold text-gray-700">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) pageNum = i;
                else if (currentPage < 4) pageNum = i;
                else if (currentPage >= totalPages - 4) pageNum = totalPages - 7 + i;
                else pageNum = currentPage - 3 + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors ${pageNum === currentPage ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {pageNum + 1}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input-base text-sm">
        <option value="">Todos</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
