import { mediaRepository, MediaRepository } from '../repositories/MediaRepository';
import { Media, UploadOptions, UploadProgress, ValidationConfig, ValidationResult, MediaEntityType } from '../types';
import { Logger } from '../../../core/logger/Logger';

export class MediaService {
  private repository: MediaRepository;
  
  // Default validation config
  private config: ValidationConfig = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB limit
    allowedContentTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml'
    ]
  };

  constructor(repository: MediaRepository = mediaRepository) {
    this.repository = repository;
  }

  /**
   * Helper to slugify a string for clean URL/storage paths
   */
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // splits accented letters into bases and diacritics
      .replace(/[\u0300-\u036f]/g, '') // removes diacritics
      .replace(/[^a-z0-9._-]/g, '_') // replace invalid characters with underscore
      .replace(/_+/g, '_') // collapse multiple underscores
      .trim();
  }

  /**
   * Validate file format, MIME type, and size
   */
  validateFile(file: File | Blob): ValidationResult {
    // 1. Validate size
    if (file.size > this.config.maxSizeBytes) {
      const mbLimit = (this.config.maxSizeBytes / (1024 * 1024)).toFixed(0);
      return {
        isValid: false,
        error: `El tamaño del archivo supera el límite permitido de ${mbLimit}MB.`
      };
    }

    // 2. Validate MIME type
    if (!this.config.allowedContentTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Formato de archivo no soportado (${file.type || 'desconocido'}). Solo se permiten imágenes JPG, JPEG, PNG, WEBP y SVG.`
      };
    }

    // 3. Validate file extension (if file is an actual File object)
    if (file instanceof File) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
      if (!allowedExts.includes(ext)) {
        return {
          isValid: false,
          error: `Extensión de archivo .${ext} no permitida. Solo se aceptan extensiones: .jpg, .jpeg, .png, .webp, .svg`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Compression placeholder (Sprint 3.2 architectural preparation)
   * Future sprint can easily implement compression logic here without modifying the React components or services.
   */
  async compressImage(file: File | Blob): Promise<File | Blob> {
    Logger.info('Compression: Passing through original file. Architectural pipeline prepared for future compression.');
    // TODO: In Sprint 3.3, integrate a compression library like browser-image-compression:
    // const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    // return await imageCompression(file, options);
    return file;
  }

  /**
   * Read image dimensions in browser before uploading
   */
  async getImageDimensions(file: File | Blob): Promise<{ width?: number; height?: number }> {
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      return {};
    }
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({});
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  /**
   * Formulates clean Storage Path following the mandated tenant-isolation scheme:
   * resorts/{resortId}/{entityType}/{optional-entityId}/filename_timestamp.ext
   */
  buildStoragePath(resortId: string, entityType: MediaEntityType, entityId?: string, originalName: string = 'file'): string {
    const cleanResortId = this.slugify(resortId);
    const cleanEntityType = this.slugify(entityType);
    const cleanEntityId = entityId ? this.slugify(entityId) : '';
    
    const parts = originalName.split('.');
    const ext = parts.pop()?.toLowerCase() || 'jpg';
    const baseName = parts.join('.');
    const cleanBaseName = this.slugify(baseName);
    
    const timestamp = Date.now();
    const finalFileName = `${cleanBaseName}_${timestamp}.${ext}`;

    if (cleanEntityType === 'accommodations' && cleanEntityId) {
      return `resorts/${cleanResortId}/accommodations/${cleanEntityId}/${finalFileName}`;
    }
    
    return `resorts/${cleanResortId}/${cleanEntityType}/${finalFileName}`;
  }

  /**
   * Upload Media using tenant paths and custom metadata, performing validations
   */
  async upload(
    file: File | Blob,
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void,
    onCancelTrigger?: (cancelFn: () => void) => void
  ): Promise<Media> {
    // 1. Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Archivo inválido');
    }

    // 2. Prepare/Compress file
    const preparedFile = await this.compressImage(file);

    // 3. Get image dimensions
    const { width, height } = await this.getImageDimensions(preparedFile);

    // 4. Construct path
    const originalName = file instanceof File ? file.name : 'upload.jpg';
    const storagePath = this.buildStoragePath(options.resortId, options.entityType, options.entityId, originalName);

    // 5. Serialize custom metadata (values must be strings)
    const customMetadata: Record<string, string> = {
      resortId: options.resortId,
      entityType: options.entityType,
      entityId: options.entityId || '',
      alt: options.alt || originalName.split('.')[0] || 'Image',
      description: options.description || '',
      fileName: originalName,
      originalName: originalName,
      tags: JSON.stringify(options.tags || []),
      width: width ? width.toString() : '',
      height: height ? height.toString() : '',
      uploadedBy: options.uploadedBy || ''
    };

    // 6. Execute Upload via Repository
    return await this.repository.upload(storagePath, preparedFile, customMetadata, onProgress, onCancelTrigger);
  }

  /**
   * Delete media from storage
   */
  async delete(storagePath: string): Promise<void> {
    if (!storagePath) {
      throw new Error('Debe proveer una ruta de almacenamiento válida para eliminar.');
    }
    await this.repository.delete(storagePath);
  }

  /**
   * Replace existing media with a new file
   */
  async replace(
    oldStoragePath: string,
    file: File | Blob,
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void,
    onCancelTrigger?: (cancelFn: () => void) => void
  ): Promise<Media> {
    // 1. Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Archivo inválido');
    }

    // 2. Prepare/Compress file
    const preparedFile = await this.compressImage(file);

    // 3. Get image dimensions
    const { width, height } = await this.getImageDimensions(preparedFile);

    // 4. Construct path (re-use name slug structure)
    const originalName = file instanceof File ? file.name : 'replaced.jpg';
    const newStoragePath = this.buildStoragePath(options.resortId, options.entityType, options.entityId, originalName);

    // 5. Build Metadata
    const customMetadata: Record<string, string> = {
      resortId: options.resortId,
      entityType: options.entityType,
      entityId: options.entityId || '',
      alt: options.alt || originalName.split('.')[0] || 'Image',
      description: options.description || '',
      fileName: originalName,
      originalName: originalName,
      tags: JSON.stringify(options.tags || []),
      width: width ? width.toString() : '',
      height: height ? height.toString() : '',
      uploadedBy: options.uploadedBy || ''
    };

    return await this.repository.replace(oldStoragePath, newStoragePath, preparedFile, customMetadata, onProgress, onCancelTrigger);
  }

  /**
   * Logically rename or update descriptive tags, alt, and descriptions of media
   */
  async updateLogicalMetadata(
    storagePath: string,
    updates: { fileName?: string; alt?: string; description?: string; tags?: string[] }
  ): Promise<Media> {
    const stringUpdates: Record<string, string> = {};
    
    if (updates.fileName) {
      stringUpdates.fileName = updates.fileName;
    }
    if (updates.alt !== undefined) {
      stringUpdates.alt = updates.alt;
    }
    if (updates.description !== undefined) {
      stringUpdates.description = updates.description;
    }
    if (updates.tags !== undefined) {
      stringUpdates.tags = JSON.stringify(updates.tags);
    }

    return await this.repository.updateMetadata(storagePath, stringUpdates);
  }

  /**
   * List files under a resort and entity type folder
   */
  async listMedia(resortId: string, entityType: MediaEntityType, entityId?: string): Promise<Media[]> {
    const cleanResortId = this.slugify(resortId);
    const cleanEntityType = this.slugify(entityType);
    const cleanEntityId = entityId ? this.slugify(entityId) : '';
    
    let path = `resorts/${cleanResortId}/${cleanEntityType}`;
    if (cleanEntityType === 'accommodations' && cleanEntityId) {
      path = `resorts/${cleanResortId}/accommodations/${cleanEntityId}`;
    }

    return await this.repository.list(path);
  }
}

export const mediaService = new MediaService();
