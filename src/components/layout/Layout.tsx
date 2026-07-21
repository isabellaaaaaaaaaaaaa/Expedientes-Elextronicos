import { useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import type { NavigationPage, AuthUser, Planta } from '../../types';

interface LayoutProps {
  children: ReactNode;
  user: AuthUser;
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onSelectEmployee: (employeeId: string) => void;
  onLogout: () => void;
  planta: Planta;
  onPlantaChange: (p: Planta) => void;
  onNotifAction: (notifId: string, filter?: { page: NavigationPage; statusFilter?: string; examDue?: 'today' | 'week' }) => void;
  onMarkAllRead: () => void;
  notifReadIds: Set<string>;
}

export default function Layout({
  children,
  user,
  currentPage,
  onNavigate,
  onSelectEmployee,
  onLogout,
  planta,
  onPlantaChange,
  onNotifAction,
  onMarkAllRead,
  notifReadIds,
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const leftOffset = collapsed ? 'ml-[68px]' : 'ml-[220px]';

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <TopBar
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
        onSelectEmployee={onSelectEmployee}
        currentPage={currentPage}
        collapsed={collapsed}
        planta={planta}
        onPlantaChange={onPlantaChange}
        onNotifAction={onNotifAction}
        onMarkAllRead={onMarkAllRead}
        notifReadIds={notifReadIds}
      />
      <main className={`${leftOffset} pt-16 min-h-screen transition-[margin] duration-200`}>
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
