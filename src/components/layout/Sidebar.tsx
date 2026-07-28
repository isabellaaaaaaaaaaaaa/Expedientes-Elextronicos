import { LayoutDashboard, Users, Settings, PanelLeftClose, PanelLeftOpen, FileText } from 'lucide-react';
import type { NavigationPage } from '../../types';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: NavigationPage; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'employees',     label: 'Empleados',    icon: Users },
  { id: 'expedients',    label: 'Expedientes',  icon: FileText },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

const employeePages: NavigationPage[] = [
  'employee-profile', 'capture-expedient',
  'new-employee', 'new-expedient', 'expedient-form',
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const isActive = (id: NavigationPage) =>
    currentPage === id ||
    (id === 'employees' && employeePages.includes(currentPage));

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 bg-[#1E2228] flex flex-col z-20 transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[224px]'
      }`}
    >
      {/* Brand card */}
      <div className={`p-3 ${collapsed ? 'px-2' : ''}`}>
        <div className={`rounded-xl bg-[#2A2F38] ${collapsed ? 'p-2 flex flex-col items-center' : 'p-4'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-9 h-9 rounded-lg bg-[hsl(355,78%,51%)] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-extrabold text-[11px] tracking-tight">N</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 leading-none">
                <p className="text-white font-extrabold text-sm leading-tight tracking-tight">SAM</p>
                <p className="text-slate-400 text-[10px] font-medium leading-tight mt-1">Nexteer México</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">NEXTEER</p>
              <p className="text-[9px] text-slate-600 mt-1 leading-none">Sistema de Administración Médica</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = isActive(id);
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                active
                  ? 'bg-[hsl(355,78%,51%)] text-white shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={2}
                className={`flex-shrink-0 ${active ? 'text-white' : ''}`}
              />
              {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2.5 flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className={`w-full flex items-center gap-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          {collapsed ? <PanelLeftOpen size={18} strokeWidth={2} /> : <PanelLeftClose size={18} strokeWidth={2} />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
