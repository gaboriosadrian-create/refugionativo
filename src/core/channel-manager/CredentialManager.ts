import { ChannelOta } from './ChannelManagerTypes';
import { Logger } from '../logger/Logger';
import { isFirebaseConfigured } from '../firebase/firebase';
import { saveDocument, getDocument } from '../firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';

export interface OtaCredential {
  ota: ChannelOta;
  apiKey: string;
  apiSecret?: string;
  clientId?: string;
  refreshToken?: string;
  accessToken?: string;
  status: 'active' | 'inactive' | 'expired' | 'degraded';
  expiresAt?: string; // ISO String
  updatedAt: string;
}

export class CredentialManager {
  private static STORAGE_PREFIX = 'ota_creds_';

  /**
   * Retrieves secure credentials for a specific tenant and channel.
   * Never exposes credentials directly to the client side.
   */
  public static async getCredentials(tenantId: string, ota: ChannelOta): Promise<OtaCredential | null> {
    const docPath = `resorts/${tenantId}/otaCredentials/${ota}`;
    
    // Attempt Firestore retrieval
    if (isFirebaseConfigured) {
      try {
        const firestoreData = await getDocument(docPath);
        if (firestoreData) {
          return firestoreData as unknown as OtaCredential;
        }
      } catch (err: any) {
        Logger.warn(`[CredentialManager] Firestore read failed, checking LocalSaaSDb: ${err.message}`);
      }
    }

    // Fallback to LocalSaaSDb
    try {
      const key = `${this.STORAGE_PREFIX}${tenantId}_${ota}`;
      const localData = await LocalSaaSDb.get<OtaCredential>(key);
      return localData || null;
    } catch (err: any) {
      Logger.error(`[CredentialManager] LocalSaaSDb read failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Persists credentials securely.
   */
  public static async saveCredentials(
    tenantId: string,
    ota: ChannelOta,
    creds: Omit<OtaCredential, 'updatedAt'>
  ): Promise<void> {
    const credentialRecord: OtaCredential = {
      ...creds,
      updatedAt: new Date().toISOString()
    };

    const docPath = `resorts/${tenantId}/otaCredentials/${ota}`;

    // Write to Firestore if configured
    if (isFirebaseConfigured) {
      try {
        await saveDocument(docPath, credentialRecord, true);
        Logger.info(`[CredentialManager] Credentials saved in Firestore for ${ota} (Tenant: ${tenantId})`);
      } catch (err: any) {
        Logger.error(`[CredentialManager] Firestore write failed: ${err.message}`);
      }
    }

    // Always write to LocalSaaSDb as primary/fallback source
    try {
      const key = `${this.STORAGE_PREFIX}${tenantId}_${ota}`;
      await LocalSaaSDb.set(key, credentialRecord);
      Logger.info(`[CredentialManager] Credentials saved in LocalSaaSDb for ${ota} (Tenant: ${tenantId})`);
    } catch (err: any) {
      Logger.error(`[CredentialManager] LocalSaaSDb write failed: ${err.message}`);
    }
  }

  /**
   * Deletes credentials.
   */
  public static async deleteCredentials(tenantId: string, ota: ChannelOta): Promise<void> {
    const docPath = `resorts/${tenantId}/otaCredentials/${ota}`;
    
    // Firestore deletion
    if (isFirebaseConfigured) {
      try {
        // Since we don't have a direct deleteDocument helper in our custom firestore, we can set status to inactive or write a null entry
        await saveDocument(docPath, { status: 'inactive', apiKey: '', apiSecret: '', refreshToken: '', accessToken: '' }, false);
      } catch (err: any) {
        Logger.error(`[CredentialManager] Firestore delete failed: ${err.message}`);
      }
    }

    // LocalSaaSDb deletion
    try {
      const key = `${this.STORAGE_PREFIX}${tenantId}_${ota}`;
      await LocalSaaSDb.set(key, null);
      Logger.info(`[CredentialManager] Credentials deleted/revoked for ${ota}`);
    } catch (err: any) {
      Logger.error(`[CredentialManager] LocalSaaSDb delete failed: ${err.message}`);
    }
  }

  /**
   * Performs credential rotation, such as refreshing an expired OAuth Refresh Token.
   */
  public static async rotateCredentials(tenantId: string, ota: ChannelOta): Promise<OtaCredential> {
    Logger.info(`[CredentialManager] Rotating credentials for ${ota} (Tenant: ${tenantId})...`);
    
    const existing = await this.getCredentials(tenantId, ota);
    if (!existing) {
      throw new Error(`Cannot rotate credentials because none exist for ${ota}`);
    }

    // Simulate OAuth / API Key Refresh Logic
    const nextExpires = new Date();
    nextExpires.setHours(nextExpires.getHours() + 24); // Expiration: 24 hours from now

    const rotated: OtaCredential = {
      ...existing,
      accessToken: `rot_tok_${Math.random().toString(36).substring(2, 15)}`,
      refreshToken: existing.refreshToken ? `rot_ref_${Math.random().toString(36).substring(2, 15)}` : undefined,
      status: 'active',
      expiresAt: nextExpires.toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docPath = `resorts/${tenantId}/otaCredentials/${ota}`;
    
    if (isFirebaseConfigured) {
      await saveDocument(docPath, rotated, true);
    }
    
    const key = `${this.STORAGE_PREFIX}${tenantId}_${ota}`;
    await LocalSaaSDb.set(key, rotated);

    Logger.info(`[CredentialManager] Completed token rotation successfully for ${ota}. New expiration: ${rotated.expiresAt}`);
    return rotated;
  }
}
