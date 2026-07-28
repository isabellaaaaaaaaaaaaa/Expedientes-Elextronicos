import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Lock,
  ChevronDown,
  User as UserIcon,
  Clock,
  Calendar,
  Network,
  ArrowRight,
  Activity,
  RefreshCw,
} from 'lucide-react';
import type { AuthUser } from '../types';
import type { AuditLogRecord } from '../lib/auditService';
import { fetchAuditLogs } from '../lib/auditService';
import { statusConfig } from '../lib/statusConfig';
import { EmptyState } from '../components/ui/empty-state';

function exportToCSV(rows: Record<string, string>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(',')),
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface BitacoraProps {
  user: AuthUser;
}

type ActionFilter = 'all' | 'status_change' | 'creation' | 'edit' | 'deletion' | 'login';

const ACTION_FILTERS: { id: ActionFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'status_change', label: 'Cambio de estado' },
  { id: 'creation', label: 'Creación' },
  { id: 'edit', label: 'Edición' },
  { id: 'deletion', label: 'Eliminación' },
  { id: 'login', label: 'Inicio de sesión' },
];

function matchesActionFilter(record: AuditLogRecord, filter: ActionFilter): boolean {
  if (filter === 'all') return true;
  const action = record.action.toLowerCase();
  switch (filter) {
    case 'status_change':
      return action.includes('estado') || (record.old_value !== null && record.new_value !== null && record.field === 'Estado');
    case 'creation':
      return action.includes('cre') || action.includes('alta') || action.includes('nuevo');
    case 'edit':
      return action.includes('edit') || action.includes('modific') || action.includes('actualiz');
    case 'deletion':
      return action.includes('elimin') || action.includes('borrado');
    case 'login':
      return action.includes('sesi') || action.includes('login') || action.includes('acceso');
    default:
      return true;
  }
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

function StatusBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  const cfg = statusConfig[value as keyof typeof statusConfig];
  if (!cfg) return <span className="text-xs font-semibold text-slate-500">{value}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.chip}`}>
      <span className={`status-dot ${cfg.dot}`} />
      {value}
    </span>
  );
}

function ActionIcon({ action }: { action: string }) {
  const lower = action.toLowerCase();
  let icon = Activity;
  let color = 'bg-slate-50 text-slate-500';
  if (lower.includes('estado')) { icon = ArrowRight; color = 'bg-blue-50 text-blue-600'; }
  else if (lower.includes('cre') || lower.includes('alta') || lower.includes('nuevo')) { icon = Activity; color = 'bg-green-50 text-green-600'; }
  else if (lower.includes('elimin')) { icon = Activity; color = 'bg-red-50 text-red-600'; }
  else if (lower.includes('login') || lower.includes('sesi')) { icon = ShieldCheck; color = 'bg-amber-50 text-amber-600'; }
  return (
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon === ArrowRight ? <ArrowRight size={13} /> : <Activity size={13} />}
    </div>
  );
}

export default function Bitacora({ user: _user }: BitacoraProps) {
  const [records, setRecords] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    const data = await fetchAuditLogs(1000);
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const uniqueUsers = useMemo(() => {
    const users = new Map<string, string>();
    records.forEach(r => {
      if (!users.has(r.user_name)) users.set(r.user_name, r.user_role);
    });
    return Array.from(users.entries()).map(([name, role]) => ({ name, role }));
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (!matchesActionFilter(r, actionFilter)) return false;
      if (userFilter !== 'all' && r.user_name !== userFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          r.user_name,
          r.user_role,
          r.action,
          r.employee_name,
          r.old_value,
          r.new_value,
          r.ip_address,
          r.field,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, actionFilter, userFilter, search]);

  const handleExport = () => {
    const rows = filtered.map(r => {
      const { date, time } = formatDateTime(r.created_at);
      return {
        Usuario: r.user_name,
        Rol: r.user_role,
        Fecha: date,
        Hora: time,
        Accion: r.action,
        Empleado: r.employee_name ?? '',
        'Estado anterior': r.old_value ?? '',
        'Estado nuevo': r.new_value ?? '',
        'IP': r.ip_address,
      };
    });
    exportToCSV(rows, `bitacora-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
              <ScrollText size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Bitácora del Sistema</h1>
              <p className="text-xs text-slate-500 mt-0.5">Registro inmutable de todas las acciones de auditoría</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRecords}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-xs font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Read-only banner */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <Lock size={15} className="text-slate-400 flex-shrink-0" />
        <p className="text-xs text-slate-500 font-medium">
          Los registros de auditoría son de solo lectura y no pueden modificarse ni eliminarse.
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuario, acción, empleado, IP..."
            className="w-full pl-9 pr-3 h-10 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(355,78%,51%)]/15 focus:border-[hsl(355,78%,51%)] transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold border rounded-lg transition-colors ${
            showFilters || actionFilter !== 'all' || userFilter !== 'all'
              ? 'bg-[hsl(355,78%,51%)] text-white border-transparent'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter size={14} />
          Filtros
          {(actionFilter !== 'all' || userFilter !== 'all') && (
            <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full">
              {[actionFilter !== 'all', userFilter !== 'all'].filter(Boolean).length}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de acción</p>
            <div className="flex flex-wrap gap-2">
              {ACTION_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActionFilter(f.id)}
                  className={`h-8 px-3 text-xs font-semibold rounded-lg transition-colors ${
                    actionFilter === f.id
                      ? 'bg-[hsl(355,78%,51%)] text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Usuario</p>
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(355,78%,51%)]/15 focus:border-[hsl(355,78%,51%)] transition-all min-w-[200px]"
            >
              <option value="all">Todos los usuarios</option>
              {uniqueUsers.map(u => (
                <option key={u.name} value={u.name}>{u.name} — {u.role}</option>
              ))}
            </select>
          </div>
          {(actionFilter !== 'all' || userFilter !== 'all' || search) && (
            <button
              onClick={() => { setActionFilter('all'); setUserFilter('all'); setSearch(''); }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total registros</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{records.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrados</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuarios activos</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{uniqueUsers.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cambios de estado</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {records.filter(r => r.field === 'Estado' && r.old_value && r.new_value).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="text-slate-300 animate-spin" />
            <p className="text-sm text-slate-400">Cargando registros de auditoría...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={records.length === 0 ? 'Sin registros de auditoría' : 'Sin resultados'}
            description={records.length === 0
              ? 'Los registros aparecerán aquí cuando se realicen acciones en el sistema.'
              : 'No hay registros que coincidan con los filtros seleccionados.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Usuario</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Fecha y hora</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Acción</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Empleado</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Estado</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(record => {
                  const { date, time } = formatDateTime(record.created_at);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon size={13} className="text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{record.user_name}</p>
                            <p className="text-[10px] text-slate-400">{record.user_role}</p>
                          </div>
                        </div>
                      </td>
                      {/* Date + time */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar size={11} className="text-slate-300" />
                          {date}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <Clock size={10} className="text-slate-300" />
                          {time}
                        </div>
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex items-center gap-2">
                          <ActionIcon action={record.action} />
                          <span className="text-xs font-medium text-gray-700 truncate">{record.action}</span>
                        </div>
                      </td>
                      {/* Employee */}
                      <td className="px-4 py-3">
                        {record.employee_name ? (
                          <span className="text-xs font-medium text-gray-700">{record.employee_name}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      {/* Status change */}
                      <td className="px-4 py-3">
                        {record.field === 'Estado' && record.old_value && record.new_value ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusBadge value={record.old_value} />
                            <ArrowRight size={11} className="text-slate-400 flex-shrink-0" />
                            <StatusBadge value={record.new_value} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      {/* IP */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                          <Network size={11} className="text-slate-300" />
                          {record.ip_address}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer note */}
      {!loading && filtered.length > 0 && (
        <p className="text-[11px] text-slate-400 text-center">
          Mostrando {filtered.length} de {records.length} registros — Los datos persisten en Supabase y son inmutables.
        </p>
      )}
    </div>
  );
}
