import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useMedia } from '../hooks/useMedia';
import { Media, MediaEntityType } from '../types';

interface MediaUploadZoneProps {
  resortId: string;
  entityType: MediaEntityType;
  entityId?: string;
  onUploadSuccess?: (media: Media) => void;
  onUploadError?: (error: string) => void;
  maxSizeMB?: number;
}

export const MediaUploadZone: React.FC<MediaUploadZoneProps> = ({
  resortId,
  entityType,
  entityId,
  onUploadSuccess,
  onUploadError,
  maxSizeMB = 5
}) => {
  const { uploadFile, uploadProgress, cancelActiveUpload, clearUploadProgress } = useMedia();
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Track active upload progress keys
  const [activeUploadKeys, setActiveUploadKeys] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const processFiles = useCallback(async (filesList: FileList) => {
    setLocalError(null);
    const filesArray = Array.from(filesList);
    
    for (const file of filesArray) {
      // Basic client side validation before uploading
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
      
      if (!allowedExts.includes(ext)) {
        const err = `Archivo "${file.name}" no soportado. Formatos permitidos: JPG, JPEG, PNG, WEBP, SVG.`;
        setLocalError(err);
        if (onUploadError) onUploadError(err);
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        const err = `Archivo "${file.name}" supera el límite de tamaño de ${maxSizeMB}MB.`;
        setLocalError(err);
        if (onUploadError) onUploadError(err);
        continue;
      }

      const uploadKey = `${file.name}_${Date.now()}`;
      setActiveUploadKeys(prev => [...prev, uploadKey]);

      try {
        const result = await uploadFile(file, {
          resortId,
          entityType,
          entityId,
          alt: file.name.split('.')[0] || 'Image'
        });
        
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
        
        // Auto-clear progress status for successful uploads after a delay
        setTimeout(() => {
          clearUploadProgress(uploadKey);
          setActiveUploadKeys(prev => prev.filter(k => k !== uploadKey));
        }, 3000);
      } catch (err: any) {
        const errMsg = err?.message || 'Error al subir el archivo.';
        setLocalError(errMsg);
        if (onUploadError) onUploadError(errMsg);
      }
    }
  }, [uploadFile, resortId, entityType, entityId, maxSizeMB, onUploadSuccess, onUploadError, clearUploadProgress]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4" id="media-upload-container">
      {/* Drag & Drop Area */}
      <div
        id="media-drag-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`w-full min-h-[160px] flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.svg"
          onChange={handleFileSelect}
          className="hidden"
          id="media-file-input"
        />
        
        <div className="p-3 bg-slate-50 rounded-full mb-3 text-slate-400 group-hover:text-slate-500 transition-colors">
          <Upload className="w-6 h-6" />
        </div>
        
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            Arrastra tus imágenes aquí o <span className="text-primary hover:underline">busca en tu equipo</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Formatos aceptados: JPG, PNG, WEBP, SVG (Max. {maxSizeMB}MB)
          </p>
        </div>
      </div>

      {/* Local Error feedback */}
      {localError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs" id="media-upload-error-banner">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="font-medium">{localError}</p>
        </div>
      )}

      {/* Progress Indicators */}
      {activeUploadKeys.length > 0 && (
        <div className="space-y-2" id="media-upload-progress-list">
          {activeUploadKeys.map((key) => {
            const prog = uploadProgress[key];
            if (!prog) return null;
            
            const isRunning = prog.status === 'running';
            const isError = prog.status === 'error';
            const isSuccess = prog.status === 'success';
            const isCanceled = prog.status === 'canceled';

            return (
              <div
                key={key}
                className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2 transition-all duration-300"
                id={`progress-card-${key}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">
                    {key.split('_')[0]}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {isRunning && (
                      <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                        Cargando
                      </span>
                    )}
                    {isSuccess && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">
                        Listo
                      </span>
                    )}
                    {isError && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">
                        Error
                      </span>
                    )}
                    {isCanceled && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                        Cancelado
                      </span>
                    )}

                    {isRunning && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelActiveUpload(key);
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        title="Cancelar carga"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isError
                          ? 'bg-red-500'
                          : isSuccess
                          ? 'bg-green-500'
                          : isCanceled
                          ? 'bg-slate-400'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${prog.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{prog.percentage}% completado</span>
                    <span>
                      {Math.round(prog.bytesTransferred / 1024)} KB / {Math.round(prog.totalBytes / 1024)} KB
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
