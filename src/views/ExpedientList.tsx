import { useState, useMemo, useEffect } from 'react';
import {
  FileText, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle,
  Search, Filter, X, Calendar, ChevronLeft, ChevronRight, Plus, ArrowLeft,
} from 'lucide-react';
import { employees, expedients, documents } from '../data/mockData';
import type { NavigationPage, Planta, ExpedientListFilter } from '../types';
import RecordActionsMenu from '../components/record/RecordActionsMenu';
import { statusConfig, EXPEDIENT_STATUSES } from '../lib/statusConfig';
import { EmptyState } from '../components/ui/empty-state';

interface ExpedientListProps {
  planta: Planta;
  initialFilter?: ExpedientListFilter | null;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string, year?: number) => void;
}

const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700',
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

const RECORD_TYPES = Array.from(new Set(expedients.map(e => e.recordType))).sort();
const YEARS = Array.from(new Set(expedients.map(e => e.year))).sort((a, b) => b - a);
const DEPARTMENTS = Array.from(new Set(employees.map(e => e.department))).sort();
const POSITIONS = Array.from(new Set(employees.map(e => e.position))).sort();
const DOCTORS = Array.from(new Set(expedients.map(e => e.responsibleDoctor).filter(Boolean))).sort();
const PAGE_SIZE = 25;

export default function ExpedientList({ initialFilter, onNavigate }: ExpedientListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [puestoFilter, setPuestoFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (initialFilter?.status) {
      setStatusFilter(initialFilter.status);
      setShowFilters(true);
    } else if (!initialFilter) {
      setStatusFilter('');
    }
    setPage(0);
  }, [initialFilter]);

  // planta is UI context only; filtering by planta is deferred until persistence exists
  const enriched = useMemo(() =>
    expedients
      .map((exp, idx) => ({ ...exp, employee: employees.find(e => e.id === exp.employeeId)!, avatarColor: avatarColors[idx % avatarColors.length] }))
      .filter(e => e.employee),
  [expedients]);

  const filtered = useMemo(() => {
    let result = enriched.filter(exp => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          exp.employee.firstName.toLowerCase().includes(q) ||
          exp.employee.lastName1.toLowerCase().includes(q) ||
          exp.employee.employeeNumber.toLowerCase().includes(q) ||
          exp.recordType.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter && exp.status !== statusFilter) return false;
      if (typeFilter && exp.recordType !== typeFilter) return false;
      if (yearFilter && String(exp.year) !== yearFilter) return false;
      if (deptFilter && exp.employee.department !== deptFilter) return false;
      if (puestoFilter && exp.employee.position !== puestoFilter) return false;
      if (doctorFilter && exp.responsibleDoctor !== doctorFilter) return false;
      if (fromDate && exp.date < fromDate) return false;
      if (toDate && exp.date > toDate) return false;
      return true;
    });
    result = result.sort((a, b) => (b.year - a.year) || b.date.localeCompare(a.date));
    return result;
  }, [enriched, search, statusFilter, typeFilter, yearFilter, deptFilter, puestoFilter, doctorFilter, fromDate, toDate]);

  const total = enriched.length;
  const finalizado = enriched.filter(e => e.status === 'Finalizado').length;
  const revision = enriched.filter(e => e.status === 'En revisión').length;
  const sinRevisar = enriched.filter(e => e.status === 'Sin revisar').length;
  const pendiente = enriched.filter(e => e.status === 'Pendiente de verificación').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const hasFilters = !!(statusFilter || typeFilter || yearFilter || deptFilter || puestoFilter || doctorFilter || fromDate || toDate);
  const clearFilters = () => {
    setStatusFilter(''); setTypeFilter(''); setYearFilter('');
    setDeptFilter(''); setPuestoFilter(''); setDoctorFilter(''); setFromDate(''); setToDate('');
    setSearch(''); setPage(0);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al Dashboard
      </button>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Expedientes</h2>
        <p className="text-sm text-slate-400 mt-1">
          <span className="font-bold text-gray-700">{filtered.length}</span> de{' '}
          <span className="font-bold text-gray-700">{total}</span> expedientes
        </p>
      </div>

      {/* Status indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Finalizados', count: finalizado, icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-600' },
          { label: 'En revisión', count: revision,   icon: Clock,        bg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Pendiente', count: pendiente,    icon: AlertCircle,  bg: 'bg-orange-50', iconColor: 'text-orange-600' },
          { label: 'Sin revisar', count: sinRevisar, icon: AlertCircle,  bg: 'bg-slate-100',   iconColor: 'text-slate-500' },
        ].map(({ label, count, icon: Icon, bg, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-3.5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={iconColor} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none tabular-nums">{count}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Buscar por empleado, número o tipo de registro..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-slate-200 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors border flex-shrink-0 ${
              showFilters || hasFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={15} /> Filtros
            {hasFilters && <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-[10px] rounded-full font-bold">{[statusFilter, typeFilter, yearFilter, deptFilter, puestoFilter, doctorFilter, fromDate, toDate].filter(Boolean).length}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="input-label">Departamento</label>
                <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(0); }} className="input-base text-sm">
                  <option value="">Todos</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Puesto</label>
                <select value={puestoFilter} onChange={e => { setPuestoFilter(e.target.value); setPage(0); }} className="input-base text-sm">
                  <option value="">Todos</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Estado</label>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="input-base text-sm">
                  <option value="">Todos</option>
                  {EXPEDIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Tipo de expediente</label>
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} className="input-base text-sm">
                  <option value="">Todos</option>
                  {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Año</label>
                <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(0); }} className="input-base text-sm">
                  <option value="">Todos</option>
                  {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Médico responsable</label>
                <select value={doctorFilter} onChange={e => { setDoctorFilter(e.target.value); setPage(0); }} className="input-base text-sm">
                  <option value="">Todos</option>
                  {DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Fecha desde</label>
                <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(0); }} className="input-base text-sm" />
              </div>
              <div>
                <label className="input-label">Fecha hasta</label>
                <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(0); }} className="input-base text-sm" />
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">
                <X size={13} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th className="hidden md:table-cell">Tipo de registro</th>
                <th className="hidden lg:table-cell">Año</th>
                <th className="hidden sm:table-cell">Actualizado</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr><td colSpan={6} className="px-6">
                  <EmptyState
                    icon={FileText}
                    title={hasFilters || search.trim() ? 'Sin resultados' : 'No hay expedientes para mostrar'}
                    description={hasFilters || search.trim() ? 'Ajusta los términos de búsqueda o filtros para encontrar expedientes.' : 'Aún no se ha registrado ningún expediente. Crea el primero para comenzar.'}
                    action={hasFilters || search.trim()
                      ? { label: 'Limpiar filtros', icon: X, onClick: clearFilters }
                      : { label: 'Crear expediente', icon: Plus, onClick: () => onNavigate('record-type-select') }
                    }
                  />
                </td></tr>
              ) : (
                pageItems.map(exp => {
                  const cfg = statusConfig[exp.status];
                  return (
                    <tr key={exp.id} className="group cursor-pointer" onClick={() => onNavigate('expedient-form', exp.employee.id, exp.id)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${exp.avatarColor} flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
                            {getInitials(exp.employee.firstName, exp.employee.lastName1)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                              {exp.employee.firstName} {exp.employee.lastName1}
                            </p>
                            <p className="text-xs text-slate-400">{exp.employee.employeeNumber} · {exp.employee.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-sm text-slate-600">{exp.recordType}</span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-sm text-slate-500 font-medium tabular-nums">{exp.year}</span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar size={12} />{new Date(exp.updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${cfg.chip}`}>
                          <span className={`status-dot ${cfg.dot}`} />
                          {exp.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <RecordActionsMenu employee={exp.employee} expedient={exp} documents={documents} onPrintPreview={(empId, expId) => onNavigate('print-preview', empId, expId)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
