import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  getMetadata as getStorageMetadata, 
  updateMetadata as updateStorageMetadata, 
  listAll,
  StorageReference,
  SettableMetadata
} from 'firebase/storage';
import { storage } from '../../../core/firebase/firebase';
import { Media, UploadProgress } from '../types';
import { Logger } from '../../../core/logger/Logger';

export class MediaRepository {
  /**
   * Helper to map Firebase Storage FullMetadata to our Media entity
   */
  private async mapToMedia(refItem: StorageReference, downloadURL?: string): Promise<Media> {
    try {
      const metadata = await getStorageMetadata(refItem);
      const url = downloadURL || metadata.customMetadata?.downloadURL || await getDownloadURL(refItem);
      
      const custom = metadata.customMetadata || {};
      const id = custom.id || refItem.fullPath.replace(/\//g, '_');
      
      let tags: string[] = [];
      try {
        if (custom.tags) {
          tags = JSON.parse(custom.tags);
        }
      } catch (e) {
        tags = custom.tags ? custom.tags.split(',').map(t => t.trim()) : [];
      }

      return {
        id,
        fileName: custom.fileName || metadata.name,
        originalName: custom.originalName || metadata.name,
        downloadURL: url,
        storagePath: refItem.fullPath,
        contentType: metadata.contentType || 'image/jpeg',
        size: metadata.size,
        width: custom.width ? Number(custom.width) : undefined,
        height: custom.height ? Number(custom.height) : undefined,
        uploadedAt: custom.uploadedAt || metadata.timeCreated || new Date().toISOString(),
        uploadedBy: custom.uploadedBy || undefined,
        tags,
        alt: custom.alt || '',
        description: custom.description || '',
        entityType: (custom.entityType as any) || 'gallery',
        entityId: custom.entityId || undefined,
        resortId: custom.resortId || ''
      };
    } catch (error) {
      Logger.error(`Error mapping StorageReference to Media: ${refItem.fullPath}`, error);
      throw error;
    }
  }

  /**
   * Upload a file to a specific storage path, reporting progress and updating custom metadata
   */
  async upload(
    filePath: string,
    file: File | Blob,
    customMetadata: Record<string, string> = {},
    onProgress?: (progress: UploadProgress) => void,
    onCancelTrigger?: (cancelFn: () => void) => void
  ): Promise<Media> {
    try {
      const storageRef = ref(storage, filePath);
      
      // Setup base metadata with custom attributes
      const uploadMetadata: SettableMetadata = {
        contentType: file.type || 'image/jpeg',
        customMetadata: {
          ...customMetadata,
          originalName: file instanceof File ? file.name : 'blob_upload',
          uploadedAt: new Date().toISOString()
        }
      };

      const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

      if (onCancelTrigger) {
        onCancelTrigger(() => {
          uploadTask.cancel();
          Logger.info(`Upload task canceled for ${filePath}`);
        });
      }

      return new Promise<Media>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (onProgress) {
              const progress: UploadProgress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                status: snapshot.state as any
              };
              onProgress(progress);
            }
          },
          (error) => {
            Logger.error(`Error uploading file to ${filePath}:`, error);
            reject(error);
          },
          async () => {
            try {
              // Get download URL on complete
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Optimizing listing: Save the download URL and storage path back into customMetadata
              const finalMetadata = {
                contentType: file.type || 'image/jpeg',
                customMetadata: {
                  ...uploadMetadata.customMetadata,
                  downloadURL,
                  storagePath: filePath,
                  id: filePath.replace(/\//g, '_')
                }
              };
              
              await updateStorageMetadata(storageRef, finalMetadata);
              const media = await this.mapToMedia(storageRef, downloadURL);
              Logger.info(`Media uploaded successfully: ${media.storagePath}`);
              resolve(media);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (error) {
      Logger.error(`Exception in MediaRepository.upload for path ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async delete(storagePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      Logger.info(`Media deleted successfully from storage: ${storagePath}`);
    } catch (error) {
      Logger.error(`Error deleting media at path ${storagePath}:`, error);
      throw error;
    }
  }

  /**
   * Replace an existing file with a new file at the same or new path, then delete the old path if different
   */
  async replace(
    oldStoragePath: string,
    newStoragePath: string,
    file: File | Blob,
    customMetadata: Record<string, string> = {},
    onProgress?: (progress: UploadProgress) => void,
    onCancelTrigger?: (cancelFn: () => void) => void
  ): Promise<Media> {
    try {
      Logger.info(`Replacing media. Old: ${oldStoragePath}, New: ${newStoragePath}`);
      // Upload new file first
      const newMedia = await this.upload(newStoragePath, file, customMetadata, onProgress, onCancelTrigger);
      
      // If paths are different, delete the old one
      if (oldStoragePath && oldStoragePath !== newStoragePath) {
        try {
          await this.delete(oldStoragePath);
        } catch (delError) {
          Logger.warn(`Could not delete old replaced media ${oldStoragePath}, but new one was uploaded:`, delError);
        }
      }
      return newMedia;
    } catch (error) {
      Logger.error(`Error replacing media: ${oldStoragePath} -> ${newStoragePath}`, error);
      throw error;
    }
  }

  /**
   * Update metadata fields of an existing storage item
   */
  async updateMetadata(storagePath: string, metadataUpdates: Record<string, string>): Promise<Media> {
    try {
      const storageRef = ref(storage, storagePath);
      const existingMetadata = await getStorageMetadata(storageRef);
      
      const newCustomMetadata = {
        ...(existingMetadata.customMetadata || {}),
        ...metadataUpdates
      };

      await updateStorageMetadata(storageRef, {
        customMetadata: newCustomMetadata
      });

      const updatedMedia = await this.mapToMedia(storageRef);
      Logger.info(`Metadata updated successfully for: ${storagePath}`);
      return updatedMedia;
    } catch (error) {
      Logger.error(`Error updating metadata for ${storagePath}:`, error);
      throw error;
    }
  }

  /**
   * Get Media entity from storage path
   */
  async getMetadata(storagePath: string): Promise<Media> {
    try {
      const storageRef = ref(storage, storagePath);
      return await this.mapToMedia(storageRef);
    } catch (error) {
      Logger.error(`Error getting metadata for ${storagePath}:`, error);
      throw error;
    }
  }

  /**
   * Get direct HTTPS URL for a file
   */
  async getDownloadURL(storagePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, storagePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      Logger.error(`Error getting download URL for ${storagePath}:`, error);
      throw error;
    }
  }

  /**
   * List files within a resort or folder prefix recursively or in a flat list
   */
  async list(prefixPath: string): Promise<Media[]> {
    try {
      Logger.info(`Listing media files under path: ${prefixPath}`);
      const storageRef = ref(storage, prefixPath);
      const result = await listAll(storageRef);
      
      // Fetch metadata for each file item in parallel
      const mediaPromises = result.items.map(async (item) => {
        try {
          return await this.mapToMedia(item);
        } catch (err) {
          Logger.warn(`Skipping item in list due to mapping failure: ${item.fullPath}`, err);
          return null;
        }
      });

      const mediaList = await Promise.all(mediaPromises);
      const filtered = mediaList.filter((item): item is Media => item !== null);
      
      // Sort by uploadedAt desc
      return filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } catch (error) {
      Logger.error(`Error listing files under ${prefixPath}:`, error);
      return [];
    }
  }
}

export const mediaRepository = new MediaRepository();
