import { useEffect } from 'react';
import {
  X,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Database,
  ScanLine,
  FileStack,
  Sparkles,
  Timer,
  ShieldCheck,
  CircleCheck,
  CircleAlert,
  type LucideIcon,
} from 'lucide-react';

interface SystemStatusDrawerProps {
  open: boolean;
  onClose: () => void;
  data: {
    totalExpedients: number;
    digitalizadosHoy: number;
    documentosProcesados: number;
    aiConfidence: number;
    tiempoPromedio: string;
    finalizados: number;
    enRevision: number;
    sinRevisar: number;
  };
}

interface ServiceItem {
  label: string;
  icon: LucideIcon;
  status: 'operational' | 'degraded' | 'down';
  detail: string;
}

export function SystemStatusDrawer({ open, onClose, data }: SystemStatusDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const services: ServiceItem[] = [
    { label: 'Servidor de aplicación', icon: Server,      status: 'operational', detail: 'Respuesta 42 ms' },
    { label: 'Base de datos',          icon: Database,    status: 'operational', detail: 'Conexión estable' },
    { label: 'Almacenamiento',         icon: HardDrive,   status: 'operational', detail: '68% utilizado' },
    { label: 'Motor de digitalización', icon: ScanLine,   status: 'operational', detail: 'Activo' },
    { label: 'Motor de IA (OCR)',       icon: Cpu,         status: 'operational', detail: `${data.aiConfidence}% confianza prom.` },
    { label: 'Conectividad de red',    icon: Wifi,        status: 'operational', detail: 'Latencia 18 ms' },
  ];

  const statusStyles: Record<ServiceItem['status'], { dot: string; text: string; label: string }> = {
    operational: { dot: 'bg-green-500', text: 'text-green-600', label: 'Operativo' },
    degraded:   { dot: 'bg-amber-500', text: 'text-amber-600', label: 'Degradado' },
    down:       { dot: 'bg-red-500',   text: 'text-red-600',   label: 'Caído' },
  };

  const metrics = [
    { label: 'Expedientes totales',     value: data.totalExpedients.toLocaleString(),     icon: FileStack },
    { label: 'Digitalizados hoy',       value: data.digitalizadosHoy.toLocaleString(),     icon: ScanLine },
    { label: 'Documentos procesados',   value: data.documentosProcesados.toLocaleString(), icon: FileStack },
    { label: 'Confianza de IA',          value: `${data.aiConfidence}%`,                    icon: Sparkles },
    { label: 'Tiempo prom. digitaliz.',  value: data.tiempoPromedio,                         icon: Timer },
    { label: 'Tasa de finalización',    value: data.totalExpedients > 0 ? `${Math.round((data.finalizados / data.totalExpedients) * 100)}%` : '0%', icon: CircleCheck },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        open ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Estado del Sistema</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monitoreo operativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Overall status banner */}
          <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3.5">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CircleCheck size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">Todos los sistemas operativos</p>
              <p className="text-xs text-green-600 mt-0.5">Sin incidencias reportadas</p>
            </div>
          </div>

          {/* Digitalization metrics */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Digitalización</p>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500 leading-tight">{label}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Service status list */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Servicios</p>
            <div className="space-y-2">
              {services.map(({ label, icon: Icon, status, detail }) => {
                const s = statusStyles[status];
                return (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{detail}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`status-dot ${s.dot}`} />
                      <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expedient distribution mini */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Distribución de expedientes</p>
            <div className="space-y-3">
              {([
                { label: 'Finalizados', value: data.finalizados, color: 'bg-green-500' },
                { label: 'En revisión',  value: data.enRevision,  color: 'bg-amber-500' },
                { label: 'Sin revisar',  value: data.sinRevisar,  color: 'bg-slate-400' },
              ]).map(item => {
                const pct = data.totalExpedients > 0 ? (item.value / data.totalExpedients) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                      <span className="text-xs font-semibold text-slate-400 tabular-nums">{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CircleAlert size={13} className="text-slate-300" />
              <span className="text-xs text-slate-400">Última actualización: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
