import { isFirebaseConfigured } from '../../core/firebase/firebase';
import { uploadFile, removeFile, uploadBase64Image } from '../../core/firebase/storage';

export class StorageService {
  static async uploadImage(resortId: string, folder: string, file: File | Blob): Promise<{ url: string; path: string; fileName: string; size: number }> {
    if (isFirebaseConfigured) {
      const filePath = `resorts/${resortId}/${folder}/${Date.now()}_${file instanceof File ? file.name : 'image.png'}`;
      return await uploadFile(filePath, file);
    } else {
      // Local Storage Mode: Convert to base64 or create object URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            url: reader.result as string,
            path: `local/resorts/${resortId}/${folder}/${Date.now()}`,
            fileName: file instanceof File ? file.name : 'local_image.png',
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  static async uploadBase64(resortId: string, folder: string, base64Data: string): Promise<{ url: string; path: string; fileName: string; size: number }> {
    if (isFirebaseConfigured) {
      const filePath = `resorts/${resortId}/${folder}/${Date.now()}_image.png`;
      return await uploadBase64Image(filePath, base64Data);
    } else {
      return {
        url: base64Data,
        path: `local/resorts/${resortId}/${folder}/${Date.now()}`,
        fileName: 'local_image.png',
        size: Math.round(base64Data.length * 0.75)
      };
    }
  }

  static async deleteFile(path: string): Promise<void> {
    if (isFirebaseConfigured && !path.startsWith('local/')) {
      await removeFile(path);
    }
  }
}
