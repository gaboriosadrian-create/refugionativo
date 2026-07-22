import { storage } from './firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadString
} from 'firebase/storage';
import { Logger } from '../logger/Logger';

export const uploadFile = async (filePath: string, file: File | Blob) => {
  try {
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    Logger.info(`Archivo subido exitosamente a ${filePath}`);
    return {
      url,
      path: filePath,
      fileName: file instanceof File ? file.name : 'upload',
      size: file.size
    };
  } catch (error) {
    Logger.error(`Error al subir archivo a ${filePath}:`, error);
    throw error;
  }
};

export const uploadBase64Image = async (filePath: string, base64String: string) => {
  try {
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadString(storageRef, base64String, 'data_url');
    const url = await getDownloadURL(snapshot.ref);
    Logger.info(`Imagen Base64 subida exitosamente a ${filePath}`);
    return {
      url,
      path: filePath,
      fileName: 'image.png',
      size: Math.round(base64String.length * 0.75)
    };
  } catch (error) {
    Logger.error(`Error al subir imagen Base64 a ${filePath}:`, error);
    throw error;
  }
};

export const removeFile = async (filePath: string) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    Logger.info(`Archivo eliminado exitosamente en ${filePath}`);
  } catch (error) {
    Logger.error(`Error al eliminar archivo en ${filePath}:`, error);
    throw error;
  }
};
