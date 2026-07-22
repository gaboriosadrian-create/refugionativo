import { incidentReportRepository } from '../repositories/IncidentReportRepository';
import { RoomStatusService } from './RoomStatusService';
import { IncidentReport, IncidentCategory, IncidentStatus, OperationPriority } from '../types';

export class IncidentService {
  /**
   * Retrieves all reported incidents.
   */
  public static async getIncidents(resortId: string): Promise<IncidentReport[]> {
    return incidentReportRepository.getAll(resortId);
  }

  /**
   * Creates an incident report.
   */
  public static async reportIncident(
    resortId: string,
    params: {
      cabinId: number;
      cabinName: string;
      category: IncidentCategory;
      priority: OperationPriority;
      reportedBy: string;
      description: string;
      photos?: string[];
    }
  ): Promise<IncidentReport> {
    const now = new Date().toISOString();
    const incidentId = `inc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newIncident: IncidentReport = {
      id: incidentId,
      resortId,
      cabinId: params.cabinId,
      cabinName: params.cabinName,
      category: params.category,
      status: 'reported',
      priority: params.priority,
      reportedBy: params.reportedBy,
      description: params.description,
      photos: params.photos || [],
      createdAt: now,
      updatedAt: now
    };

    await incidentReportRepository.save(resortId, newIncident);

    // If critical or high, we can flag the room as maintenance or out_of_service
    if (params.priority === 'critical' || params.priority === 'high') {
      await RoomStatusService.updateRoomStatus(
        resortId,
        params.cabinId,
        params.cabinName,
        'maintenance',
        'System',
        `Incidente crítico reportado por ${params.reportedBy}`
      );
    }

    return newIncident;
  }

  /**
   * Updates incident status.
   */
  public static async updateStatus(
    resortId: string,
    incidentId: string,
    status: IncidentStatus,
    userId: string,
    userName: string
  ): Promise<IncidentReport> {
    const incident = await incidentReportRepository.getById(resortId, incidentId);
    if (!incident) throw new Error(`Incident ${incidentId} not found.`);

    const now = new Date().toISOString();
    incident.status = status;
    incident.updatedAt = now;

    if (status === 'resolved') {
      incident.resolvedAt = now;
    }

    await incidentReportRepository.save(resortId, incident);

    return incident;
  }
}

export default IncidentService;
