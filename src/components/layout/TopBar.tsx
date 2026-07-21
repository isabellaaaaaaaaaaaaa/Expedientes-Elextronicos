import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search, Bell, LogOut, ChevronDown, ChevronRight, Factory, X,
  Clock, CircleAlert as AlertCircle, CircleCheck as CheckCircle2,
  FileText, UserPlus, CalendarClock, CalendarDays,
} from 'lucide-react';
import type { AuthUser, NavigationPage, Planta, Employee } from '../../types';
import { PLANTAS } from '../../types';
import { employees } from '../../data/mockData';
import { computeNotifications, NOTIFICATION_GROUP_ORDER, NOTIFICATION_GROUP_LABELS, type NotificationCategory } from '../../lib/notifications';

interface TopBarProps {
  user: AuthUser;
  onLogout: () => void;
  onNavigate: (page: NavigationPage) => void;
  onSelectEmployee: (employeeId: string) => void;
  currentPage: NavigationPage;
  collapsed: boolean;
  planta: Planta;
  onPlantaChange: (p: Planta) => void;
  onNotifAction: (notifId: string, filter?: { page: NavigationPage; statusFilter?: string; examDue?: 'today' | 'week' }) => void;
  onMarkAllRead: () => void;
  notifReadIds: Set<string>;
}

const pageTitles: Record<NavigationPage, string> = {
  'dashboard':           'Dashboard',
  'employees':           'Empleados',
  'employee-profile':    'Expediente del empleado',
  'capture-expedient':   'Captura de expediente',
  'expedient-form':      'Registro médico',
  'record-type-select':  'Nuevo registro',
  'print-preview':        'Vista previa de impresión',
  'expedients':          'Expedientes',
  'documents':           'Documentos',
  'new-employee':        'Nuevo empleado',
  'new-expedient':       'Nuevo expediente',
  'usuarios':            'Usuarios',
  'configuracion':       'Configuración',
};

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

const notifIcon: Record<NotificationCategory['icon'], React.ElementType> = {
  revision: Clock,
  pendiente: AlertCircle,
  venceHoy: CalendarClock,
  venceSemana: CalendarDays,
  finalizadoHoy: CheckCircle2,
  nuevosDocs: FileText,
  nuevosEmpleados: UserPlus,
};

const notifAccent: Record<NotificationCategory['icon'], { bg: string; text: string }> = {
  revision: { bg: 'bg-amber-50', text: 'text-amber-600' },
  pendiente: { bg: 'bg-orange-50', text: 'text-orange-600' },
  venceHoy: { bg: 'bg-red-50', text: 'text-red-600' },
  venceSemana: { bg: 'bg-blue-50', text: 'text-blue-600' },
  finalizadoHoy: { bg: 'bg-green-50', text: 'text-green-600' },
  nuevosDocs: { bg: 'bg-teal-50', text: 'text-teal-600' },
  nuevosEmpleados: { bg: 'bg-blue-50', text: 'text-blue-600' },
};

export default function TopBar({
  user, onLogout, onNavigate, onSelectEmployee, currentPage, collapsed,
  planta, onPlantaChange, onNotifAction, onMarkAllRead, notifReadIds,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [plantaOpen, setPlantaOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const plantaRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(
    () => computeNotifications(planta).filter(n => !notifReadIds.has(n.id)),
    [planta, notifReadIds],
  );
  const notifCount = notifications.length;

  const q = search.trim().toLowerCase();
  const matchedEmployees: Employee[] = q
    ? employees
        .filter(e => e.planta === planta)
        .filter(e => {
          const full = `${e.firstName} ${e.lastName1} ${e.lastName2}`.toLowerCase();
          return (
            full.includes(q) ||
            e.employeeNumber.toLowerCase().includes(q) ||
            e.curp.toLowerCase().includes(q) ||
            e.rfc.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  const selectEmployee = (emp: Employee) => {
    onSelectEmployee(emp.id);
    setSearch('');
    setSearchFocused(false);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (!matchedEmployees.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, matchedEmployees.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchedEmployees[activeIdx]) selectEmployee(matchedEmployees[activeIdx]);
    } else if (e.key === 'Escape') {
      setSearch('');
      setSearchFocused(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (plantaRef.current && !plantaRef.current.contains(e.target as Node)) setPlantaOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const leftOffset = collapsed ? 'ml-[68px]' : 'ml-[220px]';

  const handleNotifClick = (n: NotificationCategory) => {
    onNotifAction(n.id, { page: n.action.page, statusFilter: n.action.statusFilter, examDue: n.action.examDue });
    setNotifOpen(false);
  };

  return (
    <header
      className={`fixed top-0 ${leftOffset} right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between px-6 z-20 transition-[margin] duration-200`}
    >
      {/* Left: page title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{pageTitles[currentPage]}</h1>
        </div>
      </div>

      {/* Right: planta selector, search, notifications, profile */}
      <div className="flex items-center gap-2">
        {/* Planta selector */}
        <div className="relative" ref={plantaRef}>
          <button
            onClick={() => setPlantaOpen(o => !o)}
            className="flex items-center gap-1.5 h-9 px-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            <Factory size={14} className="text-slate-500" />
            <span className="tabular-nums">{planta}</span>
            <ChevronDown size={13} className={`text-slate-400 transition-transform ${plantaOpen ? 'rotate-180' : ''}`} />
          </button>
          {plantaOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200/70 py-1.5 z-50">
              <p className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cambiar planta</p>
              {PLANTAS.map(p => (
                <button
                  key={p}
                  onClick={() => { onPlantaChange(p); setPlantaOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors text-left ${
                    p === planta ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2"><Factory size={13} className="text-slate-400" /> Planta {p}</span>
                  {p === planta && <CheckCircle2 size={14} className="text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative hidden lg:block w-72" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={15} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleSearchKey}
            placeholder="Buscar empleado, CURP, RFC..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-transparent rounded-lg text-gray-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
          {searchFocused && q && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200/70 z-50 overflow-hidden">
              {matchedEmployees.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-400 font-medium">Sin resultados para "{search}"</p>
                </div>
              ) : (
                <>
                  <p className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                    {matchedEmployees.length} {matchedEmployees.length === 1 ? 'coincidencia' : 'coincidencias'}
                  </p>
                  {matchedEmployees.map((emp, idx) => {
                    const full = `${emp.firstName} ${emp.lastName1} ${emp.lastName2}`;
                    return (
                      <button
                        key={emp.id}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => selectEmployee(emp)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${idx === activeIdx ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white">{emp.firstName.slice(0,1)}{emp.lastName1.slice(0,1)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{full}</p>
                          <p className="text-[11px] text-slate-400 truncate">No. {emp.employeeNumber} · {emp.curp}</p>
                        </div>
                        <ChevronRight size={14} className={`flex-shrink-0 ${idx === activeIdx ? 'text-blue-500' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-lg border border-slate-200/70 z-50 origin-top-right overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-slate-500" />
                  <p className="text-sm font-bold text-gray-900">Centro de Notificaciones</p>
                  {notifCount > 0 && (
                    <span className="text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-full">{notifCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {notifCount > 0 && (
                    <button onClick={onMarkAllRead} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors px-1.5 py-1 rounded-md hover:bg-blue-50">
                      Marcar todas
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="max-h-[28rem] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <CheckCircle2 size={26} className="mx-auto text-green-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">Todo al corriente</p>
                    <p className="text-xs text-slate-300 mt-0.5">No hay notificaciones pendientes</p>
                  </div>
                ) : (
                  NOTIFICATION_GROUP_ORDER.map(group => {
                    const groupItems = notifications.filter(n => n.group === group);
                    if (groupItems.length === 0) return null;
                    const groupTotal = groupItems.reduce((s, n) => s + n.count, 0);
                    return (
                      <div key={group}>
                        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between bg-slate-50/60 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{NOTIFICATION_GROUP_LABELS[group]}</span>
                          <span className="text-[10px] font-bold text-slate-400 tabular-nums">{groupTotal}</span>
                        </div>
                        {groupItems.map(n => {
                          const Icon = notifIcon[n.icon];
                          const a = notifAccent[n.icon];
                          return (
                            <button
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 transition-colors text-left border-b border-slate-50 last:border-0 group"
                            >
                              <div className={`w-8 h-8 ${a.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <Icon size={15} className={a.text} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 leading-snug">
                                  <span className="font-bold text-gray-900 tabular-nums">{n.count}</span> {n.label}
                                </p>
                              </div>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-[11px] font-bold text-white">{getInitials(user.username)}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{user.username}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{user.role}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200/70 py-1.5 z-50 origin-top-right">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user.role} · Planta {planta}</p>
              </div>
              <button
                onClick={() => { onNavigate('configuracion'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
              >
                Configuración
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
