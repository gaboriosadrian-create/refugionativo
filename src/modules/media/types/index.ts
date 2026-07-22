export type MediaEntityType = 'branding' | 'accommodations' | 'gallery' | 'website' | 'documents';

export interface Media {
  id: string; // Unique ID, can be generated or storage path hash/derived
  fileName: string; // Logical name or physical name
  originalName: string; // Uploaded file name
  downloadURL: string; // Public HTTPS url
  storagePath: string; // Full Firebase Storage path
  contentType: string; // MIME type
  size: number; // In bytes
  width?: number; // Optional image width
  height?: number; // Optional image height
  uploadedAt: string; // ISO timestamp
  uploadedBy?: string; // Operator user ID
  tags: string[]; // Custom labels
  alt: string; // Accessible image alt text
  description: string; // Detailed description
  entityType: MediaEntityType; // Associated subsystem
  entityId?: string; // Associated record ID (e.g. accommodationId)
  resortId: string; // Tenant context
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  status: 'idle' | 'running' | 'success' | 'paused' | 'error' | 'canceled';
}

export interface UploadOptions {
  resortId: string;
  entityType: MediaEntityType;
  entityId?: string;
  tags?: string[];
  alt?: string;
  description?: string;
  uploadedBy?: string;
}

export interface ValidationConfig {
  maxSizeBytes: number;
  allowedContentTypes: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
