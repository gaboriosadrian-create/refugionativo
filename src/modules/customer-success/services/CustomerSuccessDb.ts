import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { 
  HelpArticle, 
  KnowledgeArticle, 
  SupportTicket, 
  TicketComment, 
  CustomerHealth, 
  Feedback, 
  NpsResponse, 
  CsatResponse, 
  StatusIncident, 
  OnboardingProgress,
  AuditLog
} from '../types';

export class CustomerSuccessDb {
  private static SEED_KEY = 'stayflow_customer_success_seeded';

  public static init() {
    const isSeeded = localStorage.getItem(this.SEED_KEY);
    if (isSeeded) return;

    // 1. Seed helpArticles
    const defaultArticles: HelpArticle[] = [
      {
        id: 'art-1',
        title: 'Cómo configurar tu Channel Manager con Airbnb',
        category: 'Sincronización',
        content: 'Para sincronizar tu inventario con Airbnb, ve a la sección "Channel Manager", haz clic en "Agregar Canal" y selecciona Airbnb. Obtén tu enlace iCal de Airbnb y pégalo en el campo indicado. Esto mantendrá tus calendarios sincronizados cada 10 minutos automáticamente, previniendo sobre-reservas.',
        tags: ['airbnb', 'ical', 'sincronizacion', 'channel manager'],
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        steps: [
          'Inicia sesión en tu extranet de Airbnb.',
          'Ve a Anuncios -> Precios y Disponibilidad -> Sincronizar Calendarios.',
          'Copia la URL de exportación de Airbnb.',
          'En StayFlow, ve a Channel Manager -> Vincular Airbnb.',
          'Pega la URL y guarda los cambios.'
        ],
        language: 'es',
        version: '1.2',
        publishDate: '2026-05-15',
        author: 'Sofía CS',
        status: 'published',
        views: 145,
        helpfulCount: 38,
        unhelpfulCount: 2,
        faq: true
      },
      {
        id: 'art-2',
        title: 'Gestión de tarifas base y temporadas altas',
        category: 'Tarifas',
        content: 'StayFlow te permite crear esquemas tarifarios dinámicos. En la pestaña "Tarifas", puedes definir tu precio base por noche para cada cabaña o domo, y configurar reglas de temporada (por ejemplo, recargos del 35% en Navidad y Semana Santa).',
        tags: ['tarifas', 'temporadas', 'precios', 'revenue'],
        steps: [
          'Ingresa a la sección "Tarifas" en el menú principal.',
          'Crea una nueva "Regla de Temporada" definiendo rangos de fechas.',
          'Especifica el porcentaje de recargo o descuento aplicable.',
          'Asigna la regla a los alojamientos deseados.'
        ],
        language: 'es',
        version: '1.0',
        publishDate: '2026-06-01',
        author: 'Martín Gomez',
        status: 'published',
        views: 98,
        helpfulCount: 22,
        unhelpfulCount: 1,
        faq: true
      },
      {
        id: 'art-3',
        title: 'Instalación y sincronización de la App Móvil de Operaciones',
        category: 'Operaciones',
        content: 'La suite de operaciones móvil está diseñada para tu personal de limpieza y mantenimiento. Trabaja sin conexión (offline-first) y sincroniza automáticamente las tareas de limpieza de las cabañas y reportes de averías cuando recupera conexión de datos.',
        tags: ['mobile', 'housekeeping', 'operaciones', 'offline'],
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        steps: [
          'Descarga la App de StayFlow desde Google Play o App Store.',
          'Inicia sesión con las credenciales de tu personal.',
          'El panel descargará automáticamente las tareas del día.',
          'Al completar una limpieza, marca como "Limpio" para sincronizar al PMS en tiempo real.'
        ],
        language: 'es',
        version: '1.1',
        publishDate: '2026-07-10',
        author: 'Adrián Gaborios',
        status: 'published',
        views: 210,
        helpfulCount: 54,
        unhelpfulCount: 0,
        faq: true
      },
      {
        id: 'art-4',
        title: 'Configuración segura de pasarela de pagos integrada',
        category: 'Pagos',
        content: 'StayFlow integra Mercado Pago de manera nativa y segura. Al configurar tus credenciales (Access Token), los huéspedes podrán abonar sus reservas al instante con tarjeta de crédito/débito o billetera digital, y el estado de la reserva se confirmará automáticamente.',
        tags: ['pagos', 'mercado pago', 'tarjetas', 'seguridad'],
        steps: [
          'Dirígete a Ajustes -> Plataforma SaaS -> Pagos.',
          'Ingresa tus credenciales de producción de Mercado Pago.',
          'Habilita la opción "Confirmación Automática".',
          'Tus huéspedes verán el portal de pago seguro en su checkout digital.'
        ],
        language: 'es',
        version: '1.4',
        publishDate: '2026-04-20',
        author: 'Lucas Dev',
        status: 'published',
        views: 112,
        helpfulCount: 29,
        unhelpfulCount: 3,
        faq: false
      }
    ];
    LocalSaaSDb.set('cs_helpArticles', defaultArticles);

    // 2. Seed knowledgeBase
    const defaultKnowledgeBase: KnowledgeArticle[] = defaultArticles.map(art => ({
      ...art,
      aiSummary: `Este artículo explica de manera didáctica el proceso de configuración y resolución de problemas para el módulo de ${art.category}, garantizando la correcta adopción por parte de los administradores.`,
      internalNotes: `Artículo crítico de onboarding de clientes. Verificar validez de flujos cada trimestre con actualizaciones de la API.`
    }));
    LocalSaaSDb.set('cs_knowledgeBase', defaultKnowledgeBase);

    // 3. Seed supportTickets
    const defaultTickets: SupportTicket[] = [
      {
        id: 'tkt-1001',
        tenantId: 'patagonia-refugio',
        subject: 'Inconveniente al importar reservas mediante iCal de Booking',
        description: 'Hemos notado que algunas reservas del fin de semana largo no se reflejaron instantáneamente en el calendario general. Adjunto captura de pantalla de la configuración del enlace iCal. Necesitamos soporte urgente ya que corremos riesgo de sobre-reserva.',
        status: 'En revisión',
        priority: 'urgent',
        category: 'technical',
        createdAt: '2026-07-20T10:30:00Z',
        updatedAt: '2026-07-21T07:15:00Z',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        userName: 'Adrián Gaborios',
        attachments: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80'],
        history: [
          { timestamp: '2026-07-20T10:30:00Z', action: 'Ticket creado por el usuario', actor: 'Adrián Gaborios' },
          { timestamp: '2026-07-20T11:00:00Z', action: 'Estado cambiado a "En revisión"', actor: 'Agente Soporte (Laura)' },
          { timestamp: '2026-07-21T07:15:00Z', action: 'Actualización en log de integraciones iCal', actor: 'Soporte Nivel 2' }
        ],
        firstResponseTimeMinutes: 30
      },
      {
        id: 'tkt-1002',
        tenantId: 'patagonia-refugio',
        subject: 'Consulta sobre límites de usuarios concurrentes en plan Pro',
        description: '¿Cuántos usuarios simultáneos del personal de limpieza pueden estar conectados a la App móvil en el plan Pro? Queremos dar de alta a 3 nuevos operarios esta semana.',
        status: 'Nuevo',
        priority: 'medium',
        category: 'billing',
        createdAt: '2026-07-21T08:00:00Z',
        updatedAt: '2026-07-21T08:00:00Z',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        userName: 'Adrián Gaborios',
        history: [
          { timestamp: '2026-07-21T08:00:00Z', action: 'Ticket creado por el usuario', actor: 'Adrián Gaborios' }
        ]
      },
      {
        id: 'tkt-1003',
        tenantId: 'patagonia-refugio',
        subject: 'Fallo visual en el mapa de contacto del sitio web comercial',
        description: 'La ubicación en el mapa de contacto de la cabaña mostraba una latitud incorrecta por un error de tipeo. Ya lo corregimos en ajustes generales del complejo.',
        status: 'Resuelto',
        priority: 'low',
        category: 'feedback',
        createdAt: '2026-07-18T14:00:00Z',
        updatedAt: '2026-07-19T09:30:00Z',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        userName: 'Adrián Gaborios',
        history: [
          { timestamp: '2026-07-18T14:00:00Z', action: 'Ticket creado por el usuario', actor: 'Adrián Gaborios' },
          { timestamp: '2026-07-18T15:15:00Z', action: 'Estado cambiado a "En progreso"', actor: 'Agente Soporte (Tomás)' },
          { timestamp: '2026-07-19T09:30:00Z', action: 'Usuario confirma solución. Estado cambiado a "Resuelto"', actor: 'Adrián Gaborios' }
        ],
        firstResponseTimeMinutes: 75,
        resolutionTimeMinutes: 1170
      }
    ];
    LocalSaaSDb.set('cs_supportTickets', defaultTickets);

    // 4. Seed ticketComments
    const defaultComments: TicketComment[] = [
      {
        id: 'cmt-1',
        ticketId: 'tkt-1001',
        content: 'Hola Adrián. Estamos revisando tu log de sincronización de Booking iCal. Vemos que la URL tiene un parámetro adicional de sesión que podría estar rechazando las peticiones. Por favor, prueba pegar la URL limpia sin tokens temporales.',
        createdAt: '2026-07-20T11:00:00Z',
        userId: 'support-agent-laura',
        userEmail: 'laura@stayflow.com',
        userName: 'Laura Martinez (Soporte)',
        userRole: 'agent'
      },
      {
        id: 'cmt-2',
        ticketId: 'tkt-1001',
        content: 'Buenísimo Laura. Ya removí los parámetros y pegué el enlace puro de exportación. Avisen si el log de sincronización del servidor ya muestra peticiones exitosas.',
        createdAt: '2026-07-20T12:15:00Z',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        userName: 'Adrián Gaborios',
        userRole: 'client'
      }
    ];
    LocalSaaSDb.set('cs_ticketComments', defaultComments);

    // 5. Seed customerHealth
    const defaultHealths: CustomerHealth[] = [
      {
        id: 'h-1',
        tenantId: 'patagonia-refugio',
        companyName: 'Refugio Nativo (Patagonia)',
        healthScore: 92,
        status: 'Excelente',
        usageFrequency: 24, // 24 sessions/week
        featureAdoptionRate: 85, // 85% of features used
        activeUsersCount: 5,
        openIncidentsCount: 1,
        renewalsProbability: 95,
        satisfactionRate: 90, // equivalent to 4.5 CSAT
        lastCalculated: '2026-07-21T08:00:00Z'
      },
      {
        id: 'h-2',
        tenantId: 'andes-glamping',
        companyName: 'Andes Glamping Domes',
        healthScore: 78,
        status: 'Saludable',
        usageFrequency: 12,
        featureAdoptionRate: 60,
        activeUsersCount: 2,
        openIncidentsCount: 0,
        renewalsProbability: 85,
        satisfactionRate: 80,
        lastCalculated: '2026-07-21T08:00:00Z'
      },
      {
        id: 'h-3',
        tenantId: 'los-coihues',
        companyName: 'Complejo Los Coihues (Demo)',
        healthScore: 48,
        status: 'En riesgo',
        usageFrequency: 4,
        featureAdoptionRate: 30,
        activeUsersCount: 1,
        openIncidentsCount: 3,
        renewalsProbability: 40,
        satisfactionRate: 60,
        lastCalculated: '2026-07-21T08:00:00Z'
      },
      {
        id: 'h-4',
        tenantId: 'altas-cumbres',
        companyName: 'Altas Cumbres Cabin Suites',
        healthScore: 25,
        status: 'Crítico',
        usageFrequency: 1,
        featureAdoptionRate: 15,
        activeUsersCount: 1,
        openIncidentsCount: 5,
        renewalsProbability: 15,
        satisfactionRate: 40,
        lastCalculated: '2026-07-21T08:00:00Z'
      }
    ];
    LocalSaaSDb.set('cs_customerHealth', defaultHealths);

    // 6. Seed feedback, nps, csat
    const defaultFeedback: Feedback[] = [
      {
        id: 'fb-1',
        tenantId: 'patagonia-refugio',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        module: 'bookings',
        rating: 5,
        comment: 'La fluidez del drag and drop en el calendario es magnífica.',
        createdAt: '2026-07-15T10:00:00Z'
      },
      {
        id: 'fb-2',
        tenantId: 'patagonia-refugio',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        module: 'mobile',
        rating: 4,
        comment: 'Funciona muy bien offline, pero me gustaría un widget de batería en el header.',
        suggestion: 'Mostrar advertencia visual de nivel crítico de batería.',
        createdAt: '2026-07-19T11:45:00Z'
      }
    ];
    LocalSaaSDb.set('cs_feedback', defaultFeedback);

    const defaultNps: NpsResponse[] = [
      {
        id: 'nps-1',
        tenantId: 'patagonia-refugio',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        score: 10,
        comment: 'Súper completo, ahorra horas diarias de gestión administrativa.',
        createdAt: '2026-07-15T10:05:00Z'
      },
      {
        id: 'nps-2',
        tenantId: 'andes-glamping',
        userId: 'andes-admin',
        userEmail: 'domos@andesglamping.com',
        score: 9,
        comment: 'Muy buena experiencia visual y usabilidad para todo el staff.',
        createdAt: '2026-07-16T12:00:00Z'
      }
    ];
    LocalSaaSDb.set('cs_npsResponses', defaultNps);

    const defaultCsat: CsatResponse[] = [
      {
        id: 'csat-1',
        tenantId: 'patagonia-refugio',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        score: 5,
        comment: 'Excelente soporte técnico de Laura con el tema iCal.',
        createdAt: '2026-07-21T07:30:00Z'
      }
    ];
    LocalSaaSDb.set('cs_csatResponses', defaultCsat);

    // 7. Seed statusIncidents (Public Status Page)
    const defaultIncidents: StatusIncident[] = [
      {
        id: 'inc-1',
        title: 'Degradación temporal en servicio de Webhooks iCal',
        description: 'Hemos detectado demoras de hasta 5 minutos en el procesamiento de actualizaciones iCal debido a una alta concurrencia de peticiones en el balanceador de carga de producción.',
        severity: 'degraded',
        status: 'resolved',
        createdAt: '2026-07-20T10:00:00Z',
        updatedAt: '2026-07-20T12:00:00Z',
        updates: [
          { timestamp: '2026-07-20T10:00:00Z', message: 'Investigando demoras en colas de sincronización.', status: 'investigating' },
          { timestamp: '2026-07-20T11:15:00Z', message: 'Servicio reestablecido de forma parcial. Monitoreando latencia de colas.', status: 'monitoring' },
          { timestamp: '2026-07-20T12:00:00Z', message: 'Servicio plenamente normalizado. Todos los iCal pendientes fueron procesados.', status: 'resolved' }
        ]
      },
      {
        id: 'inc-2',
        title: 'Mantenimiento preventivo en Base de Datos Principal',
        description: 'Se realizarán tareas de mantenimiento preventivo y optimización de índices de bases de datos para garantizar el óptimo desempeño del PMS.',
        severity: 'operational',
        status: 'resolved',
        createdAt: '2026-07-15T02:00:00Z',
        updatedAt: '2026-07-15T04:30:00Z',
        updates: [
          { timestamp: '2026-07-15T02:00:00Z', message: 'Mantenimiento programado iniciado.', status: 'monitoring' },
          { timestamp: '2026-07-15T04:30:00Z', message: 'Tareas finalizadas exitosamente sin caída del servicio.', status: 'resolved' }
        ]
      }
    ];
    LocalSaaSDb.set('cs_statusIncidents', defaultIncidents);

    // 8. Seed onboardingProgress
    const defaultOnboardingProgress: OnboardingProgress[] = [
      {
        id: 'patagonia-refugio',
        tenantId: 'patagonia-refugio',
        userId: 'demo-owner-uid',
        progressPercentage: 60,
        tasks: [
          { id: 'ob-1', title: 'Completar perfil del complejo', description: 'Carga dirección, redes, teléfonos de soporte y branding.', completed: true, module: 'settings', completedAt: '2026-07-12T09:00:00Z' },
          { id: 'ob-2', title: 'Dar de alta tu primer Cabaña/Domo', description: 'Define nombres, fotos de portada, tarifas y amenities principales.', completed: true, module: 'cabins', completedAt: '2026-07-12T09:30:00Z' },
          { id: 'ob-3', title: 'Configurar pasarela de pagos', description: 'Vincula tus claves de Mercado Pago en la suite SaaS.', completed: true, module: 'payments', completedAt: '2026-07-13T14:00:00Z' },
          { id: 'ob-4', title: 'Vincular un Canal OTA (Airbnb/Booking)', description: 'Conecta tu calendario mediante importación iCal o Channel Manager.', completed: false, module: 'channels' },
          { id: 'ob-5', title: 'Descargar e instalar App Móvil', description: 'Asigna el primer parte de limpieza a tu personal operativo.', completed: false, module: 'mobile' }
        ],
        updatedAt: '2026-07-21T08:00:00Z'
      }
    ];
    LocalSaaSDb.set('cs_onboardingProgress', defaultOnboardingProgress);

    // 9. Seed Audit Logs
    const defaultAuditLogs: AuditLog[] = [
      {
        id: 'aud-1',
        timestamp: '2026-07-21T08:00:00Z',
        userId: 'demo-owner-uid',
        userEmail: 'gaboriosadrian@gmail.com',
        userRole: 'owner',
        action: 'ONBOARDING_TASK_COMPLETED',
        details: 'El usuario completó la tarea de onboarding: Configurar pasarela de pagos.'
      }
    ];
    LocalSaaSDb.set('cs_auditLogs', defaultAuditLogs);

    localStorage.setItem(this.SEED_KEY, 'true');
  }

  // Generic methods
  public static getAll<T>(collection: string): T[] {
    this.init();
    return LocalSaaSDb.get<T[]>(`cs_${collection}`) || [];
  }

  public static setAll<T>(collection: string, data: T[]): void {
    this.init();
    LocalSaaSDb.set(`cs_${collection}`, data);
  }
}
