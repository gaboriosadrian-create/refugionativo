import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Media, UploadOptions, UploadProgress, MediaEntityType } from '../types';
import { mediaService } from '../services/MediaService';
import { Logger } from '../../../core/logger/Logger';

interface MediaContextType {
  files: Media[];
  loading: boolean;
  error: string | null;
  uploadProgress: Record<string, UploadProgress>; // Key is filename or a custom upload key
  uploadFile: (file: File | Blob, options: UploadOptions) => Promise<Media>;
  deleteFile: (storagePath: string) => Promise<void>;
  replaceFile: (oldStoragePath: string, file: File | Blob, options: UploadOptions) => Promise<Media>;
  updateMediaMetadata: (storagePath: string, updates: { fileName?: string; alt?: string; description?: string; tags?: string[] }) => Promise<Media>;
  loadMediaList: (resortId: string, entityType: MediaEntityType, entityId?: string) => Promise<Media[]>;
  cancelActiveUpload: (uploadKey: string) => void;
  clearUploadProgress: (uploadKey: string) => void;
  setError: (err: string | null) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<Media[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setErrorState] = useState<string | null>(null);
  
  // Track live upload progress per file key
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  
  // Keep cancel functions of active tasks
  const cancelTokens = useRef<Map<string, () => void>>(new Map());

  const setError = useCallback((err: string | null) => {
    setErrorState(err);
  }, []);

  const clearUploadProgress = useCallback((uploadKey: string) => {
    setUploadProgress(prev => {
      const copy = { ...prev };
      delete copy[uploadKey];
      return copy;
    });
  }, []);

  /**
   * Cancel an active upload task
   */
  const cancelActiveUpload = useCallback((uploadKey: string) => {
    const cancelFn = cancelTokens.current.get(uploadKey);
    if (cancelFn) {
      cancelFn();
      cancelTokens.current.delete(uploadKey);
      setUploadProgress(prev => ({
        ...prev,
        [uploadKey]: {
          ...prev[uploadKey],
          status: 'canceled'
        }
      }));
      Logger.info(`Upload canceled in context for key: ${uploadKey}`);
    }
  }, []);

  /**
   * List files for a resort and entity path
   */
  const loadMediaList = useCallback(async (resortId: string, entityType: MediaEntityType, entityId?: string): Promise<Media[]> => {
    setLoading(true);
    setErrorState(null);
    try {
      const result = await mediaService.listMedia(resortId, entityType, entityId);
      setFiles(result);
      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'Error al listar los archivos multimedia';
      setErrorState(errMsg);
      Logger.error('MediaContext.loadMediaList failed:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a new file
   */
  const uploadFile = useCallback(async (file: File | Blob, options: UploadOptions): Promise<Media> => {
    const uploadKey = file instanceof File ? `${file.name}_${Date.now()}` : `upload_${Date.now()}`;
    setErrorState(null);

    // Initial progress state
    setUploadProgress(prev => ({
      ...prev,
      [uploadKey]: { bytesTransferred: 0, totalBytes: file.size, percentage: 0, status: 'running' }
    }));

    try {
      const result = await mediaService.upload(
        file,
        options,
        (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [uploadKey]: progress
          }));
        },
        (cancelFn) => {
          cancelTokens.current.set(uploadKey, cancelFn);
        }
      );

      // Clean token upon success
      cancelTokens.current.delete(uploadKey);
      
      // Update local state list if uploading to active view scope
      setFiles(prev => [result, ...prev]);
      
      return result;
    } catch (err: any) {
      cancelTokens.current.delete(uploadKey);
      const errMsg = err?.message || 'Error al subir el archivo multimedia';
      setUploadProgress(prev => ({
        ...prev,
        [uploadKey]: {
          ...(prev[uploadKey] || { bytesTransferred: 0, totalBytes: file.size, percentage: 0 }),
          status: 'error'
        }
      }));
      setErrorState(errMsg);
      Logger.error('MediaContext.uploadFile failed:', err);
      throw err;
    }
  }, []);

  /**
   * Replace existing media with another file
   */
  const replaceFile = useCallback(async (oldStoragePath: string, file: File | Blob, options: UploadOptions): Promise<Media> => {
    const uploadKey = `replace_${file instanceof File ? file.name : 'image'}_${Date.now()}`;
    setErrorState(null);

    setUploadProgress(prev => ({
      ...prev,
      [uploadKey]: { bytesTransferred: 0, totalBytes: file.size, percentage: 0, status: 'running' }
    }));

    try {
      const result = await mediaService.replace(
        oldStoragePath,
        file,
        options,
        (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [uploadKey]: progress
          }));
        },
        (cancelFn) => {
          cancelTokens.current.set(uploadKey, cancelFn);
        }
      );

      cancelTokens.current.delete(uploadKey);

      // Replace in local state list
      setFiles(prev => prev.map(f => f.storagePath === oldStoragePath ? result : f));

      return result;
    } catch (err: any) {
      cancelTokens.current.delete(uploadKey);
      const errMsg = err?.message || 'Error al reemplazar el archivo multimedia';
      setUploadProgress(prev => ({
        ...prev,
        [uploadKey]: {
          ...(prev[uploadKey] || { bytesTransferred: 0, totalBytes: file.size, percentage: 0 }),
          status: 'error'
        }
      }));
      setErrorState(errMsg);
      Logger.error('MediaContext.replaceFile failed:', err);
      throw err;
    }
  }, []);

  /**
   * Delete existing media
   */
  const deleteFile = useCallback(async (storagePath: string): Promise<void> => {
    setErrorState(null);
    try {
      await mediaService.delete(storagePath);
      // Remove from local state
      setFiles(prev => prev.filter(f => f.storagePath !== storagePath));
    } catch (err: any) {
      const errMsg = err?.message || 'Error al eliminar el archivo multimedia';
      setErrorState(errMsg);
      Logger.error('MediaContext.deleteFile failed:', err);
      throw err;
    }
  }, []);

  /**
   * Update Logical Metadata (rename, tags, description, alt)
   */
  const updateMediaMetadata = useCallback(async (
    storagePath: string,
    updates: { fileName?: string; alt?: string; description?: string; tags?: string[] }
  ): Promise<Media> => {
    setErrorState(null);
    try {
      const updated = await mediaService.updateLogicalMetadata(storagePath, updates);
      
      // Update in local state list
      setFiles(prev => prev.map(f => f.storagePath === storagePath ? updated : f));
      
      return updated;
    } catch (err: any) {
      const errMsg = err?.message || 'Error al actualizar los metadatos';
      setErrorState(errMsg);
      Logger.error('MediaContext.updateMediaMetadata failed:', err);
      throw err;
    }
  }, []);

  return (
    <MediaContext.Provider
      value={{
        files,
        loading,
        error,
        uploadProgress,
        uploadFile,
        deleteFile,
        replaceFile,
        updateMediaMetadata,
        loadMediaList,
        cancelActiveUpload,
        clearUploadProgress,
        setError
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMediaContext = () => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMediaContext must be used within a MediaProvider');
  }
  return context;
};
