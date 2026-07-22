import { useState, useCallback } from 'react';
import './App.css';
import Login from './views/Login';
import Layout from './components/layout/Layout';
import Dashboard from './views/Dashboard';
import Employees from './views/Employees';
import ExpedientList from './views/ExpedientList';
import ExpedientForm from './views/ExpedientForm';
import RecordTypeSelect from './views/RecordTypeSelect';
import DocumentsGlobal from './views/DocumentsGlobal';
import NewEmployee from './views/NewEmployee';
import EmployeeProfile from './views/EmployeeProfile';
import PrintPreview from './views/PrintPreview';
import Configuracion from './views/Configuracion';
import type { NavigationPage, AuthUser, Planta, ExpedientListFilter } from './types';
import { computeNotifications } from './lib/notifications';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedExpedientId, setSelectedExpedientId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [planta, setPlanta] = useState<Planta>('61');
  const [expedientFilter, setExpedientFilter] = useState<ExpedientListFilter | null>(null);
  const [employeesExamDue, setEmployeesExamDue] = useState<'today' | 'week' | null>(null);
  const [notifReadIds, setNotifReadIds] = useState<Set<string>>(new Set());

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    setPlanta(u.planta);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
    setSelectedEmployeeId(null);
    setSelectedExpedientId(null);
    setNotifReadIds(new Set());
  };

  const handleNavigate = useCallback(
    (
      page: NavigationPage,
      employeeId?: string,
      expedientId?: string,
      year?: number,
      filter?: ExpedientListFilter,
    ) => {
      setCurrentPage(page);
      setSelectedEmployeeId(employeeId ?? null);
      setSelectedExpedientId(expedientId ?? null);
      if (year !== undefined) setSelectedYear(year);
      if (filter) {
        setExpedientFilter(filter);
        setEmployeesExamDue(filter.examDue ?? null);
      } else {
        setExpedientFilter(null);
        setEmployeesExamDue(null);
      }
    },
    [],
  );

  const handleNavigateSimple = useCallback((page: NavigationPage) => {
    handleNavigate(page);
  }, [handleNavigate]);

  const handlePlantaChange = (next: Planta) => {
    setPlanta(next);
    setNotifReadIds(new Set());
    setExpedientFilter(null);
    setEmployeesExamDue(null);
  };

  const markNotifRead = (ids: string[]) => {
    setNotifReadIds(prev => {
      const copy = new Set(prev);
      ids.forEach(id => copy.add(id));
      return copy;
    });
  };

  const markAllRead = () => {
    setNotifReadIds(prev => {
      const copy = new Set(prev);
      computeNotifications(planta).forEach(n => copy.add(n.id));
      return copy;
    });
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      user={user}
      currentPage={currentPage}
      onNavigate={handleNavigateSimple}
      onSelectEmployee={(employeeId: string) => handleNavigate('employee-profile', employeeId)}
      onLogout={handleLogout}
      planta={planta}
      onPlantaChange={handlePlantaChange}
      onNotifAction={(notifId, filter) => {
        markNotifRead([notifId]);
        if (filter) {
          handleNavigate(filter.page, undefined, undefined, undefined, filter);
        } else {
          handleNavigate('expedients');
        }
      }}
      onMarkAllRead={markAllRead}
      notifReadIds={notifReadIds}
    >
      {currentPage === 'dashboard' && (
        <Dashboard user={user} planta={planta} onNavigate={handleNavigate} />
      )}
      {currentPage === 'employees' && (
        <Employees
          user={user}
          planta={planta}
          examDue={employeesExamDue}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'new-employee' && (
        <NewEmployee onNavigate={handleNavigate} />
      )}
      {currentPage === 'expedients' && (
        <ExpedientList
          planta={planta}
          initialFilter={expedientFilter}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'expedient-form' && selectedEmployeeId && (
        <ExpedientForm
          employeeId={selectedEmployeeId}
          expedientId={selectedExpedientId}
          currentUser={user}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'record-type-select' && selectedEmployeeId && (
        <RecordTypeSelect
          employeeId={selectedEmployeeId}
          year={selectedYear ?? undefined}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'documents' && (
        <DocumentsGlobal planta={planta} onNavigate={handleNavigate} />
      )}
      {currentPage === 'print-preview' && selectedExpedientId && selectedEmployeeId && (
        <PrintPreview
          employeeId={selectedEmployeeId}
          expedientId={selectedExpedientId}
          user={user}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'employee-profile' && selectedEmployeeId && (
        <EmployeeProfile
          employeeId={selectedEmployeeId}
          user={user}
          initialYear={selectedYear ?? undefined}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'configuracion' && <Configuracion user={user} onNavigate={handleNavigateSimple} />}
      {currentPage === 'usuarios' && (
        <div className="max-w-5xl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <p className="text-sm font-semibold text-slate-400">Esta sección estará disponible próximamente.</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
