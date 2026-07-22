import { roomStatusRepository } from '../repositories/RoomStatusRepository';
import { operationLogRepository } from '../repositories/OperationLogRepository';
import { RoomStatus, OperationalStatus, OperationLog } from '../types';
import { Cabin } from '../../../types';

export class RoomStatusService {
  /**
   * Retrieves or initializes the operational status of a cabin.
   */
  public static async getRoomStatus(
    resortId: string,
    cabinId: number,
    cabinName: string
  ): Promise<RoomStatus> {
    const statuses = await roomStatusRepository.getAll(resortId);
    const existing = statuses.find(r => r.cabinId === cabinId);
    
    if (existing) {
      return existing;
    }

    // Initialize if not found
    const now = new Date().toISOString();
    const newStatus: RoomStatus = {
      id: `cabin_${cabinId}`,
      resortId,
      cabinId,
      cabinName,
      status: 'available',
      updatedAt: now,
      updatedBy: 'System'
    };

    await roomStatusRepository.save(resortId, newStatus);
    return newStatus;
  }

  /**
   * Updates the operational status of a cabin and logs the action.
   */
  public static async updateRoomStatus(
    resortId: string,
    cabinId: number,
    cabinName: string,
    status: OperationalStatus,
    userId: string,
    userName: string
  ): Promise<RoomStatus> {
    const current = await this.getRoomStatus(resortId, cabinId, cabinName);
    const oldStatus = current.status;
    
    if (oldStatus === status) {
      return current;
    }

    const now = new Date().toISOString();
    current.status = status;
    current.updatedAt = now;
    current.updatedBy = userName || userId;

    if (status === 'clean') {
      current.lastCleanedAt = now;
    } else if (status === 'available' && oldStatus === 'inspection') {
      current.lastInspectedAt = now;
    }

    await roomStatusRepository.save(resortId, current);

    // Create operation log
    const logId = `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const log: OperationLog = {
      id: logId,
      resortId,
      userId,
      userName,
      action: 'update_status',
      targetType: 'room',
      targetId: String(cabinId),
      description: `Estado operativo cambiado de "${oldStatus}" a "${status}" para ${cabinName}.`,
      timestamp: now
    };

    await operationLogRepository.save(resortId, log);

    return current;
  }

  /**
   * Initial batch run to make sure all existing cabins have an operational status.
   */
  public static async initializeAllRoomStatuses(
    resortId: string,
    cabins: Cabin[]
  ): Promise<RoomStatus[]> {
    const statuses = await roomStatusRepository.getAll(resortId);
    const results: RoomStatus[] = [];

    for (const cabin of cabins) {
      const match = statuses.find(s => s.cabinId === cabin.id);
      if (!match) {
        const now = new Date().toISOString();
        // Set initial status based on commercial status
        let initialStatus: OperationalStatus = 'available';
        if (cabin.status === 'maintenance') {
          initialStatus = 'maintenance';
        } else if (cabin.status === 'occupied') {
          initialStatus = 'occupied';
        }

        const newStatus: RoomStatus = {
          id: `cabin_${cabin.id}`,
          resortId,
          cabinId: cabin.id,
          cabinName: cabin.name,
          status: initialStatus,
          updatedAt: now,
          updatedBy: 'System'
        };
        await roomStatusRepository.save(resortId, newStatus);
        results.push(newStatus);
      } else {
        results.push(match);
      }
    }

    return results;
  }

  /**
   * Fetches the full operations audit trail.
   */
  public static async getOperationLogs(resortId: string): Promise<OperationLog[]> {
    const logs = await operationLogRepository.getAll(resortId);
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

export default RoomStatusService;
