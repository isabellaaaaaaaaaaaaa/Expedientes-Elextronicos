import { FileText, Image, Plus } from 'lucide-react';
import { documents, employees, expedients } from '../data/mockData';
import type { NavigationPage, Planta } from '../types';
import { EmptyState } from '../components/ui/empty-state';

interface DocumentsGlobalProps {
  planta: Planta;
  onNavigate: (page: NavigationPage, employeeId?: string, expedientId?: string) => void;
}

const docTypeColors: Record<string, string> = {
  'Examen médico':   'bg-blue-50 text-blue-700',
  'Audiometría':     'bg-teal-50 text-teal-700',
  'Espirometría':    'bg-cyan-50 text-cyan-700',
  'Laboratorio':     'bg-violet-50 text-violet-700',
  'Radiografía':     'bg-slate-100 text-slate-600',
  'Consulta médica': 'bg-green-50 text-green-700',
  'Incapacidad':     'bg-orange-50 text-orange-700',
  'Fotografía':      'bg-pink-50 text-pink-700',
  'Otro':            'bg-slate-100 text-slate-600',
};

export default function DocumentsGlobal({ planta: _planta, onNavigate }: DocumentsGlobalProps) {
  void _planta;
  // planta is UI context only; all documents shown until persistence-based filtering exists
  const enriched = documents
    .map(doc => ({
      ...doc,
      employee: employees.find(e => e.id === doc.employeeId),
      expedient: expedients.find(e => e.id === doc.expedientId),
    }))
    .filter(d => d.employee && d.expedient);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Documentos</h2>
          <p className="text-sm text-slate-400 mt-0.5">{enriched.length} documento{enriched.length !== 1 ? 's' : ''} digitalizados</p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed flex-shrink-0"
          title="Usa el módulo de captura dentro del expediente"
        >
          <Plus size={15} />
          Subir Documento
        </button>
      </div>

      {enriched.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No existen documentos cargados"
            description="Los documentos se agregan desde el expediente de cada empleado usando el módulo de captura."
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
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.fileType === 'image' ? 'bg-blue-50' : 'bg-red-50'} overflow-hidden`}>
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
                            className="text-sm text-slate-700 hover:text-blue-600 font-medium transition-colors"
                          >
                            {doc.employee.firstName} {doc.employee.lastName1}
                          </button>
                        )}
                      </td>
                      <td className="hidden sm:table-cell">
                        {doc.expedient && (
                          <button
                            onClick={() => onNavigate('expedient-form', doc.employeeId, doc.expedientId)}
                            className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
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
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
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
