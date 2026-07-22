# Documentación Técnica de Producción
## StayFlow Enterprise PMS & SaaS Platform

Bienvenido a la documentación oficial para desarrolladores de **StayFlow**. Esta guía describe la arquitectura del sistema, los patrones de seguridad, las estrategias de optimización y el flujo de despliegue automatizado para entornos empresariales de alta disponibilidad.

---

## 1. Arquitectura de Software & Patrones de Diseño

StayFlow está diseñado como una aplicación full-stack moderna basada en **React 18 con Vite** para la capa de presentación y un backend robusto basado en Node.js de alta escalabilidad.

### Principios Fundamentales
- **SOLID Design Principles:** Cada servicio cumple una responsabilidad única. Por ejemplo, `SecurityHardeningService` aisla las tareas de desinfección de entrada, mientras que `BackupStrategyService` se encarga exclusivamente de las políticas de restauración y copias de seguridad de datos.
- **Segregación Estricta Multi-Tenant:** La lógica de aislamiento reside a nivel de base de datos. Ningún usuario puede ejecutar transacciones sin pasar por la validación de pertenencia en `SecurityService.validateTenantAccess`.
- **Arquitectura Basada en Servicios:** Las capacidades complejas (BI, Pagos, Notificaciones) están organizadas como microservicios en la carpeta `/src/core/` para desacoplar el código de los componentes visuales de React.

---

## 2. Inventario de Módulos & APIs de Optimización

### A. API Optimization (`core/config/APIOptimizationService`)
Maneja de manera integral el rendimiento de comunicación externa:
- **Estrategia de Reintentos Exponenciales (Exponential Backoff Retry):** Las llamadas a APIs externas fallidas se reintentan incrementando progresivamente el tiempo de espera, evitando el agotamiento de recursos del sistema remoto.
- **Timeout Protection:** Límite estricto de tiempo (ej. 8000ms) para evitar hilos huérfanos que degraden la memoria del servidor de la aplicación.
- **Caché de Respuesta de Red:** Reduce llamadas REST redundantes en vistas de dashboard de alta concurrencia.

### B. Firestore Optimization (`core/firebase/FirestoreOptimizationService`)
Middleware inteligente de base de datos:
- **Caché Local con TTL:** Las lecturas de Firestore se almacenan con un tiempo de vida (Time To Live). En las siguientes solicitudes, se retornan directamente de la memoria, reduciendo el consumo de cuota de Google Cloud y optimizando la latencia de respuesta a menos de 5ms.
- **Loteador Batch Writes:** Procesa colecciones masivas dividiendo las operaciones en lotes de tamaño óptimo (máximo 500 registros) de forma transaccional.

### C. Feature Flags (`core/config/FeatureFlagService`)
Motor de despliegue por fases:
- Permite habilitar o deshabilitar funcionalidades críticas (SaaS Billing, Backups, Motor de Promociones) en tiempo real por Tenant o Entorno sin requerir un redespliegue de código.
- Configuración persistente y autoadministrable almacenada localmente.

---

## 3. Plan de Recuperación ante Desastres (Disaster Recovery & Backups)

La estrategia de respaldo y restauración ante contingencias críticas en StayFlow consta de las siguientes fases:

1. **Backups Automáticos Diarios (Snapshots):** El sistema realiza capturas completas en caliente de las colecciones de base de datos.
2. **Ciclo de Vida de Almacenamiento:**
   - **Estándar (Google Cloud Storage Standard):** Para los respaldos de los últimos 7 días. Acceso inmediato para recuperaciones rápidas.
   - **Coldline / Archive:** Para históricos mensuales, reduciendo costos de retención a largo plazo.
3. **Procedimiento de Restauración Transaccional (Safe Restore):**
   - El sistema entra en modo de mantenimiento temporal.
   - Se valida el hash de suma criptográfica (checksum).
   - Se purgan las transacciones inestables y se reescriben las colecciones.
   - Se reconstruyen los índices de Firestore en segundo plano para evitar bloqueos del sistema.

---

## 4. Pipeline de Despliegue CI/CD (Desarrollo, Staging & Producción)

El proyecto incluye soporte para flujos integrados con **GitHub Actions**. El pipeline ejecuta las siguientes tareas:

```yaml
# Estructura del Flujo de Despliegue CI/CD
Fase 1: Linting & Validación de Tipos (TypeScript --noEmit)
Fase 2: Ejecución de Casos de Prueba (Unit, Integration, E2E)
Fase 3: Auditoría de Seguridad & OWASP Compliance Scan
Fase 4: Compilación de Código de Producción (Vite Bundling)
Fase 5: Creación de Imagen de Contenedor Docker segura
Fase 6: Despliegue de Alta Disponibilidad a Google Cloud Run
```

Para ver la configuración técnica detallada del pipeline, consulte el archivo `.github/workflows/deploy.yml` provisto en el directorio raíz.
