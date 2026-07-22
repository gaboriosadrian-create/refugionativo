import { CommercialPlan, SaaSPlanType } from '../types';
import { CommercialRepository } from './CommercialRepository';
import { AuditService } from '../../../core/audit/AuditService';

const DEFAULT_PLAN_CONFIGS: CommercialPlan[] = [
  {
    id: 'Starter',
    name: 'StayFlow Starter',
    price: 49,
    billingPeriod: 'monthly',
    maxAccommodations: 1,
    maxRooms: 5,
    maxUsers: 2,
    storageGB: 5,
    supportLevel: 'Email',
    integrations: ['WhatsApp Basic'],
    features: ['Motor de Reservas', 'Gestión de Huéspedes', 'PMS Simple'],
    active: true
  },
  {
    id: 'Professional',
    name: 'StayFlow Professional',
    price: 99,
    billingPeriod: 'monthly',
    maxAccommodations: 3,
    maxRooms: 20,
    maxUsers: 5,
    storageGB: 20,
    supportLevel: 'Chat & Email',
    integrations: ['WhatsApp Integration', 'Mercado Pago', 'Stripe'],
    features: ['Motor de Reservas', 'Gestión de Huéspedes', 'PMS Completo', 'Pagos Online', 'Estadísticas Base'],
    active: true
  },
  {
    id: 'Business',
    name: 'StayFlow Business',
    price: 199,
    billingPeriod: 'monthly',
    maxAccommodations: 10,
    maxRooms: 100,
    maxUsers: 15,
    storageGB: 100,
    supportLevel: '24/7 Priority Phone',
    integrations: ['WhatsApp Integration', 'Mercado Pago', 'Stripe', 'Google Calendar', 'Airbnb Sync'],
    features: ['Todo lo de Professional', 'Asistente de IA (Copilot)', 'Múltiples Propiedades', 'Revenue Engine', 'BI & Analytics Avanzado'],
    active: true
  },
  {
    id: 'Enterprise',
    name: 'StayFlow Enterprise',
    price: 399,
    billingPeriod: 'monthly',
    maxAccommodations: 99,
    maxRooms: 999,
    maxUsers: 99,
    storageGB: 1000,
    supportLevel: 'Dedicated Account Manager',
    integrations: ['Integraciones Ilimitadas', 'Open API', 'Channel Manager Realtime', 'Custom Gateways'],
    features: ['Todo lo de Business', 'SLA Garantizado', 'Desarrollo a Medida', 'Multi-Tenant Completo', 'Super Admin Dedicado'],
    active: true
  }
];

export class PlanService {
  public static async initializePlans(): Promise<void> {
    const plans = await CommercialRepository.getSubscriptionPlans();
    if (plans.length === 0) {
      for (const p of DEFAULT_PLAN_CONFIGS) {
        await CommercialRepository.saveSubscriptionPlan(p);
      }
    }
  }

  public static async getPlans(): Promise<CommercialPlan[]> {
    await this.initializePlans();
    return CommercialRepository.getSubscriptionPlans();
  }

  public static async getPlan(planId: SaaSPlanType): Promise<CommercialPlan> {
    const plans = await this.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      // Fallback
      return DEFAULT_PLAN_CONFIGS.find(p => p.id === planId) || DEFAULT_PLAN_CONFIGS[0];
    }
    return plan;
  }

  public static async updatePlan(plan: CommercialPlan, operatorEmail: string): Promise<void> {
    await CommercialRepository.saveSubscriptionPlan(plan);
    
    // Log audit trail
    await AuditService.record(
      'system',
      'super-admin',
      'UPDATE_SUBSCRIPTION_PLAN',
      'subscription_plan',
      plan.id,
      null,
      plan as any,
      operatorEmail
    );
  }
}
