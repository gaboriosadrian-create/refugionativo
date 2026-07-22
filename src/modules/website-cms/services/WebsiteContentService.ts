import { Logger } from '../../../core/logger/Logger';
import { WebsiteContent } from '../types';
import { websiteContentRepository } from '../repositories/WebsiteContentRepository';
import { validateWebsiteContent, WebsiteContentValidationError } from '../validators/websiteContentValidator';

export class WebsiteContentService {
  /**
   * Recovers the website content for a specific resort.
   * If none exists, returns default pre-configured content.
   */
  public static async getContent(resortId: string): Promise<WebsiteContent> {
    Logger.info(`Obteniendo contenido del sitio web para Resort: ${resortId}`);
    try {
      const content = await websiteContentRepository.getContent(resortId);
      return content;
    } catch (err) {
      Logger.error(`Error al obtener contenido para Resort: ${resortId}`, err);
      // Fallback safe return
      return websiteContentRepository.getDefaultContent(resortId);
    }
  }

  /**
   * Validates and saves the website content as a draft/direct save.
   */
  public static async saveContent(resortId: string, content: WebsiteContent): Promise<void> {
    Logger.info(`Guardando borrador de contenido web para Resort: ${resortId}`);
    
    // Validate first
    const errors = validateWebsiteContent(content);
    const criticalErrors = { ...errors };
    delete criticalErrors.seo;

    if (Object.keys(criticalErrors).length > 0) {
      Logger.warn(`Errores de validación al guardar contenido web para Resort: ${resortId}`, errors);
      throw new Error(`Error de validación: ${JSON.stringify(criticalErrors)}`);
    }

    try {
      await websiteContentRepository.saveContent(resortId, content);
      Logger.info(`Contenido web guardado con éxito para Resort: ${resortId}`);
    } catch (err) {
      Logger.error(`Error al guardar contenido web para Resort: ${resortId}`, err);
      throw err;
    }
  }

  /**
   * Publishes the content, updating versioning fields and setting publishedAt.
   */
  public static async publishContent(resortId: string, content: WebsiteContent): Promise<WebsiteContent> {
    Logger.info(`Publicando cambios de contenido web para Resort: ${resortId}`);
    
    const errors = validateWebsiteContent(content);
    const criticalErrors = { ...errors };
    delete criticalErrors.seo;

    if (Object.keys(criticalErrors).length > 0) {
      Logger.warn(`Errores de validación al publicar contenido web para Resort: ${resortId}`, errors);
      throw new Error(`No se puede publicar: Existen campos inválidos o incompletos.`);
    }

    try {
      const updatedVersion = (content.version || 0) + 1;
      const publishedContent: WebsiteContent = {
        ...content,
        version: updatedVersion,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await websiteContentRepository.saveContent(resortId, publishedContent);
      Logger.info(`Contenido web publicado con éxito (v${updatedVersion}) para Resort: ${resortId}`);
      return publishedContent;
    } catch (err) {
      Logger.error(`Error al publicar contenido web para Resort: ${resortId}`, err);
      throw err;
    }
  }

  /**
   * Resets the website content to original system defaults.
   */
  public static async resetToDefaults(resortId: string): Promise<WebsiteContent> {
    Logger.info(`Restableciendo contenido web a valores predeterminados de fábrica para Resort: ${resortId}`);
    try {
      const defaultContent = websiteContentRepository.getDefaultContent(resortId);
      await websiteContentRepository.saveContent(resortId, defaultContent);
      Logger.info(`Contenido web restablecido con éxito para Resort: ${resortId}`);
      return defaultContent;
    } catch (err) {
      Logger.error(`Error al restablecer contenido web para Resort: ${resortId}`, err);
      throw err;
    }
  }
}
