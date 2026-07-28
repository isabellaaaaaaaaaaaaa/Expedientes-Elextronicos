import { useState } from 'react';
import { Settings, Image, ShieldCheck, Users, Lock, ArrowLeft, Save, Check, Eye, EyeOff, Loader as Loader2 } from 'lucide-react';
import { useSettings, useUsers } from '../hooks/useStore';
import { addUser, updateUser, deleteUser, updateSettings } from '../lib/store';
import type { SystemUser } from '../lib/store';
import type { AuthUser, NavigationPage } from '../types';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

interface ConfiguracionProps {
  user: AuthUser;
  onNavigate: (page: NavigationPage) => void;
}

function SectionCard({ title, icon: Icon, iconBg, iconColor, children }: {
  title: string; icon: React.ElementType; iconBg: string; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={15} className={iconColor} />
        </div>
        <p className="section-title">{title}</p>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

const roles = [
  { nombre: 'Administrador', descripcion: 'Acceso completo al sistema, gestión de usuarios y configuración.' },
  { nombre: 'Doctora',       descripcion: 'Puede crear, editar y finalizar expedientes y consultas.' },
  { nombre: 'Enfermera',     descripcion: 'Puede capturar documentos y actualizar registros asignados.' },
  { nombre: 'Auditor',       descripcion: 'Solo lectura. No puede editar, crear, eliminar ni desbloquear.' },
];

export default function Configuracion({ user, onNavigate }: ConfiguracionProps) {
  const isAdmin = user.role === 'Administrador';
  const settings = useSettings();
  const users = useUsers();

  const [sysName, setSysName] = useState(settings.systemName);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [savingSystem, setSavingSystem] = useState(false);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passError, setPassError] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userForm, setUserForm] = useState({ username: '', fullName: '', role: 'Doctora' as SystemUser['role'], planta: '61' as string });
  const [savingUser, setSavingUser] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const saveSystem = () => {
    setSavingSystem(true);
    setTimeout(() => {
      updateSettings({ systemName: sysName, subtitle });
      setSavingSystem(false);
      toast.success('Configuración del sistema actualizada');
    }, 600);
  };

  const savePassword = () => {
    setPassError('');
    if (oldPass !== settings.masterPassword) {
      setPassError('La contraseña actual es incorrecta.');
      return;
    }
    if (newPass.length < 4) {
      setPassError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }
    setSavingPass(true);
    setTimeout(() => {
      updateSettings({ masterPassword: newPass });
      setOldPass(''); setNewPass(''); setConfirmPass('');
      setSavingPass(false);
      toast.success('Contraseña maestra actualizada correctamente');
    }, 600);
  };

  const openNewUserForm = () => {
    setEditingUser(null);
    setUserForm({ username: '', fullName: '', role: 'Doctora', planta: '61' });
    setShowUserForm(true);
  };

  const openEditUserForm = (u: SystemUser) => {
    setEditingUser(u);
    setUserForm({ username: u.username, fullName: u.fullName, role: u.role, planta: u.planta });
    setShowUserForm(true);
  };

  const saveUserForm = () => {
    if (!userForm.username.trim() || !userForm.fullName.trim()) {
      toast.error('Completa todos los campos del usuario');
      return;
    }
    setSavingUser(true);
    setTimeout(() => {
      if (editingUser) {
        updateUser(editingUser.id, {
          username: userForm.username,
          fullName: userForm.fullName,
          role: userForm.role,
          planta: userForm.planta,
        });
        toast.success(`Usuario "${userForm.username}" actualizado`);
      } else {
        const newUser: SystemUser = {
          id: `usr-${Date.now()}`,
          username: userForm.username,
          fullName: userForm.fullName,
          role: userForm.role,
          planta: userForm.planta,
          active: true,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        addUser(newUser);
        toast.success(`Usuario "${userForm.username}" creado correctamente`);
      }
      setSavingUser(false);
      setShowUserForm(false);
    }, 600);
  };

  const toggleUserActive = (u: SystemUser) => {
    updateUser(u.id, { active: !u.active, lastLogin: u.active ? u.lastLogin : undefined });
    toast.success(`Usuario "${u.username}" ${u.active ? 'desactivado' : 'activado'}`);
  };

  const removeUser = (u: SystemUser) => {
    setConfirmDeleteUser(u);
  };

  const confirmRemoveUser = () => {
    if (!confirmDeleteUser) return;
    setDeletingUser(true);
    const u = confirmDeleteUser;
    setTimeout(() => {
      deleteUser(u.id);
      setDeletingUser(false);
      setConfirmDeleteUser(null);
      toast.success(`Usuario "${u.username}" eliminado`);
    }, 500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al Dashboard
      </button>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
        <p className="text-sm text-slate-400 mt-0.5">Ajustes generales del sistema SAM</p>
      </div>

      {/* Sistema */}
      <SectionCard title="Nombre del sistema" icon={Settings} iconBg="bg-red-50" iconColor="text-[hsl(355,78%,51%)]">
        <div className="space-y-4">
          <div>
            <label className="input-label">Nombre del sistema</label>
            <input
              type="text"
              value={sysName}
              onChange={e => setSysName(e.target.value)}
              disabled={!isAdmin}
              className="input-base"
            />
          </div>
          <div>
            <label className="input-label">Subtítulo / Área</label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              disabled={!isAdmin}
              className="input-base"
            />
          </div>
          <div>
            <label className="input-label">Versión</label>
            <input
              type="text"
              value={settings.version}
              disabled
              className="input-base opacity-60 cursor-not-allowed"
            />
          </div>
          {isAdmin && (
            <button
              onClick={saveSystem}
              disabled={savingSystem}
              className="flex items-center gap-2 px-4 h-9 text-xs font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-all disabled:opacity-60"
            >
              {savingSystem ? <Save size={13} className="animate-pulse" /> : <Check size={13} />}
              {savingSystem ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </SectionCard>

      {/* Logo */}
      <SectionCard title="Logotipo" icon={Image} iconBg="bg-slate-50" iconColor="text-slate-500">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-xl bg-[hsl(355,78%,51%)] flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-extrabold text-2xl tracking-tight">N</span>
          </div>
          <div className="space-y-2 flex-1">
            <p className="text-sm font-semibold text-gray-700">Logotipo institucional</p>
            <p className="text-xs text-slate-400 leading-relaxed">El logotipo de Nexteer está preconfigurado y se muestra en el login, sidebar y documentos impresos.</p>
          </div>
        </div>
      </SectionCard>

      {/* Roles */}
      <SectionCard title="Roles del sistema" icon={Users} iconBg="bg-violet-50" iconColor="text-violet-600">
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-4">Estructura de roles definida para el sistema. La asignación de usuarios se gestiona desde la sección "Usuarios".</p>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {roles.map(role => (
              <div key={role.nombre} className="flex items-start gap-3.5 px-4 py-3.5">
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck size={14} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{role.nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{role.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Contraseña maestra */}
      {isAdmin && (
        <SectionCard title="Contraseña maestra de desbloqueo" icon={Lock} iconBg="bg-amber-50" iconColor="text-amber-600">
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Esta contraseña se utiliza para desbloquear expedientes en estado <span className="font-bold text-slate-700">Finalizado</span> y permitir su edición.
            </p>
            <div>
              <label className="input-label">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPass}
                  onChange={e => setOldPass(e.target.value)}
                  placeholder="Ingresa la contraseña actual"
                  className="input-base pr-11"
                />
                <button type="button" onClick={() => setShowOld(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Mín. 4 caracteres"
                    className="input-base pr-11"
                  />
                  <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="input-label">Confirmar</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="input-base"
                />
              </div>
            </div>
            {passError && (
              <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">{passError}</p>
            )}
            <button
              onClick={savePassword}
              disabled={savingPass || !oldPass || !newPass || !confirmPass}
              className="flex items-center gap-2 px-4 h-9 text-xs font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPass ? <Save size={13} className="animate-pulse" /> : <Lock size={13} />}
              {savingPass ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </SectionCard>
      )}

      {/* Users management */}
      {isAdmin && (
        <SectionCard title="Gestión de usuarios" icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Usuarios con acceso al sistema y sus roles asignados.</p>
              <button
                onClick={openNewUserForm}
                className="flex items-center gap-1.5 px-3 h-8 text-xs font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-all"
              >
                <Users size={13} />
                Nuevo usuario
              </button>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${u.active ? 'bg-blue-50' : 'bg-slate-100'}`}>
                    <Users size={14} className={u.active ? 'text-blue-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{u.fullName}</p>
                      {!u.active && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Inactivo</span>}
                    </div>
                    <p className="text-xs text-slate-400">@{u.username} · {u.role} · Planta {u.planta}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditUserForm(u)} className="px-2.5 h-7 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors">Editar</button>
                    <button onClick={() => toggleUserActive(u)} className="px-2.5 h-7 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => removeUser(u)} className="px-2.5 h-7 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showUserForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowUserForm(false)}>
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-sm font-bold text-gray-900 mb-4">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="input-label">Nombre completo</label>
                    <input type="text" value={userForm.fullName} onChange={e => setUserForm(f => ({ ...f, fullName: e.target.value }))} className="input-base" placeholder="Ej. Dra. Karina López" />
                  </div>
                  <div>
                    <label className="input-label">Usuario</label>
                    <input type="text" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} className="input-base" placeholder="Ej. klopez" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Rol</label>
                      <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value as SystemUser['role'] }))} className="input-base">
                        <option value="Administrador">Administrador</option>
                        <option value="Doctora">Doctora</option>
                        <option value="Enfermera">Enfermera</option>
                        <option value="Auditor">Auditor</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Planta</label>
                      <select value={userForm.planta} onChange={e => setUserForm(f => ({ ...f, planta: e.target.value }))} className="input-base">
                        <option value="61">Planta 61</option>
                        <option value="63">Planta 63</option>
                        <option value="65">Planta 65</option>
                        <option value="66">Planta 66</option>
                        <option value="68">Planta 68</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <button onClick={() => setShowUserForm(false)} className="px-4 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                  <button onClick={saveUserForm} disabled={savingUser} className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-all disabled:opacity-60">
                    {savingUser ? <Save size={13} className="animate-pulse" /> : <Check size={13} />}
                    {savingUser ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      <ConfirmDialog
        open={!!confirmDeleteUser}
        title="¿Eliminar usuario?"
        message={`Se eliminará permanentemente el usuario «${confirmDeleteUser?.username}» (${confirmDeleteUser?.fullName}). Esta acción no se puede deshacer.`}
        confirmLabel={deletingUser ? 'Eliminando...' : 'Eliminar'}
        variant="danger"
        onConfirm={confirmRemoveUser}
        onCancel={() => setConfirmDeleteUser(null)}
      >
        {deletingUser && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 size={12} className="animate-spin" /> Eliminando usuario...
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
