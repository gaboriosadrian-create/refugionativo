import { Booking } from '../../../types';

export type StayStatus = Booking['status'];

export interface StayAuditLog {
  userId: string;
  timestamp: string;
  action: string;
  previousState: StayStatus;
  newState: StayStatus;
  description: string;
}

export interface StayTransition {
  action: string;
  from: StayStatus;
  to: StayStatus;
  label: string;
  description: string;
  allowedRoles?: string[];
}

export const STAY_TRANSITIONS: StayTransition[] = [
  {
    action: 'confirm',
    from: 'pending',
    to: 'confirmed',
    label: 'Confirmar Reserva',
    description: 'La reserva ha sido abonada o garantizada y queda formalmente confirmada.'
  },
  {
    action: 'check_in',
    from: 'confirmed',
    to: 'checked_in',
    label: 'Procesar Check-In',
    description: 'El huésped ha llegado al complejo. Se registran sus datos y se entrega la llave.'
  },
  {
    action: 'start_stay',
    from: 'checked_in',
    to: 'in_house',
    label: 'Ingresar a Cabaña (In-House)',
    description: 'El huésped ingresa físicamente a la cabaña seleccionada.'
  },
  {
    action: 'check_out',
    from: 'in_house',
    to: 'checked_out',
    label: 'Procesar Check-Out',
    description: 'El huésped finaliza su estadía, se inspecciona la cabaña y se liquida cualquier saldo.'
  },
  {
    action: 'complete',
    from: 'checked_out',
    to: 'completed',
    label: 'Completar Estadía',
    description: 'Se cierra formalmente la estadía. El historial se guarda de manera definitiva.'
  },
  {
    action: 'no_show',
    from: 'confirmed',
    to: 'no_show',
    label: 'Marcar como No-Show',
    description: 'El huésped no se presentó en la fecha acordada sin aviso previo. Se libera la disponibilidad.'
  },
  {
    action: 'no_show_pending',
    from: 'pending',
    to: 'no_show',
    label: 'Marcar como No-Show',
    description: 'El huésped no se presentó para el check-in pendiente. Se libera la disponibilidad.'
  },
  {
    action: 'cancel',
    from: 'pending',
    to: 'cancelled',
    label: 'Cancelar Reserva',
    description: 'Se cancela la reserva y se reembolsa si corresponde. Las fechas se liberan.'
  },
  {
    action: 'cancel_confirmed',
    from: 'confirmed',
    to: 'cancelled',
    label: 'Cancelar Reserva',
    description: 'Se cancela la reserva confirmada. Las fechas se liberan de inmediato.'
  }
];

// --- SMART OPERATIONS TYPES ---

export type OperationalStatus = 
  | 'available'
  | 'occupied'
  | 'pending_cleaning'
  | 'in_cleaning'
  | 'clean'
  | 'inspection'
  | 'maintenance'
  | 'out_of_service'
  | 'blocked';

export interface RoomStatus {
  id: string; // Typically "cabin_" + cabinId
  resortId: string;
  cabinId: number;
  cabinName: string;
  status: OperationalStatus;
  lastCleanedAt?: string;
  lastInspectedAt?: string;
  updatedAt: string;
  updatedBy: string;
}

export type HousekeepingType = 'check_out' | 'guest_change' | 'scheduled' | 'manual';
export type HousekeepingStatus = 'pending' | 'in_progress' | 'completed' | 'inspected';
export type OperationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface HousekeepingTask {
  id: string;
  resortId: string;
  cabinId: number;
  cabinName: string;
  type: HousekeepingType;
  status: HousekeepingStatus;
  priority: OperationPriority;
  assignedStaffId: string;
  assignedStaffName: string;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  notes?: string;
  photos?: string[];
  checklistId?: string;
  checklistAnswers?: Record<string, boolean>; // checklist item -> checked (true/false)
  auditedBy?: string;
  auditedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceType = 'preventive' | 'corrective' | 'urgent' | 'scheduled';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceOrder {
  id: string;
  resortId: string;
  cabinId: number;
  cabinName: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: OperationPriority;
  assignedStaffId: string;
  assignedStaffName: string;
  cost: number;
  issueDescription: string;
  comments: string;
  startDate?: string; // Block start date (format YYYY-MM-DD)
  endDate?: string;   // Block end date (format YYYY-MM-DD)
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncidentCategory = 
  | 'damage' 
  | 'lost_item' 
  | 'electrical' 
  | 'water' 
  | 'internet' 
  | 'ac' 
  | 'heating' 
  | 'furniture' 
  | 'other';

export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';

export interface IncidentReport {
  id: string;
  resortId: string;
  cabinId: number;
  cabinName: string;
  category: IncidentCategory;
  status: IncidentStatus;
  priority: OperationPriority;
  reportedBy: string;
  description: string;
  photos?: string[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  resortId: string;
  userId: string;
  userName: string;
  action: string;
  targetType: 'room' | 'task' | 'maintenance' | 'incident';
  targetId: string;
  description: string;
  timestamp: string;
}

export interface CleaningChecklist {
  id: string;
  resortId: string;
  name: string;
  items: string[];
  category: 'bathroom' | 'bedroom' | 'kitchen' | 'exterior' | 'general';
  isActive: boolean;
  createdAt: string;
}

export interface TaskAssignment {
  id: string;
  resortId: string;
  staffId: string;
  staffName: string;
  role: 'housekeeper' | 'maintenance' | 'inspector' | 'supervisor';
  activeTasksCount: number;
  completedTodayCount: number;
}

export interface OperationMetrics {
  totalRooms: number;
  byStatus: Record<OperationalStatus, number>;
  pendingCleaning: number;
  inCleaning: number;
  pendingMaintenance: number;
  urgentIncidents: number;
  cleaningCompletionRate: number; // percentage
  averageCleaningMinutes: number;
  staffUtilization: Record<string, number>; // staffId -> assigned tasks
}

