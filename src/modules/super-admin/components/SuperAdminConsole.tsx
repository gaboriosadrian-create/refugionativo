import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Building2, 
  Layers, 
  FileSpreadsheet, 
  Settings, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Loader2, 
  RefreshCw, 
  Server, 
  ShieldAlert, 
  DollarSign, 
  BookmarkCheck, 
  Database,
  ArrowRight,
  Sparkles,
  UserCheck,
  Power,
  Trash2,
  Mail,
  Smartphone,
  Globe,
  Palette,
  Eye,
  Settings2,
  Bell,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Menu
} from 'lucide-react';
import { useSidebarCollapse } from '../../../shared/hooks/useSidebarCollapse';
import { useAuth } from '../../auth/hooks/useAuth';
import { ProductionHardeningConsole } from './ProductionHardeningConsole';
import { CommercialDashboard } from '../../commercial-platform/components/CommercialDashboard';
import { SuperAdminService } from '../services/SuperAdminService';
import { LoggerService } from '../../../core/observability/LoggerService';
import { MetricsService } from '../../../core/observability/MetricsService';
import { AlertService } from '../../../core/observability/AlertService';
import { MonitoringService } from '../../../core/observability/MonitoringService';
import { 
  SuperAdminDashboardMetrics, 
  TenantWithConfig, 
  SaaSPlanConfig, 
  PlatformHealthStatus, 
  GlobalPlatformConfig, 
  GlobalAuditLog 
} from '../types';
import { SaaSPlan, TenantStatus } from '../../../core/tenant/TenantTypes';
import { Resort } from '../../../types';

export const SuperAdminConsole: React.FC = () => {
  const { user, logout } = useAuth();
  const { isCollapsed: sidebarCollapsed, toggleCollapse: toggleSidebar } = useSidebarCollapse();
  
  // Security verification
  const isSuperAdmin = user?.email === 'gaboriosadrian@gmail.com' || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-8 text-center animate-fade-in">
        <div className="grid w-16 h-16 place-content-center bg-rose-500/10 text-rose-400 rounded-2xl mb-6 border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="font-display font-extrabold text-2xl text-white mb-2 tracking-tight">Acceso Restringido</h3>
        <p className="text-slate-400 text-sm leading-relaxed max-w-[420px] mb-6 font-sans">
          Hola <strong className="text-slate-200">{user?.displayName || 'Usuario'}</strong>. Tu cuenta (<span className="font-mono text-xs text-indigo-300">{user?.email}</span>) no dispone de los privilegios globales de **Super Administrador** requeridos para esta sección.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/10"
          >
            Volver al Portal
          </button>
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'onboarding' | 'plans' | 'users' | 'audit' | 'health' | 'config' | 'production' | 'saas-commercial'>('dashboard');
  const [metrics, setMetrics] = useState<SuperAdminDashboardMetrics | null>(null);
  const [tenants, setTenants] = useState<TenantWithConfig[]>([]);
  const [plans, setPlans] = useState<SaaSPlanConfig[]>(SuperAdminService.getPlans());
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<GlobalAuditLog[]>([]);
  const [healthStatus, setHealthStatus] = useState<PlatformHealthStatus | null>(null);
  const [globalConfig, setGlobalConfig] = useState<GlobalPlatformConfig>(SuperAdminService.getGlobalConfig());
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'plan' | 'commercialStatus'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selected Tenant for Detailed Edit Modal
  const [editingTenant, setEditingTenant] = useState<TenantWithConfig | null>(null);
  const [selectedTenantHistory, setSelectedTenantHistory] = useState<any[]>([]);
  const [reassigningOwnerTenant, setReassigningOwnerTenant] = useState<TenantWithConfig | null>(null);
  const [newOwnerEmail, setNewOwnerEmail] = useState<string>('');
  const [editingPlan, setEditingPlan] = useState<SaaSPlanConfig | null>(null);

  // Onboarding Wizard Form State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [onboardingForm, setOnboardingForm] = useState({
    id: '',
    name: '',
    razonSocial: '',
    businessType: 'CABIN' as Resort['businessType'],
    plan: 'Starter' as SaaSPlan,
    ownerEmail: '',
    ownerName: '',
    ownerLastName: '',
    phone: '',
    country: 'Argentina',
    province: 'Buenos Aires',
    city: 'CABA',
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    primaryColor: '#0f172a',
    accommodationsQty: 3
  });
  const [onboardingLogs, setOnboardingLogs] = useState<string[]>([]);
  const [isOnboardingRunning, setIsOnboardingRunning] = useState<boolean>(false);
  const [onboardingSuccess, setOnboardingSuccess] = useState<boolean | null>(null);

  // Real-time component check spinner
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  // Observability & Telemetry States
  const [obsLogs, setObsLogs] = useState<any[]>([]);
  const [obsAlerts, setObsAlerts] = useState<any[]>([]);
  const [tenantHealthReports, setTenantHealthReports] = useState<any[]>([]);
  const [executiveIndicators, setExecutiveIndicators] = useState<any | null>(null);
  const [logFilter, setLogFilter] = useState<string>('ALL');

  // Fetch metrics & data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const fetchedMetrics = await SuperAdminService.getMetrics();
      const fetchedTenants = await SuperAdminService.getTenants();
      const fetchedUsers = await SuperAdminService.getUsers();
      const fetchedLogs = SuperAdminService.getAuditLogs();
      const fetchedHealth = await SuperAdminService.getHealthStatus();
      
      setMetrics(fetchedMetrics);
      setTenants(fetchedTenants);
      setUsersList(fetchedUsers);
      setAuditLogs(fetchedLogs);
      setHealthStatus(fetchedHealth);

      // Run full diagnostics and fetch telemetry
      try {
        await MonitoringService.runSystemDiagnostic();
        const alerts = AlertService.getAlerts();
        const logs = LoggerService.getLogs();
        const reports = await MonitoringService.getTenantHealthReports();
        const indicators = await MonitoringService.getExecutiveIndicators();

        setObsLogs(logs);
        setObsAlerts(alerts);
        setTenantHealthReports(reports);
        setExecutiveIndicators(indicators);
      } catch (obsErr) {
        console.error('Error fetching observability telemetry:', obsErr);
      }
    } catch (err) {
      console.error('[SUPER_ADMIN_CONSOLE] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (editingTenant) {
      const history = SuperAdminService.getTenantHistory(editingTenant.id);
      setSelectedTenantHistory(history);
    } else {
      setSelectedTenantHistory([]);
    }
  }, [editingTenant]);

  // Onboarding wizard handler
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOnboardingRunning) return;

    setIsOnboardingRunning(true);
    setOnboardingSuccess(null);
    setOnboardingLogs([]);

    const fullName = `${onboardingForm.ownerName} ${onboardingForm.ownerLastName}`.trim();

    const result = await SuperAdminService.provisionTenant({
      id: onboardingForm.id,
      name: onboardingForm.name,
      businessType: onboardingForm.businessType,
      plan: onboardingForm.plan,
      ownerEmail: onboardingForm.ownerEmail,
      ownerName: fullName || onboardingForm.ownerName,
      phone: onboardingForm.phone,
      country: onboardingForm.country,
      timezone: onboardingForm.timezone,
      currency: onboardingForm.currency,
      primaryColor: onboardingForm.primaryColor
    });

    setOnboardingLogs(result.logs);
    setOnboardingSuccess(result.success);
    setIsOnboardingRunning(false);

    if (result.success) {
      // Clear form on success
      setOnboardingForm({
        id: '',
        name: '',
        razonSocial: '',
        businessType: 'CABIN',
        plan: 'Starter',
        ownerEmail: '',
        ownerName: '',
        ownerLastName: '',
        phone: '',
        country: 'Argentina',
        province: 'Buenos Aires',
        city: 'CABA',
        language: 'es',
        timezone: 'America/Argentina/Buenos_Aires',
        currency: 'ARS',
        primaryColor: '#0f172a',
        accommodationsQty: 3
      });
      setWizardStep(1);
      // reload lists
      await loadAllData();
    }
  };

  const handleTestHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const fetchedHealth = await SuperAdminService.getHealthStatus();
      setHealthStatus(fetchedHealth);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await AlertService.resolveAlert(alertId);
      const alerts = AlertService.getAlerts();
      setObsAlerts(alerts);
      const indicators = await MonitoringService.getExecutiveIndicators();
      setExecutiveIndicators(indicators);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleToggleTenantStatus = async (tenantId: string) => {
    if (confirm('¿Estás seguro de cambiar el estado de suspensión de este cliente?')) {
      await SuperAdminService.toggleTenantStatus(tenantId);
      await loadAllData();
    }
  };

  const handleSoftDeleteTenant = async (tenantId: string) => {
    if (confirm('¿Estás seguro de aplicar borrado lógico a este cliente? El sitio web quedará inactivo pero se preservarán los datos históricamente.')) {
      await SuperAdminService.softDeleteTenant(tenantId);
      await loadAllData();
    }
  };

  const handleReassignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassigningOwnerTenant) return;
    try {
      await SuperAdminService.reassignOwner(reassigningOwnerTenant.id, newOwnerEmail);
      setNewOwnerEmail('');
      setReassigningOwnerTenant(null);
      await loadAllData();
      alert('Propietario reasignado con éxito.');
    } catch (err: any) {
      alert(`Error al reasignar propietario: ${err.message || String(err)}`);
    }
  };

  const handleToggleUserStatus = async (uid: string) => {
    await SuperAdminService.toggleUserStatus(uid);
    await loadAllData();
  };

  const handleUpdateGlobalConfig = (newCfg: Partial<GlobalPlatformConfig>) => {
    const updated = { ...globalConfig, ...newCfg };
    setGlobalConfig(updated);
    SuperAdminService.updateGlobalConfig(updated);
  };

  const handleSaveTenantEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    await SuperAdminService.updateTenant(editingTenant.id, {
      name: editingTenant.name,
      businessType: editingTenant.businessType,
      plan: editingTenant.plan,
      email: editingTenant.email,
      phone: editingTenant.phone,
      domain: editingTenant.domain,
      commercialStatus: editingTenant.commercialStatus
    });
    setEditingTenant(null);
    await loadAllData();
  };

  // Filtered and Sorted tenants
  const filteredTenants = tenants
    .filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === 'all' || t.plan === planFilter;
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && t.active && t.commercialStatus !== 'Suspendido') ||
                            (statusFilter === 'suspended' && (t.status === 'suspended' || t.commercialStatus === 'Suspendido')) ||
                            (statusFilter === 'trial' && t.commercialStatus === 'Trial') ||
                            (statusFilter === 'vencido' && t.commercialStatus === 'Vencido') ||
                            (statusFilter === 'pendiente_pago' && t.commercialStatus === 'Pendiente de Pago') ||
                            (statusFilter === 'cancelado' && t.commercialStatus === 'Cancelado');
      return matchesSearch && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      
      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'id') {
        valA = a.id.toLowerCase();
        valB = b.id.toLowerCase();
      } else if (sortBy === 'plan') {
        valA = a.plan.toLowerCase();
        valB = b.plan.toLowerCase();
      } else if (sortBy === 'commercialStatus') {
        valA = (a.commercialStatus || '').toLowerCase();
        valB = (b.commercialStatus || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-indigo-500/30">
      
      {/* Top Warning Banner if Platform is in Maintenance */}
      {globalConfig.maintenanceMode && (
        <div className="bg-amber-600 text-white font-bold text-xs py-2 px-4 text-center flex items-center justify-center gap-2 animate-pulse z-30">
          <AlertTriangle className="w-4 h-4" />
          <span>SISTEMA EN MODO MANTENIMIENTO GLOBAL - Los clientes verán avisos de mantenimiento en sus portales.</span>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between relative z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="grid w-10 h-10 place-content-center bg-gradient-to-tr from-indigo-600 to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              StayFlow <span className="text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">SUPER ADMIN</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium uppercase tracking-wider">Consola de Control de Plataforma SaaS</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{user?.displayName || 'Administrador Global'}</span>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono">{user?.email}</span>
          </div>
          <button 
            onClick={loadAllData}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Refrescar Datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-white font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            Ir a Backoffice
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        
        {/* Sidebar Nav */}
        <nav className={`w-full ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-1 z-10 shrink-0 transition-all duration-300 ease-in-out`}>
          <div className="hidden lg:flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Módulos de Control
              </div>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 mx-auto"
              title={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
              aria-label="Alternar menú lateral"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <PanelLeftClose className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
            </button>
          </div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            title="Panel de Control"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Panel de Control</span>}
          </button>

          <button
            onClick={() => setActiveTab('saas-commercial')}
            title="SaaS Comercial & CRM"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'saas-commercial' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse shrink-0" />
            {!sidebarCollapsed && <span>SaaS Comercial & CRM</span>}
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            title="Gestión de Clientes"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'clients' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Gestión de Clientes</span>}
          </button>

          <button
            onClick={() => setActiveTab('onboarding')}
            title="Alta Automática (Onboard)"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'onboarding' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {!sidebarCollapsed && (
              <span className="flex items-center gap-1.5">
                <span>Alta Automática</span>
                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase">Onboard</span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            title="Planes & Límites"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'plans' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Planes & Límites</span>}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            title="Gestión de Usuarios"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Gestión de Usuarios</span>}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            title="Auditoría Global"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'audit' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Auditoría Global</span>}
          </button>

          <button
            onClick={() => setActiveTab('health')}
            title="Monitor de Salud"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'health' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Server className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Monitor de Salud</span>}
          </button>

          <button
            onClick={() => setActiveTab('production')}
            title="Producción & Hardening"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'production' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Producción & Hardening</span>}
          </button>

          <button
            onClick={() => setActiveTab('config')}
            title="Configuración Global"
            className={`w-full text-left ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'config' 
                ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Configuración Global</span>}
          </button>

          <div className="mt-auto pt-6 border-t border-slate-800/50 hidden lg:flex flex-col gap-2 p-3">
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Motor MP: Online</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Motor Reserva: Online</span>
                </div>
                <p className="text-[9px] text-slate-600 font-mono mt-1">Platform Version {globalConfig.version}</p>
              </>
            ) : (
              <div className="flex justify-center py-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="SaaS Core: Online"></span>
              </div>
            )}
          </div>
        </nav>

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {loading && metrics === null ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-indigo-400">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-400">Sincronizando consola con el cluster SaaS...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >
                
                {/* 1. DASHBOARD TAB */}
                {activeTab === 'dashboard' && metrics && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">Métricas Globales de Plataforma</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">Visión integrada del estado financiero y operativo de todos los resorts hospedados.</p>
                    </div>

                    {/* Indicators Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clientes (Tenants)</span>
                          <Building2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div>
                          <div className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{metrics.totalClients}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{metrics.activeClients} Activos</span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">{metrics.suspendedClients} Susp.</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos Estimados (MP)</span>
                          <DollarSign className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <div>
                          <div className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                            {metrics.estimatedRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{metrics.completedPayments} Transacciones exitosas</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full filter blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reservas Procesadas</span>
                          <BookmarkCheck className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <div>
                          <div className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{metrics.totalReservations}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">+{metrics.dailyReservations} nuevas hoy</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-sky-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full filter blur-xl group-hover:bg-sky-500/10 transition-colors"></div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uso de Almacenamiento</span>
                          <Database className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
                        </div>
                        <div>
                          <div className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{metrics.storageUtilization.toFixed(1)} MB</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span className="text-sky-600 dark:text-sky-400 font-semibold">{metrics.totalAccommodationsCount} Alojamientos</span>
                            <span>•</span>
                            <span>{metrics.totalUsers} Usuarios</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Secondary Visual Charts & Health Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Live Activity Logs Feed */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                            <span>Auditoría de Actividad Reciente</span>
                          </h3>
                          <button 
                            onClick={() => setActiveTab('audit')}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            Ver todos los logs
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                          {auditLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/40 rounded-xl flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start text-[11px]">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                                <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
                                  <span>ID: {log.entityId}</span>
                                  <span>•</span>
                                  <span>Por: {log.userEmail || log.userId}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* System health quick summary */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl space-y-4">
                        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Server className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          <span>Componentes de Plataforma</span>
                        </h3>

                        <div className="space-y-3">
                          {healthStatus?.components.slice(0, 3).map((comp, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/50">
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-300">{comp.name}</p>
                                <p className="text-[9px] text-slate-500 truncate max-w-[180px]">{comp.details}</p>
                              </div>
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                comp.status === 'healthy' ? 'bg-emerald-500 shadow-md shadow-emerald-500/20 animate-pulse' : 'bg-amber-500 animate-pulse'
                              }`}></span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => setActiveTab('health')}
                          className="w-full text-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-800"
                        >
                          Ir al monitor completo
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. TENANTS MANAGEMENT TAB */}
                {activeTab === 'clients' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">Cartera de Clientes Activos</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Administra la base, cambia de planes, suspende o reasigna administradores.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('onboarding')}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 self-start transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Provisionar Nuevo Cliente</span>
                      </button>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col xl:flex-row gap-4 items-center">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre, ID o email..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-800 dark:text-slate-200 transition-colors"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-3 w-full xl:w-auto shrink-0">
                        <select
                          value={planFilter}
                          onChange={e => setPlanFilter(e.target.value)}
                          className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="all">Todos los Planes</option>
                          <option value="Starter">Starter</option>
                          <option value="Professional">Professional</option>
                          <option value="Business">Business</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>

                        <select
                          value={statusFilter}
                          onChange={e => setStatusFilter(e.target.value)}
                          className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="all">Todos los Estados</option>
                          <option value="active">Activos</option>
                          <option value="suspended">Suspendidos / Suspensión</option>
                          <option value="trial">Modo Trial</option>
                          <option value="pendiente_pago">Pendiente de Pago</option>
                          <option value="vencido">Vencido</option>
                          <option value="cancelado">Cancelado</option>
                        </select>

                        <select
                          value={sortBy}
                          onChange={e => setSortBy(e.target.value as any)}
                          className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="name">Ordenar por: Nombre</option>
                          <option value="id">Ordenar por: ID</option>
                          <option value="plan">Ordenar por: Plan</option>
                          <option value="commercialStatus">Ordenar por: Estado</option>
                        </select>

                        <button
                          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 font-bold cursor-pointer"
                          title="Alternar Orden"
                        >
                          <span>{sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Tenants Table/Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTenants.map(tenant => (
                        <div key={tenant.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">{tenant.name}</h3>
                              <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">ID: {tenant.id}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              tenant.commercialStatus === 'Trial' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20' :
                              tenant.commercialStatus === 'Activo' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                              tenant.commercialStatus === 'Suspendido' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                              'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                            }`}>
                              {tenant.commercialStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/40">
                            <div>
                              <p className="text-[9px] text-slate-500">Plan</p>
                              <p className="font-bold text-slate-200">{tenant.plan}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500">Tipo de Negocio</p>
                              <p className="font-semibold text-slate-300">{tenant.businessType}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[9px] text-slate-500">Contacto principal</p>
                              <p className="text-slate-300 truncate">{tenant.email}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[9px] text-slate-500">Dominio</p>
                              <p className="text-indigo-400 font-mono truncate">{tenant.domain}</p>
                            </div>
                          </div>

                          <div className="flex gap-2.5">
                            <button
                              onClick={() => setEditingTenant(tenant)}
                              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold transition-all"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleTenantStatus(tenant.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center border ${
                                tenant.status === 'active' 
                                  ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' 
                                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={tenant.status === 'active' ? 'Suspender' : 'Reactivar'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSoftDeleteTenant(tenant.id)}
                              className="px-3 py-2 rounded-xl border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all flex items-center justify-center"
                              title="Borrado Lógico"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setReassigningOwnerTenant(tenant);
                                setNewOwnerEmail(tenant.email);
                              }}
                              className="px-3 py-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center text-[10px] font-bold"
                              title="Reasignar Dueño"
                            >
                              Propietario
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. AUTOMATED ONBOARDING ASSISTANT TAB */}
                {activeTab === 'onboarding' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Form Section (Wizard) */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col justify-between">
                      
                      {/* Wizard Header & Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-display font-black text-white tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                            <span>Onboarding de Clientes</span>
                          </h2>
                          <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                            Paso {wizardStep} de 5
                          </span>
                        </div>

                        {/* Progress Tracker Bar */}
                        <div className="grid grid-cols-5 gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map((step) => (
                            <button
                              key={step}
                              type="button"
                              disabled={isOnboardingRunning}
                              onClick={() => {
                                // Allow jumping back or to valid steps
                                if (step < wizardStep) setWizardStep(step);
                              }}
                              className={`h-1.5 rounded-full transition-all ${
                                step === wizardStep ? 'bg-indigo-500 shadow-md shadow-indigo-500/30' :
                                step < wizardStep ? 'bg-emerald-500' : 'bg-slate-800'
                              }`}
                              title={`Ir al Paso ${step}`}
                            />
                          ))}
                        </div>

                        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 mb-6 text-xs text-slate-400">
                          {wizardStep === 1 && "Ingresa la información comercial básica del nuevo cliente y los datos de contacto inicial."}
                          {wizardStep === 2 && "Define el identificador del cluster para el subdominio, idioma, huso horario y moneda principal."}
                          {wizardStep === 3 && "Selecciona el plan contratado. Esto cargará dinámicamente los módulos y límites en el cluster."}
                          {wizardStep === 4 && "Registra los datos del usuario administrador que tendrá el rol inicial de PROPIETARIO."}
                          {wizardStep === 5 && "Revisa la configuración completa del nuevo Resort antes de ejecutar el pipeline atómico."}
                        </div>
                      </div>

                      {/* Step Forms */}
                      <div className="flex-1 space-y-4">
                        
                        {/* STEP 1: DATOS GENERALES */}
                        {wizardStep === 1 && (
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paso 1: Datos Generales</h3>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Comercial del Resort</label>
                              <input
                                type="text"
                                required
                                placeholder="ej: Sierra Refugio Glamping"
                                value={onboardingForm.name}
                                onChange={e => setOnboardingForm({ ...onboardingForm, name: e.target.value })}
                                disabled={isOnboardingRunning}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Razón Social / Identificación Fiscal</label>
                              <input
                                type="text"
                                required
                                placeholder="ej: Sierra Refugio S.A.S."
                                value={onboardingForm.razonSocial}
                                onChange={e => setOnboardingForm({ ...onboardingForm, razonSocial: e.target.value })}
                                disabled={isOnboardingRunning}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Email del Cliente (Contractual)</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="ej: sierrarefugio@gmail.com"
                                  value={onboardingForm.ownerEmail}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, ownerEmail: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Móvil</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="ej: +54 9 294 555-0138"
                                  value={onboardingForm.phone}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, phone: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">País</label>
                                <input
                                  type="text"
                                  required
                                  value={onboardingForm.country}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, country: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Provincia/Estado</label>
                                <input
                                  type="text"
                                  required
                                  value={onboardingForm.province}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, province: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Ciudad</label>
                                <input
                                  type="text"
                                  required
                                  value={onboardingForm.city}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, city: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* STEP 2: CONFIGURACIÓN INICIAL */}
                        {wizardStep === 2 && (
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paso 2: Configuración Inicial</h3>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Subdominio ID (Identificador único)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  required
                                  placeholder="ej: sierra-refugio"
                                  value={onboardingForm.id}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                                  disabled={isOnboardingRunning}
                                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono"
                                />
                                <span className="text-xs font-mono text-slate-500">.stayflow.app</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Complejo</label>
                                <select
                                  value={onboardingForm.businessType}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, businessType: e.target.value as any })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-300"
                                >
                                  <option value="CABIN">Cabañas (Cabin)</option>
                                  <option value="GLAMPING">Glamping</option>
                                  <option value="HOTEL">Hotel</option>
                                  <option value="CAMPING">Camping</option>
                                  <option value="OTHER">Otro</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Alojamientos Iniciales (Cantidad)</label>
                                <input
                                  type="number"
                                  required
                                  min={1}
                                  max={100}
                                  value={onboardingForm.accommodationsQty}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, accommodationsQty: Math.max(1, parseInt(e.target.value) || 1) })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Idioma Default</label>
                                <select
                                  value={onboardingForm.language}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, language: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                                >
                                  <option value="es">Español</option>
                                  <option value="en">Inglés</option>
                                  <option value="pt">Portugués</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Moneda Base</label>
                                <input
                                  type="text"
                                  required
                                  value={onboardingForm.currency}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, currency: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Zona Horaria</label>
                                <select
                                  value={onboardingForm.timezone}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, timezone: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                                >
                                  <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                                  <option value="America/Sao_Paulo">Sao Paulo</option>
                                  <option value="America/Santiago">Santiago</option>
                                  <option value="America/Bogota">Bogotá</option>
                                  <option value="America/Mexico_City">Ciudad de México</option>
                                  <option value="UTC">UTC</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* STEP 3: PLAN CONTRATADO */}
                        {wizardStep === 3 && (
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paso 3: Plan Contratado</h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                              {plans.map(p => {
                                const isSelected = onboardingForm.plan === p.id;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    disabled={isOnboardingRunning}
                                    onClick={() => setOnboardingForm({ ...onboardingForm, plan: p.id as SaaSPlan })}
                                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between h-[155px] cursor-pointer ${
                                      isSelected 
                                        ? 'bg-indigo-600/10 border-indigo-500 shadow-md' 
                                        : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-display font-black text-xs text-white">{p.name}</span>
                                        {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400"></span>}
                                      </div>
                                      <p className="text-[11px] text-slate-400 font-mono">${p.price}/mes</p>
                                    </div>

                                    <div className="space-y-1 border-t border-slate-800/40 pt-2 text-[9px] text-slate-500 w-full">
                                      <div className="flex justify-between">
                                        <span>Alojamientos:</span>
                                        <span className="font-bold text-slate-300">{p.maxAccommodations}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Usuarios:</span>
                                        <span className="font-bold text-slate-300">{p.maxUsers}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Espacio:</span>
                                        <span className="font-bold text-slate-300">{p.maxStorageMB} MB</span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* STEP 4: USUARIO PROPIETARIO & BRANDING */}
                        {wizardStep === 4 && (
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paso 4: Administrador Inicial</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="ej: Adrián"
                                  value={onboardingForm.ownerName}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, ownerName: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Apellido</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="ej: Gaborios"
                                  value={onboardingForm.ownerLastName}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, ownerLastName: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Email de Cuenta (Inicio de sesión)</label>
                              <input
                                type="email"
                                required
                                placeholder="ej: gaboriosadrian@gmail.com"
                                value={onboardingForm.ownerEmail}
                                onChange={e => setOnboardingForm({ ...onboardingForm, ownerEmail: e.target.value })}
                                disabled={isOnboardingRunning}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Color Primario Corporativo (Branding)</label>
                              <div className="flex gap-2.5">
                                <input
                                  type="color"
                                  value={onboardingForm.primaryColor}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, primaryColor: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="w-10 h-10 rounded-xl bg-transparent border border-slate-800 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={onboardingForm.primaryColor}
                                  onChange={e => setOnboardingForm({ ...onboardingForm, primaryColor: e.target.value })}
                                  disabled={isOnboardingRunning}
                                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* STEP 5: RESUMEN Y CONFIRMACIÓN */}
                        {wizardStep === 5 && (
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paso 5: Revisión de Configuración</h3>
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                <span className="text-[8px] text-slate-500 uppercase">Resort Comercial</span>
                                <p className="font-sans font-bold text-white truncate">{onboardingForm.name}</p>
                                <p className="text-indigo-400 text-[9px] truncate">{onboardingForm.id}.stayflow.app</p>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                <span className="text-[8px] text-slate-500 uppercase">Fiscal</span>
                                <p className="font-sans font-semibold text-slate-300 truncate">{onboardingForm.razonSocial || onboardingForm.name}</p>
                                <p className="text-[9px] text-slate-400">Contacto: {onboardingForm.phone}</p>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                <span className="text-[8px] text-slate-500 uppercase">Ubicación y Entorno</span>
                                <p className="text-slate-300">{onboardingForm.city}, {onboardingForm.province}</p>
                                <p className="text-slate-400">{onboardingForm.country}</p>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                <span className="text-[8px] text-slate-500 uppercase">Suscripción SaaS</span>
                                <p className="font-sans font-bold text-indigo-400">Plan {onboardingForm.plan}</p>
                                <p className="text-slate-400">Moneda Base: {onboardingForm.currency}</p>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 col-span-2 space-y-1">
                                <span className="text-[8px] text-slate-500 uppercase">Dueño Inicial del Tenant</span>
                                <p className="font-sans font-semibold text-slate-200">{onboardingForm.ownerName} {onboardingForm.ownerLastName}</p>
                                <p className="text-indigo-300 truncate">{onboardingForm.ownerEmail}</p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Navigation buttons */}
                      <div className="flex gap-4 pt-4 border-t border-slate-800/60 mt-6">
                        {wizardStep > 1 && (
                          <button
                            type="button"
                            disabled={isOnboardingRunning}
                            onClick={() => setWizardStep(prev => prev - 1)}
                            className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 font-bold hover:bg-slate-850 transition-all cursor-pointer"
                          >
                            Atrás
                          </button>
                        )}
                        
                        {wizardStep < 5 ? (
                          <button
                            type="button"
                            disabled={
                              (wizardStep === 1 && (!onboardingForm.name || !onboardingForm.ownerEmail || !onboardingForm.phone)) ||
                              (wizardStep === 2 && !onboardingForm.id) ||
                              (wizardStep === 4 && (!onboardingForm.ownerName || !onboardingForm.ownerLastName))
                            }
                            onClick={() => setWizardStep(prev => prev + 1)}
                            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                          >
                            Siguiente Paso
                          </button>
                        ) : (
                          <form onSubmit={handleOnboardingSubmit} className="flex-1">
                            <button
                              type="submit"
                              disabled={isOnboardingRunning}
                              className="w-full min-h-[44px] flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black tracking-wide shadow-md shadow-indigo-600/10 cursor-pointer"
                            >
                              {isOnboardingRunning ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>PROVISIONANDO SISTEMAS...</span>
                                </>
                              ) : (
                                <>
                                  <span>EJECUTAR ALTA ATÓMICA COMPLETA</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>

                    </div>

                    {/* Console Logger Display */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-sm text-white">Consola de Estado & Revertibilidad</h3>
                          {onboardingSuccess === true && (
                            <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">ÉXITO</span>
                          )}
                          {onboardingSuccess === false && (
                            <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">FALLIDO (ROLLBACK)</span>
                          )}
                        </div>
                        
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 h-[320px] font-mono text-[10px] text-slate-300 overflow-y-auto space-y-2 select-text">
                          {onboardingLogs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 italic text-center p-4">
                              Completa el asistente de {5 - wizardStep + 1} pasos y presiona "Ejecutar" para observar el pipeline de aprovisionamiento de bases en tiempo real...
                            </div>
                          ) : (
                            onboardingLogs.map((log, idx) => (
                              <div key={idx} className={`${
                                log.includes('[ERROR]') ? 'text-rose-400 font-bold' :
                                log.includes('[OK]') ? 'text-emerald-400 font-semibold' :
                                log.includes('[DESHACER]') ? 'text-amber-400 font-bold' :
                                log.includes('[COMPLETADO]') ? 'text-indigo-400 font-extrabold underline' :
                                'text-slate-400'
                              }`}>
                                {log}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/60 mt-4 text-[10px] text-slate-400 leading-relaxed font-sans">
                        <p className="font-bold text-slate-300 mb-1">Garantía Atómica StayFlow</p>
                        El aprovisionador opera en un pipeline con un manejador de transacciones simulado. Si alguna de las operaciones de base de datos (seeding, CMS, asignación de roles o base de páginas) falla, la pila ejecutará un deshacer en orden inverso garantizando cero contaminación o datos huérfanos.
                      </div>
                    </div>

                  </div>
                )}

                {/* 4. PLANS & LIMITS TAB */}
                {activeTab === 'plans' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-display font-black text-white tracking-tight">Estructura de Planes & Módulos</h2>
                      <p className="text-slate-400 text-xs">Alineación de límites contractuales y disponibilidad de módulos por nivel.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {plans.map(plan => (
                        <div key={plan.id} className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                          {plan.id === 'Enterprise' && (
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-mono px-3 py-1 font-extrabold uppercase rounded-bl-xl tracking-wider">RECOMENDADO</div>
                          )}
                          <div className="space-y-3">
                            <h3 className="font-display font-black text-base text-white">{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-extrabold text-white">${plan.price}</span>
                              <span className="text-xs text-slate-500">/ mes (USD)</span>
                            </div>
                            
                            <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Usuarios máximos</span>
                                <span className="font-bold text-white">{plan.maxUsers}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Aloj. permitidos</span>
                                <span className="font-bold text-white">{plan.maxAccommodations}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Límite de Disco</span>
                                <span className="font-bold text-white">{plan.maxStorageMB} MB</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-3">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Módulos habilitados</p>
                              <div className="flex flex-wrap gap-1">
                                {plan.enabledFeatures.map(feat => (
                                  <span key={feat} className="text-[9px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-950 rounded-xl text-center border border-slate-850/60 text-[10px] text-indigo-400 font-mono font-bold">
                            Límites activos en cluster
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. USER MANAGEMENT TAB */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-display font-black text-white tracking-tight">Directorio General de Usuarios</h2>
                      <p className="text-slate-400 text-xs">Visualiza accesos, bloquea accesos y reasigna administradores de resorts.</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                              <th className="p-4">Usuario</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Resorts & Roles</th>
                              <th className="p-4">Último Acceso</th>
                              <th className="p-4 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {usersList.map((usr: any) => (
                              <tr key={usr.uid} className="hover:bg-slate-850/30 transition-colors">
                                <td className="p-4 font-bold text-slate-200">{usr.displayName || 'Usuario de Google'}</td>
                                <td className="p-4 font-mono text-slate-300">{usr.email}</td>
                                <td className="p-4 space-y-1">
                                  {usr.resortsAssigned.length === 0 ? (
                                    <span className="text-slate-500 italic text-[11px]">Ninguno</span>
                                  ) : (
                                    usr.resortsAssigned.map((as: any, idx: number) => (
                                      <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                        <span className="font-semibold text-white">{as.resortName}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono border border-indigo-500/20 font-bold uppercase">{as.role}</span>
                                      </div>
                                    ))
                                  )}
                                </td>
                                <td className="p-4 text-slate-400">{usr.lastLogin ? new Date(usr.lastLogin).toLocaleString() : 'Nunca'}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleToggleUserStatus(usr.uid)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer ${
                                      usr.active === false 
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10' 
                                        : 'bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white'
                                    }`}
                                  >
                                    {usr.active === false ? 'Habilitar' : 'Bloquear'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SYSTEM AUDIT TAB */}
                {activeTab === 'audit' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-display font-black text-white tracking-tight">Consola de Auditoría de Sistemas</h2>
                      <p className="text-slate-400 text-xs">Bitácora centralizada de eventos y mutaciones globales del cluster StayFlow.</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
                      
                      {/* Audit Log Table */}
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {auditLogs.map(log => (
                          <div key={log.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  log.action.includes('PROVISIONED') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                  log.action.includes('SOFT_DELETED') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {log.action}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">{log.id}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-300 font-medium">{log.details}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-900 text-[10px] text-slate-400 font-mono">
                              <div>
                                <span className="text-slate-500">Módulo:</span> {log.entityType}
                              </div>
                              <div>
                                <span className="text-slate-500">ID Entidad:</span> {log.entityId}
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-500">Actor/Usuario:</span> {log.userEmail || log.userId}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}

                {/* 7. HEALTH MONITOR TAB & NOC OBSERVABILITY SUITE */}
                {activeTab === 'health' && healthStatus && (
                  <div className="space-y-8">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/40 pb-5">
                      <div>
                        <h2 className="text-xl font-display font-black text-white tracking-tight">Centro de Control de Observabilidad & NOC</h2>
                        <p className="text-slate-400 text-xs">Monitoreo técnico unificado en tiempo real del cluster SaaS, telemetría y salud de tenants.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={loadAllData}
                          disabled={isCheckingHealth}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/10"
                        >
                          <RefreshCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                          <span>Actualizar NOC</span>
                        </button>
                      </div>
                    </div>

                    {/* Executive SLA KPIs */}
                    {executiveIndicators && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SLA de Disponibilidad</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-emerald-400 font-mono">
                              {executiveIndicators.availabilityRate.toFixed(2)}%
                            </span>
                            <span className="text-[9px] text-slate-500">objetivo: 99.9%</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uptime de Plataforma</span>
                          <div className="text-2xl font-black text-slate-200 font-mono">
                            {executiveIndicators.uptimeFormatted}
                          </div>
                          <p className="text-[9px] text-slate-500 leading-none">Sin incidentes de red críticos</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tasa de Transacciones OK</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-indigo-400 font-mono">
                              {executiveIndicators.paymentSuccessRate}%
                            </span>
                            <span className="text-[9px] text-slate-500">• Pagos</span>
                          </div>
                          <p className="text-[9px] text-slate-500 leading-none">Reservas confirmadas: {executiveIndicators.bookingSuccessRate}%</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Errores Recientes (24h)</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-black font-mono ${
                              executiveIndicators.errorsLast24h > 10 ? 'text-amber-500' : 'text-slate-400'
                            }`}>
                              {executiveIndicators.errorsLast24h}
                            </span>
                            <span className="text-[9px] text-slate-500">mensajes agrupados</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, executiveIndicators.errorsLast24h * 5)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Alert Engine Active Incidents Board */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Engine - Incidentes Activos</h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                          obsAlerts.filter(a => !a.resolved).length > 0 
                            ? 'bg-rose-500/20 text-rose-300 animate-pulse border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {obsAlerts.filter(a => !a.resolved).length} Activos
                        </span>
                      </div>

                      {obsAlerts.filter(a => !a.resolved).length === 0 ? (
                        <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-2xl flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-emerald-200">Plataforma libre de alarmas activas</p>
                            <p className="text-[10px] text-emerald-400/80">Todos los umbrales de latencia, operaciones e inicio de sesión se mantienen dentro del SLA.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {obsAlerts.filter(a => !a.resolved).map(alert => (
                            <div key={alert.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              alert.severity === 'CRITICAL' 
                                ? 'bg-rose-950/20 border-rose-900/50' 
                                : 'bg-amber-950/20 border-amber-900/50'
                            }`}>
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-xl mt-0.5 ${
                                  alert.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                                }`}>
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-white">{alert.title}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                      alert.severity === 'CRITICAL' ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                                    }`}>
                                      {alert.severity}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 leading-normal max-w-2xl">{alert.message}</p>
                                  <div className="flex items-center gap-2.5 text-[9px] text-slate-500 font-mono">
                                    <span>Origen: {alert.source}</span>
                                    <span>•</span>
                                    <span>Detectado: {new Date(alert.timestamp).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-[10px] rounded-xl border border-slate-700 transition-all cursor-pointer self-start md:self-auto"
                              >
                                Resolver Incidente
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Technical Health Indicators (10 Target Modules) */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado de Servicios del Cluster ({healthStatus.components.length} Monitoreados)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {healthStatus.components.map((comp, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl space-y-3.5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg ${
                                  comp.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  <Server className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-xs text-white">{comp.name}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                                comp.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {comp.status === 'healthy' ? 'ONLINE' : comp.status}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-normal h-8 overflow-hidden line-clamp-2">
                              {comp.details}
                            </p>

                            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono border-t border-slate-850/40 pt-2.5">
                              <div className="flex items-center gap-1">
                                <span>Latencia:</span>
                                <span className="font-bold text-slate-300">{comp.latencyMs ? `${comp.latencyMs}ms` : '1ms'}</span>
                              </div>
                              <span>{new Date(comp.lastChecked).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Multi-Tenant Health Profiles */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perfil de Salud & Consumos de Tenants</h3>
                        <span className="text-[10px] text-slate-500 font-mono">Consumos calculados dinámicamente</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-950/40 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                <th className="p-4">Cliente / ID</th>
                                <th className="p-4">Estado / Plan</th>
                                <th className="p-4">Reservas</th>
                                <th className="p-4">Firestore Ops</th>
                                <th className="p-4">Storage (MB)</th>
                                <th className="p-4">Usuarios Activos</th>
                                <th className="p-4 text-center">Alertas / Errores</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/40 text-[11px]">
                              {tenantHealthReports.map((report) => (
                                <tr key={report.tenantId} className="hover:bg-slate-850/15 transition-colors">
                                  <td className="p-4 font-sans">
                                    <div className="font-bold text-slate-200">{report.name}</div>
                                    <div className="text-[9px] text-slate-500 font-mono">{report.tenantId}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        report.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                                      }`}></span>
                                      <span className="text-xs font-semibold capitalize text-slate-300">{report.plan}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-mono text-slate-300 font-semibold">
                                    {report.reservationsCount}
                                  </td>
                                  <td className="p-4 font-mono text-slate-400">
                                    {report.firestoreUsageCount} <span className="text-[9px] text-slate-600">consultas</span>
                                  </td>
                                  <td className="p-4 space-y-1">
                                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                      <span>{report.storageUsedMB} MB</span>
                                      <span>/ {report.limits.maxStorageMB} MB</span>
                                    </div>
                                    <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-500 rounded-full" 
                                        style={{ width: `${Math.min(100, (report.storageUsedMB / report.limits.maxStorageMB) * 100)}%` }}
                                      ></div>
                                    </div>
                                  </td>
                                  <td className="p-4 font-mono text-slate-300">
                                    {report.authUsersCount} <span className="text-[9px] text-slate-500">/ {report.limits.maxUsers} max</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    {report.errorsCount > 0 ? (
                                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold">
                                        {report.errorsCount} errores
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold">
                                        0 incidentes
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Centralized Live Logger (NOC Terminal Viewer) */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bitácora de Eventos y Logger de Plataforma</h3>
                          <p className="text-[10px] text-slate-500 leading-normal">Bitácora del clúster con clasificación por severidades DEBUG, INFO, WARN, ERROR, CRITICAL.</p>
                        </div>
                        {/* Severity level filters */}
                        <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                          {['ALL', 'INFO', 'WARN', 'ERROR', 'CRITICAL', 'DEBUG'].map(level => (
                            <button
                              key={level}
                              onClick={() => setLogFilter(level)}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                                logFilter === level
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Log Console Window */}
                      <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Terminal header */}
                        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-850">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">stayflow@noc-node-01:~</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Log Stream Active</span>
                        </div>

                        {/* Terminal Body */}
                        <div className="p-4 font-mono text-[10px] leading-relaxed max-h-[350px] overflow-y-auto space-y-2 h-[350px] select-text">
                          {obsLogs
                            .filter(l => logFilter === 'ALL' || l.severity === logFilter)
                            .map((log, index) => {
                              let sevColor = 'text-cyan-400';
                              if (log.severity === 'WARN') sevColor = 'text-amber-400';
                              else if (log.severity === 'ERROR') sevColor = 'text-rose-400';
                              else if (log.severity === 'CRITICAL') sevColor = 'text-red-500 font-bold bg-red-950/20 px-1 py-0.5 rounded';
                              else if (log.severity === 'DEBUG') sevColor = 'text-purple-400';

                              return (
                                <div key={log.id || index} className="hover:bg-slate-900/40 py-0.5 px-1 rounded transition-colors flex items-start gap-3">
                                  <span className="text-slate-600 shrink-0">{new Date(log.timestamp).toISOString()}</span>
                                  <span className={`font-black shrink-0 w-14 ${sevColor}`}>[{log.severity}]</span>
                                  <span className="text-slate-300 break-all">{log.message}</span>
                                </div>
                              );
                            })}

                          {obsLogs.filter(l => logFilter === 'ALL' || l.severity === logFilter).length === 0 && (
                            <div className="text-slate-600 italic text-center py-10">
                              No hay registros que coincidan con la severidad seleccionada.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. GLOBAL PLATFORM CONFIG TAB */}
                {activeTab === 'config' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-display font-black text-white tracking-tight">Configuraciones Generales de StayFlow</h2>
                      <p className="text-slate-400 text-xs">Administra la marca, versión del cluster, emails de soporte y modo mantenimiento.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      {/* Form section */}
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
                        <h3 className="font-display font-bold text-sm text-white">Marca de Plataforma</h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre de Plataforma</label>
                            <input
                              type="text"
                              value={globalConfig.platformName}
                              onChange={e => handleUpdateGlobalConfig({ platformName: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Email de Soporte Técnico</label>
                              <input
                                type="email"
                                value={globalConfig.supportEmail}
                                onChange={e => handleUpdateGlobalConfig({ supportEmail: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Email Comercial</label>
                              <input
                                type="email"
                                value={globalConfig.contactEmail}
                                onChange={e => handleUpdateGlobalConfig({ contactEmail: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Sitio Web Comercial</label>
                            <input
                              type="text"
                              value={globalConfig.commercialWebsite}
                              onChange={e => handleUpdateGlobalConfig({ commercialWebsite: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Operation Controls */}
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
                        <h3 className="font-display font-bold text-sm text-white">Controles Operacionales</h3>
                        
                        <div className="space-y-5">
                          
                          {/* Maintenance toggle */}
                          <div className="flex items-start justify-between gap-4 p-4 bg-slate-950 rounded-xl border border-slate-850">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span>Modo Mantenimiento Global</span>
                              </p>
                              <p className="text-[10px] text-slate-400 leading-relaxed max-w-[280px]">
                                Al habilitarlo, todos los resorts presentarán un banner de mantenimiento y restringirá las reservas preventivamente.
                              </p>
                            </div>
                            <button
                              onClick={() => handleUpdateGlobalConfig({ maintenanceMode: !globalConfig.maintenanceMode })}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                globalConfig.maintenanceMode 
                                  ? 'bg-amber-600 text-white hover:bg-amber-500' 
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {globalConfig.maintenanceMode ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>

                          {/* Global Banner message */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Anuncio global de plataforma (Banner)</label>
                            <textarea
                              placeholder="ej: El día Domingo 24 se realizarán actualizaciones del cluster Mercado Pago..."
                              value={globalConfig.globalNotificationMessage}
                              onChange={e => handleUpdateGlobalConfig({ globalNotificationMessage: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white h-20 resize-none"
                            />
                          </div>

                          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/60 text-[10px] text-slate-500 flex justify-between font-mono">
                            <span>SaaS Cluster Build: 9a8df13b</span>
                            <span>Node Environment: Production</span>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 9. ENTERPRISE HARDENING & PRODUCTION READY TAB */}
                {activeTab === 'production' && (
                  <ProductionHardeningConsole />
                )}

                {/* 10. SAAS COMMERCIAL & CRM TAB */}
                {activeTab === 'saas-commercial' && (
                  <CommercialDashboard />
                )}

              </motion.div>
            </AnimatePresence>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 9. MODALS SECTION */}
      {/* ========================================================================= */}

      {/* Editing Tenant General Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display font-extrabold text-sm text-white">Ficha Integral de Cliente SaaS</h3>
              <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                ID: {editingTenant.id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Section */}
              <form onSubmit={handleSaveTenantEdits} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.name}
                    onChange={e => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Plan Contratado</label>
                    <select
                      value={editingTenant.plan}
                      onChange={e => setEditingTenant({ ...editingTenant, plan: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                    >
                      <option value="Starter">Starter</option>
                      <option value="Professional">Professional</option>
                      <option value="Business">Business</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Estado Comercial</label>
                    <select
                      value={editingTenant.commercialStatus}
                      onChange={e => setEditingTenant({ ...editingTenant, commercialStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                    >
                      <option value="Trial">Trial</option>
                      <option value="Activo">Activo</option>
                      <option value="Suspendido">Suspendido</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="Pendiente de Pago">Pendiente de Pago</option>
                      <option value="Vencido">Vencido</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email de Contacto</label>
                  <input
                    type="email"
                    required
                    value={editingTenant.email}
                    onChange={e => setEditingTenant({ ...editingTenant, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.phone}
                    onChange={e => setEditingTenant({ ...editingTenant, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Dominio Personalizado</label>
                  <input
                    type="text"
                    value={editingTenant.domain || ''}
                    placeholder="ej: miejemplo.com"
                    onChange={e => setEditingTenant({ ...editingTenant, domain: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setEditingTenant(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold transition-all cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>

              {/* History / Audit Section */}
              <div className="flex flex-col justify-between space-y-4 border-l border-slate-800 pl-6 h-full min-h-[380px]">
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Historial de Transacciones</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Bitácora histórica específica de cambios de plan, asignación de dueños y operaciones lógicas del resort.</p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[320px] space-y-3 pr-1">
                  {selectedTenantHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-xs text-center">
                      No se registran transacciones previas en este cluster.
                    </div>
                  ) : (
                    selectedTenantHistory.map((item: any) => (
                      <div key={item.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-mono font-bold text-indigo-400 uppercase">{item.action}</span>
                          <span className="text-slate-500 font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 font-medium leading-relaxed">{item.details}</p>
                        <div className="text-[9px] text-slate-500 font-mono truncate">
                          Por: {item.userEmail || 'system@stayflow.app'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reassign Owner Modal */}
      {reassigningOwnerTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="font-display font-extrabold text-sm text-white">Reasignar Propietario del Resort</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Ingresa el correo electrónico del nuevo propietario. El usuario debe estar previamente registrado en el sistema. Se desactivará al propietario anterior para este resort.
            </p>

            <form onSubmit={handleReassignOwner} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email del Nuevo Propietario</label>
                <input
                  type="email"
                  required
                  placeholder="ej: correo@gmail.com"
                  value={newOwnerEmail}
                  onChange={e => setNewOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setReassigningOwnerTenant(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold transition-all cursor-pointer"
                >
                  Reasignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
