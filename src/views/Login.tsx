import { useState } from 'react';
import { Eye, EyeOff, LogIn, ShieldCheck, FileClock, FolderArchive, Lock } from 'lucide-react';
import type { AuthUser, UserRole, Planta } from '../types';

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

const ROLES: UserRole[] = ['Administrador', 'Doctora', 'Enfermera', 'Auditor'];
const PLANTAS: Planta[] = ['61', '63', '65', '66', '68'];

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<UserRole>('Doctora');
  const [planta, setPlanta]     = useState<Planta>('61');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (password.length < 4) {
      setError('Contraseña incorrecta.');
      return;
    }
    setError('');
    onLogin({ username: username.trim(), role, planta });
  };

  return (
    <div className="min-h-screen bg-[#1E2228] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-5 gap-6 items-stretch">

        {/* Information card — institutional identity, greater presence */}
        <div className="hidden lg:flex flex-col justify-between bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-12 lg:col-span-3 relative overflow-hidden">
          {/* Red side accent line */}
          <div className="absolute left-0 top-10 bottom-10 w-1 bg-[hsl(355,78%,51%)] rounded-full" />

          <div className="pl-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-[hsl(355,78%,51%)] flex items-center justify-center shadow-sm">
                <span className="text-white font-extrabold text-lg tracking-tight">N</span>
              </div>
              <div className="leading-none">
                <p className="text-gray-900 font-extrabold text-3xl leading-tight tracking-tight">SAM</p>
                <p className="text-slate-400 text-xs font-medium leading-tight mt-1.5">Sistema de Administración Médica</p>
              </div>
            </div>

            {/* Red separator */}
            <div className="w-12 h-0.5 bg-[hsl(355,78%,51%)] rounded-full mt-8" />

            <h1 className="mt-8 text-xl font-bold text-gray-900 leading-snug tracking-tight">
              Digitalización de expedientes médicos
            </h1>
            <p className="mt-5 text-sm text-slate-500 leading-relaxed">
              Plataforma para la digitalización y almacenamiento de expedientes médicos existentes. Centraliza la información médica del personal en formato electrónico, sustituyendo el archivo físico por un expediente digital que facilita la consulta segura, la organización y la administración documental.
            </p>

            <div className="mt-9 space-y-4">
              {[
                { icon: FolderArchive, label: 'Expedientes digitalizados' },
                { icon: ShieldCheck,    label: 'Consulta segura y centralizada' },
                { icon: FileClock,      label: 'Archivo electrónico por empleado' },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-[hsl(355,78%,51%)]" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-10 pl-4">© 2026 Nexteer — Área Médica</p>
        </div>

        {/* Login card — discreet, minimalist */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 p-8 sm:p-9 flex flex-col justify-center lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="text-slate-400 text-sm mt-1.5">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="input-label">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                className="input-base"
              />
            </div>

            <div>
              <label className="input-label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-base pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Planta</label>
                <select
                  value={planta}
                  onChange={e => setPlanta(e.target.value as Planta)}
                  className="input-base"
                >
                  {PLANTAS.map(p => <option key={p} value={p}>Planta {p}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Rol</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="input-base"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 h-11 bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] active:bg-[hsl(355,78%,42%)] text-white font-semibold text-sm rounded-lg transition-all shadow-sm hover:shadow mt-2 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-1"
            >
              <LogIn size={16} strokeWidth={2.5} />
              Iniciar Sesión
            </button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 mt-7">
            <Lock size={12} />
            Usa cualquier usuario y contraseña (mín. 4 caracteres)
          </p>
        </div>
      </div>
    </div>
  );
}
