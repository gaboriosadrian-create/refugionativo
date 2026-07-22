import { CustomerSuccessDb } from './CustomerSuccessDb';
import { StatusIncident } from '../types';

export class StatusPageService {
  /**
   * Retrieves all registered status incidents (active & historical).
   */
  public static getIncidents(): StatusIncident[] {
    return CustomerSuccessDb.getAll<StatusIncident>('statusIncidents');
  }

  /**
   * Gets the general platform status summary.
   * Returns: 'operational' (green), 'degraded' (yellow), or 'outage' (red)
   */
  public static getOverallStatus(): 'operational' | 'degraded' | 'outage' {
    const incidents = this.getIncidents();
    // Active incidents that are not fully resolved
    const activeIncidents = incidents.filter(i => i.status !== 'resolved');

    if (activeIncidents.length === 0) {
      return 'operational';
    }

    const hasMajorOutage = activeIncidents.some(i => i.severity === 'major_outage');
    if (hasMajorOutage) {
      return 'outage';
    }

    return 'degraded';
  }

  /**
   * Registers a new incident (typically triggered by observability webhook or super admins).
   */
  public static createIncident(params: {
    title: string;
    description: string;
    severity: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  }): StatusIncident {
    const incidents = CustomerSuccessDb.getAll<StatusIncident>('statusIncidents');
    const newId = `inc-${incidents.length + 1}`;

    const newIncident: StatusIncident = {
      id: newId,
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: 'investigating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updates: [
        {
          timestamp: new Date().toISOString(),
          message: 'Estamos investigando problemas reportados en el sistema.',
          status: 'investigating'
        }
      ]
    };

    incidents.push(newIncident);
    CustomerSuccessDb.setAll('statusIncidents', incidents);
    return newIncident;
  }

  /**
   * Appends an update message to an existing incident.
   */
  public static addIncidentUpdate(
    incidentId: string, 
    message: string, 
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  ): StatusIncident | null {
    const incidents = CustomerSuccessDb.getAll<StatusIncident>('statusIncidents');
    const idx = incidents.findIndex(i => i.id === incidentId);
    if (idx === -1) return null;

    const inc = incidents[idx];
    inc.status = status;
    inc.updatedAt = new Date().toISOString();
    inc.updates.push({
      timestamp: new Date().toISOString(),
      message,
      status
    });

    incidents[idx] = inc;
    CustomerSuccessDb.setAll('statusIncidents', incidents);
    return inc;
  }
}
