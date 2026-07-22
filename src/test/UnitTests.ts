import { SecurityHardeningService } from '../core/security/SecurityHardeningService';
import { FirestoreOptimizationService } from '../core/firebase/FirestoreOptimizationService';
import { FeatureFlagService } from '../core/config/FeatureFlagService';

export interface TestCaseResult {
  id: string;
  suite: string;
  name: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  error?: string;
}

export class UnitTests {
  public static async runAll(): Promise<TestCaseResult[]> {
    const results: TestCaseResult[] = [];

    // Test 1: Sanitize Input XSS
    results.push(await this.runTest('Seguridad', 'Debe sanitizar etiquetas HTML para prevenir XSS', async () => {
      const payload = '<script>alert("hack")</script>';
      const sanitized = SecurityHardeningService.sanitizeInput(payload);
      if (sanitized.includes('<script>') || sanitized.includes('</script>')) {
        throw new Error(`Sanitización fallida. Script tags presentes: ${sanitized}`);
      }
    }));

    // Test 2: Sanitize SQL Injection
    results.push(await this.runTest('Seguridad', 'Debe purgar caracteres SQL de consulta', async () => {
      const query = "SELECT * FROM users WHERE email = 'admin@stayflow.com' OR '1'='1';";
      const sanitized = SecurityHardeningService.sanitizeSqlInput(query);
      if (sanitized.includes("'") || sanitized.includes('"') || sanitized.includes(';')) {
        throw new Error(`SQL Injection vulnerable. Símbolos especiales presentes: ${sanitized}`);
      }
    }));

    // Test 3: Cache Hit Optimization
    results.push(await this.runTest('Firestore', 'Debe servir datos de caché local para evitar lecturas de Firestore', async () => {
      let fetchCount = 0;
      const fetchFn = async () => {
        fetchCount++;
        return { data: 'patagonia-config' };
      };

      // Miss
      const r1 = await FirestoreOptimizationService.fetchWithCache('test_key', fetchFn, 5000);
      // Hit
      const r2 = await FirestoreOptimizationService.fetchWithCache('test_key', fetchFn, 5000);

      if (fetchCount !== 1) {
        throw new Error(`Optimización fallida. Consultas dinámicas realizadas: ${fetchCount}. Esperado: 1`);
      }
      if (r1.data !== 'patagonia-config' || r2.data !== 'patagonia-config') {
        throw new Error(`Datos retornados por caché inconsistentes`);
      }
    }));

    // Test 4: Feature Flags toggles
    results.push(await this.runTest('Feature Flags', 'Debe recuperar flags dinámicos por tenant', async () => {
      const features = FeatureFlagService.getFeatures();
      if (!features || features.length === 0) {
        throw new Error('Lista de funcionalidades vacía.');
      }
      const isSaaSEnabled = FeatureFlagService.isEnabled('enableSaaS');
      if (typeof isSaaSEnabled !== 'boolean') {
        throw new Error('Retorno de Feature Flag debe ser booleano');
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
        id: `ut-${Math.random().toString(36).substr(2, 9)}`,
        suite,
        name,
        status: 'PASSED',
        durationMs: Math.round(end - start)
      };
    } catch (err: any) {
      const end = performance.now();
      return {
        id: `ut-${Math.random().toString(36).substr(2, 9)}`,
        suite,
        name,
        status: 'FAILED',
        durationMs: Math.round(end - start),
        error: err.message
      };
    }
  }
}
