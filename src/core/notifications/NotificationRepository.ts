import { isFirebaseConfigured } from '../firebase/firebase';
import { getDocument, saveDocument, getResortSubcollection } from '../firebase/firestore';
import { doc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { Logger } from '../logger/Logger';
import { TenantManager } from '../tenant/TenantManager';
import {
  NotificationTemplate,
  NotificationSettings,
  NotificationQueueItem,
  NotificationLog,
  NotificationEvent,
  NotificationChannel,
  NotificationStatus
} from './NotificationTypes';

export class NotificationRepository {
  private static TEMPLATES_KEY = 'notificationTemplates';
  private static SETTINGS_KEY = 'notificationSettings';
  private static QUEUE_KEY = 'notificationQueue';
  private static LOGS_KEY = 'notificationLogs';

  private static getTenantId(tenantId?: string): string {
    return tenantId || TenantManager.getCurrentTenantId() || 'default-resort';
  }

  // --- SETTINGS ---
  public static async getSettings(tenantId?: string): Promise<NotificationSettings> {
    const tid = this.getTenantId(tenantId);
    const fallback: NotificationSettings = {
      tenantId: tid,
      language: 'es',
      enabledChannels: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.INTERNAL],
      signature: 'Atentamente,\nEl Equipo de StayFlow',
      logo: '',
      contactInfo: {
        email: 'soporte@stayflow.com',
        whatsapp: '+5491100000000'
      },
      allowedHoursStart: '08:00',
      allowedHoursEnd: '22:00',
      retryConfig: {
        maxAttempts: 3,
        backoffExponential: true,
        initialIntervalSeconds: 30
      }
    };

    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.SETTINGS_KEY}/config`;
        const docData = await getDocument(path);
        if (docData) {
          return { tenantId: tid, ...docData } as unknown as NotificationSettings;
        }
      } catch (err) {
        Logger.error(`Error loading settings for tenant ${tid}:`, err);
      }
    }

    // Local DB / Fallback
    const local = LocalSaaSDb.get<NotificationSettings>(`${this.SETTINGS_KEY}_${tid}`);
    if (local) return local;

    // Save fallback to LocalSaaSDb so it exists
    LocalSaaSDb.set(`${this.SETTINGS_KEY}_${tid}`, fallback);
    return fallback;
  }

  public static async saveSettings(settings: NotificationSettings): Promise<void> {
    const tid = settings.tenantId;
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.SETTINGS_KEY}/config`;
        await saveDocument(path, settings, true);
        Logger.info(`Notification settings saved to Firestore for tenant ${tid}`);
      } catch (err) {
        Logger.error(`Error saving settings to Firestore for tenant ${tid}:`, err);
      }
    }
    LocalSaaSDb.set(`${this.SETTINGS_KEY}_${tid}`, settings);
  }

  // --- TEMPLATES ---
  public static async getTemplates(tenantId?: string): Promise<NotificationTemplate[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.TEMPLATES_KEY);
        const snap = await getDocs(colRef);
        const list: NotificationTemplate[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, tenantId: tid, ...d.data() } as NotificationTemplate);
        });
        if (list.length > 0) return list;
      } catch (err) {
        Logger.error(`Error loading templates from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<NotificationTemplate[]>(`${this.TEMPLATES_KEY}_${tid}`);
    if (local && local.length > 0) return local;

    // Seed default templates if empty
    const defaults = this.getDefaultTemplates(tid);
    LocalSaaSDb.set(`${this.TEMPLATES_KEY}_${tid}`, defaults);
    return defaults;
  }

  public static async saveTemplate(template: NotificationTemplate): Promise<void> {
    const tid = template.tenantId;
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.TEMPLATES_KEY}/${template.id}`;
        const payload = { ...template };
        delete (payload as any).id;
        await saveDocument(path, payload, true);
      } catch (err) {
        Logger.error(`Error saving template to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getTemplates(tid);
    const idx = list.findIndex(t => t.id === template.id);
    if (idx !== -1) {
      list[idx] = template;
    } else {
      list.push(template);
    }
    LocalSaaSDb.set(`${this.TEMPLATES_KEY}_${tid}`, list);
  }

  public static async deleteTemplate(templateId: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.TEMPLATES_KEY);
        await deleteDoc(doc(colRef, templateId));
      } catch (err) {
        Logger.error(`Error deleting template from Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getTemplates(tid);
    const filtered = list.filter(t => t.id !== templateId);
    LocalSaaSDb.set(`${this.TEMPLATES_KEY}_${tid}`, filtered);
  }

  // --- QUEUE ---
  public static async getQueue(tenantId?: string): Promise<NotificationQueueItem[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.QUEUE_KEY);
        const snap = await getDocs(colRef);
        const list: NotificationQueueItem[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, tenantId: tid, ...d.data() } as NotificationQueueItem);
        });
        return list;
      } catch (err) {
        Logger.error(`Error loading queue from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<NotificationQueueItem[]>(`${this.QUEUE_KEY}_${tid}`);
    return local || [];
  }

  public static async saveQueueItem(item: NotificationQueueItem): Promise<void> {
    const tid = item.tenantId;
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.QUEUE_KEY}/${item.id}`;
        const payload = { ...item };
        delete (payload as any).id;
        await saveDocument(path, payload, true);
      } catch (err) {
        Logger.error(`Error saving queue item to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getQueue(tid);
    const idx = list.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    LocalSaaSDb.set(`${this.QUEUE_KEY}_${tid}`, list);
  }

  public static async deleteQueueItem(itemId: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.QUEUE_KEY);
        await deleteDoc(doc(colRef, itemId));
      } catch (err) {
        Logger.error(`Error deleting queue item from Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getQueue(tid);
    const filtered = list.filter(i => i.id !== itemId);
    LocalSaaSDb.set(`${this.QUEUE_KEY}_${tid}`, filtered);
  }

  // --- LOGS / DELIVERY HISTORY ---
  public static async getLogs(tenantId?: string): Promise<NotificationLog[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.LOGS_KEY);
        const snap = await getDocs(colRef);
        const list: NotificationLog[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, tenantId: tid, ...d.data() } as NotificationLog);
        });
        return list;
      } catch (err) {
        Logger.error(`Error loading logs from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<NotificationLog[]>(`${this.LOGS_KEY}_${tid}`);
    return local || [];
  }

  public static async saveLog(log: NotificationLog): Promise<void> {
    const tid = log.tenantId;
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.LOGS_KEY}/${log.id}`;
        const payload = { ...log };
        delete (payload as any).id;
        await saveDocument(path, payload, true);
      } catch (err) {
        Logger.error(`Error saving log to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getLogs(tid);
    list.push(log);
    // Keep logs list capped to prevent infinite localStorage growth
    if (list.length > 500) {
      list.shift();
    }
    LocalSaaSDb.set(`${this.LOGS_KEY}_${tid}`, list);
  }

  // Seed default templates for multi-tenant configurations
  private static getDefaultTemplates(tenantId: string): NotificationTemplate[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'tmpl_booking_created_email',
        tenantId,
        event: NotificationEvent.BOOKING_CREATED,
        channel: NotificationChannel.EMAIL,
        name: 'Confirmación de Solicitud de Reserva',
        subject: 'StayFlow - Solicitud de Reserva Recibida {{booking.code}}',
        title: '¡Recibimos tu solicitud de reserva!',
        content: 'Hola {{guest.name}},\n\nHemos recibido tu solicitud de reserva en {{property.name}} para alojarte en {{room.name}}.\n\nDetalles de tu estadía:\n• Código: {{booking.code}}\n• Entrada: {{checkin.date}}\n• Salida: {{checkout.date}}\n\nEl monto total es de {{payment.amount}}. Actualmente tu reserva está: {{payment.status}}.\n\nPronto nos pondremos en contacto contigo para coordinar los pasos a seguir.',
        language: 'es',
        version: 1,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'tmpl_booking_confirmed_email',
        tenantId,
        event: NotificationEvent.BOOKING_CONFIRMED,
        channel: NotificationChannel.EMAIL,
        name: 'Confirmación de Reserva',
        subject: 'StayFlow - ¡Tu Reserva está Confirmada! {{booking.code}}',
        title: '¡Reserva Confirmada!',
        content: 'Hola {{guest.name}},\n\n¡Grandes noticias! Tu reserva para {{room.name}} en {{property.name}} está confirmada.\n\nDetalles de tu estadía:\n• Código de reserva: {{booking.code}}\n• Entrada: {{checkin.date}}\n• Salida: {{checkout.date}}\n\n¡Te esperamos para vivir una experiencia inolvidable!\n\nUbicación: {{map.url}}',
        language: 'es',
        version: 1,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'tmpl_booking_confirmed_whatsapp',
        tenantId,
        event: NotificationEvent.BOOKING_CONFIRMED,
        channel: NotificationChannel.WHATSAPP,
        name: 'Confirmación de Reserva por WhatsApp',
        content: '¡Hola {{guest.name}}! Su reserva con código *{{booking.code}}* para *{{room.name}}* en *{{property.name}}* ha sido confirmada con éxito. Entrada: {{checkin.date}}. ¡Que disfrute de su estadía!',
        language: 'es',
        version: 1,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'tmpl_checkin_upcoming_email',
        tenantId,
        event: NotificationEvent.CHECKIN_UPCOMING,
        channel: NotificationChannel.EMAIL,
        name: 'Instrucciones previas al Check-In',
        subject: 'StayFlow - Tu ingreso a {{property.name}} está próximo',
        title: '¡Ya casi es hora de tu viaje!',
        content: 'Hola {{guest.name}},\n\nFalta muy poco para tu check-in en {{room.name}} ({{checkin.date}}).\n\nPara facilitar tu llegada, aquí tienes los detalles de acceso:\n• Clave del WiFi: {{wifi.password}}\n• Red del WiFi: {{wifi.name}}\n\nSi necesitas indicaciones de cómo llegar, haz clic aquí: {{map.url}}.\n\n¡Buen viaje!',
        language: 'es',
        version: 1,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'tmpl_checkout_upcoming_email',
        tenantId,
        event: NotificationEvent.CHECKOUT_UPCOMING,
        channel: NotificationChannel.EMAIL,
        name: 'Información de Check-Out',
        subject: 'StayFlow - Información importante para tu salida mañana',
        title: 'Esperamos que hayas disfrutado de tu estadía',
        content: 'Hola {{guest.name}},\n\nTe recordamos que tu salida de {{room.name}} está programada para mañana {{checkout.date}} antes de las 10:00 AM.\n\nAntes de salir:\n1. Por favor apaga las luces y la calefacción.\n2. Deja las llaves en la recepción o en el buzón electrónico.\n\n¡Gracias por elegir {{property.name}} y esperamos verte pronto de nuevo!',
        language: 'es',
        version: 1,
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ];
  }
}
