import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WebsiteContent } from '../types';
import { WebsiteContentService } from '../services/WebsiteContentService';
import { useResort } from '../../../shared/contexts/ResortContext';
import { Logger } from '../../../core/logger/Logger';

interface WebsiteCMSContextType {
  content: WebsiteContent | null;
  loading: boolean;
  saving: boolean;
  publishing: boolean;
  error: string | null;
  saveContent: (updatedContent: WebsiteContent) => Promise<void>;
  publishContent: (updatedContent: WebsiteContent) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reload: () => Promise<void>;
}

const WebsiteCMSContext = createContext<WebsiteCMSContextType | undefined>(undefined);

export const WebsiteCMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();
  const resortId = resort?.id || 'demo_resort';

  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WebsiteContentService.getContent(resortId);
      setContent(data);
    } catch (err: any) {
      Logger.error(`Error in WebsiteCMSProvider.fetchContent:`, err);
      setError(err.message || 'Error al obtener el contenido.');
    } finally {
      setLoading(false);
    }
  }, [resortId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSave = async (updatedContent: WebsiteContent) => {
    setSaving(true);
    setError(null);
    try {
      await WebsiteContentService.saveContent(resortId, updatedContent);
      setContent(updatedContent);
    } catch (err: any) {
      Logger.error(`Error in WebsiteCMSProvider.handleSave:`, err);
      setError(err.message || 'Error al guardar el borrador del contenido.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (updatedContent: WebsiteContent) => {
    setPublishing(true);
    setError(null);
    try {
      const published = await WebsiteContentService.publishContent(resortId, updatedContent);
      setContent(published);
    } catch (err: any) {
      Logger.error(`Error in WebsiteCMSProvider.handlePublish:`, err);
      setError(err.message || 'Error al publicar los cambios.');
      throw err;
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    try {
      const restored = await WebsiteContentService.resetToDefaults(resortId);
      setContent(restored);
    } catch (err: any) {
      Logger.error(`Error in WebsiteCMSProvider.handleReset:`, err);
      setError(err.message || 'Error al restablecer los valores predeterminados.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <WebsiteCMSContext.Provider
      value={{
        content,
        loading,
        saving,
        publishing,
        error,
        saveContent: handleSave,
        publishContent: handlePublish,
        resetToDefaults: handleReset,
        reload: fetchContent,
      }}
    >
      {children}
    </WebsiteCMSContext.Provider>
  );
};

export const useWebsiteCMS = () => {
  const context = useContext(WebsiteCMSContext);
  if (context === undefined) {
    throw new Error('useWebsiteCMS debe utilizarse dentro de un WebsiteCMSProvider');
  }
  return context;
};
