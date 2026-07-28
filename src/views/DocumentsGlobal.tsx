import { useMemo, useState } from 'react';
import { FileText, Image, Search } from 'lucide-react';
import { useDocuments, useEmployees, useExpedients } from '../hooks/useStore';
import type { NavigationPage, Planta } from '../types';
import { EmptyState } from '../components/ui/empty-state';

interface DocumentsGlobalProps {
  planta: Planta;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string) => void;
}

const docTypeColors: Record<string, string> = {
  'Examen médico':   'bg-red-50 text-red-700',
  'Audiometría':     'bg-teal-50 text-teal-700',
  'Espirometría':    'bg-cyan-50 text-cyan-700',
  'Laboratorio':     'bg-violet-50 text-violet-700',
  'Radiografía':     'bg-slate-100 text-slate-600',
  'Consulta médica': 'bg-green-50 text-green-700',
  'Incapacidad':     'bg-orange-50 text-orange-700',
  'Fotografía':      'bg-pink-50 text-pink-700',
  'Otro':            'bg-slate-100 text-slate-600',
};

const docTypes = ['Examen médico', 'Audiometría', 'Espirometría', 'Laboratorio', 'Radiografía', 'Consulta médica', 'Incapacidad', 'Fotografía', 'Otro'];

export default function DocumentsGlobal({ planta, onNavigate }: DocumentsGlobalProps) {
  const documents = useDocuments(planta);
  const employees = useEmployees(planta);
  const expedients = useExpedients(planta);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const enriched = useMemo(() => {
    return documents
      .map(doc => ({
        ...doc,
        employee: employees.find(e => e.id === doc.employeeId),
        expedient: expedients.find(e => e.id === doc.expedientId),
      }))
      .filter(d => d.employee && d.expedient)
      .filter(d => {
        if (filterType && d.type !== filterType) return false;
        if (search) {
          const q = search.toLowerCase();
          const empName = `${d.employee!.firstName} ${d.employee!.lastName1}`.toLowerCase();
          return d.name.toLowerCase().includes(q) || empName.includes(q) || d.employee!.employeeNumber.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [documents, employees, expedients, search, filterType]);

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Documentos</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {enriched.length} documento{enriched.length !== 1 ? 's' : ''} digitalizados
          {planta && <span className="text-slate-400"> · Planta {planta}</span>}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empleado o número..."
            className="w-full pl-10 pr-4 h-10 text-sm bg-white border border-slate-200 rounded-lg text-gray-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10 transition-all"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-gray-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10 transition-all min-w-[160px]"
        >
          <option value="">Todos los tipos</option>
          {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {enriched.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title={search || filterType ? "No se encontraron documentos" : "No existen documentos cargados"}
            description={search || filterType ? "Ajusta los filtros de búsqueda." : "Los documentos se agregan desde el expediente de cada empleado usando el módulo de captura."}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th>Documento</th>
                  <th className="hidden md:table-cell">Tipo</th>
                  <th className="hidden lg:table-cell">Empleado</th>
                  <th className="hidden sm:table-cell">Expediente</th>
                  <th className="hidden xl:table-cell">Cargado por</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enriched.map(doc => {
                  const colorClass = docTypeColors[doc.type] ?? docTypeColors['Otro'];
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.fileType === 'image' ? 'bg-red-50' : 'bg-red-50'} overflow-hidden`}>
                            {doc.fileType === 'image' && doc.dataUrl ? (
                              <img src={doc.dataUrl} alt={doc.name} className="w-full h-full object-cover" />
                            ) : doc.fileType === 'image' ? (
                              <Image size={16} className="text-blue-400" />
                            ) : (
                              <FileText size={16} className="text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{doc.name}</p>
                            <p className="text-xs text-slate-400">{new Date(doc.uploadDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-bold ${colorClass}`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        {doc.employee && (
                          <button
                            onClick={() => onNavigate('employee-profile', doc.employeeId)}
                            className="text-sm text-slate-700 hover:text-red-600 font-medium transition-colors"
                          >
                            {doc.employee.firstName} {doc.employee.lastName1}
                          </button>
                        )}
                      </td>
                      <td className="hidden sm:table-cell">
                        {doc.expedient && (
                          <button
                            onClick={() => onNavigate('expedient-form', doc.employeeId, doc.expedientId)}
                            className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                          >
                            Expediente {doc.expedient.year}
                          </button>
                        )}
                      </td>
                      <td className="hidden xl:table-cell">
                        <p className="text-xs text-slate-500">{doc.uploadedBy}</p>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => onNavigate('expedient-form', doc.employeeId, doc.expedientId)}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                        >
                          Ver expediente
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
