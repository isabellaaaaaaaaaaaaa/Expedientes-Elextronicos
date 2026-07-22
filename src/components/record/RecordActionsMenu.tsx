import { useState, useRef, useEffect } from 'react';
import { MoveVertical as MoreVertical, FileDown, Printer, Paperclip } from 'lucide-react';
import { exportRegistroToPDF, printRegistro, downloadDocument } from '../../lib/exportUtils';
import { logAction } from '../../lib/auditLog';
import type { Employee, Expedient, MedDocument } from '../../types';

interface RecordActionsMenuProps {
  employee: Employee;
  expedient: Expedient;
  documents: MedDocument[];
  user?: string;
  onPrintPreview?: (employeeId: string, expedientId: string) => void;
}

export default function RecordActionsMenu({ employee, expedient, documents, user = 'Sistema', onPrintPreview }: RecordActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const attachedDocs = documents.filter(d => d.expedientId === expedient.id);

  const handleDownloadPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportRegistroToPDF(employee, expedient);
    logAction(expedient.id, user, 'Descarga de PDF', 'Descargó el PDF');
    setOpen(false);
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPrintPreview) {
      onPrintPreview(employee.id, expedient.id);
    } else {
      printRegistro(employee, expedient);
      logAction(expedient.id, user, 'Impresión', 'Realizó la impresión');
    }
    setOpen(false);
  };

  const handleDownloadDoc = (e: React.MouseEvent, doc: MedDocument) => {
    e.stopPropagation();
    downloadDocument({ name: doc.name, dataUrl: doc.dataUrl, fileType: doc.fileType });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Más opciones"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 animate-in fade-in-0 zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
          >
            <FileDown size={15} className="text-slate-400" />
            Descargar registro en PDF
          </button>

          <button
            onClick={handlePrint}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
          >
            <Printer size={15} className="text-slate-400" />
            Imprimir registro
          </button>

          {attachedDocs.length > 0 && (
            <>
              <div className="border-t border-slate-100 my-1" />
              {attachedDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={(e) => handleDownloadDoc(e, doc)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-600 transition-colors text-left"
                >
                  <Paperclip size={15} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{doc.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
