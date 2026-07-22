import { MobileFirestore } from './MobileFirestore';
import { MobileSession, MobileUserRole } from '../types';
import { DeviceManager } from './DeviceManager';

/**
 * MobileSessionService administers authentication tickets on mobile endpoints.
 * Controls multi-device allowances, session longevity tracking, and biometric flags.
 */
export class MobileSessionService {
  /**
   * Authenticates a user in the context of a mobile device.
   */
  public static async authenticateDeviceUser(
    tenantId: string,
    deviceId: string,
    userEmail: string,
    userId: string,
    role: MobileUserRole,
    biometricRegistered: boolean = false
  ): Promise<MobileSession> {
    // 1. Verify device is allowed
    const isAuthorized = DeviceManager.isDeviceAuthorized(deviceId);
    if (!isAuthorized) {
      throw new Error('El dispositivo que intenta acceder no está autorizado o ha sido revocado.');
    }

    // 2. Generate secure session token (mock cryptographic signature)
    const sessionToken = `m_token_${btoa(`${tenantId}:${deviceId}:${userEmail}:${Date.now()}`)}`;
    const sessionId = `m_sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const session: MobileSession = {
      id: sessionId,
      deviceId,
      userId,
      userEmail,
      tenantId,
      role,
      loginAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      token: sessionToken,
      biometricRegistered
    };

    // 3. Save to mobileSessions collection
    MobileFirestore.mobileSessions.save(session);

    // 4. Audit
    MobileFirestore.deviceAudit.log({
      id: `audit_${Date.now()}`,
      deviceId,
      userEmail,
      tenantId,
      timestamp: new Date().toISOString(),
      action: 'USER_LOGIN',
      status: 'success',
      details: `Usuario ${userEmail} ingresó desde dispositivo. Rol: ${role.toUpperCase()}. biométrica lista: ${biometricRegistered}.`
    });

    return session;
  }

  /**
   * Terminate a specific session.
   */
  public static logoutSession(sessionId: string): void {
    const session = MobileFirestore.mobileSessions.getById(sessionId);
    if (session) {
      MobileFirestore.mobileSessions.delete(sessionId);

      MobileFirestore.deviceAudit.log({
        id: `audit_${Date.now()}`,
        deviceId: session.deviceId,
        userEmail: session.userEmail,
        tenantId: session.tenantId,
        timestamp: new Date().toISOString(),
        action: 'USER_LOGOUT',
        status: 'success',
        details: `Cierre de sesión manual para el token ${session.id.substring(0, 10)}...`
      });
    }
  }

  /**
   * Updates last activity of a session to prevent expiration.
   */
  public static touchSession(sessionId: string): void {
    const session = MobileFirestore.mobileSessions.getById(sessionId);
    if (session) {
      session.lastActivityAt = new Date().toISOString();
      MobileFirestore.mobileSessions.save(session);
    }
  }

  /**
   * Biometric registration flag toggler.
   */
  public static setBiometricsState(sessionId: string, enabled: boolean): void {
    const session = MobileFirestore.mobileSessions.getById(sessionId);
    if (session) {
      session.biometricRegistered = enabled;
      MobileFirestore.mobileSessions.save(session);

      // Audit
      MobileFirestore.deviceAudit.log({
        id: `audit_${Date.now()}`,
        deviceId: session.deviceId,
        userEmail: session.userEmail,
        tenantId: session.tenantId,
        timestamp: new Date().toISOString(),
        action: 'TOGGLE_BIOMETRICS',
        status: 'success',
        details: `Configuración biométrica de sesión actualizada: ${enabled ? 'Activada' : 'Desactivada'}`
      });
    }
  }
}
