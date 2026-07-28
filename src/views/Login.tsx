import { useState } from 'react';
import { Eye, EyeOff, LogIn, Lock, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AuthUser, UserRole, Planta } from '../types';
import { writeAuditLog } from '../lib/auditService';

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
  const [loading, setLoading]   = useState(false);

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
    setLoading(true);
    const toastId = toast.loading('Verificando credenciales...', { description: `Planta ${planta} · ${role}` });
    setTimeout(() => {
      toast.success(`Bienvenido, ${username.trim()}`, { id: toastId, description: 'Sesión iniciada correctamente' });
      writeAuditLog({
        user: username.trim(),
        userRole: role,
        action: `Inicio de sesión — Planta ${planta}`,
      });
      onLogin({ username: username.trim(), role, planta });
    }, 900);
  };

  return (
    <div className="h-screen w-full flex">

      {/* Left column — institutional identity (40%) */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#1E2228] relative flex-col justify-center px-16 xl:px-24">
        {/* Discreet vertical red accent line */}
        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[hsl(355,78%,51%)] rounded-full opacity-80" />

        <div className="pl-6">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-[hsl(355,78%,51%)] flex items-center justify-center shadow-lg">
            <span className="text-white font-extrabold text-2xl tracking-tight">N</span>
          </div>

          {/* Identity */}
          <h1 className="mt-10 text-white font-extrabold text-4xl leading-none tracking-tight">SAM</h1>
          <p className="mt-3 text-slate-300 text-sm font-medium tracking-wide">Sistema de Administración Médica</p>
          <p className="mt-1 text-slate-500 text-xs font-medium tracking-wider uppercase">Nexteer México</p>

          {/* Red separator */}
          <div className="w-14 h-0.5 bg-[hsl(355,78%,51%)] rounded-full mt-10" />

          {/* Description */}
          <p className="mt-10 text-slate-400 text-sm leading-relaxed max-w-sm">
            Plataforma para la digitalización, organización y consulta segura de expedientes médicos laborales.
          </p>
        </div>

        <p className="absolute bottom-8 left-16 xl:left-24 text-[11px] text-slate-600 font-medium">
          © 2026 Nexteer — Área Médica
        </p>
      </div>

      {/* Right column — login form (60%) */}
      <div className="flex-1 bg-white flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32">
        <div className="w-full max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bienvenido</h2>
          <p className="text-slate-400 text-sm mt-2">Inicia sesión con tus credenciales corporativas.</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 tracking-wide">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-gray-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-[hsl(355,78%,51%)] focus:bg-white focus:ring-2 focus:ring-red-500/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 tracking-wide">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-gray-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-[hsl(355,78%,51%)] focus:bg-white focus:ring-2 focus:ring-red-500/10"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 tracking-wide">Planta</label>
                <select
                  value={planta}
                  onChange={e => setPlanta(e.target.value as Planta)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-gray-900 transition-all focus:outline-none focus:border-[hsl(355,78%,51%)] focus:bg-white focus:ring-2 focus:ring-red-500/10"
                >
                  {PLANTAS.map(p => <option key={p} value={p}>Planta {p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 tracking-wide">Rol</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-gray-900 transition-all focus:outline-none focus:border-[hsl(355,78%,51%)] focus:bg-white focus:ring-2 focus:ring-red-500/10"
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-11 bg-[hsl(355,78%,51%)] hover:bg-[hsl(355,78%,46%)] active:bg-[hsl(355,78%,42%)] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-1"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} strokeWidth={2.5} />}
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 mt-8">
            <Lock size={12} />
            Usa cualquier usuario y contraseña (mín. 4 caracteres)
          </p>
        </div>
      </div>
    </div>
  );
}
