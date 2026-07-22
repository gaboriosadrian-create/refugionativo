import { MobileFirestore } from './MobileFirestore';
import { MobileDevice } from '../types';

/**
 * DeviceManager handles the lifecycle of mobile devices registered in StayFlow.
 * Enforces security by permitting immediate remote session/device revocations.
 */
export class DeviceManager {
  /**
   * Registers a new mobile device or updates an existing one on sync.
   */
  public static registerDevice(
    tenantId: string,
    userEmail: string,
    deviceData: {
      id: string;
      model: string;
      os: 'iOS' | 'Android' | 'WebMobile';
      osVersion: string;
      appVersion: string;
    }
  ): MobileDevice {
    const existing = MobileFirestore.mobileDevices.getById(deviceData.id);

    if (existing && existing.status === 'revoked') {
      throw new Error('Este dispositivo ha sido revocado y tiene prohibido el acceso. Contacte al administrador.');
    }

    const device: MobileDevice = {
      id: deviceData.id,
      model: deviceData.model,
      os: deviceData.os,
      osVersion: deviceData.osVersion,
      appVersion: deviceData.appVersion,
      userEmail,
      tenantId,
      registeredAt: existing?.registeredAt || new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      status: 'active'
    };

    MobileFirestore.mobileDevices.save(device);

    MobileFirestore.deviceAudit.log({
      id: `audit_${Date.now()}`,
      deviceId: device.id,
      userEmail,
      tenantId,
      timestamp: new Date().toISOString(),
      action: 'REGISTER_DEVICE',
      status: 'success',
      details: `Dispositivo ${device.model} (${device.os}) registrado con éxito.`
    });

    return device;
  }

  /**
   * Gets all registered devices for a tenant.
   */
  public static getDevicesForTenant(tenantId: string): MobileDevice[] {
    return MobileFirestore.mobileDevices.queryByTenant(tenantId);
  }

  /**
   * Remote revocation of a device. Logs out any active sessions and flags the device status.
   */
  public static revokeDevice(tenantId: string, deviceId: string, operatorEmail: string): void {
    const device = MobileFirestore.mobileDevices.getById(deviceId);
    if (!device) throw new Error('Dispositivo no encontrado.');

    device.status = 'revoked';
    MobileFirestore.mobileDevices.save(device);

    // Terminate all sessions belonging to this device
    const activeSessions = MobileFirestore.mobileSessions.queryByDevice(deviceId);
    activeSessions.forEach(session => {
      MobileFirestore.mobileSessions.delete(session.id);
    });

    // Write audit trails
    MobileFirestore.deviceAudit.log({
      id: `audit_${Date.now()}`,
      deviceId,
      userEmail: device.userEmail,
      tenantId,
      timestamp: new Date().toISOString(),
      action: 'REVOKE_DEVICE',
      status: 'success',
      details: `Dispositivo revocado remotamente por el operador ${operatorEmail}. Sesiones activas finalizadas.`
    });
  }

  /**
   * Check if device is allowed to operate.
   */
  public static isDeviceAuthorized(deviceId: string): boolean {
    const device = MobileFirestore.mobileDevices.getById(deviceId);
    return !!device && device.status === 'active';
  }
}
