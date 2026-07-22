# StayFlow - Plan de Backups y Recuperación ante Desastres (DR)

Este documento detalla el procedimiento oficial y recomendado para realizar respaldos periódicos del sistema SaaS StayFlow en producción. Al utilizar un backend híbrido (Firestore en la nube y fallback de persistencia local en entornos de desarrollo), la estrategia de backups se divide en dos niveles tácticos.

---

## 1. Copias de Seguridad en Google Cloud (Firestore)

Firestore proporciona capacidades nativas de exportación e importación administradas mediante Cloud Storage.

### Frecuencia Recomendada
* **Incrementales / Diarios**: Ejecutados automáticamente cada 24 horas durante horas de menor tráfico (e.g., 03:00 UTC).
* **Mensuales / Históricos**: Conservados por 1 año para auditorías impositivas y legales de reservas.

### Procedimiento Manual de Exportación

Para realizar una copia de seguridad inmediata de todas las colecciones de StayFlow, ejecute el siguiente comando utilizando la herramienta CLI `gcloud`:

```bash
gcloud firestore export gs://[STAYFLOW_BACKUP_BUCKET]
```

Para exportar únicamente colecciones críticas (como reservas y auditorías) para mitigar costos de transferencia:

```bash
gcloud firestore export gs://[STAYFLOW_BACKUP_BUCKET] \
  --collection-ids=reservations,guests,audit_logs,pricing_seasons
```

### Automatización del Proceso (Arquitectura recomendada para Producción)

Para automatizar este flujo sin agregar dependencias externas al bundle de la aplicación React, implemente la siguiente arquitectura Serverless en Google Cloud Platform:

1. **Cloud Storage**: Cree un bucket multiregión con ciclo de vida (Life Cycle Policy) de borrado automático tras 30 días para optimizar costes.
2. **Cloud Function**: Cree una función corta en Node.js que ejecute el método `v1.firestoreAdminClient.exportDocuments`.
3. **Cloud Scheduler**: Configure un trigger cron job de tipo Pub/Sub (e.g., `0 3 * * *`) que invoque la Cloud Function diariamente.

---

## 2. Copias de Seguridad de Configuración por Tenant (Metadatos)

La configuración global de límites del sistema, feature flags y defaults por tenant reside en `src/core/config/Config.ts`. 

### Procedimiento de Respaldo de Archivos
* **Control de Versiones**: Cualquier modificación en las configuraciones globales, límites o habilitación de módulos debe realizarse mediante Pull Requests en Git, asegurando trazabilidad histórica completa.
* **Sincronización Local (Development Mode)**: El motor de almacenamiento de desarrollo se basa en `LocalSaaSDb` utilizando localStorage. Se aconseja a los desarrolladores exportar el dump JSON directamente desde la consola del navegador:

```javascript
// Ejecutar en consola del navegador para descargar el backup local de StayFlow
const backupData = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.startsWith('stayflow_') || key.startsWith('audit_') || key.startsWith('logs_'))) {
    backupData[key] = localStorage.getItem(key);
  }
}
const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = `stayflow_local_backup_${new Date().toISOString().slice(0,10)}.json`;
a.click();
```

---

## 3. Plan de Recuperación ante Desastres (DR)

En caso de corrupción de datos o borrado accidental en producción, siga estos pasos:

1. **Identificar Punto de Restauración**: Localice la carpeta de exportación en Cloud Storage (e.g., `gs://stayflow-backups/2026-07-16T03:00:00/`).
2. **Importación de Datos**:
   ```bash
   gcloud firestore import gs://stayflow-backups/2026-07-16T03:00:00/
   ```
3. **Verificación de Consistencia**: Inicie el servicio de observabilidad `ObservabilityService.checkHealth()` y revise que el estado del componente de base de datos reporte `UP`.
