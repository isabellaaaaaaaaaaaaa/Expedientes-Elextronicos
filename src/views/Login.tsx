import { useState } from 'react';
import { Eye, EyeOff, Stethoscope, LogIn } from 'lucide-react';
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
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[42%] bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="relative flex items-center gap-3 z-10">
          <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Stethoscope size={22} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">MedExpedient</p>
            <p className="text-blue-200 text-xs">Área Médica Empresarial</p>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <h1 className="text-white text-3xl font-bold leading-tight">
            Gestión de expedientes médicos
          </h1>
          <p className="text-blue-100 mt-4 text-sm leading-relaxed">
            Plataforma centralizada para la administración de expedientes médicos del personal, con seguimiento de registros, documentos y estados en tiempo real.
          </p>
          <div className="mt-8 space-y-3">
            {['Expedientes digitalizados', 'Registros médicos por año', 'Documentos adjuntos por empleado'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                <span className="text-blue-50 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-blue-300 text-xs z-10">© 2026 Nexteer — Área Médica</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFBFC] px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div>
              <p className="text-gray-900 font-bold leading-tight">MedExpedient</p>
              <p className="text-slate-400 text-xs">Área Médica</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
          <p className="text-slate-400 text-sm mt-1.5">Inicia sesión para continuar</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-blue-200 mt-2"
            >
              <LogIn size={16} strokeWidth={2.5} />
              Iniciar Sesión
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Usa cualquier usuario y contraseña (mín. 4 caracteres)
          </p>
        </div>
      </div>
    </div>
  );
}
