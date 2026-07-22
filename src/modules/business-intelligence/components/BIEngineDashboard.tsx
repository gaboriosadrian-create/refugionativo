import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Share2, 
  Eye, 
  EyeOff, 
  Sliders, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Wrench, 
  Home, 
  ArrowUpDown, 
  FileSpreadsheet, 
  Clock, 
  Lock,
  CalendarDays,
  FileJson,
  UserCheck,
  Save
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { BIEngine } from '../services/BIEngine';
import { ReportService } from '../services/ReportService';
import { ExportService } from '../services/ExportService';
import { BIRepository } from '../repositories/BIRepositories';
import { 
  ExecutiveDashboard, 
  BusinessReport, 
  ForecastModel, 
  ExecutiveAlert, 
  BIWidget,
  AnalyticsSnapshot
} from '../types';
import { AuditService } from '../../../core/audit/AuditService';
import { Logger } from '../../../core/logger/Logger';

const COLORS = ['#054f3c', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const BIEngineDashboard: React.FC = () => {
  const { user, tenant, hasPermission, role } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparatives' | 'builder' | 'forecast' | 'alerts'>('dashboard');

  // Permissions check
  const canViewBI = hasPermission('bi.view') || role === 'SUPER_ADMIN' || role === 'owner';
  const canEditBI = hasPermission('bi.edit') || role === 'SUPER_ADMIN' || role === 'owner';
  const canViewReports = hasPermission('bi.reports') || role === 'SUPER_ADMIN' || role === 'owner';
  const canExportBI = hasPermission('bi.export') || role === 'SUPER_ADMIN' || role === 'owner';

  // Filters State
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  
  // Data Loading
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState<AnalyticsSnapshot['kpis'] | null>(null);
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null);
  const [alerts, setAlerts] = useState<ExecutiveAlert[]>([]);
  const [comparisons, setComparisons] = useState<{ current: any; previous: any } | null>(null);

  // Widget management state
  const [isAddingWidget, setIsAddingWidget] = useState<boolean>(false);
  const [availableMetricsToAdd, setAvailableMetricsToAdd] = useState<string[]>([]);

  // Report Builder State
  const [reportTitle, setReportTitle] = useState<string>('Nuevo Reporte de BI');
  const [selectedMetricsForReport, setSelectedMetricsForReport] = useState<string[]>(['revenue', 'occupancy', 'adr']);
  const [reportGroupBy, setReportGroupBy] = useState<'none' | 'channel' | 'segment' | 'property'>('none');
  const [reportSortBy, setReportSortBy] = useState<string>('rawValue');
  const [reportSortOrder, setReportSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isReportGenerated, setIsReportGenerated] = useState<boolean>(false);
  const [generatedReportData, setGeneratedReportData] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<BusinessReport[]>([]);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [scheduleEmail, setScheduleEmail] = useState<string>('');
  const [scheduleFreq, setScheduleFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Forecast state
  const [forecastTarget, setForecastTarget] = useState<'revenue' | 'occupancy' | 'demand'>('revenue');
  const [forecastDays, setForecastDays] = useState<number>(30);
  const [forecastModel, setForecastModel] = useState<ForecastModel | null>(null);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);

  // Custom views
  const [savedViewName, setSavedViewName] = useState<string>('');
  const [savedViewsList, setSavedViewsList] = useState<any[]>([]);

  // Initial Seed & Fetch trigger
  useEffect(() => {
    if (tenant && canViewBI) {
      fetchDashboardData();
      fetchSavedReports();
      fetchSavedViews();
    }
  }, [tenant, selectedProperty, selectedCity, selectedTimeframe, selectedRoomType, canViewBI]);

  // Handle forecast change
  useEffect(() => {
    if (tenant && canViewBI) {
      calculateForecast();
    }
  }, [tenant, forecastTarget, forecastDays, canViewBI]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const resortId = tenant || 'patagonia-refugio';
      const userId = user?.uid || 'guest';

      const filters = {
        propertyId: selectedProperty || undefined,
        city: selectedCity || undefined,
        roomType: selectedRoomType || undefined,
        timeframe: selectedTimeframe
      };

      const data = await BIEngine.getDashboardData(resortId, userId, filters);
      setKpis(data.kpis);
      setDashboard(data.dashboard);
      setAlerts(data.alerts);
      setComparisons(data.comparisons);

      // Audit Log for diagnostic dashboard access
      await AuditService.record(
        resortId,
        userId,
        'BI_DASHBOARD_ACCESS',
        'executiveDashboard',
        data.dashboard?.id || 'default',
        null,
        filters,
        user?.email
      );

    } catch (err) {
      Logger.error('[BIEngineDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedReports = async () => {
    try {
      const list = await BIRepository.getReports(tenant || 'patagonia-refugio');
      setSavedReports(list);
    } catch (err) {
      Logger.warn('[BIEngineDashboard] Error fetching reports:', err);
    }
  };

  const fetchSavedViews = async () => {
    try {
      const list = await BIRepository.getSavedViews(tenant || 'patagonia-refugio');
      setSavedViewsList(list);
    } catch (err) {
      Logger.warn('[BIEngineDashboard] Error fetching saved views:', err);
    }
  };

  const calculateForecast = async () => {
    setForecastLoading(true);
    try {
      const resortId = tenant || 'patagonia-refugio';
      const model = await BIEngine.getForecastProjections(resortId, forecastTarget, forecastDays);
      setForecastModel(model);
    } catch (err) {
      Logger.error('[BIEngineDashboard] Error calculating forecast:', err);
    } finally {
      setForecastLoading(false);
    }
  };

  // Re-order / position change helper
  const handleMoveWidget = async (widgetId: string, direction: 'up' | 'down') => {
    if (!dashboard || !canEditBI) return;
    const list = [...dashboard.widgets];
    const idx = list.findIndex(w => w.id === widgetId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap positions
    const tempPos = list[idx].position;
    list[idx].position = list[targetIdx].position;
    list[targetIdx].position = tempPos;

    // Sort list by position
    list.sort((a, b) => a.position - b.position);

    const updatedDashboard = {
      ...dashboard,
      widgets: list
    };

    setDashboard(updatedDashboard);
    await BIEngine.saveUserDashboard(tenant || 'patagonia-refugio', updatedDashboard);
  };

  const handleHideWidget = async (widgetId: string) => {
    if (!dashboard || !canEditBI) return;
    const list = dashboard.widgets.map(w => {
      if (w.id === widgetId) {
        return { ...w, visible: false };
      }
      return w;
    });

    const updatedDashboard = {
      ...dashboard,
      widgets: list
    };

    setDashboard(updatedDashboard);
    await BIEngine.saveUserDashboard(tenant || 'patagonia-refugio', updatedDashboard);
  };

  const handleAddWidget = async (metricKey: string) => {
    if (!dashboard || !canEditBI) return;
    
    const widgetTitles: Record<string, string> = {
      occupancy: 'Tasa de Ocupación',
      adr: 'Tarifa Promedio (ADR)',
      revpar: 'RevPAR Promedio',
      goppar: 'GOPPAR Ejecutivo',
      revenue: 'Ingresos Brutos',
      avgStay: 'Estadía Promedio',
      avgBookingWindow: 'Antelación de Reserva',
      cancellationRate: 'Tasa de Cancelación',
      repeatGuestRate: 'Huéspedes Recurrentes',
      guestLifetimeValue: 'Valor Ciclo de Vida (LTV)',
      housekeepingProductivity: 'Productividad de Housekeeping'
    };

    const newWidget: BIWidget = {
      id: `widget_custom_${Date.now()}`,
      type: 'kpi_card',
      title: widgetTitles[metricKey] || metricKey,
      metric: metricKey,
      size: 'sm',
      visible: true,
      position: dashboard.widgets.length + 1
    };

    const updatedDashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, newWidget]
    };

    setDashboard(updatedDashboard);
    await BIEngine.saveUserDashboard(tenant || 'patagonia-refugio', updatedDashboard);
    setIsAddingWidget(false);
  };

  const handleRestoreDefaultWidgets = async () => {
    if (!dashboard || !canEditBI) return;
    const defaultDash = {
      ...dashboard,
      widgets: [
        { id: 'w_1', type: 'kpi_card' as const, title: 'Ocupación Real', metric: 'occupancy', size: 'sm' as const, visible: true, position: 1 },
        { id: 'w_2', type: 'kpi_card' as const, title: 'Tarifa Promedio (ADR)', metric: 'adr', size: 'sm' as const, visible: true, position: 2 },
        { id: 'w_3', type: 'kpi_card' as const, title: 'RevPAR', metric: 'revpar', size: 'sm' as const, visible: true, position: 3 },
        { id: 'w_4', type: 'kpi_card' as const, title: 'GOPPAR Ejecutivo', metric: 'goppar', size: 'sm' as const, visible: true, position: 4 },
        { id: 'w_5', type: 'revenue_chart' as const, title: 'Curva de Ingresos Consolidados', metric: 'revenue', size: 'lg' as const, visible: true, position: 5 },
        { id: 'w_6', type: 'channel_distribution' as const, title: 'Distribución por Canal de Reservas', metric: 'otaDistribution', size: 'md' as const, visible: true, position: 6 },
        { id: 'w_7', type: 'segment_breakdown' as const, title: 'Segmentación de Huéspedes', metric: 'revenueBySegment', size: 'md' as const, visible: true, position: 7 },
        { id: 'w_8', type: 'property_comparison' as const, title: 'Comparativa de Complejos Multi-Propiedad', metric: 'revenueByProperty', size: 'md' as const, visible: true, position: 8 },
        { id: 'w_9', type: 'cleaning_productivity' as const, title: 'Eficiencia de Stay Operations', metric: 'housekeepingProductivity', size: 'sm' as const, visible: true, position: 9 }
      ]
    };
    setDashboard(defaultDash);
    await BIEngine.saveUserDashboard(tenant || 'patagonia-refugio', defaultDash);
  };

  const handleSaveView = async () => {
    if (!canEditBI || !savedViewName.trim()) return;
    try {
      const resortId = tenant || 'patagonia-refugio';
      const view = {
        id: `view_${Date.now()}`,
        resortId,
        userId: user?.uid || 'guest',
        name: savedViewName,
        path: '/admin/bi',
        state: { selectedProperty, selectedCity, selectedTimeframe, selectedRoomType },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await BIRepository.saveSavedView(resortId, view);
      setSavedViewName('');
      fetchSavedViews();
      alert('Vista guardada exitosamente');
    } catch (err) {
      Logger.error('[BIEngineDashboard] Error saving view:', err);
    }
  };

  const handleLoadSavedView = (view: any) => {
    if (view.state) {
      setSelectedProperty(view.state.selectedProperty || '');
      setSelectedCity(view.state.selectedCity || '');
      setSelectedTimeframe(view.state.selectedTimeframe || 'month');
      setSelectedRoomType(view.state.selectedRoomType || '');
    }
  };

  // Report Builder Runner
  const handleGenerateReport = async () => {
    if (!canViewReports || !kpis) return;
    
    const fakeReport: BusinessReport = {
      id: `temp_${Date.now()}`,
      resortId: tenant || 'patagonia-refugio',
      userId: user?.uid || 'guest',
      title: reportTitle,
      reportType: 'custom',
      metrics: selectedMetricsForReport,
      filters: {
        propertyId: selectedProperty || undefined,
        roomType: selectedRoomType || undefined
      },
      savedAt: new Date().toISOString()
    };

    if (reportGroupBy !== 'none') {
      fakeReport.groupBy = reportGroupBy as any;
      // map group by elements
      if (reportGroupBy === 'channel') {
        fakeReport.metrics = ['revenueByChannel'];
      } else if (reportGroupBy === 'segment') {
        fakeReport.metrics = ['revenueBySegment'];
      } else if (reportGroupBy === 'property') {
        fakeReport.metrics = ['revenueByProperty'];
      }
    }

    if (reportSortBy) {
      fakeReport.sortBy = reportSortBy;
      fakeReport.sortOrder = reportSortOrder;
    }

    const reportOutput = await ReportService.runReport(tenant || 'patagonia-refugio', fakeReport, kpis);
    setGeneratedReportData(reportOutput);
    setIsReportGenerated(true);
  };

  const handleSaveReport = async () => {
    if (!canEditBI || !kpis) return;
    try {
      const resortId = tenant || 'patagonia-refugio';
      const newReport: BusinessReport = {
        id: `report_${Date.now()}`,
        resortId,
        userId: user?.uid || 'guest',
        title: reportTitle,
        reportType: 'custom',
        metrics: selectedMetricsForReport,
        filters: {
          propertyId: selectedProperty || undefined,
          roomType: selectedRoomType || undefined
        },
        savedAt: new Date().toISOString()
      };
      await BIRepository.saveReport(resortId, newReport);
      fetchSavedReports();
      alert('Reporte guardado exitosamente');
    } catch (err) {
      Logger.error('[BIEngineDashboard] Error saving report:', err);
    }
  };

  const handleScheduleReport = async (reportId: string) => {
    if (!canEditBI || !scheduleEmail.trim()) return;
    try {
      await ReportService.scheduleReport(tenant || 'patagonia-refugio', reportId, scheduleFreq, scheduleEmail);
      setIsScheduling(false);
      setScheduleEmail('');
      fetchSavedReports();
      alert(`Reporte programado exitosamente para enviarse con frecuencia ${scheduleFreq}`);
    } catch (err) {
      Logger.error('[BIEngineDashboard] Error scheduling report:', err);
    }
  };

  // Export functions
  const handleExport = (format: 'csv' | 'json' | 'excel' | 'pdf') => {
    if (!canExportBI || !generatedReportData) return;
    ExportService.exportData(generatedReportData, format, reportTitle);
  };

  const handleAlertAction = async (alertObj: ExecutiveAlert) => {
    try {
      alertObj.resolved = true;
      await BIRepository.saveAlert(tenant || 'patagonia-refugio', alertObj);
      
      // Save audit log
      await AuditService.record(
        tenant || 'patagonia-refugio',
        user?.uid || 'system',
        `RESOLVE_ALERT_${alertObj.metricName.toUpperCase()}`,
        'executiveAlert',
        alertObj.id,
        null,
        { action: 'applied_recommendation', recommendation: alertObj.recommendation },
        user?.email
      );

      // Refresh data
      fetchDashboardData();
      alert('Recomendación ejecutada exitosamente y registrada en la bitácora de auditoría.');
    } catch (err) {
      Logger.error('[BIEngineDashboard] Error processing alert action:', err);
    }
  };

  // Helper formatting values for standard KPI tiles
  const formatVal = (key: string, val: number) => {
    if (['revenue', 'netRevenue', 'adr', 'revpar', 'goppar', 'maintenanceCost', 'guestLifetimeValue'].includes(key)) {
      return `$${val.toLocaleString('es-AR')}`;
    }
    if (['occupancy', 'cancellationRate', 'repeatGuestRate', 'housekeepingProductivity'].includes(key)) {
      return `${val}%`;
    }
    if (key === 'avgStay') {
      return `${val} noches`;
    }
    if (key === 'avgBookingWindow') {
      return `${val} días`;
    }
    if (key === 'avgCleaningTime') {
      return `${val} mins`;
    }
    return String(val);
  };

  const renderKPIArrowAndTrend = (key: string) => {
    if (!comparisons) return null;
    const curr = comparisons.current[key];
    const prev = comparisons.previous[key];
    if (curr === undefined || prev === undefined || prev === 0) return null;

    const pct = Math.round(((curr - prev) / prev) * 100);
    const isUp = pct >= 0;
    const isGood = ['occupancy', 'revenue', 'netRevenue', 'adr', 'revpar', 'goppar', 'repeatGuestRate', 'guestLifetimeValue', 'housekeepingProductivity'].includes(key) ? isUp : !isUp;

    return (
      <div className={`flex items-center gap-1.5 text-[11px] font-bold mt-2 ${isGood ? 'text-emerald-600' : 'text-rose-500'}`}>
        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>{isUp ? '+' : ''}{pct}% vs período anterior</span>
      </div>
    );
  };

  // Security Access Denied block
  if (!canViewBI) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-line shadow-sm min-h-[450px]">
        <Lock className="w-14 h-14 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-800 mb-1.5">Acceso Restringido</h3>
        <p className="text-xs text-muted max-w-md text-center mb-6">
          Su rol actual no posee permisos suficientes para acceder a la plataforma de Business Intelligence corporativa. Por favor solicite asignación del permiso <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">bi.view</code> a su administrador.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted font-sans border-t border-line pt-4 w-full justify-center">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Políticas de Seguridad: Enterprise RBAC v2.1 Activas</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* 1. Header & Filters Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
        <div className="flex max-md:flex-col justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-black text-slate-850 tracking-tight">StayFlow Business Intelligence</h2>
            </div>
            <p className="text-xs text-slate-500">
              Plataforma Ejecutiva Integrada de Decisiones Estratégicas y KPIs Operativos
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={fetchDashboardData}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition"
              title="Sincronizar BI Engine"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {canEditBI && (
              <button 
                onClick={handleRestoreDefaultWidgets}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Restaurar Panel</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters bar representing Enterprise Multi-Property Analytics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> Complejo / Propiedad
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todos los Complejos (Multi-Property)</option>
              <option value="1">Cabañas del Refugio</option>
              <option value="2">Mendoza Vineyards Domos</option>
              <option value="3">Patagonia Lakeside</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ciudad / Región</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todas las Regiones</option>
              <option value="patagonia">Patagonia, Argentina</option>
              <option value="mendoza">Mendoza, Argentina</option>
              <option value="bariloche">Bariloche, Argentina</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Período Analítico
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
            >
              <option value="today">Hoy vs Ayer</option>
              <option value="yesterday">Ayer vs Antier</option>
              <option value="week">Esta Semana vs Anterior</option>
              <option value="month">Este Mes vs Anterior</option>
              <option value="quarter">Este Trimestre vs Anterior</option>
              <option value="year">Este Año vs Anterior</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Unidad</label>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todas las Categorías</option>
              <option value="cabin">Cabañas</option>
              <option value="glamping_dome">Domos Glamping</option>
              <option value="hotel_room">Habitaciones de Hotel</option>
            </select>
          </div>
        </div>

        {/* Saved Views quick selection bar */}
        {savedViewsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Vistas Guardadas:</span>
            {savedViewsList.map((v) => (
              <button
                key={v.id}
                onClick={() => handleLoadSavedView(v)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition"
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* View Custom Views Creator */}
        {canEditBI && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Nombre para guardar vista actual..."
              value={savedViewName}
              onChange={(e) => setSavedViewName(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl max-w-xs focus:outline-none"
            />
            <button
              onClick={handleSaveView}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Guardar Vista
            </button>
          </div>
        )}
      </div>

      {/* 2. LIVE EXECUTIVE ALERTS ANOMALY FEED */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>ALERTAS EJECUTIVAS DETECTADAS POR BI ENGINE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 text-xs">{alert.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${alert.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{alert.description}</p>
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-lg font-medium leading-relaxed">
                    <strong>Recomendación BI:</strong> {alert.recommendation}
                  </p>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleAlertAction(alert)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[10px] rounded-lg transition"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Ejecutar Recomendación</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. NAVIGATION TABS */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-xs font-bold transition shrink-0 border-b-2 ${activeTab === 'dashboard' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Panel Ejecutivo
        </button>
        <button
          onClick={() => setActiveTab('comparatives')}
          className={`px-4 py-2 text-xs font-bold transition shrink-0 border-b-2 ${activeTab === 'comparatives' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Comparativas Temporales
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 text-xs font-bold transition shrink-0 border-b-2 ${activeTab === 'builder' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Report Builder & Export
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2 text-xs font-bold transition shrink-0 border-b-2 ${activeTab === 'forecast' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Proyecciones & Forecasts
        </button>
      </div>

      {/* 4. CONTENT SECTIONS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-line shadow-sm min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-muted font-semibold font-sans">Compilando e indexando métricas ejecutivas en BI Engine...</p>
        </div>
      ) : (
        <>
          {/* TAB: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && kpis && dashboard && (
            <div className="flex flex-col gap-6">
              
              {/* Dynamic Action: Add widget */}
              {canEditBI && (
                <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-600 font-semibold">Configure su Panel de Control</span>
                  <div className="flex items-center gap-1.5">
                    {isAddingWidget ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleAddWidget(e.target.value);
                          }}
                          className="text-xs bg-white border border-slate-200 rounded p-1"
                        >
                          <option value="">Seleccione Métrica...</option>
                          <option value="occupancy">Ocupación</option>
                          <option value="adr">Tarifa Promedio (ADR)</option>
                          <option value="revpar">RevPAR</option>
                          <option value="goppar">GOPPAR</option>
                          <option value="avgStay">Estadía Promedio</option>
                          <option value="avgBookingWindow">Antelación Reserva</option>
                          <option value="cancellationRate">Cancelaciones</option>
                          <option value="repeatGuestRate">Clientes Recurrentes</option>
                          <option value="guestLifetimeValue">LTV de Huésped</option>
                        </select>
                        <button onClick={() => setIsAddingWidget(false)} className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded">Cancelar</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingWidget(true)}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Widget</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Loop and Render Configured KPI cards (size: sm) */}
                {dashboard.widgets.filter(w => w.visible && w.type === 'kpi_card').map((w) => {
                  const metricValue = kpis[w.metric as keyof typeof kpis];
                  if (metricValue === undefined || typeof metricValue === 'object') return null;

                  return (
                    <div key={w.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative group">
                      
                      {/* Widget Controls on Hover */}
                      {canEditBI && (
                        <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 bg-white p-1 rounded-lg shadow border border-slate-100">
                          <button onClick={() => handleMoveWidget(w.id, 'up')} className="p-0.5 text-slate-400 hover:text-slate-700 transition" title="Mover Arriba"><TrendingUp className="w-3 h-3" /></button>
                          <button onClick={() => handleMoveWidget(w.id, 'down')} className="p-0.5 text-slate-400 hover:text-slate-700 transition" title="Mover Abajo"><TrendingDown className="w-3 h-3" /></button>
                          <button onClick={() => handleHideWidget(w.id)} className="p-0.5 text-rose-400 hover:text-rose-700 transition" title="Ocultar"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}

                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{w.title}</span>
                        <div className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                          {formatVal(w.metric, Number(metricValue))}
                        </div>
                      </div>
                      {renderKPIArrowAndTrend(w.metric)}
                    </div>
                  );
                })}
              </div>

              {/* Charts Bento Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 2. Area chart representing revenue Curve */}
                {dashboard.widgets.some(w => w.visible && w.type === 'revenue_chart') && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative group min-h-[350px]">
                    
                    {canEditBI && (
                      <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 bg-white p-1 rounded-lg shadow border border-slate-100">
                        <button onClick={() => handleHideWidget('w_5')} className="p-0.5 text-rose-400 hover:text-rose-700 transition"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Curva de Ingresos Consolidados</span>
                        <h4 className="text-sm font-extrabold text-slate-800">Trayectoria Mensual de Facturación</h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">Consolidado</span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { date: 'Semana 1', 'Ingresos': kpis.revenue * 0.18, 'Neto': kpis.netRevenue * 0.18 },
                          { date: 'Semana 2', 'Ingresos': kpis.revenue * 0.42, 'Neto': kpis.netRevenue * 0.41 },
                          { date: 'Semana 3', 'Ingresos': kpis.revenue * 0.72, 'Neto': kpis.netRevenue * 0.71 },
                          { date: 'Semana 4', 'Ingresos': kpis.revenue, 'Neto': kpis.netRevenue }
                        ]}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#054f3c" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#054f3c" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="Ingresos" stroke="#054f3c" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                          <Area type="monotone" dataKey="Neto" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 3. Pie chart representing channel distribution */}
                {dashboard.widgets.some(w => w.visible && w.type === 'channel_distribution') && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative group min-h-[350px]">
                    
                    {canEditBI && (
                      <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 bg-white p-1 rounded-lg shadow border border-slate-100">
                        <button onClick={() => handleHideWidget('w_6')} className="p-0.5 text-rose-400 hover:text-rose-700 transition"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distribución por Canal de Reservas</span>
                        <h4 className="text-sm font-extrabold text-slate-800">Análisis Comparativo OTA vs Directo</h4>
                      </div>
                    </div>

                    <div className="h-64 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(kpis.otaDistribution).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {Object.entries(kpis.otaDistribution).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Secondary Visual Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 4. Bar chart representing segment break down */}
                {dashboard.widgets.some(w => w.visible && w.type === 'segment_breakdown') && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ingresos por Segmento de Cliente</span>
                    </div>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(kpis.revenueBySegment).map(([name, value]) => ({ name, value }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                          <Bar dataKey="value" fill="#054f3c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 5. Bar chart representing multi property comparative */}
                {dashboard.widgets.some(w => w.visible && w.type === 'property_comparison') && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Desempeño Multi-Propiedad</span>
                    </div>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(kpis.revenueByProperty).map(([name, value]) => ({ name, value }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: COMPARATIVES */}
          {activeTab === 'comparatives' && kpis && comparisons && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-base font-black text-slate-800">Matriz de Comparativas Temporales</h3>
                <p className="text-xs text-slate-500">Contraste de métricas clave versus el período analítico anterior inmediato</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(kpis).filter(k => typeof kpis[k as keyof typeof kpis] !== 'object').map((key) => {
                  const curr = comparisons.current[key];
                  const prev = comparisons.previous[key];
                  if (curr === undefined || prev === undefined) return null;

                  const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
                  const isUp = pct >= 0;

                  return (
                    <div key={key} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <div className="text-lg font-black text-slate-800 mt-0.5">{formatVal(key, curr)}</div>
                        <div className="text-[10px] text-slate-500 mt-1">Anterior: {formatVal(key, prev)}</div>
                      </div>

                      <div className={`flex flex-col items-end ${isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        <span className="text-xs font-bold mt-1">{isUp ? '+' : ''}{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: REPORT BUILDER */}
          {activeTab === 'builder' && kpis && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Report Builder Controls Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-800">Constructor de Reportes</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Título del Reporte</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Seleccionar Métricas</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-200 p-2.5 rounded-xl">
                    {[
                      { key: 'revenue', label: 'Ingresos Brutos' },
                      { key: 'netRevenue', label: 'Ingresos Netos' },
                      { key: 'occupancy', label: 'Ocupación' },
                      { key: 'adr', label: 'ADR' },
                      { key: 'revpar', label: 'RevPAR' },
                      { key: 'goppar', label: 'GOPPAR' },
                      { key: 'avgStay', label: 'Estadía Promedio' },
                      { key: 'avgBookingWindow', label: 'Antelación Reserva' },
                      { key: 'cancellationRate', label: 'Cancelaciones' },
                      { key: 'repeatGuestRate', label: 'Clientes Recurrentes' },
                      { key: 'guestLifetimeValue', label: 'LTV Huésped' },
                      { key: 'housekeepingProductivity', label: 'Op. Limpieza' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMetricsForReport.includes(item.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMetricsForReport([...selectedMetricsForReport, item.key]);
                            } else {
                              setSelectedMetricsForReport(selectedMetricsForReport.filter(k => k !== item.key));
                            }
                          }}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Agrupar por (Group By)</label>
                  <select
                    value={reportGroupBy}
                    onChange={(e) => setReportGroupBy(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="none">Sin Agrupamiento (General)</option>
                    <option value="channel">Por Canal de Reservas</option>
                    <option value="segment">Por Segmento de Huésped</option>
                    <option value="property">Por Propiedad / Complejo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Ordenar por</label>
                    <select
                      value={reportSortBy}
                      onChange={(e) => setReportSortBy(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    >
                      <option value="rawValue">Valor Numérico</option>
                      <option value="Métrica">Nombre de Métrica</option>
                      <option value="Grupo">Grupo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Dirección</label>
                    <select
                      value={reportSortOrder}
                      onChange={(e) => setReportSortOrder(e.target.value as any)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    >
                      <option value="desc">Descendente</option>
                      <option value="asc">Ascendente</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleGenerateReport}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Ejecutar Reporte</span>
                  </button>
                  {canEditBI && (
                    <button
                      onClick={handleSaveReport}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Reporte</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Report Outputs & Exports Panel */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                {isReportGenerated && generatedReportData ? (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-850">{reportTitle}</h4>
                        <p className="text-[10px] text-slate-400">Total Filas: {generatedReportData.summary.totalRows} · Generación: {generatedReportData.summary.generationTimeMs}ms</p>
                      </div>

                      {canExportBI && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleExport('pdf')}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
                            title="Exportar PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => handleExport('csv')}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
                            title="Exportar CSV"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>CSV</span>
                          </button>
                          <button
                            onClick={() => handleExport('excel')}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
                            title="Exportar Excel"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={() => handleExport('json')}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
                            title="Exportar JSON"
                          >
                            <FileJson className="w-3.5 h-3.5 text-slate-600" />
                            <span>JSON</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto max-h-96 border border-slate-150 rounded-xl">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-150">
                          <tr>
                            {generatedReportData.columns.map((col: string) => (
                              <th key={col} className="p-3 text-left">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {generatedReportData.rows.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {generatedReportData.columns.map((col: string) => (
                                <td key={col} className="p-3">{row[col]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Report Scheduling Block */}
                    {canEditBI && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-150 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span>Programar Envíos Automáticos</span>
                        </div>
                        
                        {isScheduling ? (
                          <div className="flex max-sm:flex-col gap-2 items-center">
                            <input
                              type="email"
                              placeholder="correo@ejemplo.com"
                              value={scheduleEmail}
                              onChange={(e) => setScheduleEmail(e.target.value)}
                              className="text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none flex-1"
                            />
                            <select
                              value={scheduleFreq}
                              onChange={(e) => setScheduleFreq(e.target.value as any)}
                              className="text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                            >
                              <option value="daily">Diario</option>
                              <option value="weekly">Semanal</option>
                              <option value="monthly">Mensual</option>
                            </select>
                            <button
                              onClick={() => handleScheduleReport('temp_report_id')}
                              className="px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800"
                            >
                              Programar
                            </button>
                            <button
                              onClick={() => setIsScheduling(false)}
                              className="text-xs text-slate-400 hover:text-slate-600 px-2"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsScheduling(true)}
                            className="text-xs bg-white border border-slate-200 p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition max-w-xs font-semibold"
                          >
                            Configurar Programación de Reportes
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 min-h-[300px]">
                    <FileText className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-xs font-bold">Configure los filtros del menú izquierdo y presione "Ejecutar Reporte"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: FORECAST PROJECTIONS */}
          {activeTab === 'forecast' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-850">Módulo de Proyecciones de Demanda & Forecast</h3>
                  <p className="text-xs text-slate-500">
                    Proyección predictiva a 30 días calculada en base a la estacionalidad e históricos de facturación
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={forecastTarget}
                    onChange={(e) => setForecastTarget(e.target.value as any)}
                    className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="revenue">Previsión de Ingresos</option>
                    <option value="occupancy">Previsión de Ocupación</option>
                    <option value="demand">Previsión de Demanda General</option>
                  </select>

                  <select
                    value={forecastDays}
                    onChange={(e) => setForecastDays(Number(e.target.value))}
                    className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="7">Próximos 7 días</option>
                    <option value="15">Próximos 15 días</option>
                    <option value="30">Próximos 30 días</option>
                  </select>
                </div>
              </div>

              {forecastLoading ? (
                <div className="flex flex-col items-center justify-center p-12 min-h-[250px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
                  <p className="text-xs text-muted font-semibold font-sans">Compilando escenarios predictivos estacionales...</p>
                </div>
              ) : (
                forecastModel && (
                  <div className="flex flex-col gap-6">
                    {/* Forecast metadata banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Modelo Predictivo Activado</span>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">Seasonal Naive Smoothing (Estacional)</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Período de Históricos</span>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">{forecastModel.historicalPeriodDays} días analizados</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Puntuación de Confianza</span>
                        <div className="text-sm font-bold text-emerald-700 mt-0.5">{forecastModel.confidenceScore}% (Nivel Alto)</div>
                      </div>
                    </div>

                    {/* Area forecast chart */}
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forecastModel.projections.map(p => ({
                          date: p.date,
                          'Optimista (p90)': p.p90,
                          'Previsión (p50)': p.p50,
                          'Pesimista (p10)': p.p10
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="Optimista (p90)" stroke="#10b981" fill="#e6f7f0" opacity={0.6} />
                          <Area type="monotone" dataKey="Previsión (p50)" stroke="#054f3c" fill="#054f3c" strokeWidth={2.5} fillOpacity={0.15} />
                          <Area type="monotone" dataKey="Pesimista (p10)" stroke="#f59e0b" fill="#fffbeb" opacity={0.4} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <p className="text-[10px] text-muted leading-normal italic text-center max-w-lg mx-auto">
                      * Las proyecciones de StayFlow BI calculan la estacionalidad histórica mediante modelos matemáticos suavizados. Para habilitar predicciones neuronales profundas (IA Neural Network), active el módulo en configuración general.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

        </>
      )}

    </div>
  );
};
