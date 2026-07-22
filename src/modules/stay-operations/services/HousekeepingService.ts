import { housekeepingTaskRepository } from '../repositories/HousekeepingTaskRepository';
import { cleaningChecklistRepository } from '../repositories/CleaningChecklistRepository';
import { RoomStatusService } from './RoomStatusService';
import { HousekeepingTask, HousekeepingType, HousekeepingStatus, OperationPriority, CleaningChecklist, OperationLog } from '../types';
import { operationLogRepository } from '../repositories/OperationLogRepository';

export class HousekeepingService {
  /**
   * Retrieves all housekeeping tasks for a resort.
   */
  public static async getTasks(resortId: string): Promise<HousekeepingTask[]> {
    return housekeepingTaskRepository.getAll(resortId);
  }

  /**
   * Creates a brand new housekeeping task.
   */
  public static async createTask(
    resortId: string,
    params: {
      cabinId: number;
      cabinName: string;
      type: HousekeepingType;
      priority: OperationPriority;
      assignedStaffId?: string;
      assignedStaffName?: string;
      notes?: string;
      checklistId?: string;
    }
  ): Promise<HousekeepingTask> {
    const now = new Date().toISOString();
    const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const newTask: HousekeepingTask = {
      id: taskId,
      resortId,
      cabinId: params.cabinId,
      cabinName: params.cabinName,
      type: params.type,
      status: 'pending',
      priority: params.priority,
      assignedStaffId: params.assignedStaffId || '',
      assignedStaffName: params.assignedStaffName || 'Sin asignar',
      notes: params.notes || '',
      photos: [],
      checklistId: params.checklistId || '',
      checklistAnswers: {},
      createdAt: now,
      updatedAt: now
    };

    await housekeepingTaskRepository.save(resortId, newTask);

    // Update room status to pending_cleaning when task is created
    await RoomStatusService.updateRoomStatus(
      resortId,
      params.cabinId,
      params.cabinName,
      'pending_cleaning',
      'System',
      'Housekeeping Engine'
    );

    return newTask;
  }

  /**
   * Starts a housekeeping task (changes status to in_progress).
   */
  public static async startTask(
    resortId: string,
    taskId: string,
    userId: string,
    userName: string
  ): Promise<HousekeepingTask> {
    const task = await housekeepingTaskRepository.getById(resortId, taskId);
    if (!task) throw new Error(`Task ${taskId} not found.`);

    const now = new Date().toISOString();
    task.status = 'in_progress';
    task.startedAt = now;
    task.updatedAt = now;

    await housekeepingTaskRepository.save(resortId, task);

    // Update room status to in_cleaning
    await RoomStatusService.updateRoomStatus(
      resortId,
      task.cabinId,
      task.cabinName,
      'in_cleaning',
      userId,
      userName
    );

    return task;
  }

  /**
   * Completes a housekeeping task (changes status to completed).
   */
  public static async completeTask(
    resortId: string,
    taskId: string,
    params: {
      notes?: string;
      photos?: string[];
      checklistAnswers?: Record<string, boolean>;
    },
    userId: string,
    userName: string
  ): Promise<HousekeepingTask> {
    const task = await housekeepingTaskRepository.getById(resortId, taskId);
    if (!task) throw new Error(`Task ${taskId} not found.`);

    const now = new Date().toISOString();
    task.status = 'completed';
    task.completedAt = now;
    task.updatedAt = now;
    
    if (params.notes !== undefined) task.notes = params.notes;
    if (params.photos !== undefined) task.photos = params.photos;
    if (params.checklistAnswers !== undefined) task.checklistAnswers = params.checklistAnswers;

    if (task.startedAt) {
      const start = new Date(task.startedAt).getTime();
      const end = new Date(now).getTime();
      task.durationMinutes = Math.round((end - start) / (1000 * 60));
    }

    await housekeepingTaskRepository.save(resortId, task);

    // Update room status to clean
    await RoomStatusService.updateRoomStatus(
      resortId,
      task.cabinId,
      task.cabinName,
      'clean',
      userId,
      userName
    );

    return task;
  }

  /**
   * Inspects and approves a housekeeping task (changes status to inspected, releases room to available).
   */
  public static async inspectTask(
    resortId: string,
    taskId: string,
    approved: boolean,
    params: {
      notes?: string;
      auditorName: string;
    },
    userId: string
  ): Promise<HousekeepingTask> {
    const task = await housekeepingTaskRepository.getById(resortId, taskId);
    if (!task) throw new Error(`Task ${taskId} not found.`);

    const now = new Date().toISOString();
    task.updatedAt = now;
    task.auditedBy = params.auditorName;
    task.auditedAt = now;

    if (approved) {
      task.status = 'inspected';
      await housekeepingTaskRepository.save(resortId, task);

      // Room is now available
      await RoomStatusService.updateRoomStatus(
        resortId,
        task.cabinId,
        task.cabinName,
        'available',
        userId,
        params.auditorName
      );
    } else {
      // Failed inspection -> put back to pending or in_progress
      task.status = 'pending';
      if (params.notes) {
        task.notes = `${task.notes || ''}\n[Inspección fallida el ${now} por ${params.auditorName}]: ${params.notes}`;
      }
      await housekeepingTaskRepository.save(resortId, task);

      await RoomStatusService.updateRoomStatus(
        resortId,
        task.cabinId,
        task.cabinName,
        'pending_cleaning',
        userId,
        params.auditorName
      );
    }

    return task;
  }

  /**
   * Checklist templates management.
   */
  public static async getChecklists(resortId: string): Promise<CleaningChecklist[]> {
    const checklists = await cleaningChecklistRepository.getAll(resortId);
    if (checklists.length === 0) {
      // Seed default checklists
      const defaultChecklists: CleaningChecklist[] = [
        {
          id: 'check_gen',
          resortId,
          name: 'Checklist de Limpieza General',
          items: [
            'Cambiar sábanas, fundas y toallas',
            'Barrer, aspirar y trapear pisos',
            'Limpiar polvo de mesas, veladores y armarios',
            'Limpiar y desinfectar inodoro, ducha y lavamanos',
            'Reponer amenities de baño (jabón, champú, papel higiénico)',
            'Vaciar cestos de basura y colocar bolsas nuevas',
            'Revisar funcionamiento de luces, TV y aire acondicionado',
            'Cerrar ventanas y asegurar puertas',
            'Verificar que no queden objetos olvidados del huésped'
          ],
          category: 'general',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'check_kitchen',
          resortId,
          name: 'Checklist de Limpieza Cocina / Vajilla',
          items: [
            'Lavar y secar toda la vajilla, cubiertos y vasos',
            'Limpiar mesadas, hornallas y bacha',
            'Verificar heladera (vaciar restos, limpiar repisas)',
            'Limpiar microondas y pava eléctrica',
            'Reponer kit de cocina (esponja nueva, detergente, repasador)'
          ],
          category: 'kitchen',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      for (const list of defaultChecklists) {
        await cleaningChecklistRepository.save(resortId, list);
      }
      return defaultChecklists;
    }
    return checklists;
  }

  public static async saveChecklist(resortId: string, checklist: CleaningChecklist): Promise<void> {
    await cleaningChecklistRepository.save(resortId, checklist);
  }
}

export default HousekeepingService;
