import { Settings, Image, ShieldCheck, Users, Lock } from 'lucide-react';
import type { AuthUser } from '../types';

interface ConfiguracionProps {
  user: AuthUser;
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

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

function PlaceholderInput({ value, placeholder, isAdmin }: { value?: string; placeholder?: string; isAdmin: boolean }) {
  return (
    <input
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      disabled={!isAdmin}
      className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-gray-700 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
    />
  );
}

const roles = [
  { nombre: 'Administrador', descripcion: 'Acceso completo al sistema, gestión de usuarios y configuración.' },
  { nombre: 'Médico',        descripcion: 'Puede crear, editar y finalizar expedientes y consultas.' },
  { nombre: 'Enfermera',     descripcion: 'Puede capturar documentos y actualizar registros asignados.' },
  { nombre: 'Auditor',       descripcion: 'Solo lectura. No puede editar, crear, eliminar ni desbloquear.' },
];

export default function Configuracion({ user }: ConfiguracionProps) {
  const isAdmin = user.role === 'Administrador';
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
        <p className="text-sm text-slate-400 mt-0.5">Ajustes generales del sistema SAM</p>
      </div>

      {/* Sistema */}
      <SectionCard title="Nombre del sistema" icon={Settings} iconBg="bg-blue-50" iconColor="text-blue-600">
        <div className="space-y-3">
          <FieldGroup label="Nombre del sistema">
            <PlaceholderInput value="SAM — Sistema de Administración Médica" isAdmin={isAdmin} />
          </FieldGroup>
          <FieldGroup label="Subtítulo / Área">
            <PlaceholderInput value="Área Médica" isAdmin={isAdmin} />
          </FieldGroup>
          <FieldGroup label="Versión">
            <PlaceholderInput value="v0.2 — Prototipo en validación" isAdmin={isAdmin} />
          </FieldGroup>
          <p className="text-[11px] text-slate-400 pt-1">La edición de estos campos estará disponible en la versión final.</p>
        </div>
      </SectionCard>

      {/* Logo */}
      <SectionCard title="Logotipo" icon={Image} iconBg="bg-slate-50" iconColor="text-slate-500">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center flex-shrink-0">
            <Image size={22} className="text-slate-300" />
            <p className="text-[9px] text-slate-300 mt-1 font-medium">Sin logo</p>
          </div>
          <div className="space-y-2 flex-1">
            <p className="text-sm font-semibold text-gray-700">Subir logotipo de la empresa</p>
            <p className="text-xs text-slate-400 leading-relaxed">Formatos aceptados: PNG, SVG. Tamaño recomendado: 200×200 px. Esta función estará disponible en la versión final.</p>
            <button disabled={!isAdmin} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl ${!isAdmin ? 'cursor-not-allowed' : ''}`}>
              <Image size={13} />
              Cargar imagen (proximamente)
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Roles */}
      <SectionCard title="Roles del sistema" icon={Users} iconBg="bg-violet-50" iconColor="text-violet-600">
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-4">Estructura de roles definida para el sistema. La asignación de usuarios a roles estará disponible en la versión final.</p>
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
      <SectionCard title="Contraseña maestra de desbloqueo" icon={Lock} iconBg="bg-amber-50" iconColor="text-amber-600">
        <div className="space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Esta contraseña se utiliza para desbloquear expedientes en estado <span className="font-bold text-slate-700">Finalizado</span> y permitir su edición. En la versión final esta contraseña será configurable y auditada.
          </p>
          <FieldGroup label="Contraseña actual">
            <input
              type="password"
              defaultValue="doctora"
              disabled={!isAdmin}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-gray-700 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </FieldGroup>
          <FieldGroup label="Nueva contraseña">
            <input
              type="password"
              placeholder="Disponible en versión final"
              disabled={!isAdmin}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-gray-400 ${!isAdmin ? 'opacity-60 cursor-not-allowed placeholder:text-slate-300' : ''}`}
            />
          </FieldGroup>
          <button disabled={!isAdmin} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl ${!isAdmin ? 'cursor-not-allowed' : ''}`}>
            <Lock size={13} />
            Cambiar contraseña (proximamente)
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
