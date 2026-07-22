import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../errors/AppErrors';
import { Logger } from '../logger/Logger';

// Multi-tenant helper: Get collection reference within a resort
export const getResortSubcollection = (resortId: string, subcollection: string) => {
  return collection(db, `resorts/${resortId}/${subcollection}`);
};

// Generic helper to get a document by ID with robust error wrapping
export const getDocument = async (path: string) => {
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    Logger.error(`Error al obtener documento en ${path}:`, error);
    handleFirestoreError(error, OperationType.GET, path);
  }
};

// Generic helper to set or update a document with robust error wrapping
export const cleanUndefined = (obj: any): any => {
  if (obj === undefined) {
    return null;
  }
  if (obj === null) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj;
    }
    const proto = Object.getPrototypeOf(obj);
    if (proto === null || proto === Object.prototype) {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
      return cleaned;
    }
  }
  return obj;
};

// Generic helper to set or update a document with robust error wrapping
export const saveDocument = async (path: string, data: any, merge = true) => {
  try {
    const docRef = doc(db, path);
    const cleanedData = cleanUndefined(data);
    await setDoc(docRef, cleanedData, { merge });
    Logger.info(`Documento guardado exitosamente en ${path}`);
  } catch (error) {
    Logger.error(`Error al guardar documento en ${path}:`, error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Helper for complex query execution with robust error wrapping
export const queryCollection = async (collectionPath: string, ...constraints: QueryConstraint[]) => {
  try {
    const q = query(collection(db, collectionPath), ...constraints);
    const querySnapshot = await getDocs(q);
    const results: DocumentData[] = [];
    querySnapshot.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() });
    });
    return results;
  } catch (error) {
    Logger.error(`Error al consultar colección ${collectionPath}:`, error);
    handleFirestoreError(error, OperationType.GET, collectionPath);
  }
};
