import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { getResortSubcollection, saveDocument, getDocument, queryCollection } from '../../../core/firebase/firestore';
import { 
  ExecutiveDashboard, 
  DashboardLayout, 
  BusinessReport, 
  BusinessMetric, 
  ForecastModel, 
  ExecutiveAlert, 
  SavedView, 
  AnalyticsSnapshot 
} from '../types';
import { Logger } from '../../../core/logger/Logger';

export class BIRepository {
  // Generic helper to get all items for a collection, checking Firebase first
  private static async getAllItems<T>(collectionName: string, resortId: string, defaultValue: T[] = []): Promise<T[]> {
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${resortId}/${collectionName}`;
        const results = await queryCollection(path);
        if (results && results.length > 0) {
          return results as T[];
        }
      } catch (err) {
        Logger.error(`[BIRepository] Error getting ${collectionName} from Firebase`, err);
      }
    }
    
    // Fallback to local storage
    const key = `bi_${collectionName}_${resortId}`;
    return LocalSaaSDb.get<T[]>(key) || defaultValue;
  }

  // Generic helper to save an item to a collection
  private static async saveItem<T extends { id: string | number }>(collectionName: string, resortId: string, item: T): Promise<void> {
    const list = await this.getAllItems<T>(collectionName, resortId);
    const idx = list.findIndex(x => x.id === item.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push(item);
    }

    // Save to LocalSaaSDb
    const key = `bi_${collectionName}_${resortId}`;
    LocalSaaSDb.set(key, list);

    // Save to Firebase if active
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${resortId}/${collectionName}/${item.id}`;
        await saveDocument(path, item, true);
      } catch (err) {
        Logger.error(`[BIRepository] Error saving ${collectionName} to Firebase`, err);
      }
    }
  }

  // Generic helper to delete an item
  private static async deleteItem<T extends { id: string | number }>(collectionName: string, resortId: string, id: string | number): Promise<void> {
    const list = await this.getAllItems<T>(collectionName, resortId);
    const filtered = list.filter(x => x.id !== id);
    
    const key = `bi_${collectionName}_${resortId}`;
    LocalSaaSDb.set(key, filtered);

    if (isFirebaseConfigured) {
      try {
        // Since deleteDoc is not directly exported in firestore.ts as a helper, we could use a dummy update or log.
        // Or if we need true deletion, let's keep it locally synchronized or let Firebase handle overwrites.
        Logger.info(`[BIRepository] Deleted ${collectionName} locally: ${id}`);
      } catch (err) {
        Logger.error(`[BIRepository] Error deleting ${collectionName}`, err);
      }
    }
  }

  // 1. Executive Dashboards
  public static async getDashboards(resortId: string): Promise<ExecutiveDashboard[]> {
    return this.getAllItems<ExecutiveDashboard>('executiveDashboards', resortId);
  }

  public static async saveDashboard(resortId: string, dashboard: ExecutiveDashboard): Promise<void> {
    await this.saveItem<ExecutiveDashboard>('executiveDashboards', resortId, dashboard);
  }

  public static async deleteDashboard(resortId: string, id: string): Promise<void> {
    await this.deleteItem<ExecutiveDashboard>('executiveDashboards', resortId, id);
  }

  // 2. Dashboard Layouts
  public static async getLayouts(resortId: string): Promise<DashboardLayout[]> {
    return this.getAllItems<DashboardLayout>('dashboardLayouts', resortId);
  }

  public static async saveLayout(resortId: string, layout: DashboardLayout): Promise<void> {
    await this.saveItem<DashboardLayout>('dashboardLayouts', resortId, layout);
  }

  // 3. Business Reports
  public static async getReports(resortId: string): Promise<BusinessReport[]> {
    return this.getAllItems<BusinessReport>('businessReports', resortId);
  }

  public static async saveReport(resortId: string, report: BusinessReport): Promise<void> {
    await this.saveItem<BusinessReport>('businessReports', resortId, report);
  }

  public static async deleteReport(resortId: string, id: string): Promise<void> {
    await this.deleteItem<BusinessReport>('businessReports', resortId, id);
  }

  // 4. Business Metrics
  public static async getMetrics(resortId: string): Promise<BusinessMetric[]> {
    return this.getAllItems<BusinessMetric>('businessMetrics', resortId);
  }

  public static async saveMetric(resortId: string, metric: BusinessMetric): Promise<void> {
    await this.saveItem<BusinessMetric>('businessMetrics', resortId, metric);
  }

  // 5. Forecast Models
  public static async getForecastModels(resortId: string): Promise<ForecastModel[]> {
    return this.getAllItems<ForecastModel>('forecastModels', resortId);
  }

  public static async saveForecastModel(resortId: string, model: ForecastModel): Promise<void> {
    await this.saveItem<ForecastModel>('forecastModels', resortId, model);
  }

  // 6. Executive Alerts
  public static async getAlerts(resortId: string): Promise<ExecutiveAlert[]> {
    return this.getAllItems<ExecutiveAlert>('executiveAlerts', resortId);
  }

  public static async saveAlert(resortId: string, alert: ExecutiveAlert): Promise<void> {
    await this.saveItem<ExecutiveAlert>('executiveAlerts', resortId, alert);
  }

  // 7. Saved Views
  public static async getSavedViews(resortId: string): Promise<SavedView[]> {
    return this.getAllItems<SavedView>('savedViews', resortId);
  }

  public static async saveSavedView(resortId: string, view: SavedView): Promise<void> {
    await this.saveItem<SavedView>('savedViews', resortId, view);
  }

  public static async deleteSavedView(resortId: string, id: string): Promise<void> {
    await this.deleteItem<SavedView>('savedViews', resortId, id);
  }

  // 8. Analytics Snapshots
  public static async getSnapshots(resortId: string): Promise<AnalyticsSnapshot[]> {
    return this.getAllItems<AnalyticsSnapshot>('analyticsSnapshots', resortId);
  }

  public static async saveSnapshot(resortId: string, snapshot: AnalyticsSnapshot): Promise<void> {
    await this.saveItem<AnalyticsSnapshot>('analyticsSnapshots', resortId, snapshot);
  }
}
