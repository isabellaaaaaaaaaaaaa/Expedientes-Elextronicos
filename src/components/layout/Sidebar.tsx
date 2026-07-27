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
      className={`fixed left-0 top-14 bottom-0 bg-white border-r border-slate-200/70 flex flex-col z-20 transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[224px]'
      }`}
    >
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
                  ? 'bg-red-50 text-red-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[hsl(355,78%,51%)] rounded-r-full" />
              )}
              <Icon
                size={18}
                strokeWidth={2}
                className={`flex-shrink-0 ${active ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`}
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
          {collapsed ? <PanelLeftOpen size={18} strokeWidth={2} /> : <PanelLeftClose size={18} strokeWidth={2} />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
