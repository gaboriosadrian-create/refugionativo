import { useMediaContext } from '../contexts/MediaContext';
import { useCallback, useState } from 'react';
import { UploadOptions, Media, MediaEntityType } from '../types';

export const useMedia = () => {
  const context = useMediaContext();
  const [activeScope, setActiveScope] = useState<{ resortId: string; entityType: MediaEntityType; entityId?: string } | null>(null);

  const fetchScope = useCallback(async (resortId: string, entityType: MediaEntityType, entityId?: string) => {
    setActiveScope({ resortId, entityType, entityId });
    return await context.loadMediaList(resortId, entityType, entityId);
  }, [context]);

  const uploadInScope = useCallback(async (file: File | Blob, alt?: string, tags?: string[], description?: string, uploadedBy?: string) => {
    if (!activeScope) {
      throw new Error('No active media scope set. Call fetchScope first or use direct uploadFile.');
    }
    const options: UploadOptions = {
      resortId: activeScope.resortId,
      entityType: activeScope.entityType,
      entityId: activeScope.entityId,
      alt,
      tags,
      description,
      uploadedBy
    };
    return await context.uploadFile(file, options);
  }, [activeScope, context]);

  const replaceInScope = useCallback(async (oldStoragePath: string, file: File | Blob, alt?: string, tags?: string[], description?: string, uploadedBy?: string) => {
    if (!activeScope) {
      throw new Error('No active media scope set. Call fetchScope first or use direct replaceFile.');
    }
    const options: UploadOptions = {
      resortId: activeScope.resortId,
      entityType: activeScope.entityType,
      entityId: activeScope.entityId,
      alt,
      tags,
      description,
      uploadedBy
    };
    return await context.replaceFile(oldStoragePath, file, options);
  }, [activeScope, context]);

  return {
    ...context,
    activeScope,
    fetchScope,
    uploadInScope,
    replaceInScope
  };
};

export default useMedia;
