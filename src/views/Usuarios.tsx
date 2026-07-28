import { useState } from 'react';
import { ArrowLeft, Users, Plus, Search, ShieldCheck, Check, Save, UserPlus, Ban, Trash2, CreditCard as Edit2 } from 'lucide-react';
import { useUsers } from '../hooks/useStore';
import { addUser, updateUser, deleteUser } from '../lib/store';
import type { SystemUser } from '../lib/store';
import type { AuthUser, NavigationPage, Planta } from '../types';
import { toast } from 'sonner';

interface UsuariosProps {
  user: AuthUser;
  onNavigate: (page: NavigationPage) => void;
}

const PLANTAS: Planta[] = ['61', '63', '65', '66', '68'];
const ROLE_OPTIONS: SystemUser['role'][] = ['Administrador', 'Doctora', 'Enfermera', 'Auditor'];

const roleColors: Record<string, string> = {
  Administrador: 'bg-red-50 text-red-700',
  Doctora:       'bg-blue-50 text-blue-700',
  Enfermera:     'bg-teal-50 text-teal-700',
  Auditor:       'bg-violet-50 text-violet-700',
};

export default function Usuarios({ user, onNavigate }: UsuariosProps) {
  const isAdmin = user.role === 'Administrador';
  const users = useUsers();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [form, setForm] = useState({ username: '', fullName: '', role: 'Doctora' as SystemUser['role'], planta: '61' as Planta });
  const [saving, setSaving] = useState(false);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const openNew = () => {
    setEditing(null);
    setForm({ username: '', fullName: '', role: 'Doctora', planta: '61' });
    setShowForm(true);
  };

  const openEdit = (u: SystemUser) => {
    setEditing(u);
    setForm({ username: u.username, fullName: u.fullName, role: u.role, planta: u.planta as Planta });
    setShowForm(true);
  };

  const submit = () => {
    if (!form.username.trim() || !form.fullName.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    const dup = users.find(u => u.username === form.username && u.id !== editing?.id);
    if (dup) {
      toast.error('Ya existe un usuario con ese nombre de usuario');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      if (editing) {
        updateUser(editing.id, { username: form.username, fullName: form.fullName, role: form.role, planta: form.planta });
        toast.success(`Usuario "${form.username}" actualizado`);
      } else {
        addUser({
          id: `usr-${Date.now()}`,
          username: form.username,
          fullName: form.fullName,
          role: form.role,
          planta: form.planta,
          active: true,
          createdAt: new Date().toISOString().slice(0, 10),
        });
        toast.success(`Usuario "${form.username}" creado correctamente`);
      }
      setSaving(false);
      setShowForm(false);
    }, 600);
  };

  const toggleActive = (u: SystemUser) => {
    updateUser(u.id, { active: !u.active });
    toast.success(`Usuario "${u.username}" ${u.active ? 'desactivado' : 'activado'}`);
  };

  const remove = (u: SystemUser) => {
    if (u.username === user.username) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }
    deleteUser(u.id);
    toast.success(`Usuario "${u.username}" eliminado`);
  };

  return (
    <div className="max-w-5xl space-y-5">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {users.length} usuario{users.length !== 1 ? 's' : ''} · {users.filter(u => u.active).length} activos
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-all shadow-sm"
          >
            <Plus size={15} />
            Nuevo usuario
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, usuario o rol..."
          className="w-full pl-10 pr-4 h-10 text-sm bg-white border border-slate-200 rounded-lg text-gray-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10 transition-all"
        />
      </div>

      {!isAdmin && (
        <div className="card p-4 flex items-center gap-3">
          <ShieldCheck size={18} className="text-slate-400" />
          <p className="text-xs text-slate-500">Solo los administradores pueden crear, editar o eliminar usuarios.</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th>Usuario</th>
                <th className="hidden md:table-cell">Rol</th>
                <th className="hidden lg:table-cell">Planta</th>
                <th className="hidden sm:table-cell">Último acceso</th>
                <th>Estado</th>
                {isAdmin && <th className="text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${u.active ? 'bg-blue-50' : 'bg-slate-100'}`}>
                        <Users size={16} className={u.active ? 'text-blue-600' : 'text-slate-400'} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{u.fullName}</p>
                        <p className="text-xs text-slate-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-bold ${roleColors[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell">
                    <span className="text-sm text-slate-600">Planta {u.planta}</span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="text-xs text-slate-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin accesos'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.active ? 'text-green-600' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="text-right px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} title="Editar" className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => toggleActive(u)} title={u.active ? 'Desactivar' : 'Activar'} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors">
                          {u.active ? <Ban size={14} /> : <Check size={14} />}
                        </button>
                        <button onClick={() => remove(u)} title="Eliminar" className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">{search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-[hsl(355,78%,51%)] flex items-center justify-center">
                {editing ? <Edit2 size={15} className="text-white" /> : <UserPlus size={15} className="text-white" />}
              </div>
              <h3 className="text-sm font-bold text-gray-900">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Nombre completo</label>
                <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="input-base" placeholder="Ej. Dra. Karina López" />
              </div>
              <div>
                <label className="input-label">Usuario</label>
                <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="input-base" placeholder="Ej. klopez" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Rol</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as SystemUser['role'] }))} className="input-base">
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Planta</label>
                  <select value={form.planta} onChange={e => setForm(f => ({ ...f, planta: e.target.value as Planta }))} className="input-base">
                    {PLANTAS.map(p => <option key={p} value={p}>Planta {p}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold text-white bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] rounded-lg transition-all disabled:opacity-60">
                {saving ? <Save size={13} className="animate-pulse" /> : <Check size={13} />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
