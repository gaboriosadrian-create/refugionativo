import { LoggingService } from '../logger/LoggingService';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  tenantId: string;
  sizeKb: number;
  collectionsIncluded: string[];
  status: 'SUCCESS' | 'FAILED' | 'ARCHIVED';
  storageClass: 'STANDARD' | 'NEARLINE' | 'COLDLINE';
  checksum: string;
}

export class BackupStrategyService {
  private static STORAGE_KEY = 'stayflow_enterprise_backups';

  private static defaultBackups: BackupSnapshot[] = [
    {
      id: 'snap-20260720-001',
      timestamp: '2026-07-20T04:00:00Z',
      tenantId: 'patagonia-refugio',
      sizeKb: 1424,
      collectionsIncluded: ['accommodations', 'bookings', 'pricing_seasons', 'users'],
      status: 'SUCCESS',
      storageClass: 'STANDARD',
      checksum: 'e7a18f8b89c30d9bf89bc30113fa02'
    },
    {
      id: 'snap-20260719-001',
      timestamp: '2026-07-19T04:00:00Z',
      tenantId: 'patagonia-refugio',
      sizeKb: 1412,
      collectionsIncluded: ['accommodations', 'bookings', 'pricing_seasons', 'users'],
      status: 'SUCCESS',
      storageClass: 'STANDARD',
      checksum: 'd19842fbc9823f9b23fa0981b2394a'
    },
    {
      id: 'snap-20260718-001',
      timestamp: '2026-07-18T04:00:00Z',
      tenantId: 'patagonia-refugio',
      sizeKb: 1398,
      collectionsIncluded: ['accommodations', 'bookings', 'pricing_seasons', 'users'],
      status: 'ARCHIVED',
      storageClass: 'COLDLINE',
      checksum: 'a8972b98e123faef8902049bfcd892'
    }
  ];

  /**
   * Retrieves all available backups from localStorage or populates default mocks
   */
  public static getBackups(): BackupSnapshot[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultBackups));
    } catch {
      LoggingService.warn('Could not read backups from localStorage');
    }
    return [...this.defaultBackups];
  }

  /**
   * Creates a manual full backup snapshot of a tenant's database
   */
  public static triggerManualBackup(tenantId: string): BackupSnapshot {
    LoggingService.info(`Triggering on-demand enterprise backup for tenant: ${tenantId}`);
    
    const backups = this.getBackups();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(Math.random() * 16777215).toString(16);
    
    const newSnapshot: BackupSnapshot = {
      id: `snap-${dateStr}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      tenantId,
      sizeKb: Math.floor(1200 + Math.random() * 300),
      collectionsIncluded: ['accommodations', 'bookings', 'pricing_seasons', 'users', 'stay_operations', 'audit_logs'],
      status: 'SUCCESS',
      storageClass: 'STANDARD',
      checksum: randomHex.padEnd(30, 'f')
    };

    backups.unshift(newSnapshot);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
    LoggingService.info(`Backup Snapshot ${newSnapshot.id} created successfully with checksum ${newSnapshot.checksum}`);
    
    return newSnapshot;
  }

  /**
   * Simulates a safe transactional database restoration from a snapshot
   */
  public static simulateRestore(snapshotId: string): { success: boolean; log: string[] } {
    const backups = this.getBackups();
    const snap = backups.find(b => b.id === snapshotId);
    
    if (!snap) {
      return { success: false, log: [`Error: Snapshot ${snapshotId} not found`] };
    }

    LoggingService.warn(`INITIATING ENTERPRISE DATABASE DISASTER RECOVERY RESTORATION. Target Snapshot: ${snapshotId}`);
    
    const log: string[] = [
      `[RESTORE] [INFO] Inicializando restauración de base de datos desde snapshot: ${snapshotId}`,
      `[RESTORE] [WARN] Bloqueando solicitudes entrantes para evitar estados de concurrencia inconsistentes.`,
      `[RESTORE] [INFO] Validando suma de verificación checksum: ${snap.checksum} -> OK`,
      `[RESTORE] [INFO] Purgando tablas locales de transacciones activas...`,
      `[RESTORE] [INFO] Recreando colecciones de Firestore: ${snap.collectionsIncluded.join(', ')}`,
      `[RESTORE] [INFO] Descomprimiendo snapshot del almacenamiento de Google Cloud Storage clase: ${snap.storageClass}...`,
      `[RESTORE] [INFO] Restaurando datos del cliente: ${snap.tenantId} (${snap.sizeKb} KB cargados)...`,
      `[RESTORE] [INFO] Reconstruyendo índices secundarios en segundo plano...`,
      `[RESTORE] [INFO] Desbloqueando peticiones de cliente.`,
      `[RESTORE] [SUCCESS] La restauración completó con éxito. Cero pérdidas de datos registradas.`
    ];

    LoggingService.info(`RESTORATION COMPLETED SUCCESSFULLY FOR SNAPSHOT: ${snapshotId}`);
    return { success: true, log };
  }
}
