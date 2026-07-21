import { useState, useRef } from 'react';
import { X, Upload, Check, Trash2, ZoomIn, FileText, Image as ImageIcon } from 'lucide-react';
import type { CapturedItem, DocumentType } from '../../types';

interface CaptureModuleProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: CapturedItem[], docType: DocumentType) => void;
  uploadedBy: string;
}

const docTypes: DocumentType[] = [
  'Examen médico',
  'Audiometría',
  'Espirometría',
  'Laboratorio',
  'Radiografía',
  'Otro',
];

export default function CaptureModule({ isOpen, onClose, onSave, uploadedBy: _uploadedBy }: CaptureModuleProps) {
  const [captures, setCaptures] = useState<CapturedItem[]>([]);
  const [docType, setDocType] = useState<DocumentType>('Examen médico');
  const [preview, setPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        setCaptures(prev => [
          ...prev,
          {
            id: `imp-${Date.now()}-${file.name}`,
            dataUrl,
            fileType: isPdf ? 'pdf' : 'image',
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCapture = (id: string) => {
    setCaptures(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = () => {
    onSave(captures, docType);
    setCaptures([]);
    setDocType('Examen médico');
    setPreview(null);
  };

  const handleClose = () => {
    setCaptures([]);
    setDocType('Examen médico');
    setPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Upload size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Importar archivos</p>
              <p className="text-[11px] text-slate-400">PDF, JPG o PNG</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 space-y-4">
          {/* Upload area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="w-full border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-2xl p-10 text-center transition-all group"
            >
              <Upload size={28} className="mx-auto text-slate-300 group-hover:text-blue-400 mb-3 transition-colors" />
              <p className="text-sm font-semibold text-slate-500 group-hover:text-blue-600 transition-colors">
                Toca para seleccionar archivos
              </p>
              <p className="text-xs text-slate-400 mt-1">Formatos permitidos: PDF, JPG, PNG</p>
            </button>
          </div>

          {/* Accepted formats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: FileText, label: 'PDF', color: 'bg-red-50 text-red-500' },
              { icon: ImageIcon, label: 'JPG', color: 'bg-blue-50 text-blue-500' },
              { icon: ImageIcon, label: 'PNG', color: 'bg-green-50 text-green-500' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={11} />
                </div>
                <span className="text-[11px] font-bold text-slate-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Doc type selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Tipo de documento
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as DocumentType)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            >
              {docTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Captured items */}
          {captures.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Archivos importados ({captures.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {captures.map(item => (
                  <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    {item.fileType === 'image' ? (
                      <img src={item.dataUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <FileText size={24} className="text-slate-400" />
                        <p className="text-[9px] text-slate-400 mt-1 px-2 truncate w-full text-center">{item.name}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      {item.fileType === 'image' && (
                        <button
                          onClick={() => setPreview(item.dataUrl)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-slate-600 hover:text-blue-500 transition-colors"
                        >
                          <ZoomIn size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => removeCapture(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-400">
            {captures.length > 0
              ? `${captures.length} archivo${captures.length !== 1 ? 's' : ''} listo${captures.length !== 1 ? 's' : ''}`
              : 'Importa al menos un archivo'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={captures.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-blue-500 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-colors shadow-sm"
            >
              <Check size={15} />
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen preview */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
          <button
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setPreview(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
