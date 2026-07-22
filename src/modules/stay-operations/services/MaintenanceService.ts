import { maintenanceOrderRepository } from '../repositories/MaintenanceOrderRepository';
import { RoomStatusService } from './RoomStatusService';
import { MaintenanceOrder, MaintenanceType, MaintenanceStatus, OperationPriority } from '../types';
import { AvailabilityService } from '../../availability/services/AvailabilityService';
import { AvailabilityStatus } from '../../availability/types';

export class MaintenanceService {
  /**
   * Retrieves all maintenance orders.
   */
  public static async getOrders(resortId: string): Promise<MaintenanceOrder[]> {
    return maintenanceOrderRepository.getAll(resortId);
  }

  /**
   * Creates a maintenance order and blocks calendar availability if dates are provided.
   */
  public static async createOrder(
    resortId: string,
    params: {
      cabinId: number;
      cabinName: string;
      type: MaintenanceType;
      priority: OperationPriority;
      assignedStaffId?: string;
      assignedStaffName?: string;
      issueDescription: string;
      comments?: string;
      cost?: number;
      startDate?: string; // Format YYYY-MM-DD
      endDate?: string;   // Format YYYY-MM-DD
    },
    userId: string,
    userName: string
  ): Promise<MaintenanceOrder> {
    const now = new Date().toISOString();
    const orderId = `maint_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newOrder: MaintenanceOrder = {
      id: orderId,
      resortId,
      cabinId: params.cabinId,
      cabinName: params.cabinName,
      type: params.type,
      status: 'pending',
      priority: params.priority,
      assignedStaffId: params.assignedStaffId || '',
      assignedStaffName: params.assignedStaffName || 'Sin asignar',
      cost: params.cost || 0,
      issueDescription: params.issueDescription,
      comments: params.comments || '',
      startDate: params.startDate,
      endDate: params.endDate,
      createdAt: now,
      updatedAt: now
    };

    await maintenanceOrderRepository.save(resortId, newOrder);

    // Update room status to maintenance
    await RoomStatusService.updateRoomStatus(
      resortId,
      params.cabinId,
      params.cabinName,
      'maintenance',
      userId,
      userName
    );

    // If dates are provided, automatically apply block in Availability Engine
    if (params.startDate && params.endDate) {
      try {
        await AvailabilityService.applyBlock(
          resortId,
          params.cabinId,
          params.startDate,
          params.endDate,
          AvailabilityStatus.MAINTENANCE,
          `Mantenimiento #${orderId}`,
          params.issueDescription,
          userId
        );
      } catch (err) {
        console.error(`Error automatically applying availability block for maintenance ${orderId}:`, err);
      }
    }

    return newOrder;
  }

  /**
   * Starts a maintenance order.
   */
  public static async startOrder(
    resortId: string,
    orderId: string,
    userId: string,
    userName: string
  ): Promise<MaintenanceOrder> {
    const order = await maintenanceOrderRepository.getById(resortId, orderId);
    if (!order) throw new Error(`Maintenance order ${orderId} not found.`);

    const now = new Date().toISOString();
    order.status = 'in_progress';
    order.updatedAt = now;

    await maintenanceOrderRepository.save(resortId, order);

    // Ensure room is in maintenance state
    await RoomStatusService.updateRoomStatus(
      resortId,
      order.cabinId,
      order.cabinName,
      'maintenance',
      userId,
      userName
    );

    return order;
  }

  /**
   * Completes a maintenance order and releases calendar availability block.
   */
  public static async completeOrder(
    resortId: string,
    orderId: string,
    params: {
      comments?: string;
      cost?: number;
    },
    userId: string,
    userName: string
  ): Promise<MaintenanceOrder> {
    const order = await maintenanceOrderRepository.getById(resortId, orderId);
    if (!order) throw new Error(`Maintenance order ${orderId} not found.`);

    const now = new Date().toISOString();
    order.status = 'completed';
    order.resolvedAt = now;
    order.updatedAt = now;

    if (params.comments !== undefined) order.comments = params.comments;
    if (params.cost !== undefined) order.cost = params.cost;

    await maintenanceOrderRepository.save(resortId, order);

    // Update room status to clean or pending_cleaning
    await RoomStatusService.updateRoomStatus(
      resortId,
      order.cabinId,
      order.cabinName,
      'clean',
      userId,
      userName
    );

    // Automatically release availability block
    if (order.startDate && order.endDate) {
      try {
        await AvailabilityService.releaseBlock(
          resortId,
          order.cabinId,
          order.startDate,
          order.endDate
        );
      } catch (err) {
        console.error(`Error automatically releasing availability block for maintenance ${orderId}:`, err);
      }
    }

    return order;
  }

  /**
   * Cancels a maintenance order and releases availability block.
   */
  public static async cancelOrder(
    resortId: string,
    orderId: string,
    reason: string,
    userId: string,
    userName: string
  ): Promise<MaintenanceOrder> {
    const order = await maintenanceOrderRepository.getById(resortId, orderId);
    if (!order) throw new Error(`Maintenance order ${orderId} not found.`);

    const now = new Date().toISOString();
    order.status = 'cancelled';
    order.updatedAt = now;
    if (reason) {
      order.comments = `${order.comments || ''}\n[Cancelado por ${userName}]: ${reason}`;
    }

    await maintenanceOrderRepository.save(resortId, order);

    // Update room status to available (or back to previous)
    await RoomStatusService.updateRoomStatus(
      resortId,
      order.cabinId,
      order.cabinName,
      'available',
      userId,
      userName
    );

    // Automatically release availability block
    if (order.startDate && order.endDate) {
      try {
        await AvailabilityService.releaseBlock(
          resortId,
          order.cabinId,
          order.startDate,
          order.endDate
        );
      } catch (err) {
        console.error(`Error releasing availability block on cancel:`, err);
      }
    }

    return order;
  }
}

export default MaintenanceService;
