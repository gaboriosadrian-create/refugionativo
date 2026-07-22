import { checkinAuditRepository } from '../repositories/CheckinAuditRepository';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
}

export class JourneyTimelineService {
  /**
   * Retrieves a consolidated list of events for the guest's digital journey.
   */
  public static async getTimelineEvents(resortId: string, bookingId: string | number): Promise<TimelineEntry[]> {
    const audits = await checkinAuditRepository.findByBookingId(resortId, bookingId);
    
    // Convert to simplified timeline format and sort
    return audits
      .map(audit => ({
        id: audit.id,
        timestamp: audit.timestamp,
        action: this.formatActionName(audit.action),
        performedBy: this.formatPerformedBy(audit.performedBy),
        details: audit.details
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private static formatActionName(action: string): string {
    const mapping: Record<string, string> = {
      'JOURNEY_INITIALIZED': 'Viaje Iniciado',
      'PRE_CHECKIN_COMPLETED': 'Pre Check-in Completo',
      'SIGNATURE_INTERNAL_RULES': 'Reglamento Interno Firmado',
      'SIGNATURE_PRIVACY_POLICY': 'Política de Privacidad Firmada',
      'SIGNATURE_TERMS_OF_STAY': 'Condiciones de Hospedaje Firmadas',
      'DOCUMENT_UPLOADED': 'Documento Cargado',
      'COMPANION_ADDED': 'Acompañante Agregado',
      'COMPANION_REMOVED': 'Acompañante Removido',
      'STAGE_TRANSITION_PRE_CHECKIN': 'Enviado a Pre Check-in',
      'STAGE_TRANSITION_CHECKIN_PENDING': 'Check-in Pendiente',
      'STAGE_TRANSITION_CHECKED_IN': 'Check-in Realizado',
      'STAGE_TRANSITION_IN_STAY': 'En Estadía',
      'STAGE_TRANSITION_CHECKOUT_PENDING': 'Check-out Iniciado',
      'STAGE_TRANSITION_CHECKED_OUT': 'Check-out Realizado',
      'STAGE_TRANSITION_CANCELLED': 'Estadía Cancelada',
      'SURVEY_SUBMITTED': 'Encuesta de Satisfacción Enviada',
    };

    return mapping[action] || action.replace(/_/g, ' ');
  }

  private static formatPerformedBy(by: string): string {
    const mapping: Record<string, string> = {
      'guest': 'Huésped Principal',
      'companion': 'Acompañante',
      'receptionist': 'Recepción / Recepcionista',
      'system': 'Sistema StayFlow',
      'admin': 'Administrador'
    };
    return mapping[by] || by;
  }
}
