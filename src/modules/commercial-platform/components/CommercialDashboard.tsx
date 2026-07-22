import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  X, 
  Send, 
  Check, 
  Sparkles, 
  ArrowRight, 
  BarChart4, 
  Filter, 
  Plus, 
  User, 
  Trash2,
  DollarSign,
  AlertTriangle,
  Mail,
  Phone,
  FileSpreadsheet,
  Globe,
  Loader2,
  CreditCard,
  FileText,
  Percent,
  Play,
  Pause,
  Calendar,
  Activity,
  Award
} from 'lucide-react';
import { CommercialService } from '../services/CommercialService';
import { CommercialLead, CommercialPlan, CommercialMetrics, BillingProfile, SaaSPlanType, Subscription, License, BillingAccount, BillingHistory, BillingEvent, Coupon, FinancialMetrics } from '../types';
import { CommercialRepository } from '../services/CommercialRepository';
import { SubscriptionEngine } from '../services/SubscriptionEngine';
import { BillingEngine } from '../services/BillingEngine';
import { LicenseService } from '../services/LicenseService';
import { PlanService } from '../services/PlanService';
import { InvoiceService } from '../services/InvoiceService';
import { FinancialDashboardService } from '../services/FinancialDashboardService';
import { SubscriptionValidator } from '../services/SubscriptionValidator';

export const CommercialDashboard: React.FC = () => {
  // Existing states
  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [metrics, setMetrics] = useState<CommercialMetrics | null>(null);
  const [billingProfiles, setBillingProfiles] = useState<BillingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'crm' | 'analytics' | 'plans' | 'billing' | 'subscriptions' | 'sandbox'>('crm');

  // Selected lead for detail/approval
  const [selectedLead, setSelectedLead] = useState<CommercialLead | null>(null);
  const [approving, setApproving] = useState(false);
  const [selectedPlanForApprove, setSelectedPlanForApprove] = useState<SaaSPlanType>('Professional');
  const [crmNote, setCrmNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Plan editing
  const [selectedPlan, setSelectedPlan] = useState<CommercialPlan | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  // --- NEW SUBSCRIPTION / BILLING STATES ---
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [billingAccounts, setBillingAccounts] = useState<BillingAccount[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  
  // Selected Tenant context for detail actions
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [targetPlanId, setTargetPlanId] = useState<SaaSPlanType>('Professional');
  const [couponCode, setCouponCode] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<number>(50);
  const [creditReason, setCreditReason] = useState<string>('');
  
  // Coupon creation
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponVal, setNewCouponVal] = useState<number>(15);

  const [sandboxRunning, setSandboxRunning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      await CommercialService.initializeData();
      await PlanService.initializePlans();
      await InvoiceService.getCoupons(); // Ensure coupons seeded

      const [l, p, m, b, subs, lics, accs, finM, c, hist, evts] = await Promise.all([
        CommercialService.getLeads(),
        PlanService.getPlans(),
        CommercialService.getMetrics(),
        CommercialService.getBillingProfiles(),
        CommercialRepository.getSubscriptions(),
        CommercialRepository.getLicenses(),
        CommercialRepository.getBillingAccounts(),
        FinancialDashboardService.getFinancialMetrics(),
        InvoiceService.getCoupons(),
        CommercialRepository.getBillingHistory(),
        CommercialRepository.getBillingEvents()
      ]);

      setLeads(l);
      setPlans(p);
      setMetrics(m);
      setBillingProfiles(b);
      setSubscriptions(subs);
      setLicenses(lics);
      setBillingAccounts(accs);
      setFinancialMetrics(finM);
      setCoupons(c);
      setBillingHistory(hist);
      setBillingEvents(evts);

      if (subs.length > 0 && !selectedTenantId) {
        setSelectedTenantId(subs[0].tenantId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // --- CRM CONTROLS ---
  const handleStageChange = async (leadId: string, newStage: CommercialLead['status']) => {
    try {
      const updated = await CommercialService.updateLeadStage(leadId, newStage, crmNote || undefined);
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
      setSelectedLead(updated);
      setCrmNote('');
      triggerToast(`Prospecto actualizado al estado: ${newStage}`);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAndProvision = async () => {
    if (!selectedLead) return;
    setApproving(true);
    try {
      const tenantId = await CommercialService.provisionTenant(selectedLead, selectedPlanForApprove);
      triggerToast(`¡Tenant "${tenantId}" aprovisionado y activado exitosamente!`);
      setSelectedLead(null);
      await loadData();
      setSelectedTenantId(tenantId);
    } catch (err: any) {
      alert(err.message || 'Error al aprovisionar el tenant');
    } finally {
      setApproving(false);
    }
  };

  // --- PLAN MANAGEMENT CONTROLS ---
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSavingPlan(true);
    try {
      await PlanService.updatePlan(selectedPlan, 'admin@stayflow.app');
      setPlans(prev => prev.map(p => p.id === selectedPlan.id ? selectedPlan : p));
      setSelectedPlan(null);
      triggerToast(`Plan "${selectedPlan.name}" guardado correctamente.`);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPlan(false);
    }
  };

  // --- SUBSCRIPTION ACTIONS ---
  const handlePlanChange = async () => {
    if (!selectedTenantId) return;
    try {
      setLoading(true);
      await SubscriptionEngine.changePlan(selectedTenantId, targetPlanId, 'admin@stayflow.app');
      triggerToast(`Plan de ${selectedTenantId} actualizado con éxito a ${targetPlanId}`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSub = async () => {
    if (!selectedTenantId) return;
    try {
      setLoading(true);
      await SubscriptionEngine.pauseSubscription(selectedTenantId, 'admin@stayflow.app');
      triggerToast(`Suscripción de ${selectedTenantId} pausada temporalmente`);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSub = async () => {
    if (!selectedTenantId) return;
    try {
      setLoading(true);
      await SubscriptionEngine.reactivateSubscription(selectedTenantId, 'admin@stayflow.app');
      triggerToast(`Suscripción de ${selectedTenantId} reactivada correctamente`);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSub = async () => {
    if (!selectedTenantId) return;
    if (!window.confirm('¿Está seguro de cancelar la suscripción? Esto inhabilitará la licencia inmediatamente.')) return;
    try {
      setLoading(true);
      await SubscriptionEngine.cancelSubscription(selectedTenantId, 'admin@stayflow.app');
      triggerToast(`Suscripción de ${selectedTenantId} cancelada`);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- BILLING / COBROS ACTIONS ---
  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || creditAmount <= 0) return;
    try {
      setLoading(true);
      await BillingEngine.allocateCredits(selectedTenantId, creditAmount, creditReason || 'Crédito de cortesía comercial', 'admin@stayflow.app');
      setCreditAmount(50);
      setCreditReason('');
      triggerToast(`Crédito de $${creditAmount} asignado con éxito a ${selectedTenantId}`);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    try {
      setLoading(true);
      const coupon: Coupon = {
        id: newCouponCode.toUpperCase(),
        code: newCouponCode.toUpperCase(),
        discountType: newCouponType,
        discountValue: newCouponVal,
        expiryDate: '2027-12-31',
        active: true,
        redemptionsCount: 0
      };
      await InvoiceService.createCoupon(coupon);
      setNewCouponCode('');
      triggerToast(`Cupón de descuento ${coupon.code} creado exitosamente.`);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedTenantId) return;
    try {
      setLoading(true);
      const sub = subscriptions.find(s => s.tenantId === selectedTenantId);
      if (!sub) throw new Error('Suscripción no encontrada');

      const success = await BillingEngine.processSubscriptionCharge(selectedTenantId, sub.amount, couponCode || undefined);
      if (success) {
        triggerToast(`Cobro procesado exitosamente para ${selectedTenantId}`);
        setCouponCode('');
      } else {
        alert('El cobro falló. Se inició la secuencia de Cobranza.');
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  // --- SANDBOX SIMULATIONS ---
  const runConversionSimulation = async () => {
    if (!selectedTenantId) return;
    setSandboxRunning(true);
    try {
      await SubscriptionEngine.convertTrialToPaid(selectedTenantId);
      triggerToast(`Simulación completada: Periodo de prueba de ${selectedTenantId} convertido a pago con éxito.`);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Error en simulación');
    } finally {
      setSandboxRunning(false);
    }
  };

  const runFailedPaymentSequenceSimulation = async () => {
    if (!selectedTenantId) return;
    setSandboxRunning(true);
    try {
      const sub = subscriptions.find(s => s.tenantId === selectedTenantId);
      if (!sub) throw new Error('Suscripción no encontrada');

      // Ensure billing account card is set to 9999 to simulate failure
      const billingAcc = billingAccounts.find(a => a.tenantId === selectedTenantId);
      if (billingAcc) {
        billingAcc.paymentMethod = { brand: 'Visa', last4: '9999' }; // 9999 is set to fail in provider
        await CommercialRepository.saveBillingAccount(billingAcc);
      }

      // First failure
      await BillingEngine.processSubscriptionCharge(selectedTenantId, sub.amount);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Error en simulación');
    } finally {
      setSandboxRunning(false);
    }
  };

  const runVerifyGuardrailsSimulation = async () => {
    if (!selectedTenantId) return;
    setSandboxRunning(true);
    try {
      const activeCheck = await SubscriptionValidator.isTenantActive(selectedTenantId);
      const roomCheck = await SubscriptionValidator.canAddAccommodation(selectedTenantId);
      const userCheck = await SubscriptionValidator.canAddUser(selectedTenantId);

      alert(
        `[StayFlow Guardrails Check - Tenant: ${selectedTenantId}]\n` +
        `-----------------------------------------\n` +
        `- ¿Tenant Activo?: ${activeCheck.active ? 'SÍ' : 'NO (' + activeCheck.reason + ')'}\n` +
        `- ¿Puede añadir Habitación?: ${roomCheck.allowed ? 'SÍ' : 'NO (' + roomCheck.reason + ')'}\n` +
        `- ¿Puede registrar nuevo Usuario?: ${userCheck.allowed ? 'SÍ' : 'NO (' + userCheck.reason + ')'}`
      );
    } catch (e: any) {
      alert(e.message || 'Error en validaciones');
    } finally {
      setSandboxRunning(false);
    }
  };

  const getStatusBadgeClass = (status: CommercialLead['status']) => {
    switch (status) {
      case 'Lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Demo': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Proposal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Negotiation': return 'bg-orange/10 text-orange border-orange/20';
      case 'Cliente': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Inactivo': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getSubStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'trial': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'past_due': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'suspended': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const currentTenantSub = subscriptions.find(s => s.tenantId === selectedTenantId);
  const currentTenantLic = licenses.find(l => l.tenantId === selectedTenantId);
  const currentTenantAcc = billingAccounts.find(a => a.tenantId === selectedTenantId);

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 max-w-7xl mx-auto w-full">
      {/* Toast alert */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-100 bg-emerald-600 border border-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-sans font-bold text-xs animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header and Sync controls */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="grid w-8 h-8 place-content-center bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h1 className="font-display font-black text-xl tracking-tight">StayFlow SaaS Platform</h1>
          </div>
          <p className="text-slate-400 text-xs">Administrador comercial, licencias de Tenants, facturación, reintentos de pago y analíticas financieras.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={loadData}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="Refrescar Datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Tab switches */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex flex-wrap gap-1">
            <button 
              onClick={() => setActiveTab('crm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'crm' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              CRM & Demos
            </button>
            <button 
              onClick={() => setActiveTab('subscriptions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'subscriptions' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Suscripciones & Licencias
            </button>
            <button 
              onClick={() => setActiveTab('billing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'billing' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Facturas & Cobros
            </button>
            <button 
              onClick={() => setActiveTab('plans')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Límites & Planes
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Métricas MRR
            </button>
            <button 
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'sandbox' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Simulador Sandbox
            </button>
          </div>
        </div>
      </header>

      {loading && subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs text-slate-400 mt-2 font-bold font-mono">Iniciando plataforma de licenciamiento SaaS...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: CRM COMERCIAL */}
          {activeTab === 'crm' && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Leads Pipeline Table */}
              <div className="lg:col-span-8 space-y-4 text-left">
                <div className="flex justify-between items-center bg-slate-950 px-4 py-3 rounded-xl border border-slate-850">
                  <span className="text-xs font-bold text-slate-300 font-sans">Embudo Comercial de Registro (Leads CRM)</span>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">{leads.length} Registrados</span>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-3.5">Empresa / Hotel</th>
                          <th className="p-3.5">Persona de Contacto</th>
                          <th className="p-3.5">Origen / Tipo</th>
                          <th className="p-3.5 text-center">Unidades</th>
                          <th className="p-3.5">Estado</th>
                          <th className="p-3.5 text-right">Ficha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {leads.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3.5 font-bold text-white">{l.companyName}</td>
                            <td className="p-3.5">
                              <div>{l.contactName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{l.email}</div>
                            </td>
                            <td className="p-3.5">
                              <div>{l.country}</div>
                              <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase">{l.accommodationType}</span>
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-indigo-400">{l.roomCount}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(l.status)}`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button 
                                onClick={() => {
                                  setSelectedLead(l);
                                  setCrmNote('');
                                }}
                                className="px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 transition-all font-bold text-[10px] cursor-pointer"
                              >
                                Gestionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* CRM Lead Details & Automatic SaaS Provisioning */}
              <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-4 text-left animate-fade-in">
                {selectedLead ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">Prospecto ID: {selectedLead.id}</span>
                        <h3 className="font-bold text-sm text-white truncate max-w-[210px]">{selectedLead.companyName}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedLead(null)}
                        className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-850/50">
                      <div>Contacto: <span className="font-bold text-white">{selectedLead.contactName}</span></div>
                      <div>Email: <span className="font-bold text-white font-mono">{selectedLead.email}</span></div>
                      <div>Teléfono: <span className="font-bold text-white font-mono">{selectedLead.phone}</span></div>
                      {selectedLead.message && (
                        <div className="pt-2 border-t border-slate-800 text-slate-400 leading-relaxed italic">
                          "{selectedLead.message}"
                        </div>
                      )}
                    </div>

                    {/* Stage transition controls */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Cambiar Estado CRM</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Lead', 'Demo', 'Proposal', 'Negotiation', 'Inactivo'] as const).map((stg) => (
                          <button
                            key={stg}
                            type="button"
                            onClick={() => handleStageChange(selectedLead.id, stg)}
                            className={`px-2 py-1.5 rounded-lg text-center text-[10px] font-bold border transition-colors ${
                              selectedLead.status === stg 
                                ? 'bg-indigo-600 border-indigo-500 text-white' 
                                : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300'
                            }`}
                          >
                            {stg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Añadir Nota al Historial</label>
                      <input 
                        type="text"
                        placeholder="Añadir una nota de contacto..."
                        value={crmNote}
                        onChange={e => setCrmNote(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-500 text-white"
                      />
                    </div>

                    {/* Auto SaaS Activation */}
                    {selectedLead.status !== 'Cliente' ? (
                      <div className="pt-4 border-t border-slate-850 space-y-3 bg-indigo-950/20 p-3 rounded-xl border border-indigo-900/30">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-orange" />
                          <strong className="text-xs text-white">Alta Automática de Tenant</strong>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Al aprobar, se aprovisionará el Tenant stayflow, se creará su base de datos, se emitirá una licencia y se iniciará un periodo de prueba de 14 días.
                        </p>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Asignar Plan Inicial</label>
                          <select
                            value={selectedPlanForApprove}
                            onChange={e => setSelectedPlanForApprove(e.target.value as SaaSPlanType)}
                            className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-850 rounded-lg text-white"
                          >
                            <option value="Starter">Starter - $49/mes</option>
                            <option value="Professional">Professional - $99/mes</option>
                            <option value="Business">Business - $199/mes</option>
                            <option value="Enterprise">Enterprise - $399/mes</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={approving}
                          onClick={handleApproveAndProvision}
                          className="w-full min-h-[38px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {approving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Aprovisionando Tenant...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Aprobar y Provisionar Tenant</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>¡Este lead ya es un Cliente Activo y cuenta con su propio Tenant!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <Building2 className="w-10 h-10 mx-auto text-slate-700" />
                    <p className="text-xs font-bold">Selecciona un prospecto para ver detalles e iniciar el aprovisionamiento de su tenant.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION ENGINE & LICENSING */}
          {activeTab === 'subscriptions' && (
            <div className="grid lg:grid-cols-12 gap-6 items-start text-left">
              {/* Left Column: Subscriptions List */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center bg-slate-950 px-4 py-3 rounded-xl border border-slate-850">
                  <span className="text-xs font-bold text-slate-300">Monitoreo de Suscripciones y Licencias Activas (SaaS)</span>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">{subscriptions.length} Clientes</span>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3.5 text-left">Tenant</th>
                        <th className="p-3.5 text-left">Suscripción</th>
                        <th className="p-3.5 text-left">Límites Licencia</th>
                        <th className="p-3.5 text-left">Expiración</th>
                        <th className="p-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {subscriptions.map(sub => {
                        const lic = licenses.find(l => l.tenantId === sub.tenantId);
                        const isSelected = sub.tenantId === selectedTenantId;
                        return (
                          <tr key={sub.id} className={`hover:bg-slate-900/40 transition-colors ${isSelected ? 'bg-indigo-600/10' : ''}`}>
                            <td className="p-3.5 font-bold">
                              <div className="text-white">{sub.tenantId}</div>
                              <div className="text-[10px] text-slate-500 font-mono font-normal">StayFlow Tenant</div>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-200">{sub.planId}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${getSubStatusClass(sub.status)}`}>
                                  {sub.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">${sub.amount}/{sub.billingPeriod === 'monthly' ? 'mes' : 'año'}</div>
                            </td>
                            <td className="p-3.5 text-slate-400">
                              {lic ? (
                                <div>
                                  Habitaciones: <span className="font-mono text-white font-bold">{lic.maxRooms}</span> · Users: <span className="font-mono text-white font-bold">{lic.maxUsers}</span>
                                </div>
                              ) : (
                                <span className="text-slate-600 italic">No emitida</span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-slate-300">
                              {sub.endDate.split('T')[0]}
                            </td>
                            <td className="p-3.5 text-right">
                              <button 
                                onClick={() => setSelectedTenantId(sub.tenantId)}
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 text-[10px] font-bold"
                              >
                                Administrar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {subscriptions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 italic font-bold">
                            No se registran tenants o suscripciones activas en el sistema. Apruebe un prospecto para crear uno.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Engine Controls */}
              <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-4">
                {selectedTenantId && currentTenantSub ? (
                  <div className="space-y-4">
                    <div className="border-b border-slate-850 pb-2">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Administración de Suscripción</span>
                      <strong className="text-sm text-white">{selectedTenantId}</strong>
                    </div>

                    {/* License status snippet */}
                    <div className="p-3 bg-slate-900 border border-slate-850/60 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Estado Licencia:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getSubStatusClass(currentTenantLic?.status || 'inactive')}`}>
                          {currentTenantLic?.status || 'desconocido'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-850/60 text-slate-300">
                        <div>Expiración: <span className="text-white font-mono">{currentTenantLic?.endDate.split('T')[0]}</span></div>
                        <div>Soporte: <span className="text-white font-bold">{currentTenantLic?.supportLevel}</span></div>
                      </div>
                      {currentTenantLic && (
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-500 font-bold block mb-1">Módulos de Negocio Habilitados:</span>
                          <div className="flex flex-wrap gap-1">
                            {currentTenantLic.enabledModules.map(m => (
                              <span key={m} className="bg-slate-950 border border-slate-800 text-slate-400 text-[8px] font-mono px-1.5 py-0.5 rounded">
                                {m.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Change plan controls (Upgrades & Downgrades) */}
                    <div className="space-y-2 bg-indigo-950/10 border border-indigo-900/20 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <strong className="text-xs text-white">Upgrade & Downgrade Engine</strong>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Permite actualizar o descender de plan. Los límites de uso del tenant (habitaciones, usuarios) son validados automáticamente antes del cambio.
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={targetPlanId}
                          onChange={e => setTargetPlanId(e.target.value as SaaSPlanType)}
                          className="flex-1 bg-slate-900 text-white text-xs px-2 py-1.5 border border-slate-800 rounded-lg"
                        >
                          <option value="Starter">Starter - $49</option>
                          <option value="Professional">Professional - $99</option>
                          <option value="Business">Business - $199</option>
                          <option value="Enterprise">Enterprise - $399</option>
                        </select>
                        <button
                          onClick={handlePlanChange}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
                        >
                          Modificar
                        </button>
                      </div>
                    </div>

                    {/* Subscription lifecycle controls */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Ciclo de Vida de Suscripción</span>
                      <div className="grid grid-cols-2 gap-2">
                        {currentTenantSub.status === 'suspended' ? (
                          <button
                            onClick={handleReactivateSub}
                            className="flex items-center justify-center gap-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Reactivar</span>
                          </button>
                        ) : (
                          <button
                            onClick={handlePauseSub}
                            className="flex items-center justify-center gap-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pausar</span>
                          </button>
                        )}
                        <button
                          onClick={handleCancelSub}
                          className="flex items-center justify-center gap-1 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs rounded-lg border border-rose-500/20 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 italic">
                    <Users className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                    <p className="text-xs">Seleccione un tenant de la lista para ver sus licencias vigentes, limites contratados y administrar su plan.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INVOICES, COUPONS & BILLING ACCOUNTS */}
          {activeTab === 'billing' && (
            <div className="grid lg:grid-cols-12 gap-6 items-start text-left animate-fade-in">
              {/* Left Side: Invoice history & billing profiles */}
              <div className="lg:col-span-8 space-y-6">
                {/* Billing Accounts */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-950 px-4 py-2 rounded-xl border border-slate-850">
                    <span className="text-xs font-bold text-slate-300">Cuentas de Facturación y Pasarelas de Pago Integradas</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Provider abstraction ready</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-bold text-[10px]">
                        <tr>
                          <th className="p-3 text-left">Tenant</th>
                          <th className="p-3 text-left">País / Moneda</th>
                          <th className="p-3 text-left">Pasarela Defecto</th>
                          <th className="p-3 text-left">Tarjeta Registrada</th>
                          <th className="p-3 text-right">Crédito Activo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {billingAccounts.map(acc => (
                          <tr key={acc.id} className="hover:bg-slate-900/30">
                            <td className="p-3 font-bold text-white">{acc.tenantId}</td>
                            <td className="p-3 text-slate-300">{acc.country} ({acc.currency})</td>
                            <td className="p-3 font-mono text-indigo-400">
                              {acc.paymentProvider === 'none' ? 'Abstracción País' : acc.paymentProvider.toUpperCase()}
                            </td>
                            <td className="p-3 text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                                <span>{acc.paymentMethod?.brand || 'Visa'} *{acc.paymentMethod?.last4 || '4242'}</span>
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-400 font-bold">${acc.credits}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Billing Invoices / Billing History */}
                <div className="space-y-3">
                  <strong className="text-xs text-slate-300 block">Historial de Comprobantes Emitidos (Invoices)</strong>
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-3 text-left">N° Factura</th>
                          <th className="p-3 text-left">Tenant</th>
                          <th className="p-3 text-left">Fecha</th>
                          <th className="p-3 text-left">Total con IVA</th>
                          <th className="p-3 text-left">Descuento</th>
                          <th className="p-3 text-center">Estado</th>
                          <th className="p-3 text-right">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {billingHistory.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-900/30">
                            <td className="p-3 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                            <td className="p-3 font-bold text-white">{inv.tenantId}</td>
                            <td className="p-3 text-slate-300">{inv.date}</td>
                            <td className="p-3 font-mono text-white font-black">${inv.total} {inv.currency}</td>
                            <td className="p-3 text-slate-500 font-mono">
                              {inv.discountCode ? `Cupón: ${inv.discountCode}` : '-'}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {inv.status === 'paid' ? 'PAGADA' : 'PENDIENTE'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => triggerToast(`Descargando comprobante ${inv.invoiceNumber} en PDF...`)}
                                className="p-1 hover:bg-slate-800 rounded text-indigo-400"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {billingHistory.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                              No se han emitido facturas aún.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Side: Coupons & Credit allocation */}
              <div className="lg:col-span-4 space-y-6">
                {/* Coupon Management */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                    <Percent className="w-4 h-4 text-emerald-400" />
                    <strong className="text-xs text-white">Generar Cupón de Descuento</strong>
                  </div>

                  <form onSubmit={handleCreateCoupon} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Código del Cupón</label>
                      <input 
                        type="text"
                        required
                        placeholder="SFANUAL30"
                        value={newCouponCode}
                        onChange={e => setNewCouponCode(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white font-mono uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                        <select 
                          value={newCouponType}
                          onChange={e => setNewCouponType(e.target.value as any)}
                          className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                        >
                          <option value="percentage">Porcentaje (%)</option>
                          <option value="fixed">Fijo ($ USD)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Valor</label>
                        <input 
                          type="number"
                          required
                          value={newCouponVal}
                          onChange={e => setNewCouponVal(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                    >
                      Crear y Activar Cupón
                    </button>
                  </form>

                  {/* Active coupons list */}
                  <div className="pt-2 border-t border-slate-850">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Cupones Vigentes:</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {coupons.map(c => (
                        <div key={c.id} className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-850 text-[11px]">
                          <span className="font-mono font-bold text-indigo-400">{c.code}</span>
                          <span className="text-slate-400">
                            {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `$${c.discountValue} Off`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Credit Allocation Form */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <strong className="text-xs text-white">Asignar Crédito de Servicio</strong>
                  </div>

                  <form onSubmit={handleAddCredits} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Seleccionar Tenant</label>
                      <select 
                        value={selectedTenantId}
                        onChange={e => setSelectedTenantId(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                      >
                        {subscriptions.map(s => (
                          <option key={s.tenantId} value={s.tenantId}>{s.tenantId}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Monto a Acreditar ($ USD)</label>
                      <input 
                        type="number"
                        required
                        value={creditAmount}
                        onChange={e => setCreditAmount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Motivo / Descripción</label>
                      <input 
                        type="text"
                        required
                        placeholder="Compensación técnica por cortes..."
                        value={creditReason}
                        onChange={e => setCreditReason(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                    >
                      Acreditar Saldo a Favor
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLAN MANAGEMENT (LIMITS & CONFIGURATION) */}
          {activeTab === 'plans' && (
            <div className="grid lg:grid-cols-12 gap-6 items-start text-left animate-fade-in">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center bg-slate-950 px-4 py-3 rounded-xl border border-slate-850">
                  <span className="text-xs font-bold text-slate-300">Administración de Límites y Precios de Planes Comerciales</span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Seguridad: Super Admin Only</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {plans.map(p => (
                    <div key={p.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <strong className="text-sm text-white">{p.name}</strong>
                          <span className="text-[10px] font-mono text-indigo-400 font-bold">${p.price}/mes</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Habitaciones: {p.maxRooms === 999 ? 'Ilimitadas' : p.maxRooms} · Usuarios: {p.maxUsers} · Almacenamiento: {p.storageGB} GB · Soporte: {p.supportLevel}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.integrations.map((itg, idx) => (
                            <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-500 text-[8px] font-mono px-1.5 py-0.5 rounded">{itg}</span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-900 mt-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(p)}
                          className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-300 font-bold text-xs border border-slate-800 transition-colors cursor-pointer"
                        >
                          Editar límites y precios
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan Edit modal side */}
              <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-4">
                {selectedPlan ? (
                  <form onSubmit={handleSavePlan} className="space-y-3.5">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <strong className="text-xs text-white font-sans">Editar Plan: {selectedPlan.id}</strong>
                      <button type="button" onClick={() => setSelectedPlan(null)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Comercial</label>
                      <input 
                        type="text"
                        required
                        value={selectedPlan.name}
                        onChange={e => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Precio mensual</label>
                        <input 
                          type="number"
                          required
                          value={selectedPlan.price}
                          onChange={e => setSelectedPlan({ ...selectedPlan, price: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Máx. Alojamientos</label>
                        <input 
                          type="number"
                          required
                          value={selectedPlan.maxAccommodations}
                          onChange={e => setSelectedPlan({ ...selectedPlan, maxAccommodations: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Máx. Habitaciones</label>
                        <input 
                          type="number"
                          required
                          value={selectedPlan.maxRooms}
                          onChange={e => setSelectedPlan({ ...selectedPlan, maxRooms: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Máx. Usuarios</label>
                        <input 
                          type="number"
                          required
                          value={selectedPlan.maxUsers}
                          onChange={e => setSelectedPlan({ ...selectedPlan, maxUsers: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nivel de Soporte</label>
                      <input 
                        type="text"
                        required
                        value={selectedPlan.supportLevel}
                        onChange={e => setSelectedPlan({ ...selectedPlan, supportLevel: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingPlan}
                      className="w-full min-h-[38px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                    >
                      {savingPlan ? 'Guardando plan...' : 'Guardar Cambios de Plan'}
                    </button>
                  </form>
                ) : (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <Layers className="w-10 h-10 mx-auto text-slate-700" />
                    <p className="text-xs font-bold">Selecciona un plan comercial para editar sus límites, características y costos de licenciamiento.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: FINANCIAL ANALYTICS */}
          {activeTab === 'analytics' && financialMetrics && (
            <div className="space-y-6 text-left animate-fade-in">
              {/* Stat Bento Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">MRR SaaS Activo</span>
                  <div className="font-display font-black text-2xl text-emerald-400">${financialMetrics.mrr}</div>
                  <span className="text-[9px] text-slate-500 font-mono">Facturación Mensual</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">ARR Proyectado</span>
                  <div className="font-display font-black text-2xl text-indigo-400">${financialMetrics.arr}</div>
                  <span className="text-[9px] text-slate-500 font-mono">Proyección Anual</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">ARPU</span>
                  <div className="font-display font-black text-2xl text-white">${financialMetrics.arpu}</div>
                  <span className="text-[9px] text-slate-500 font-mono">Ingreso Promedio</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">SaaS Churn Rate</span>
                  <div className="font-display font-black text-2xl text-rose-400">{financialMetrics.churn}%</div>
                  <span className="text-[9px] text-slate-500 font-mono">Índice de Bajas</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Customer LTV</span>
                  <div className="font-display font-black text-2xl text-white">${financialMetrics.ltv}</div>
                  <span className="text-[9px] text-emerald-400 font-mono">Valor de Vida Estimado</span>
                </div>
              </div>

              {/* Client distribution */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Licencias Activas</span>
                  <strong className="text-xl text-emerald-400">{financialMetrics.activeCount}</strong>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Periodos de Prueba</span>
                  <strong className="text-xl text-indigo-400">{financialMetrics.trialCount}</strong>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Suspendidos</span>
                  <strong className="text-xl text-rose-400">{financialMetrics.suspendedCount}</strong>
                </div>
              </div>

              {/* Breakdown breakdowns */}
              <div className="grid md:grid-cols-12 gap-6">
                {/* Revenue by Plan */}
                <div className="md:col-span-6 bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3">
                  <strong className="text-xs text-slate-300">Ingresos SaaS por Plan Comercial ($ MRR)</strong>
                  <div className="space-y-3 pt-2">
                    {Object.entries(financialMetrics.byPlan).map(([planId, mrrVal]) => {
                      const total = Object.values(financialMetrics.byPlan).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? (mrrVal / total) * 100 : 0;
                      return (
                        <div key={planId} className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-bold text-slate-200">{planId}</span>
                            <span className="text-slate-400 font-mono">${mrrVal} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue by Country */}
                <div className="md:col-span-6 bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3">
                  <strong className="text-xs text-slate-300">Penetración por País / Mercado ($ MRR)</strong>
                  <div className="space-y-3 pt-2">
                    {Object.entries(financialMetrics.byCountry).map(([country, val]) => {
                      const total = Object.values(financialMetrics.byCountry).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? (val / total) * 100 : 0;
                      return (
                        <div key={country} className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-bold text-slate-200">{country}</span>
                            <span className="text-slate-400 font-mono">${val} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(financialMetrics.byCountry).length === 0 && (
                      <p className="text-slate-500 text-xs italic text-center py-6">No hay ingresos activos aún para desglosar por país.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SIMULATION SANDBOX PLAYGROUND */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="grid w-8 h-8 place-content-center bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sandbox de Pruebas Comerciales</h3>
                    <p className="text-[10px] text-slate-500">Ejecuta y audita simulaciones en tiempo real para validar el ciclo de vida, guardarrailes de licenciamiento y flujos de cobranza.</p>
                  </div>
                </div>
              </div>

              {/* Selection context */}
              <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-950 border border-slate-850 p-4 rounded-xl">
                <div className="flex-1 space-y-1 text-xs">
                  <span className="text-slate-400 font-bold">1. Selecciona un Tenant de Prueba</span>
                  <p className="text-[10px] text-slate-500">Toda simulación se ejecutará apuntando a este contexto.</p>
                  <select 
                    value={selectedTenantId}
                    onChange={e => setSelectedTenantId(e.target.value)}
                    className="w-full mt-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    {subscriptions.map(s => (
                      <option key={s.tenantId} value={s.tenantId}>{s.tenantId}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 pt-2 md:pt-0">
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 font-bold block mb-1">Cupón Aplicable</span>
                    <input 
                      type="text"
                      placeholder="ANUALSAVE20"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono uppercase text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Simulation Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* 1. Trial Expiration */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">TRIAL CONVERSION</span>
                    <h4 className="text-xs font-bold text-white">Simular Conversión de Trial a Cliente</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Simula el fin del periodo de prueba gratuito de 14 días. Genera un cobro formal por la mensualidad del plan contratado y convierte la suscripción en estado 'active'.
                    </p>
                  </div>
                  <button
                    onClick={runConversionSimulation}
                    disabled={sandboxRunning || !selectedTenantId}
                    className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Simular Conversión
                  </button>
                </div>

                {/* 2. Cobros & Retries failures */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">COBRANZA RETRY SEQUENCE</span>
                    <h4 className="text-xs font-bold text-white">Simular Error de Pago y Suspensión</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Fuerza una tarjeta rechazada (terminada en 9999). Esto iniciará la secuencia de cobranza de 3 reintentos antes de inhabilitar la licencia y suspender al tenant.
                    </p>
                  </div>
                  <button
                    onClick={runFailedPaymentSequenceSimulation}
                    disabled={sandboxRunning || !selectedTenantId}
                    className="w-full mt-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Simular Rechazo y Cobranza
                  </button>
                </div>

                {/* 3. Guardrails Checker */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">LICENSE GUARDRAILS</span>
                    <h4 className="text-xs font-bold text-white">Testear Guardarrailes de Licencia</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Ejecuta en tiempo real el validador de límites del sistema para este tenant, simulando si se le permite crear nuevas habitaciones, usuarios o acceder a la Suite PMS.
                    </p>
                  </div>
                  <button
                    onClick={runVerifyGuardrailsSimulation}
                    disabled={sandboxRunning || !selectedTenantId}
                    className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Verificar Guardarrailes Live
                  </button>
                </div>
              </div>

              {/* Event Logs auditing */}
              <div className="space-y-2 pt-2">
                <strong className="text-xs text-slate-300 block">Bitácora de Eventos de Facturación y Suscripciones (Auditoría en Tiempo Real)</strong>
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 h-60 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-2 scrollbar-thin">
                  {billingEvents.map(evt => (
                    <div key={evt.id} className="flex items-start gap-2 border-b border-slate-900 pb-2">
                      <span className="text-[9px] bg-slate-900 border border-slate-800 text-indigo-400 px-1.5 py-0.5 rounded shrink-0">{evt.eventType.toUpperCase()}</span>
                      <div className="flex-1 leading-normal">
                        <div className="text-white font-sans">{evt.details}</div>
                        <div className="text-[10px] text-slate-500">Tenant: <span className="text-slate-300">{evt.tenantId}</span> · {evt.timestamp}</div>
                      </div>
                    </div>
                  ))}
                  {billingEvents.length === 0 && (
                    <p className="text-slate-600 italic text-center py-16">No hay eventos de facturación o licenciamiento registrados aún.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
