import { useState } from 'react';
import { Lock, X, Eye, EyeOff, ShieldAlert, CircleAlert as AlertCircle } from 'lucide-react';

const MASTER_PASSWORD = 'doctora';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export default function UnlockModal({ isOpen, onClose, onUnlock }: UnlockModalProps) {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      onUnlock();
      setPassword('');
      setError('');
    } else {
      setError('Contraseña incorrecta. Verifica e intenta de nuevo.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-6 pb-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Expediente finalizado</p>
                <p className="text-[11px] text-amber-100 mt-0.5 leading-snug">
                  Para volver a editarlo ingrese la contraseña de autorización.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Contraseña de autorización"
                autoFocus
                autoComplete="current-password"
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-gray-800 ${
                  error
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                    : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-red-600">
                <AlertCircle size={12} />
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors shadow-sm"
            >
              <Lock size={14} />
              Desbloquear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
