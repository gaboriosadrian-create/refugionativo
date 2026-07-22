import { useState, useEffect, useCallback } from 'react';
import { GalleryImage } from '../../types';
import { GalleryService } from '../services/GalleryService';
import { useResort } from '../contexts/ResortContext';

export const useGallery = () => {
  const { resort } = useResort();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!resort) {
      setImages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await GalleryService.getImages(resort.id);
      setImages(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar galería');
    } finally {
      setLoading(false);
    }
  }, [resort]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const addImage = async (image: GalleryImage) => {
    if (!resort) return;
    try {
      await GalleryService.addImage(resort.id, image);
      await fetchImages();
    } catch (err: any) {
      setError(err.message || 'Error al añadir imagen');
      throw err;
    }
  };

  const removeImage = async (id: string) => {
    if (!resort) return;
    try {
      await GalleryService.removeImage(resort.id, id);
      await fetchImages();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar imagen');
      throw err;
    }
  };

  return {
    images,
    loading,
    error,
    addImage,
    removeImage,
    reload: fetchImages
  };
};
export default useGallery;
