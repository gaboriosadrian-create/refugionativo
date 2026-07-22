import { NotificationTemplate, NotificationEvent, NotificationChannel } from './NotificationTypes';
import { NotificationRepository } from './NotificationRepository';

export class TemplateService {
  /**
   * Replace placeholders in a string like {{guest.name}} with values from variables dictionary
   */
  public static compile(templateText: string, variables: Record<string, any>): string {
    if (!templateText) return '';
    
    return templateText.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
      const parts = key.split('.');
      let value = variables;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return match; // Keep placeholder if variable is not found
        }
      }
      
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Find the active template for an event and channel, with language fallback
   */
  public static async resolveTemplate(
    event: NotificationEvent,
    channel: NotificationChannel,
    preferredLanguage = 'es',
    tenantId?: string
  ): Promise<NotificationTemplate | null> {
    const templates = await NotificationRepository.getTemplates(tenantId);
    
    // 1. Match event, channel, language, active
    let match = templates.find(
      t => t.event === event && t.channel === channel && t.language === preferredLanguage && t.active
    );
    
    // 2. Fallback to default setting language
    if (!match) {
      const settings = await NotificationRepository.getSettings(tenantId);
      match = templates.find(
        t => t.event === event && t.channel === channel && t.language === settings.language && t.active
      );
    }
    
    // 3. Fallback to first active template of this event and channel
    if (!match) {
      match = templates.find(
        t => t.event === event && t.channel === channel && t.active
      );
    }
    
    return match || null;
  }

  /**
   * Get all templates for a tenant
   */
  public static async getTemplates(tenantId?: string): Promise<NotificationTemplate[]> {
    return NotificationRepository.getTemplates(tenantId);
  }

  /**
   * Save or update template
   */
  public static async saveTemplate(template: NotificationTemplate): Promise<void> {
    template.updatedAt = new Date().toISOString();
    await NotificationRepository.saveTemplate(template);
  }

  /**
   * Delete template
   */
  public static async deleteTemplate(templateId: string, tenantId?: string): Promise<void> {
    await NotificationRepository.deleteTemplate(templateId, tenantId);
  }
}
