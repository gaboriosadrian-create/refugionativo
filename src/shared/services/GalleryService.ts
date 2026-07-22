import { galleryRepository } from '../repositories/GalleryRepository';
import { GalleryImage } from '../../types';

export class GalleryService {
  static async getImages(resortId: string): Promise<GalleryImage[]> {
    return galleryRepository.getAll(resortId);
  }

  static async addImage(resortId: string, image: GalleryImage): Promise<void> {
    await galleryRepository.save(resortId, image);
  }

  static async removeImage(resortId: string, id: string): Promise<void> {
    await galleryRepository.delete(resortId, id);
  }
}
export default GalleryService;
