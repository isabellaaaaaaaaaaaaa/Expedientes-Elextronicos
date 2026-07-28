import type { NavigationPage, UserRole } from '../types';

export type Permission =
  | 'view_dashboard'
  | 'view_employees'
  | 'create_employee'
  | 'view_expedients'
  | 'create_expedient'
  | 'digitalize_documents'
  | 'save_drafts'
  | 'review_expedients'
  | 'validate_info'
  | 'finalize_expedients'
  | 'manage_users'
  | 'configure_system'
  | 'view_reports'
  | 'view_audit'
  | 'view_bitacora'
  | 'delete_expedients';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Administrador: [
    'view_dashboard',
    'view_employees',
    'create_employee',
    'view_expedients',
    'create_expedient',
    'digitalize_documents',
    'save_drafts',
    'review_expedients',
    'validate_info',
    'finalize_expedients',
    'delete_expedients',
    'manage_users',
    'configure_system',
    'view_reports',
    'view_audit',
    'view_bitacora',
  ],
  Doctora: [
    'view_dashboard',
    'view_employees',
    'view_expedients',
    'review_expedients',
    'validate_info',
    'finalize_expedients',
    'view_reports',
  ],
  Enfermera: [
    'view_dashboard',
    'view_employees',
    'view_expedients',
    'create_expedient',
    'digitalize_documents',
    'save_drafts',
    'create_employee',
  ],
  Auditor: [
    'view_dashboard',
    'view_employees',
    'view_expedients',
    'view_bitacora',
  ],
};

const NAV_PAGE_PERMISSIONS: Partial<Record<NavigationPage, Permission>> = {
  dashboard:     'view_dashboard',
  employees:     'view_employees',
  expedients:    'view_expedients',
  bitacora:      'view_bitacora',
  usuarios:      'manage_users',
  configuracion: 'configure_system',
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canNavigate(role: UserRole, page: NavigationPage): boolean {
  const required = NAV_PAGE_PERMISSIONS[page];
  if (!required) return true;
  return can(role, required);
}

export function getAllowedNavPages(role: UserRole): Set<NavigationPage> {
  const pages = new Set<NavigationPage>();
  (Object.keys(NAV_PAGE_PERMISSIONS) as NavigationPage[]).forEach(page => {
    if (canNavigate(role, page)) pages.add(page);
  });
  return pages;
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    Administrador: 'Administrador',
    Doctora: 'Doctora',
    Enfermera: 'Enfermería',
    Auditor: 'Auditor',
  };
  return labels[role];
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
    view_dashboard: 'Ver dashboard',
    view_employees: 'Ver empleados',
    create_employee: 'Crear empleados',
    view_expedients: 'Ver expedientes',
    create_expedient: 'Crear expedientes',
    digitalize_documents: 'Digitalizar documentos',
    save_drafts: 'Guardar borradores',
    review_expedients: 'Revisar expedientes',
    validate_info: 'Validar información',
    finalize_expedients: 'Finalizar expedientes',
    manage_users: 'Gestión de usuarios',
    configure_system: 'Configuración del sistema',
    view_reports: 'Ver reportes',
    view_audit: 'Ver auditoría',
    view_bitacora: 'Consultar bitácora',
    delete_expedients: 'Eliminar expedientes',
  };
  return labels[permission] ?? permission;
}
