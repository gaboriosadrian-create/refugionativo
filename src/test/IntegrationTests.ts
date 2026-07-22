import { APIOptimizationService } from '../core/config/APIOptimizationService';
import { SecurityService } from '../core/security/SecurityService';
import { TestCaseResult } from './UnitTests';

export class IntegrationTests {
  public static async runAll(): Promise<TestCaseResult[]> {
    const results: TestCaseResult[] = [];

    // Test 1: API Timeout recovery
    results.push(await this.runTest('API Integration', 'Debe simular y recuperarse ante fallas con reintentos', async () => {
      let callCount = 0;
      const apiCall = async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Servidor remoto temporalmente inactivo.');
        }
        return { status: 'success' };
      };

      const res = await APIOptimizationService.fetchWithOptimizations(
        'mock_ota_rates',
        apiCall,
        { timeoutMs: 3000, maxRetries: 3, useCache: false }
      );

      if (res.status !== 'success') {
        throw new Error('Retorno inconsistente del motor de reintentos');
      }
      if (callCount !== 2) {
        throw new Error(`El motor de reintentos debió gatillar 2 intentos, gatilló: ${callCount}`);
      }
    }));

    // Test 2: Multi-Tenant Tenant Leak Prevention
    results.push(await this.runTest('Multi-Tenant Segregación', 'Debe rechazar consultas privadas si el usuario no tiene rol asignado', async () => {
      try {
        SecurityService.checkPermission(
          { uid: 'guest_user', email: 'guest@portal.com' } as any,
          null, // NO role
          'ADMIN'
        );
        throw new Error('Error: Se permitió acceso a recurso administrativo a usuario sin rol asignado');
      } catch (err: any) {
        if (!err.message.includes('User role is not defined')) {
          throw new Error(`Falla de validación RBAC incorrecta: ${err.message}`);
        }
      }
    }));

    // Test 3: Standard SLA latency verification
    results.push(await this.runTest('SLA de Latencia', 'Debe mantener un promedio de latencia inferior al umbral SLA empresarial de 500ms', async () => {
      const metrics = APIOptimizationService.getAPIMetrics();
      if (metrics.averageLatencyMs > 500) {
        throw new Error(`Exceso de SLA: latencia promedio registrada es de ${metrics.averageLatencyMs}ms`);
      }
    }));

    return results;
  }

  private static async runTest(suite: string, name: string, fn: () => Promise<void>): Promise<TestCaseResult> {
    const start = performance.now();
    try {
      await fn();
      const end = performance.now();
      return {
        id: `it-${Math.random().toString(36).substr(2, 9)}`,
        suite,
        name,
        status: 'PASSED',
        durationMs: Math.round(end - start)
      };
    } catch (err: any) {
      const end = performance.now();
      return {
        id: `it-${Math.random().toString(36).substr(2, 9)}`,
        suite,
        name,
        status: 'FAILED',
        durationMs: Math.round(end - start),
        error: err.message
      };
    }
  }
}
export default IntegrationTests;
