import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { isFirebaseConfigured } from '../firebase/firebase';
import { saveDocument } from '../firebase/firestore';
import { AuditService } from '../audit/AuditService';

export interface TenantSession {
  id: string;
  originalUserId: string;
  originalUserEmail?: string;
  targetTenantId: string;
  isImpersonating: boolean;
  startedAt: string;
  active: boolean;
}

export class TenantSwitchService {
  private static SESSION_KEY = 'stayflow_support_tenant_session';

  /**
   * Starts a support session where a Super Admin impersonates a tenant.
   */
  public static async startSupportSession(
    originalUserId: string,
    originalUserEmail: string,
    targetTenantId: string
  ): Promise<TenantSession> {
    const session: TenantSession = {
      id: `ts_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      originalUserId,
      originalUserEmail,
      targetTenantId,
      isImpersonating: true,
      startedAt: new Date().toISOString(),
      active: true,
    };

    // Save session locally
    LocalSaaSDb.set(this.SESSION_KEY, session);

    // Save session in Firestore if configured
    if (isFirebaseConfigured) {
      try {
        await saveDocument(`tenantSessions/${session.id}`, session);
      } catch (err) {
        console.warn('[STAYFLOW] Failed to persist support session to Firestore:', err);
      }
    }

    // Register Audit Event
    await AuditService.record(
      targetTenantId,
      originalUserId,
      'START_IMPERSONATION',
      'tenant_session',
      session.id,
      null,
      { targetTenantId, originalUserEmail },
      originalUserEmail
    );

    return session;
  }

  /**
   * Retrieves the currently active support session, if any.
   */
  public static getCurrentSupportSession(): TenantSession | null {
    const session = LocalSaaSDb.get<TenantSession>(this.SESSION_KEY);
    if (session && session.active) {
      return session;
    }
    return null;
  }

  /**
   * Terminates the active support session.
   */
  public static async endSupportSession(): Promise<void> {
    const session = this.getCurrentSupportSession();
    if (!session) return;

    const updatedSession: TenantSession = {
      ...session,
      active: false,
      isImpersonating: false,
    };

    // Update locally
    LocalSaaSDb.set(this.SESSION_KEY, updatedSession);

    // Update in Firestore if configured
    if (isFirebaseConfigured) {
      try {
        await saveDocument(`tenantSessions/${session.id}`, updatedSession);
      } catch (err) {
        console.warn('[STAYFLOW] Failed to terminate support session in Firestore:', err);
      }
    }

    // Register Audit Event
    await AuditService.record(
      session.targetTenantId,
      session.originalUserId,
      'END_IMPERSONATION',
      'tenant_session',
      session.id,
      { targetTenantId: session.targetTenantId },
      { active: false },
      session.originalUserEmail
    );
  }

  /**
   * Checks if support impersonation is currently active.
   */
  public static isImpersonating(): boolean {
    const session = this.getCurrentSupportSession();
    return !!session && session.isImpersonating;
  }
}

export default TenantSwitchService;
