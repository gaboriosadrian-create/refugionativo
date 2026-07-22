import { OfflineSyncService } from './OfflineSyncService';
import { SyncConflict, SyncLog } from '../types';

export type ConnectionStateListener = (online: boolean) => void;

/**
 * SyncEngine monitors connectivity changes and automatically triggers
 * queue synchronizations when signal recovers.
 */
export class SyncEngine {
  private static listeners: ConnectionStateListener[] = [];
  private static isOnline: boolean = true;

  public static addConnectionListener(listener: ConnectionStateListener): void {
    this.listeners.push(listener);
    // immediate callback with current status
    listener(this.isOnline);
  }

  public static removeConnectionListener(listener: ConnectionStateListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Toggles simulated connectivity status. Useful for testing Offline First behaviors in web previews.
   */
  public static setConnectivity(
    online: boolean,
    tenantId: string,
    deviceId: string,
    userEmail: string,
    onSyncTriggered?: (result: { processed: number; conflicts: SyncConflict[]; log: SyncLog }) => void
  ): void {
    if (this.isOnline === online) return;
    this.isOnline = online;
    
    // Broadcast status change
    this.listeners.forEach(l => l(online));

    console.log(`[SYNC ENGINE] Connection status modified: ${online ? 'ONLINE' : 'OFFLINE'}`);

    // If signal recovered, trigger automatic sync in background
    if (online) {
      console.log(`[SYNC ENGINE] Signal recovered. Initiating auto-synchronization queue...`);
      OfflineSyncService.syncPendingQueue(tenantId, deviceId, userEmail)
        .then(result => {
          if (onSyncTriggered) {
            onSyncTriggered(result);
          }
        })
        .catch(err => {
          console.error('[SYNC ENGINE] Auto sync failed:', err);
        });
    }
  }

  public static getConnectivity(): boolean {
    return this.isOnline;
  }
}
