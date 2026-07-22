import React from 'react';
import { X } from 'lucide-react';
import { MediaManager } from './MediaManager';
import { Media, MediaEntityType } from '../types';

interface MediaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resortId: string;
  selectedUrl?: string;
  onSelect?: (media: Media) => void;
  entityType?: MediaEntityType;
  entityId?: string;
  title?: string;
}

export const MediaManagerModal: React.FC<MediaManagerModalProps> = ({
  isOpen,
  onClose,
  resortId,
  selectedUrl,
  onSelect,
  entityType = 'gallery',
  entityId,
  title = 'Media Manager & Storage Explorer'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-display font-extrabold text-slate-800 text-lg leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Administra archivos de forma independiente y segura en Firebase Storage.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 bg-slate-50">
          <MediaManager
            resortId={resortId}
            selectedUrl={selectedUrl}
            onSelect={(media) => {
              if (onSelect) {
                onSelect(media);
              }
            }}
            entityType={entityType}
            entityId={entityId}
          />
        </div>

      </div>
    </div>
  );
};
export default MediaManagerModal;
