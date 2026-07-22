import { auth } from '../firebase/firebase';

export class AppError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RepositoryError extends AppError {
  constructor(message: string, code?: string, public readonly originalError?: any) {
    super(message, code);
    this.name = 'RepositoryError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'StorageError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'PermissionError';
  }
}

// Firestore custom error handler required by firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  const jsonErrorStr = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonErrorStr);
  
  if (errInfo.error.includes('permission') || errInfo.error.includes('Permission')) {
    throw new PermissionError(jsonErrorStr);
  }
  
  throw new RepositoryError(jsonErrorStr, 'FIRESTORE_ERROR', error);
}
