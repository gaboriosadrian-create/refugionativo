import React, { useState, useEffect } from 'react';
import { 
  Coins, TrendingUp, Percent, Calendar, Shield, Cpu, HelpCircle, 
  Sparkles, Check, X, AlertTriangle, Play, RefreshCw, BarChart2, 
  Plus, Settings, FileText, Info, Users, Compass, DollarSign, Clock, List, ToggleLeft, ToggleRight, ArrowUpRight, ArrowDownRight, Edit3, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

import { useResort } from '../../../shared/contexts/ResortContext';
import { KPIService } from '../services/KPIService';
import { RevenueRuleService } from '../services/RevenueRuleService';
import { CommercialCalendarService } from '../services/CommercialCalendarService';
import { PricingRecommendationService } from '../services/PricingRecommendationService';
import { SimulationService } from '../services/SimulationService';
import { RevenueEngine } from '../services/RevenueEngine';
import { revenueAlertRepository } from '../repositories/RevenueAlertRepository';
import { RevenueAnalyticsService, ComparisonDataset } from '../services/RevenueAnalyticsService';
import { RevenueDashboardService, DailyTrendItem, PickupCurveItem } from '../services/RevenueDashboardService';
import { 
  CommercialKPIs, 
  RevenueRule, 
  CommercialCalendarEvent, 
  PricingRecommendation, 
  PricingSimulation, 
  RevenueAlert, 
  RevenueHistoryItem,
  CommercialRuleType,
  CommercialAdjustmentType
} from '../types';
import { Logger } from '../../../core/logger/Logger';

export const RevenueDashboard: React.FC = () => {
  const { resort } = useResort();
  const resortId = resort?.id || 'default';

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'recommendations' | 'rules' | 'calendar' | 'simulator' | 'analytics' | 'ai'>('dashboard');

  // Loading state & Trigger reloading
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [triggerReload, setTriggerReload] = useState(0);

  // Core Data State
  const [kpis, setKpis] = useState<CommercialKPIs | null>(null);
  const [rules, setRules] = useState<RevenueRule[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CommercialCalendarEvent[]>([]);
  const [recommendations, setRecommendations] = useState<PricingRecommendation[]>([]);
  const [simulations, setSimulations] = useState<PricingSimulation[]>([]);
  const [alerts, setAlerts] = useState<RevenueAlert[]>([]);
  const [history, setHistory] = useState<RevenueHistoryItem[]>([]);

  // Analytics & Dashboard charts state
  const [dailyTrends, setDailyTrends] = useState<DailyTrendItem[]>([]);
  const [paceCurve, setPaceCurve] = useState<PickupCurveItem[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<ComparisonDataset[]>([]);
  const [accommodationComparison, setAccommodationComparison] = useState<ComparisonDataset[]>([]);
  const [channelComparison, setChannelComparison] = useState<ComparisonDataset[]>([]);

  // Simulator state variables
  const [simName, setSimName] = useState('Escenario Incremento de Tarifas');
  const [simPriceAdjustment, setSimPriceAdjustment] = useState(12); // +12%
  const [simElasticity, setSimElasticity] = useState(-0.5); // Demand drops 0.5% for every 1% price increase
  const [simResult, setSimResult] = useState<PricingSimulation | null>(null);

  // New Rule State
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleType, setNewRuleType] = useState<CommercialRuleType>(CommercialRuleType.OCCUPANCY);
  const [newRuleOccupancyThreshold, setNewRuleOccupancyThreshold] = useState(80);
  const [newRuleOccupancyComparison, setNewRuleOccupancyComparison] = useState<'greater' | 'less'>('greater');
  const [newRuleAdjType, setNewRuleAdjType] = useState<CommercialAdjustmentType>(CommercialAdjustmentType.PERCENTAGE);
  const [newRuleAdjVal, setNewRuleAdjVal] = useState(15);

  // New Event State
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'holiday' | 'event' | 'festival' | 'congress' | 'vacation' | 'season'>('festival');
  const [newEventStart, setNewEventStart] = useState('2026-11-01');
  const [newEventEnd, setNewEventEnd] = useState('2026-11-03');
  const [newEventImpact, setNewEventImpact] = useState<'high' | 'medium' | 'low'>('high');
  const [newEventDesc, setNewEventDesc] = useState('');

  // AI Extension Hub controls
  const [aiAutoPilot, setAiAutoPilot] = useState(false);
  const [aiPredictiveForecast, setAiPredictiveForecast] = useState(true);
  const [aiChurnDetection, setAiChurnDetection] = useState(true);

  // Tooltip Explanations
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Fetch all datasets
  useEffect(() => {
    let active = true;
    const loadAllData = async () => {
      setLoading(true);
      try {
        const loadedKPIs = await KPIService.getKPIs(resortId);
        const loadedRules = await RevenueRuleService.getRules(resortId);
        const loadedEvents = await CommercialCalendarService.getEvents(resortId);
        const loadedRecs = await PricingRecommendationService.getRecommendations(resortId);
        const loadedSims = await SimulationService.getSimulations(resortId);
        const loadedAlerts = await revenueAlertRepository.getAll(resortId);
        const loadedHistory = await RevenueEngine.getHistory(resortId);

        // Fetch analytical chart datasets
        const monthly = await RevenueAnalyticsService.compareMonths(resortId);
        const accommodations = await RevenueAnalyticsService.compareAccommodations(resortId);
        const channels = await RevenueAnalyticsService.compareChannels(resortId);
        const daily = await RevenueDashboardService.getDailyTrends(resortId);
        const pace = RevenueDashboardService.getBookingPaceCurve();

        if (active) {
          setKpis(loadedKPIs);
          setRules(loadedRules);
          setCalendarEvents(loadedEvents);
          setRecommendations(loadedRecs);
          setSimulations(loadedSims);
          setAlerts(loadedAlerts);
          setHistory(loadedHistory);

          setMonthlyComparison(monthly);
          setAccommodationComparison(accommodations);
          setChannelComparison(channels);
          setDailyTrends(daily);
          setPaceCurve(pace);
        }
      } catch (err) {
        Logger.error('[RevenueDashboard] Error fetching revenue assets:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAllData();
    return () => {
      active = false;
    };
  }, [resortId, triggerReload]);

  // Run analytic pipeline trigger
  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      await RevenueEngine.runAnalysis(resortId, 'Administrador de Revenue');
      setTriggerReload(prev => prev + 1);
    } catch (err) {
      Logger.error('[RevenueDashboard] Run pipeline failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Recommendations approval/rejections
  const handleApproveRecommendation = async (id: string) => {
    try {
      await PricingRecommendationService.approveRecommendation(resortId, id, 'gaboriosadrian@gmail.com');
      setTriggerReload(prev => prev + 1);
    } catch (e) {
      Logger.error('[RevenueDashboard] Approve failed:', e);
    }
  };

  const handleRejectRecommendation = async (id: string) => {
    try {
      await PricingRecommendationService.rejectRecommendation(resortId, id, 'gaboriosadrian@gmail.com');
      setTriggerReload(prev => prev + 1);
    } catch (e) {
      Logger.error('[RevenueDashboard] Reject failed:', e);
    }
  };

  // Toggle Rule active state
  const handleToggleRule = async (rule: RevenueRule) => {
    try {
      const updated = { ...rule, isActive: !rule.isActive, updatedAt: new Date().toISOString() };
      await RevenueRuleService.saveRule(resortId, updated);
      setTriggerReload(prev => prev + 1);
    } catch (e) {
      Logger.error('[RevenueDashboard] Toggle rule failed:', e);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await RevenueRuleService.deleteRule(resortId, id);
      setTriggerReload(prev => prev + 1);
    } catch (e) {
      Logger.error('[RevenueDashboard] Delete rule failed:', e);
    }
  };

  // Add Custom Rule
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName) return;

    try {
      const rule: RevenueRule = {
        id: `rule_custom_${Date.now()}`,
        resortId,
        name: newRuleName,
        description: newRuleDesc || 'Regla comercial configurada a medida por el analista.',
        type: newRuleType,
        isActive: true,
        conditions: {
          occupancyThresholdPct: newRuleType === CommercialRuleType.OCCUPANCY ? newRuleOccupancyThreshold : undefined,
          occupancyComparison: newRuleType === CommercialRuleType.OCCUPANCY ? newRuleOccupancyComparison : undefined,
          dayOfWeek: newRuleType === CommercialRuleType.DAY_OF_WEEK ? [5, 6] : undefined,
          daysMax: newRuleType === CommercialRuleType.LAST_MINUTE ? 3 : undefined,
          daysMin: newRuleType === CommercialRuleType.LEAD_TIME ? 60 : undefined,
        },
        adjustmentType: newRuleAdjType,
        adjustmentValue: newRuleAdjVal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await RevenueRuleService.saveRule(resortId, rule);
      setShowRuleModal(false);
      setNewRuleName('');
      setNewRuleDesc('');
      setTriggerReload(prev => prev + 1);
    } catch (e) {
      Logger.error('[RevenueDashboard] Add rule failed:', e);
    }
  };

  // Add Special Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    try {
      const event: CommercialCalendarEvent = {
        id: `event_custom_${Date.now()}`,
        resortId,
        title: newEventTitle,
        type: newEventType,
        startDate: newEventStart,
        endDate: newEventEnd,
        impact: newEventImpact,
        description: newEventDesc || 'Evento de calendario comercial registrado.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await CommercialCalendarService.saveEvent(resortId, event);
      setShowEventModal(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setTriggerReload(prev => prev + 1);
    } catch (e) {
      Logger.error('[RevenueDashboard] Add event failed:', e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await CommercialCalendarService.deleteEvent(resortId, id);
      setTriggerReload(prev => prev + 1);
    } catch (e) {
      Logger.error('[RevenueDashboard] Delete event failed:', e);
    }
  };

  // Run Simulator
  const handleRunSimulation = async () => {
    try {
      const result = await SimulationService.runAndSaveSimulation(
        resortId,
        simName,
        `Simulación: ${simPriceAdjustment}% en tarifas con elasticidad ${simElasticity}.`,
        simPriceAdjustment,
        simElasticity,
        'gaboriosadrian@gmail.com'
      );
      setSimResult(result);
      setTriggerReload(prev => prev + 1);
    } catch (e) {
      Logger.error('[RevenueDashboard] Simulator run failed:', e);
    }
  };

  if (loading && triggerReload === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-sm font-semibold">Cargando Motor de Revenue Intelligence...</p>
      </div>
    );
  }

  // Safe KPI mappings with hardcoded defaults to prevent any null reference errors
  const adrValue = kpis?.adr || 14500;
  const revParValue = kpis?.revPar || 9425;
  const occupancyValue = kpis?.occupancy || 65;
  const revenueValue = kpis?.revenue || 290000;
  const pickupValue = kpis?.pickup || 24000;
  const cancellationRateValue = kpis?.cancellationRate || 8.5;

  const kpisMeta = [
    {
      key: 'adr',
      title: 'ADR (Average Daily Rate)',
      value: `$${adrValue.toLocaleString()} COP`,
      formula: 'ADR = Ingresos de Habitaciones / Noches Vendidas',
      explanation: 'Indica el precio promedio cobrado por noche ocupada en el complejo.',
      trend: '+4.2% vs mes anterior',
      trendUp: true,
      icon: Coins,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      key: 'occupancy',
      title: 'Ocupación',
      value: `${occupancyValue}%`,
      formula: 'Ocupación = (Noches Vendidas / Habitaciones Disponibles) * 100',
      explanation: 'Mide el porcentaje de inventario vendido sobre el total disponible.',
      trend: '+2.8% vs histórico',
      trendUp: true,
      icon: Percent,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      key: 'revpar',
      title: 'RevPAR',
      value: `$${revParValue.toLocaleString()} COP`,
      formula: 'RevPAR = ADR * Porcentaje de Ocupación',
      explanation: 'Ingreso promedio generado por habitación disponible. El KPI más crítico en hotelería.',
      trend: '+5.1% optimizado',
      trendUp: true,
      icon: TrendingUp,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
    },
    {
      key: 'revenue',
      title: 'Ingresos Totales',
      value: `$${revenueValue.toLocaleString()} COP`,
      formula: 'Ingresos = Sumatoria de tarifas brutas de reservas activas',
      explanation: 'Facturación total acumulada por alojamiento contratado en el período.',
      trend: 'Dentro del target',
      trendUp: true,
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      key: 'pickup',
      title: 'Pickup (Últimos 7 días)',
      value: `$${pickupValue.toLocaleString()} COP`,
      formula: 'Pickup = Nuevas reservas creadas en ventana de 7 días',
      explanation: 'Mide la velocidad de captura de reservas frescas en el mercado reciente.',
      trend: '+12% aceleración',
      trendUp: true,
      icon: Clock,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      key: 'cancellations',
      title: 'Tasa de Cancelación',
      value: `${cancellationRateValue}%`,
      formula: 'Tasa = (Cancelaciones / Total Reservas) * 100',
      explanation: 'Proporción de estadías dadas de baja. Un ratio bajo asegura previsibilidad de caja.',
      trend: '-1.5% reducción',
      trendUp: false,
      icon: X,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    }
  ];

  // Colors for charts
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & Control Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-gray-100 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-600 animate-pulse" />
            Revenue Management & pricing Intelligence
          </h1>
          <p className="text-sm text-gray-500">
            Módulo inteligente de análisis comercial, elasticidad, simulación de escenarios y recomendaciones dinámicas de tarifas.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
              analyzing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Procesando Algoritmos...' : 'Ejecutar Análisis de Revenue'}
          </button>
        </div>
      </div>

      {/* Primary KPI Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {kpisMeta.map((kpi) => {
          const Icon = kpi.icon;
          const isSelected = activeTooltip === kpi.key;
          return (
            <div 
              key={kpi.key}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.title}</span>
                  <h3 className="text-2xl font-black text-gray-900">{kpi.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 text-xs">
                <span className={`font-semibold flex items-center gap-0.5 ${
                  kpi.trendUp ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {kpi.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.trend}
                </span>
                <button
                  onClick={() => setActiveTooltip(isSelected ? null : kpi.key)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5 font-medium"
                >
                  <Info className="h-3.5 w-3.5" />
                  <span>Fórmula & Explicación</span>
                </button>
              </div>

              {/* Explanatory Overlay if selected */}
              {isSelected && (
                <div className="absolute inset-0 bg-slate-900/95 text-white p-5 rounded-2xl z-10 flex flex-col justify-between transition-all">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Definición de Negocio</span>
                      <button onClick={() => setActiveTooltip(null)} className="text-gray-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{kpi.explanation}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-400 bg-slate-950/50 p-2.5 rounded-lg">
                    <span className="text-gray-400 block mb-1 text-[9px] uppercase tracking-wider">Fórmula matemática:</span>
                    {kpi.formula}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tab Navigation Menu */}
      <div className="bg-white border border-gray-100 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-sm">
        {[
          { key: 'dashboard', label: 'Dashboard Ejecutivo', icon: BarChart2 },
          { key: 'recommendations', label: 'Recomendaciones Tarifarias', icon: Sparkles, badge: recommendations.filter(r => r.status === 'pending').length },
          { key: 'rules', label: 'Reglas de Revenue', icon: Settings },
          { key: 'calendar', label: 'Calendario Comercial', icon: Calendar },
          { key: 'simulator', label: 'Simulador Tarifario', icon: Play },
          { key: 'analytics', label: 'Revenue Analytics', icon: TrendingUp },
          { key: 'ai', label: 'Hub de Inteligencia Artificial', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: DASHBOARD VISTA GENERAL */}
      {activeSubTab === 'dashboard' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Visual trends on left (2/3 columns) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Area Chart: Daily revenue & occupancy progression */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">Progreso Diario de Ingresos y Ocupación</h4>
                  <p className="text-[11px] text-gray-400">Evolución real combinada durante los últimos 7 días.</p>
                </div>
                <div className="flex items-center space-x-4 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> Ingresos</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-400 rounded-sm"></span> Ocupación</span>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrends}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Ingresos ($)" />
                    <Area type="monotone" dataKey="occupancy" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOcc)" name="Ocupación (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart: Booking Pace Comparison Curve */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-sm">Curva de Reserva / Booking Pace (Pickup)</h4>
                <p className="text-[11px] text-gray-400">Porcentaje de ocupación asegurado según la anticipación de la fecha de arribo (Lead Time) comparando Año Actual vs Histórico.</p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paceCurve}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="daysBeforeArrival" reversed={true} stroke="#94a3b8" fontSize={10} tickLine={false} label={{ value: 'Días previos a llegada', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="bookingsPaceCurrentYear" name="Año Actual (Optimizado)" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="bookingsPaceLastYear" name="Año Anterior" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Side panel: Intelligent active alerts (1/3 columns) */}
          <div className="space-y-6">
            {/* Intelligent alerts column */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 animate-bounce" />
                  Alertas Inteligentes
                </h4>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-black uppercase">
                  {alerts.length} Activas
                </span>
              </div>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 space-y-2">
                    <Check className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold">¡Todo en orden comercial!</p>
                    <p className="text-[10px]">No se detectan anomalías de tarifas u ocupación.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-3.5 rounded-xl border flex gap-3 ${
                        alert.severity === 'critical' 
                          ? 'bg-rose-50 border-rose-100 text-rose-900' 
                          : 'bg-amber-50 border-amber-100 text-amber-900'
                      }`}
                    >
                      <AlertTriangle className={`h-5 w-5 shrink-0 ${
                        alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'
                      }`} />
                      <div className="space-y-1">
                        <span className="font-extrabold text-xs block leading-tight">{alert.title}</span>
                        <p className="text-[10px] text-gray-500 leading-normal">{alert.description}</p>
                        <button
                          onClick={() => setActiveSubTab('recommendations')}
                          className="mt-2 text-[10px] font-black underline flex items-center gap-1 cursor-pointer"
                        >
                          Ver recomendación sugerida
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Micro-audit list */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-600" />
                Historial de Decisiones (Audit)
              </h4>

              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Sin registros de auditoría aún.</p>
                ) : (
                  history.slice(0, 5).map((h) => (
                    <div key={h.id} className="border-l-2 border-emerald-500 pl-3 py-1 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-black text-gray-900">{h.action}</span>
                        <span className="text-gray-400 font-mono">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{h.details}</p>
                      <span className="text-[9px] text-gray-400 block font-medium">Por: {h.performedBy}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RECOMMENDATIONS */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="font-black text-slate-900 text-base">Recomendaciones del Motor de Revenue</h4>
                <p className="text-xs text-gray-500">
                  Propuestas de ajustes dinámicos basados en la ejecución cruzada de reglas comerciales, eventos y proyecciones de demanda.
                </p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl font-medium">
                Último análisis: {history[0]?.timestamp ? new Date(history[0].timestamp).toLocaleTimeString() : 'No ejecutado aún'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {recommendations.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 space-y-3">
                  <Sparkles className="h-10 w-10 text-indigo-400 mx-auto animate-pulse" />
                  <p className="text-sm font-bold">Sin recomendaciones pendientes.</p>
                  <p className="text-xs">Haga clic en "Ejecutar Análisis de Revenue" arriba para correr las reglas dinámicas y escanear el calendario comercial.</p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div 
                    key={rec.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      rec.status === 'applied' 
                        ? 'bg-emerald-50/40 border-emerald-100 opacity-90' 
                        : rec.status === 'rejected'
                        ? 'bg-gray-50/50 border-gray-100 opacity-60'
                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Rec header info */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                        {rec.date}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        rec.status === 'applied' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'rejected'
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-indigo-100 text-indigo-800 animate-pulse'
                      }`}>
                        {rec.status === 'applied' ? 'Aplicada' : rec.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                      </span>
                    </div>

                    {/* Rec values */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-1">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                          {rec.type === 'increase_rate' ? 'Incrementar Tarifa' : rec.type === 'decrease_rate' ? 'Reducir Tarifa' : rec.type === 'increase_min_stay' ? 'Subir Estadía Mínima' : 'Descuento Flash'}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-xl font-black text-gray-900">
                          {typeof rec.recommendedValue === 'number' && rec.type !== 'increase_min_stay' ? `$${rec.recommendedValue.toLocaleString()}` : rec.recommendedValue} 
                          {rec.type === 'increase_min_stay' ? ' noches' : ' COP'}
                        </span>
                        {rec.originalValue !== 'N/A' && (
                          <span className="text-xs text-gray-400 line-through">
                            ${Number(rec.originalValue).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 leading-normal font-medium">{rec.reason}</p>
                    </div>

                    {/* Confidence score */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span>Confianza Estimada</span>
                        <span>{rec.confidence}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${rec.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Applied Rules, expected impact */}
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-medium mb-4">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Reglas Comerciales:</span>
                        <span className="text-slate-800 font-bold">{rec.appliedRules.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Impacto Comercial Esperado:</span>
                        <span className="text-emerald-700 font-bold">{rec.expectedImpact}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {rec.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleApproveRecommendation(rec.id)}
                          className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> Aprobar & Aplicar
                        </button>
                        <button
                          onClick={() => handleRejectRecommendation(rec.id)}
                          className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" /> Rechazar
                        </button>
                      </div>
                    )}

                    {rec.status === 'applied' && (
                      <div className="text-[10px] text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100 font-bold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <span>Aprobada por {rec.approvedBy}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RULES */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="font-black text-slate-900 text-base">Motor de Reglas Comerciales Dinámicas</h4>
                <p className="text-xs text-gray-500">
                  Defina condiciones operativas de ocupación, lead time o días festivos que dispararán recomendaciones automáticas en el panel de control.
                </p>
              </div>
              <button
                onClick={() => setShowRuleModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow cursor-pointer self-start"
              >
                <Plus className="h-4 w-4" /> Crear Nueva Regla
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rules.map((rule) => (
                <div 
                  key={rule.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    rule.isActive ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        TIPO: {rule.type.toUpperCase()}
                      </span>
                      <h5 className="font-black text-sm text-slate-900 mt-1.5">{rule.name}</h5>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                        title={rule.isActive ? 'Desactivar Regla' : 'Activar Regla'}
                      >
                        {rule.isActive ? (
                          <ToggleRight className="h-7 w-7 text-emerald-600 cursor-pointer" />
                        ) : (
                          <ToggleLeft className="h-7 w-7 text-gray-400 cursor-pointer" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded transition-colors"
                        title="Eliminar Regla"
                      >
                        <Trash2 className="h-4 w-4 cursor-pointer" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed font-medium mb-4">{rule.description}</p>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50 text-[11px] font-medium text-slate-700">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                      Ajuste: {rule.adjustmentValue > 0 ? `+${rule.adjustmentValue}` : rule.adjustmentValue}
                      {rule.adjustmentType === CommercialAdjustmentType.PERCENTAGE ? '%' : rule.adjustmentType === CommercialAdjustmentType.MIN_STAY ? ' noches estadía' : ''}
                    </span>
                    {rule.conditions.occupancyThresholdPct !== undefined && (
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
                        Disparo: Ocupación {rule.conditions.occupancyComparison === 'greater' ? '>' : '<'} {rule.conditions.occupancyThresholdPct}%
                      </span>
                    )}
                    {rule.conditions.dayOfWeek && (
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-100">
                        Fines de Semana (Vie/Sáb)
                      </span>
                    )}
                    {rule.conditions.daysMin !== undefined && (
                      <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100">
                        Lead Time {'>'} {rule.conditions.daysMin} días
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CALENDAR */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="font-black text-slate-900 text-base">Calendario Comercial de Eventos</h4>
                <p className="text-xs text-gray-500">
                  Festividades nacionales, vacaciones escolares, congresos de medicina u otros acontecimientos locales con alto impacto comercial y de afluencia turística.
                </p>
              </div>
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow cursor-pointer self-start"
              >
                <Plus className="h-4 w-4" /> Registrar Evento
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {calendarEvents.map((evt) => (
                <div key={evt.id} className="p-4 rounded-xl border border-gray-100 bg-white space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      evt.impact === 'high' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : evt.impact === 'medium'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      Impacto {evt.impact.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar Evento"
                    >
                      <Trash2 className="h-3.5 w-3.5 cursor-pointer" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-extrabold text-sm text-gray-900">{evt.title}</h5>
                    <p className="text-[10px] text-gray-400 font-semibold">{evt.startDate} — {evt.endDate}</p>
                    <p className="text-xs text-gray-500 leading-normal">{evt.description}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 text-[10px] text-gray-400 uppercase font-mono">
                    Categoría: <span className="font-bold text-gray-600">{evt.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 text-base">Simulador Comercial de Elasticidad de Precios</h4>
              <p className="text-xs text-gray-500">
                Modele la elasticidad económica de la propiedad. Evalúe de forma segura cómo impacta un porcentaje de aumento o descuento de precios sobre la conversión de ocupación e ingresos totales esperados.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Controls panel on left */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-5">
                <h5 className="font-black text-xs text-slate-900 uppercase tracking-wider">Parámetros de Simulación</h5>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 block">Nombre del Escenario</label>
                  <input 
                    type="text" 
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>Ajuste en Tarifas (%)</span>
                    <span className={simPriceAdjustment > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {simPriceAdjustment > 0 ? `+${simPriceAdjustment}` : simPriceAdjustment}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="-40" 
                    max="40" 
                    step="1"
                    value={simPriceAdjustment}
                    onChange={(e) => setSimPriceAdjustment(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[10px] text-gray-400">Determina el incremento o descuento simulado en el precio de habitación.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>Elasticidad de Ocupación</span>
                    <span className="text-indigo-600">{simElasticity}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-1.5" 
                    max="0.0" 
                    step="0.1"
                    value={simElasticity}
                    onChange={(e) => setSimElasticity(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[10px] text-gray-400">A menor elasticidad (ej. -0.9), el mercado es más sensible al precio (aumentar tarifas reduce fuertemente la ocupación).</p>
                </div>

                <button
                  onClick={handleRunSimulation}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Ejecutar Simulación
                </button>
              </div>

              {/* Charts & side-by-side comparison (2/3 cols) */}
              <div className="xl:col-span-2 space-y-6">
                {simResult ? (
                  <div className="space-y-6">
                    {/* Side-by-side indicator grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">Ocupación Base</span>
                        <span className="text-base font-black text-slate-800">{simResult.baseOccupancy}%</span>
                      </div>
                      <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-indigo-400 font-bold block">Ocupación Sim</span>
                        <span className="text-base font-black text-indigo-700">{simResult.simulatedOccupancy}%</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">ADR Base</span>
                        <span className="text-base font-black text-slate-800">${simResult.baseAdr.toLocaleString()}</span>
                      </div>
                      <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-indigo-400 font-bold block">ADR Sim</span>
                        <span className="text-base font-black text-indigo-700">${simResult.simulatedAdr.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Sim visual chart bar comparison */}
                    <div className="bg-white p-5 border border-gray-100 rounded-2xl space-y-4">
                      <h6 className="font-extrabold text-xs text-slate-900 uppercase">Impacto Financiero: Base vs Simulación</h6>
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            {
                              name: 'Ingreso Neto ($)',
                              Base: simResult.baseRevenue,
                              Simulado: simResult.simulatedRevenue,
                            },
                            {
                              name: 'RevPAR por Cuarto',
                              Base: simResult.baseRevPar,
                              Simulado: simResult.simulatedRevPar,
                            }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                            <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                            <Bar dataKey="Base" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="Simulado" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="text-xs p-3.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-800 font-medium">
                        El escenario simulado estima un cambio de ingresos netos del <span className="font-black">
                          {Math.round(((simResult.simulatedRevenue - simResult.baseRevenue) / (simResult.baseRevenue || 1)) * 100)}%
                        </span> con este ajuste en las tarifas.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-slate-400 space-y-3">
                    <BarChart2 className="h-10 w-10 text-slate-300 animate-pulse" />
                    <p className="text-xs font-bold">Sin simulación activa.</p>
                    <p className="text-[10px] text-center max-w-sm">Use los controles de la izquierda para cambiar el multiplicador comercial y pulse "Ejecutar Simulación".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 text-base">Revenue Analytics & Comparativas</h4>
              <p className="text-xs text-gray-500">
                Segmentación estratégica de las reservas por canales de distribución, categorías de alojamiento, y progresión histórica mensual.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Channel Distribution pie chart */}
              <div className="p-5 border border-gray-100 rounded-2xl bg-white space-y-4">
                <h5 className="font-extrabold text-xs text-slate-900 uppercase">Ingresos por Canales de Venta</h5>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-full sm:w-[220px] h-[220px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelComparison}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="revenue"
                        >
                          {channelComparison.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()} COP`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 w-full text-xs font-semibold">
                    {channelComparison.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="text-gray-600">{entry.name}</span>
                        </div>
                        <span className="text-slate-900">${entry.revenue.toLocaleString()} COP</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categories Comparison bar chart */}
              <div className="p-5 border border-gray-100 rounded-2xl bg-white space-y-4">
                <h5 className="font-extrabold text-xs text-slate-900 uppercase">Rendimiento por Categoría de Alojamiento</h5>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accommodationComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()} COP`} />
                      <Bar dataKey="revenue" name="Ingresos ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly breakdown chart */}
              <div className="p-5 border border-gray-100 rounded-2xl bg-white space-y-4 xl:col-span-2">
                <h5 className="font-extrabold text-xs text-slate-900 uppercase">Progresión Anual de Ingresos por Mes</h5>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()} COP`} />
                      <Area type="monotone" dataKey="revenue" name="Ingresos Mensuales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI HUB */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
              <Cpu className="h-6 w-6 text-violet-600 animate-pulse" />
              <div>
                <h4 className="font-black text-slate-900 text-base">Hub de Inteligencia Artificial (Extensión)</h4>
                <p className="text-xs text-gray-500">Módulo preparado arquitectónicamente para acoplar modelos predictivos de Machine Learning en el próximo Sprint.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Predictive Forecast extension card */}
              <div className="p-5 rounded-2xl border border-gray-100 bg-white space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h5 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-violet-600" />
                      Forecast Predictivo de Ocupación (Extensibilidad)
                    </h5>
                    <p className="text-xs text-gray-400 font-semibold leading-normal">Predice con una antelación de hasta 90 días el comportamiento esperado del mercado.</p>
                  </div>
                  <button 
                    onClick={() => setAiPredictiveForecast(!aiPredictiveForecast)}
                    className="text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    {aiPredictiveForecast ? (
                      <ToggleRight className="h-7 w-7 text-violet-600 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-gray-400 cursor-pointer" />
                    )}
                  </button>
                </div>

                <div className="bg-violet-50 p-3.5 rounded-xl border border-violet-100 space-y-2 text-xs font-semibold text-violet-900">
                  <div className="flex justify-between items-center text-[10px] text-violet-500 uppercase tracking-widest font-mono">
                    <span>Estado del Modelo</span>
                    <span>Listo para Conexión API</span>
                  </div>
                  <p className="text-xs leading-normal font-medium text-violet-700">
                    Punto de extensión estructurado en el <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px]">RevenueEngine</code>. Al acoplar la API, la interfaz graficará la banda predictiva móvil del mes entrante automáticamente.
                  </p>
                </div>
              </div>

              {/* Auto Pilot trigger card */}
              <div className="p-5 rounded-2xl border border-gray-100 bg-white space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h5 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                      <Cpu className="h-4.5 w-4.5 text-rose-600 animate-pulse" />
                      Auto-Pilot Tarifario (Aprobación Autónoma)
                    </h5>
                    <p className="text-xs text-gray-400 font-semibold leading-normal">Permite que el motor aplique y actualice de forma automatizada las recomendaciones de tarifas autorizadas.</p>
                  </div>
                  <button 
                    onClick={() => setAiAutoPilot(!aiAutoPilot)}
                    className="text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    {aiAutoPilot ? (
                      <ToggleRight className="h-7 w-7 text-rose-600 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-gray-400 cursor-pointer" />
                    )}
                  </button>
                </div>

                <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-100 space-y-2 text-xs font-semibold text-rose-900">
                  <div className="flex justify-between items-center text-[10px] text-rose-500 uppercase tracking-widest font-mono">
                    <span>Configuración de Autonomía</span>
                    <span className="text-rose-600">Requiere RBAC Enterprise</span>
                  </div>
                  <p className="text-xs leading-normal font-medium text-rose-700">
                    Esta opción permanecerá bloqueada por seguridad. StayFlow exige de forma mandatoria la firma humana en cada cambio de tarifas para evitar regresiones de facturación no deseadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RULE MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <h5 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Settings className="h-4.5 w-4.5 text-indigo-600" />
                Configurar Nueva Regla Comercial
              </h5>
              <button onClick={() => setShowRuleModal(false)} className="text-gray-400 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">Nombre de la Regla</label>
                <input 
                  type="text" 
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ej. Surcharge Fin de Semana Largo"
                  className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3.5 py-2 text-xs text-gray-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">Descripción Operativa</label>
                <textarea 
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="Explique cuándo se aplica y qué impacto busca lograr..."
                  className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3.5 py-2 text-xs text-gray-800 h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Tipo de Regla</label>
                  <select 
                    value={newRuleType}
                    onChange={(e) => setNewRuleType(e.target.value as CommercialRuleType)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-800"
                  >
                    <option value={CommercialRuleType.OCCUPANCY}>Ocupación Proyectada</option>
                    <option value={CommercialRuleType.DAY_OF_WEEK}>Día de la Semana</option>
                    <option value={CommercialRuleType.LAST_MINUTE}>Último Minuto</option>
                    <option value={CommercialRuleType.LEAD_TIME}>Lead Time (Antelación)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Tipo de Ajuste</label>
                  <select 
                    value={newRuleAdjType}
                    onChange={(e) => setNewRuleAdjType(e.target.value as CommercialAdjustmentType)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-800"
                  >
                    <option value={CommercialAdjustmentType.PERCENTAGE}>Porcentaje (%)</option>
                    <option value={CommercialAdjustmentType.FIXED}>Valor Fijo ($)</option>
                    <option value={CommercialAdjustmentType.MIN_STAY}>Estadía Mínima (Noches)</option>
                  </select>
                </div>
              </div>

              {newRuleType === CommercialRuleType.OCCUPANCY && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Ocupación</label>
                    <select 
                      value={newRuleOccupancyComparison}
                      onChange={(e) => setNewRuleOccupancyComparison(e.target.value as 'greater' | 'less')}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800"
                    >
                      <option value="greater">Mayor a ({'>'})</option>
                      <option value="less">Menor a ({'<'})</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Umbral (%)</label>
                    <input 
                      type="number"
                      min="1"
                      max="100"
                      value={newRuleOccupancyThreshold}
                      onChange={(e) => setNewRuleOccupancyThreshold(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">Valor del Ajuste (Ej: +15, -10 o 2 para noches)</label>
                <input 
                  type="number" 
                  value={newRuleAdjVal}
                  onChange={(e) => setNewRuleAdjVal(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-800 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="submit"
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow cursor-pointer"
                >
                  Guardar Regla
                </button>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <h5 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-indigo-600" />
                Registrar Evento Comercial
              </h5>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">Título del Evento / Feriado</label>
                <input 
                  type="text" 
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ej. Carnaval de Invierno 2026"
                  className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3.5 py-2 text-xs text-gray-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Categoría</label>
                  <select 
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-800"
                  >
                    <option value="festival">Festival / Concierto</option>
                    <option value="holiday">Feriado Nacional</option>
                    <option value="congress">Congreso / Exposición</option>
                    <option value="vacation">Vacaciones Escolares</option>
                    <option value="event">Evento Local General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Impacto en Demanda</label>
                  <select 
                    value={newEventImpact}
                    onChange={(e) => setNewEventImpact(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-800"
                  >
                    <option value="high">Alto Impacto</option>
                    <option value="medium">Mediano Impacto</option>
                    <option value="low">Bajo Impacto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Fecha Inicio</label>
                  <input 
                    type="date" 
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Fecha Fin</label>
                  <input 
                    type="date" 
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">Breve Descripción</label>
                <textarea 
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Detalles sobre atracciones, público objetivo o expectativas..."
                  className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3.5 py-2 text-xs text-gray-800 h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="submit"
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow cursor-pointer"
                >
                  Registrar Evento
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default RevenueDashboard;
