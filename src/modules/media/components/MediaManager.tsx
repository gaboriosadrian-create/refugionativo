import React, { useEffect, useState } from 'react';
import { 
  Folder, Image as ImageIcon, Trash2, Edit3, Check, Calendar, 
  Tag, Info, ExternalLink, RefreshCw, Layers, FileText, ChevronRight
} from 'lucide-react';
import { useMedia } from '../hooks/useMedia';
import { Media, MediaEntityType } from '../types';
import { MediaUploadZone } from './MediaUploadZone';

interface MediaManagerProps {
  resortId: string;
  selectedUrl?: string;
  onSelect?: (media: Media) => void;
  entityType?: MediaEntityType;
  entityId?: string;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  resortId,
  selectedUrl,
  onSelect,
  entityType: initialEntityType,
  entityId
}) => {
  const { 
    files, 
    loading, 
    error, 
    loadMediaList, 
    deleteFile, 
    updateMediaMetadata,
    replaceFile
  } = useMedia();

  const [activeTab, setActiveTab] = useState<MediaEntityType>(initialEntityType || 'gallery');
  const [selectedFile, setSelectedFile] = useState<Media | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    fileName: '',
    alt: '',
    description: '',
    tags: ''
  });
  const [replacingFile, setReplacingFile] = useState<boolean>(false);

  // Load the active media folder on tab or scope change
  useEffect(() => {
    loadMediaList(resortId, activeTab, activeTab === 'accommodations' ? entityId : undefined);
    setSelectedFile(null);
    setEditingMetadata(false);
  }, [resortId, activeTab, entityId, loadMediaList]);

  // Handle file select from list
  const handleFileClick = (file: Media) => {
    setSelectedFile(file);
    setEditingMetadata(false);
    setEditForm({
      fileName: file.fileName,
      alt: file.alt,
      description: file.description,
      tags: file.tags.join(', ')
    });
  };

  // Handle logical metadata edit submit
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      const tagsArray = editForm.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const updated = await updateMediaMetadata(selectedFile.storagePath, {
        fileName: editForm.fileName,
        alt: editForm.alt,
        description: editForm.description,
        tags: tagsArray
      });

      setSelectedFile(updated);
      setEditingMetadata(false);
    } catch (err) {
      // Error is set in global context
    }
  };

  // Handle deletion
  const handleDelete = async (file: Media, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Está seguro de que desea eliminar este archivo de forma permanente de Storage?')) {
      try {
        await deleteFile(file.storagePath);
        if (selectedFile?.storagePath === file.storagePath) {
          setSelectedFile(null);
        }
      } catch (err) {
        // Error in context
      }
    }
  };

  // File replacement handler
  const handleReplaceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFile || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setReplacingFile(true);

    try {
      const updated = await replaceFile(selectedFile.storagePath, file, {
        resortId,
        entityType: selectedFile.entityType,
        entityId: selectedFile.entityId,
        alt: selectedFile.alt,
        description: selectedFile.description,
        tags: selectedFile.tags
      });
      setSelectedFile(updated);
    } catch (err) {
      // Error handled by context
    } finally {
      setReplacingFile(false);
    }
  };

  // Format bytes to readable unit
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs: { key: MediaEntityType; label: string; icon: React.ReactNode }[] = [
    { key: 'gallery', label: 'Galería General', icon: <ImageIcon className="w-4 h-4" /> },
    { key: 'accommodations', label: 'Alojamientos', icon: <Layers className="w-4 h-4" /> },
    { key: 'branding', label: 'Branding & Logos', icon: <Folder className="w-4 h-4" /> },
    { key: 'website', label: 'Imágenes Web', icon: <Folder className="w-4 h-4" /> },
    { key: 'documents', label: 'Documentos', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col h-[650px] bg-slate-50 rounded-xl overflow-hidden border border-slate-200" id="media-manager-main-panel">
      
      {/* Top Tabs */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 border-b border-slate-200" id="media-manager-header">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" id="media-manager-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm shadow-primary/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              id={`tab-button-${tab.key}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Explorer Workspace */}
      <div className="flex flex-1 overflow-hidden" id="media-manager-workspace">
        
        {/* Left Side: Upload Zone & Media Grid */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto" id="media-manager-explorer-view">
          
          {/* Upload Zone */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm" id="media-manager-uploader-card">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subir nuevos archivos</h4>
            <MediaUploadZone
              resortId={resortId}
              entityType={activeTab}
              entityId={activeTab === 'accommodations' ? entityId : undefined}
              onUploadSuccess={(newFile) => {
                handleFileClick(newFile);
              }}
            />
          </div>

          {/* Media Grid */}
          <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col" id="media-manager-grid-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Archivos en carpeta ({files.length})
              </h4>
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium mb-3">
                {error}
              </div>
            )}

            {files.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400" id="media-empty-state">
                <ImageIcon className="w-12 h-12 stroke-[1.2] text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Esta carpeta está vacía</p>
                <p className="text-xs text-slate-400 mt-1">Usa la zona de arriba para cargar tus primeras imágenes</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" id="media-grid-container">
                {files.map((file) => {
                  const isSelected = selectedFile?.storagePath === file.storagePath;
                  const isSavedAsCover = selectedUrl === file.downloadURL;
                  
                  return (
                    <div
                      key={file.storagePath}
                      onClick={() => handleFileClick(file)}
                      className={`group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-primary ring-2 ring-primary/20 scale-[0.98]' 
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                      id={`media-card-${file.id}`}
                    >
                      {/* Image Thumbnail */}
                      <img
                        src={file.downloadURL}
                        alt={file.alt}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />

                      {/* Cover Selection Indicator overlay */}
                      {isSavedAsCover && (
                        <div className="absolute top-1.5 left-1.5 bg-green-500 text-white p-1 rounded-full shadow-md z-10">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Hover action bar overlay */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {onSelect && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(file);
                            }}
                            className="bg-white/95 text-slate-800 p-1.5 rounded-md hover:bg-white text-xs font-bold shadow-md transition-all flex items-center gap-1"
                            title="Seleccionar esta imagen"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Elegir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(file, e)}
                          className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-md shadow-md transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Filename details pill */}
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/60 text-white p-1 truncate text-[10px] select-none text-center font-medium">
                        {file.fileName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Details Inspector Panel */}
        <div className="w-[300px] border-l border-slate-200 bg-white flex flex-col overflow-y-auto" id="media-manager-inspector">
          {selectedFile ? (
            <div className="p-4 space-y-4" id="media-inspector-content">
              
              {/* Thumbnail Large Preview */}
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-100 relative group bg-slate-50 flex items-center justify-center">
                <img
                  src={selectedFile.downloadURL}
                  alt={selectedFile.alt}
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <a
                  href={selectedFile.downloadURL}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-md shadow-lg transition-colors"
                  title="Abrir imagen en nueva pestaña"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Title Header */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm truncate" id="inspector-file-title">
                  {selectedFile.fileName}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {selectedFile.storagePath.split('/').pop()}
                </p>
              </div>

              {/* Action Buttons: Choose, Replace, Edit Metadata */}
              <div className="flex flex-col gap-2">
                {onSelect && (
                  <button
                    type="button"
                    onClick={() => onSelect(selectedFile)}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-1.5 px-3 rounded-lg text-xs font-bold shadow-md shadow-primary/10 hover:opacity-90 transition-opacity"
                  >
                    <Check className="w-4 h-4" />
                    Seleccionar para Alojamiento
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Replace Button */}
                  <label className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer select-none transition-colors">
                    {replacingFile ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Reemplazar
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,.svg"
                      disabled={replacingFile}
                      onChange={handleReplaceSelect}
                    />
                  </label>

                  {/* Metadata Edit toggle */}
                  <button
                    type="button"
                    onClick={() => setEditingMetadata(!editingMetadata)}
                    className={`flex items-center justify-center gap-1.5 border py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                      editingMetadata
                        ? 'bg-slate-100 border-slate-300 text-slate-800 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {editingMetadata ? 'Cerrar' : 'Editar info'}
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Details and Edit Metadata Form */}
              {editingMetadata ? (
                <form onSubmit={handleSaveMetadata} className="space-y-3" id="inspector-edit-metadata-form">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Nombre Lógico
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.fileName}
                      onChange={(e) => setEditForm({ ...editForm, fileName: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Texto Alternativo (Alt)
                    </label>
                    <input
                      type="text"
                      value={editForm.alt}
                      onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="Breve descripción accesible..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Descripción
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary h-16 resize-none"
                      placeholder="Detalles sobre el archivo..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Etiquetas (Tags, separados por coma)
                    </label>
                    <input
                      type="text"
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="vistas, exterior, baño..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    Guardar Cambios
                  </button>
                </form>
              ) : (
                <div className="space-y-3.5 text-xs" id="inspector-details-view">
                  {/* Tags */}
                  {selectedFile.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" /> Etiquetas
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedFile.tags.map(t => (
                          <span key={t} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata Specs */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Info className="w-3 h-3 text-slate-400" /> Especificaciones
                    </span>
                    
                    <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 font-medium text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dimensión:</span>
                        <span>
                          {selectedFile.width && selectedFile.height 
                            ? `${selectedFile.width} x ${selectedFile.height} px` 
                            : 'N/D'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tamaño:</span>
                        <span>{formatBytes(selectedFile.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">MIME Type:</span>
                        <span className="font-mono text-[10px]">{selectedFile.contentType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subido el:</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(selectedFile.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description text */}
                  {selectedFile.description && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Descripción
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{selectedFile.description}"
                      </p>
                    </div>
                  )}

                  {/* Alt text details */}
                  {selectedFile.alt && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Texto Alt (Accesible)
                      </span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {selectedFile.alt}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none">
              <Info className="w-10 h-10 stroke-[1.2] text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Inspector de Archivos</p>
              <p className="text-[11px] text-slate-400 mt-1">Selecciona una imagen del explorador para ver sus dimensiones, metadatos y editar sus descripciones.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default MediaManager;
