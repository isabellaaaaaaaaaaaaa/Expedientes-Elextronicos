import { LayoutDashboard, Users, Settings, Stethoscope, PanelLeftClose, PanelLeftOpen, FileText } from 'lucide-react';
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
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200/70 flex flex-col z-30 transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      {/* Brand */}
      <div className={`flex items-center h-16 border-b border-slate-100 flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-[17px] h-[17px] text-white" strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">MedExpedient</p>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">Área Médica</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = isActive(id);
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all group relative ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r-full" />
              )}
              <Icon
                size={18}
                className={`flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
              />
              {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2.5 border-t border-slate-100 flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className={`w-full flex items-center gap-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
