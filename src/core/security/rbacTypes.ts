export interface PermissionDefinition {
  id: string; // e.g. 'bookings.view'
  module: string; // e.g. 'Reservas'
  screen: string; // e.g. 'bookings'
  action: string; // e.g. 'view'
  name: string; // e.g. 'Ver Reservas'
  description: string; // e.g. 'Permite visualizar el listado y calendario de reservas'
}

export interface CustomRole {
  id: string; // Unique, e.g. 'patagonia-refugio_supervisor'
  name: string; // e.g. 'Supervisor'
  description: string;
  tenantId: string; // 'system' or resort ID
  isSystem: boolean; // True if pre-defined system role
  permissions: string[]; // List of permission IDs
  active: boolean;
  copiedFrom?: string; // Duplicate audit reference
  createdAt: string;
  updatedAt: string;
}

export interface RoleAssignment {
  id: string; // unique assignment id
  userId: string;
  resortId: string;
  roleIds: string[]; // Support multiple assigned roles
  active: boolean;
  assignedBy?: string;
  assignedAt: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Reservas
  { id: 'bookings.view', module: 'Reservas', screen: 'bookings', action: 'view', name: 'Ver Reservas', description: 'Permite visualizar el listado y calendario de reservas' },
  { id: 'bookings.create', module: 'Reservas', screen: 'bookings', action: 'create', name: 'Crear Reservas', description: 'Permite crear nuevas reservas en el sistema' },
  { id: 'bookings.edit', module: 'Reservas', screen: 'bookings', action: 'edit', name: 'Editar Reservas', description: 'Permite editar los datos de reservas existentes' },
  { id: 'bookings.cancel', module: 'Reservas', screen: 'bookings', action: 'cancel', name: 'Cancelar Reservas', description: 'Permite cancelar y dar de baja reservas' },
  { id: 'bookings.export', module: 'Reservas', screen: 'bookings', action: 'export', name: 'Exportar Reservas', description: 'Permite exportar reservas a formatos CSV/Excel' },

  // Pagos
  { id: 'payments.view', module: 'Pagos', screen: 'payments', action: 'view', name: 'Ver Pagos', description: 'Permite visualizar transacciones de pagos y cobros' },
  { id: 'payments.charge', module: 'Pagos', screen: 'payments', action: 'charge', name: 'Cobrar', description: 'Permite procesar nuevos cobros o registrar pagos manuales' },
  { id: 'payments.refund', module: 'Pagos', screen: 'payments', action: 'refund', name: 'Reembolsar', description: 'Permite emitir reembolsos de pagos' },

  // Clientes
  { id: 'guests.view', module: 'Clientes', screen: 'guests', action: 'view', name: 'Ver Clientes', description: 'Permite ver el listado de huéspedes y su historial' },
  { id: 'guests.create', module: 'Clientes', screen: 'guests', action: 'create', name: 'Crear Clientes', description: 'Permite registrar nuevos huéspedes en la base de datos' },
  { id: 'guests.edit', module: 'Clientes', screen: 'guests', action: 'edit', name: 'Editar Clientes', description: 'Permite actualizar datos de contacto e historial de huéspedes' },

  // Alojamientos
  { id: 'accommodations.view', module: 'Alojamientos', screen: 'cabins', action: 'view', name: 'Ver Alojamientos', description: 'Permite ver la configuración de cabañas, domos y habitaciones' },
  { id: 'accommodations.edit', module: 'Alojamientos', screen: 'cabins', action: 'edit', name: 'Gestionar Alojamientos', description: 'Permite crear, editar, reordenar o dar de baja alojamientos y tipos' },

  // Tarifas y Reglas (Pricing)
  { id: 'pricing.view', module: 'Tarifas', screen: 'pricing', action: 'view', name: 'Ver Tarifas', description: 'Permite ver reglas de precios, temporadas y tarifas base' },
  { id: 'pricing.edit', module: 'Tarifas', screen: 'pricing', action: 'edit', name: 'Gestionar Tarifas', description: 'Permite crear o modificar temporadas, multiplicadores y reglas de precios' },

  // Promociones
  { id: 'promotions.view', module: 'Promociones', screen: 'promotions', action: 'view', name: 'Ver Cupones', description: 'Permite visualizar códigos promocionales activos' },
  { id: 'promotions.edit', module: 'Promociones', screen: 'promotions', action: 'edit', name: 'Gestionar Cupones', description: 'Permite crear, editar o desactivar cupones de descuento' },

  // CMS
  { id: 'cms.edit', module: 'CMS', screen: 'cms', action: 'edit', name: 'Editar Páginas CMS', description: 'Permite editar el contenido, términos y secciones del sitio web' },

  // Website (Portal Público)
  { id: 'website.publish', module: 'Website', screen: 'cms', action: 'publish', name: 'Publicar Cambios', description: 'Permite publicar cambios del portal web al entorno productivo' },

  // Auditoría
  { id: 'audit.view', module: 'Auditoría', screen: 'audit', action: 'view', name: 'Ver Bitácora', description: 'Permite acceder a los registros de auditoría y log general del sistema' },

  // Configuración
  { id: 'settings.view', module: 'Configuración', screen: 'settings', action: 'view', name: 'Ver Configuración', description: 'Permite visualizar la configuración general, regional y de contacto' },
  { id: 'settings.edit', module: 'Configuración', screen: 'settings', action: 'edit', name: 'Modificar Configuración', description: 'Permite alterar la configuración general, branding, emails e integraciones' },
  { id: 'rbac.manage', module: 'Configuración', screen: 'settings', action: 'manage', name: 'Administrar Roles y Permisos', description: 'Permite gestionar perfiles de acceso (RBAC) de usuarios en el tenant' },

  // Business Intelligence
  { id: 'bi.view', module: 'Business Intelligence', screen: 'analytics', action: 'view', name: 'Ver Analytics / BI', description: 'Permite acceder a la plataforma de Business Intelligence y dashboards ejecutivos' },
  { id: 'bi.edit', module: 'Business Intelligence', screen: 'analytics', action: 'edit', name: 'Gestionar Dashboards', description: 'Permite configurar dashboards, crear vistas y guardar dashboards personalizados' },
  { id: 'bi.reports', module: 'Business Intelligence', screen: 'analytics', action: 'reports', name: 'Generar Reportes', description: 'Permite usar el Report Builder para generar, programar y guardar reportes de negocio' },
  { id: 'bi.export', module: 'Business Intelligence', screen: 'analytics', action: 'export', name: 'Exportar Métricas', description: 'Permite exportar datos analíticos en formatos PDF, Excel, CSV y JSON' }
];

export const DEFAULT_SYSTEM_ROLES = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Acceso total y absoluto a nivel plataforma para administración de todos los tenants.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'owner',
    name: 'Owner',
    description: 'Propietario del resort. Control absoluto sobre todas las configuraciones, pagos, reservas y usuarios.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrador del resort. Puede gestionar reservas, clientes, alojamientos, tarifas y promociones.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(p => p.id !== 'rbac.manage' && p.id !== 'audit.view').map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Gerente Operativo. Capacidad para gestionar tarifas, promociones, reservas y alojamientos.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(p => ['bookings', 'guests', 'accommodations', 'pricing', 'promotions'].some(m => p.id.startsWith(m))).map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Recepcionista del resort. Puede visualizar y crear/editar reservas y clientes.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(p => ['bookings.view', 'bookings.create', 'bookings.edit', 'guests.view', 'guests.create', 'accommodations.view'].includes(p.id)).map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping',
    description: 'Personal de limpieza y mantenimiento. Visualización de alojamientos y estado operativo.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(p => ['accommodations.view', 'bookings.view'].includes(p.id)).map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'accounting',
    name: 'Accounting',
    description: 'Contabilidad e informes financieros. Acceso completo a pagos, reservas e informes financieros.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(p => ['payments.view', 'payments.charge', 'bookings.view', 'pricing.view'].includes(p.id)).map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Gestión de promociones y canales de adquisición.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(p => ['promotions.view', 'promotions.edit', 'cms.edit', 'website.publish', 'guests.view'].includes(p.id)).map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Personal general de atención al cliente. Visualiza calendarios y asiste en registros.',
    tenantId: 'system',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(p => ['bookings.view', 'guests.view', 'accommodations.view'].includes(p.id)).map(p => p.id),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];
