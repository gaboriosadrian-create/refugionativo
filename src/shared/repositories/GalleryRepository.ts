import { BaseRepository } from '../../core/repositories/BaseRepository';
import { GalleryImage } from '../../types';

export class GalleryRepository extends BaseRepository<GalleryImage> {
  constructor() {
    super('gallery');
  }
}
export const galleryRepository = new GalleryRepository();
