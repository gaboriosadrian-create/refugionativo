import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  HelpCircle, 
  LifeBuoy, 
  Search, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown, 
  Play, 
  Compass, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  MessageSquare, 
  Plus, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  Check, 
  User, 
  Send, 
  ArrowLeft, 
  Star, 
  Smile, 
  BarChart, 
  FileText, 
  Layers, 
  Settings, 
  Shield, 
  RefreshCw,
  TrendingUp,
  Flame,
  Globe,
  Tag,
  Eye,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

import { CustomerSuccessDb } from '../services/CustomerSuccessDb';
import { HelpCenterService } from '../services/HelpCenterService';
import { SupportCenterService } from '../services/SupportCenterService';
import { CustomerSuccessEngine } from '../services/CustomerSuccessEngine';
import { StatusPageService } from '../services/StatusPageService';
import { 
  HelpArticle, 
  KnowledgeArticle, 
  SupportTicket, 
  TicketComment, 
  CustomerHealth, 
  Feedback, 
  NpsResponse, 
  CsatResponse, 
  StatusIncident, 
  OnboardingProgress,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  AuditLog
} from '../types';

export const CustomerSuccessSuite: React.FC = () => {
  // Navigation Tabs
  type CSTab = 'dashboard' | 'help' | 'onboarding' | 'support' | 'kb' | 'feedback' | 'status';
  const [activeTab, setActiveTab] = useState<CSTab>('dashboard');

  // Role management (Client vs Customer Success Agent / Admin)
  const [userRole, setUserRole] = useState<'client' | 'agent' | 'customer_success' | 'super_admin'>('customer_success');

  // Global Tenant state (For demo / SaaS context)
  const tenantId = 'patagonia-refugio';
  const userId = 'demo-owner-uid';
  const userEmail = 'gaboriosadrian@gmail.com';
  const userName = 'Adrián Gaborios';

  // ----------------------------------------------------
  // Local states
  // ----------------------------------------------------
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketComments, setTicketComments] = useState<TicketComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  
  // New ticket form
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<TicketPriority>('medium');
  const [newTicketCategory, setNewTicketCategory] = useState<TicketCategory>('technical');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');

  // Knowledge Base admin states
  const [kbArticles, setKbArticles] = useState<KnowledgeArticle[]>([]);
  const [editingKbArticle, setEditingKbArticle] = useState<Partial<KnowledgeArticle> | null>(null);
  const [showKbArticleForm, setShowKbArticleForm] = useState(false);

  // Feedback states
  const [selectedFeedbackModule, setSelectedFeedbackModule] = useState('bookings');
  const [csatScore, setCsatScore] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');
  const [npsScoreState, setNpsScoreState] = useState<number>(10);
  const [npsCommentState, setNpsCommentState] = useState('');

  // Onboarding states
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [activeTourStep, setActiveTourStep] = useState<number | null>(null);

  // Status incidents
  const [incidents, setIncidents] = useState<StatusIncident[]>([]);
  const [overallStatus, setOverallStatus] = useState<'operational' | 'degraded' | 'outage'>('operational');
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<'operational' | 'degraded' | 'partial_outage' | 'major_outage'>('degraded');
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Customer Health Dashboard
  const [healthScores, setHealthScores] = useState<CustomerHealth[]>([]);
  const [dashboardKPIs, setDashboardKPIs] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // AI Copilot state
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<{sender: 'user' | 'assistant'; text: string; timestamp: string}[]>([
    {
      sender: 'assistant',
      text: '¡Hola Adrián! Soy tu StayFlow AI Copilot. Te asisto recomendando artículos, sugiriendo respuestas de soporte, guiando tu onboarding o analizando métricas. ¿En qué te puedo ayudar hoy?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ----------------------------------------------------
  // Load and sync data
  // ----------------------------------------------------
  const reloadData = () => {
    CustomerSuccessDb.init();
    
    // Help Center articles
    setArticles(HelpCenterService.getArticles());
    
    // Support tickets
    if (userRole === 'client') {
      setTickets(SupportCenterService.getTickets(tenantId));
    } else {
      setTickets(SupportCenterService.getAllTickets());
    }

    // Knowledge Base articles
    setKbArticles(CustomerSuccessDb.getAll<KnowledgeArticle>('knowledgeBase'));

    // Onboarding progress
    const ob = CustomerSuccessEngine.getOnboardingProgress(tenantId);
    setOnboardingProgress(ob);

    // Incidents
    setIncidents(StatusPageService.getIncidents());
    setOverallStatus(StatusPageService.getOverallStatus());

    // Health
    setHealthScores(CustomerSuccessEngine.getCustomerHealths());
    setDashboardKPIs(CustomerSuccessEngine.getDashboardMetrics(tenantId));
    setAuditLogs(SupportCenterService.getAuditLogs());
  };

  useEffect(() => {
    reloadData();
  }, [userRole]);

  useEffect(() => {
    if (selectedTicket) {
      const showInternal = userRole !== 'client';
      setTicketComments(SupportCenterService.getComments(selectedTicket.id, showInternal));
    }
  }, [selectedTicket, userRole]);

  // ----------------------------------------------------
  // Actions Handlers
  // ----------------------------------------------------

  const handleHelpfulVote = (articleId: string, helpful: boolean) => {
    HelpCenterService.voteHelpful(articleId, helpful);
    // Refresh article views
    if (selectedArticle && selectedArticle.id === articleId) {
      const updated = HelpCenterService.getArticles().find(a => a.id === articleId);
      if (updated) setSelectedArticle(updated);
    }
    reloadData();
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketDesc) return;
    
    SupportCenterService.createTicket({
      tenantId,
      userId,
      userEmail,
      userName,
      subject: newTicketSubject,
      description: newTicketDesc,
      priority: newTicketPriority,
      category: newTicketCategory
    });

    setNewTicketSubject('');
    setNewTicketDesc('');
    setShowNewTicketModal(false);
    reloadData();
  };

  const handleUpdateTicketStatus = (ticketId: string, status: TicketStatus) => {
    SupportCenterService.updateTicketStatus(
      ticketId,
      status,
      userName,
      userRole,
      userId,
      userEmail
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      const updated = SupportCenterService.getAllTickets().find(t => t.id === ticketId);
      if (updated) setSelectedTicket(updated);
    }
    reloadData();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTicket) return;

    SupportCenterService.addComment({
      ticketId: selectedTicket.id,
      content: newCommentText,
      userId,
      userEmail,
      userName,
      userRole,
      isInternal: userRole !== 'client' ? isInternalComment : false
    });

    setNewCommentText('');
    setIsInternalComment(false);
    // Refresh comments
    const showInternal = userRole !== 'client';
    setTicketComments(SupportCenterService.getComments(selectedTicket.id, showInternal));
    reloadData();
  };

  const handleSaveKbArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKbArticle?.title || !editingKbArticle?.content) return;

    const currentKb = CustomerSuccessDb.getAll<KnowledgeArticle>('knowledgeBase');
    
    if (editingKbArticle.id) {
      // Update
      const updated = currentKb.map(art => {
        if (art.id === editingKbArticle.id) {
          return {
            ...art,
            ...editingKbArticle,
            publishDate: new Date().toISOString().split('T')[0]
          } as KnowledgeArticle;
        }
        return art;
      });
      CustomerSuccessDb.setAll('knowledgeBase', updated);
      CustomerSuccessDb.setAll('helpArticles', updated.map(({ aiSummary, internalNotes, ...rest }) => rest));
    } else {
      // Create
      const newId = `art-${currentKb.length + 1}`;
      const newArt: KnowledgeArticle = {
        id: newId,
        title: editingKbArticle.title,
        category: editingKbArticle.category || 'General',
        content: editingKbArticle.content,
        tags: editingKbArticle.tags || [],
        videoUrl: editingKbArticle.videoUrl || '',
        steps: editingKbArticle.steps || [],
        language: editingKbArticle.language || 'es',
        version: '1.0',
        publishDate: new Date().toISOString().split('T')[0],
        author: userName,
        status: editingKbArticle.status || 'published',
        views: 0,
        helpfulCount: 0,
        unhelpfulCount: 0,
        aiSummary: 'Auto-generado por Copilot',
        internalNotes: 'Artículo interno de asistencia'
      };
      currentKb.push(newArt);
      CustomerSuccessDb.setAll('knowledgeBase', currentKb);
      CustomerSuccessDb.setAll('helpArticles', currentKb.map(({ aiSummary, internalNotes, ...rest }) => rest));
    }

    setEditingKbArticle(null);
    setShowKbArticleForm(false);
    reloadData();
  };

  const handleDeleteKbArticle = (id: string) => {
    const currentKb = CustomerSuccessDb.getAll<KnowledgeArticle>('knowledgeBase');
    const filtered = currentKb.filter(art => art.id !== id);
    CustomerSuccessDb.setAll('knowledgeBase', filtered);
    CustomerSuccessDb.setAll('helpArticles', filtered.map(({ aiSummary, internalNotes, ...rest }) => rest));
    reloadData();
  };

  const handleOnboardingTaskComplete = (taskId: string) => {
    CustomerSuccessEngine.completeOnboardingTask(tenantId, taskId);
    reloadData();
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment) return;

    CustomerSuccessEngine.submitFeedback({
      tenantId,
      userId,
      userEmail,
      module: selectedFeedbackModule,
      rating: csatScore,
      comment: feedbackComment,
      suggestion: feedbackSuggestion
    });

    setFeedbackComment('');
    setFeedbackSuggestion('');
    alert('¡Gracias! Tu feedback y CSAT han sido registrados correctamente.');
    reloadData();
  };

  const handleNpsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    CustomerSuccessEngine.submitNps({
      tenantId,
      userId,
      userEmail,
      score: npsScoreState,
      comment: npsCommentState
    });

    setNpsCommentState('');
    alert('¡Gracias! Tu valoración NPS ha sido registrada y sumada al Health Score.');
    reloadData();
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentTitle || !newIncidentDesc) return;

    StatusPageService.createIncident({
      title: newIncidentTitle,
      description: newIncidentDesc,
      severity: newIncidentSeverity
    });

    setNewIncidentTitle('');
    setNewIncidentDesc('');
    setShowIncidentModal(false);
    reloadData();
  };

  const handleSimulateStatusUpdate = (id: string, status: 'investigating' | 'identified' | 'monitoring' | 'resolved') => {
    StatusPageService.addIncidentUpdate(
      id,
      `Actualización de estado: ${status === 'resolved' ? 'Problema completamente solucionado.' : 'Monitoreando parches aplicados.'}`,
      status
    );
    reloadData();
  };

  // ----------------------------------------------------
  // AI Copilot response engine (Module 8 - AI Assistance)
  // ----------------------------------------------------
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim()) return;

    const userMsg = aiChatInput;
    setAiChatInput('');
    setAiChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString() }]);
    setIsAiLoading(true);

    setTimeout(() => {
      let responseText = '';
      const query = userMsg.toLowerCase();

      // Simple keywords responses based on Help Center Articles
      if (query.includes('airbnb') || query.includes('sincroniz') || query.includes('ical')) {
        responseText = 'Encontré información sobre Airbnb: Para sincronizar, ve a **Channel Manager**, selecciona Airbnb y pega el enlace iCal de tu extranet. Esto actualiza tus reservas automáticamente cada 10 minutos.';
      } else if (query.includes('precio') || query.includes('tarifa') || query.includes('temporada')) {
        responseText = 'Para tarifas: Ve a la sección **Tarifas**, allí puedes crear reglas dinámicas de temporada. Por ejemplo, definir un recargo del 35% en Navidad y aplicarlo a tus cabañas.';
      } else if (query.includes('móvil') || query.includes('mobile') || query.includes('limpieza') || query.includes('operacion')) {
        responseText = 'Sobre la App Móvil: Tu personal de limpieza puede descargar StayFlow App, marcar tareas offline y sincronizar el estado "Limpio" al PMS en tiempo real al conectarse.';
      } else if (query.includes('pagos') || query.includes('mercado pago') || query.includes('credenciales')) {
        responseText = 'Configurar Pagos: Dirígete a **Ajustes -> Plataforma SaaS -> Pagos** y pega tu Access Token de Mercado Pago. Esto habilita cobros con tarjetas al instante.';
      } else if (query.includes('onboarding') || query.includes('tour') || query.includes('recorrido')) {
        responseText = 'Sugerencia de Onboarding: Ve a la pestaña **Interactive Onboarding**. Te recomiendo completar primero la tarea "Completar perfil del complejo" para cargar tu marca y logos.';
      } else {
        responseText = 'Entiendo tu consulta sobre StayFlow. Para asistir al equipo de soporte, te recomiendo revisar el artículo "Cómo configurar tu Channel Manager con Airbnb" o escalar esta consulta creando un ticket en el Support Center.';
      }

      setAiChatMessages(prev => [...prev, { sender: 'assistant', text: responseText, timestamp: new Date().toLocaleTimeString() }]);
      setIsAiLoading(false);
    }, 850);
  };

  // AI draft reply helper for tickets
  const generateAiDraftComment = () => {
    if (!selectedTicket) return;
    setIsAiLoading(true);

    setTimeout(() => {
      let draftText = '';
      if (selectedTicket.category === 'technical') {
        draftText = `Hola ${selectedTicket.userName}, entiendo el inconveniente técnico con ${selectedTicket.subject}. Nuestro equipo de ingeniería está monitoreando las colas de sincronización iCal y ya identificamos el problema. ¿Podrías confirmarnos si removiste los parámetros de sesión en la URL?`;
      } else if (selectedTicket.category === 'billing') {
        draftText = `Estimado ${selectedTicket.userName}, gracias por tu consulta sobre el plan Pro. En dicho plan no tienes límite de usuarios del staff de limpieza concurrentes en la App Móvil. Puedes darlos de alta con confianza.`;
      } else {
        draftText = `Hola ${selectedTicket.userName}, gracias por comunicarte con StayFlow Support. Hemos recibido tu reporte y un especialista de Customer Success ya se encuentra analizando tu caso.`;
      }
      setNewCommentText(draftText);
      setIsAiLoading(false);
    }, 600);
  };

  // Interactive UI highlight tour simulator (Module 2)
  const triggerInteractiveTour = (step: number) => {
    setActiveTourStep(step);
  };

  // ----------------------------------------------------
  // Chart Color Palette & Helpers
  // ----------------------------------------------------
  const COLORS = ['#2e7d32', '#1565c0', '#e65100', '#c62828']; // Excellent, Healthy, At Risk, Critical
  const categoryCountData = () => {
    const counts = { technical: 0, billing: 0, onboarding: 0, feedback: 0, other: 0 };
    tickets.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k.toUpperCase(), value: counts[k as keyof typeof counts] }));
  };

  const healthDistributionData = () => {
    const excellent = healthScores.filter(h => h.status === 'Excelente').length;
    const healthy = healthScores.filter(h => h.status === 'Saludable').length;
    const atRisk = healthScores.filter(h => h.status === 'En riesgo').length;
    const critical = healthScores.filter(h => h.status === 'Crítico').length;

    return [
      { name: 'Excelente (80-100)', value: excellent },
      { name: 'Saludable (65-79)', value: healthy },
      { name: 'En riesgo (40-64)', value: atRisk },
      { name: 'Crítico (<40)', value: critical }
    ];
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans relative" id="customer-success-platform">
      
      {/* Interactive Tour Guide Modal Overlay (Module 2) */}
      <AnimatePresence>
        {activeTourStep !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md p-6 border border-slate-200 shadow-2xl relative"
            >
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-5 h-5 text-forest animate-spin" />
                <span className="font-extrabold text-xs text-forest uppercase tracking-wider">Recorrido StayFlow: Paso {activeTourStep} de 3</span>
              </div>

              {activeTourStep === 1 && (
                <>
                  <h3 className="font-display font-black text-lg text-ink">Paso 1: Catálogo de Alojamientos</h3>
                  <p className="text-muted text-xs leading-relaxed mt-2">
                    En la sección de <strong>Cabañas / Alojamientos</strong> creas y editas tus domos o habitaciones. Puedes configurar tarifas dinámicas por noche, cargar fotos a tu galería oficial y asignar comodidades exclusivas.
                  </p>
                </>
              )}
              {activeTourStep === 2 && (
                <>
                  <h3 className="font-display font-black text-lg text-ink">Paso 2: Conectar Canales iCal</h3>
                  <p className="text-muted text-xs leading-relaxed mt-2">
                    En la sección <strong>Channel Manager</strong> sincronizas la disponibilidad con Airbnb o Booking.com. Al conectar el iCal, StayFlow consulta en segundo plano cada 10 minutos y actualiza tus tarifas sin fricciones.
                  </p>
                </>
              )}
              {activeTourStep === 3 && (
                <>
                  <h3 className="font-display font-black text-lg text-ink">Paso 3: Cobrar mediante Pasarela</h3>
                  <p className="text-muted text-xs leading-relaxed mt-2">
                    StayFlow cuenta con un checkout digital integrado. Al vincular tus credenciales de Mercado Pago, tus clientes pagan con tarjetas de crédito/débito y sus reservas se confirman automáticamente sin intervención manual.
                  </p>
                </>
              )}

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-line">
                <button 
                  onClick={() => {
                    if (activeTourStep === 3) {
                      handleOnboardingTaskComplete('ob-5'); // Complete a task as a result
                      setActiveTourStep(null);
                    } else {
                      setActiveTourStep(prev => prev! + 1);
                    }
                  }}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {activeTourStep === 3 ? 'Finalizar Recorrido y Marcar Avance' : 'Siguiente Paso'}
                </button>
                <button 
                  onClick={() => setActiveTourStep(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Salir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CS Platform Header */}
      <div className="bg-white border-b border-line px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-100 shadow-xs">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-ink tracking-tight flex items-center gap-2">
              <span>Customer Success Hub</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-extrabold uppercase px-2 py-0.5 rounded-full">Suite 8.5</span>
            </h1>
            <p className="text-xs text-muted leading-tight mt-0.5">Soporte técnico, onboarding interactivo, métricas de salud y base de conocimientos de StayFlow.</p>
          </div>
        </div>

        {/* Roles toggle to test both Client and Customer Success Specialist points of view */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono mr-1">Vista del Perfil:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-line">
            <button
              onClick={() => {
                setUserRole('client');
                setSelectedTicket(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                userRole === 'client' ? 'bg-white text-forest shadow-xs border border-line/40' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Huésped/Complejo (Cliente)
            </button>
            <button
              onClick={() => {
                setUserRole('customer_success');
                setSelectedTicket(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                userRole === 'customer_success' ? 'bg-white text-rose-700 shadow-xs border border-line/40' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Customer Success Agent
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner on Service Outages or Degraded status (Module 9) */}
      {overallStatus !== 'operational' && (
        <div className="bg-amber-500 text-slate-950 px-6 py-3 flex items-center justify-between text-xs font-bold shrink-0 border-b border-amber-600/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950 animate-bounce" />
            <span>Alerta de Plataforma: Se registran degradaciones activas en los servicios de StayFlow. Revisa la pestaña de Status Page.</span>
          </div>
          <button 
            onClick={() => setActiveTab('status')}
            className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-900 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors shrink-0"
          >
            Ver Detalle de Incidentes
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border-b border-line px-6 flex overflow-x-auto shrink-0 select-none">
        <div className="flex gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard CS', Icon: BarChart },
            { id: 'help', label: 'Help Center', Icon: HelpCircle },
            { id: 'onboarding', label: 'Onboarding', Icon: Compass },
            { id: 'support', label: 'Soporte', Icon: LifeBuoy },
            { id: 'kb', label: 'Knowledge Base', Icon: FileText },
            { id: 'feedback', label: 'Feedback CSAT', Icon: Smile },
            { id: 'status', label: 'Status Page', Icon: Activity },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as CSTab);
                  setSelectedArticle(null);
                  setSelectedTicket(null);
                }}
                className={`py-3.5 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isSelected 
                    ? 'border-forest text-forest bg-forest/5' 
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <tab.Icon className={`w-4 h-4 ${isSelected ? 'text-forest' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container Dashboard */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Side: Active Workspace */}
        <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
          <AnimatePresence mode="wait">
            
            {/* TAB: CUSTOMER SUCCESS DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Stats cards row */}
                {dashboardKPIs && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Clientes Monitoreados</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-black text-3xl text-ink">{dashboardKPIs.activeClientsCount}</span>
                        <span className="text-xs text-emerald-600 font-bold">100% activos</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Salud Promedio</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-black text-3xl text-indigo-700">{dashboardKPIs.averageHealthScore}%</span>
                        <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded bg-indigo-50 text-indigo-700`}>Excelente</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Satisfacción CSAT</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-black text-3xl text-emerald-600">{dashboardKPIs.csatPercentage}%</span>
                        <span className="text-xs text-muted">de 5 estrellas</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Soporte Activo</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-black text-3xl text-rose-600">{dashboardKPIs.openTicketsCount}</span>
                        <span className="text-xs text-muted">tickets abiertos</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dashboard Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Health Distribution chart */}
                  <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-4">
                    <div>
                      <h3 className="font-display font-black text-base text-ink">Distribución de Salud de Clientes (Nivel de Churn)</h3>
                      <p className="text-xs text-muted">Clasificación en tiempo real de los complejos administrados según uso y adopción.</p>
                    </div>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={healthDistributionData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {healthDistributionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#2e7d32]" />Excelente (90+)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#1565c0]" />Saludable (65-79)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#e65100]" />En riesgo (40-64)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#c62828]" />Crítico (&lt;40)</span>
                    </div>
                  </div>

                  {/* CSAT / NPS stats */}
                  <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-black text-base text-ink">Histórico de Adopción e Indicadores</h3>
                      <p className="text-xs text-muted">Tiempos promedios de primera respuesta y resolución del equipo de Customer Success.</p>
                    </div>
                    {dashboardKPIs && (
                      <div className="grid grid-cols-2 gap-4 my-auto py-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-line text-center space-y-1">
                          <Clock className="w-5 h-5 text-indigo-600 mx-auto" />
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Primera Respuesta</span>
                          <strong className="text-lg font-black text-slate-800">{dashboardKPIs.averageResponseMinutes} min</strong>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-line text-center space-y-1">
                          <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Resolución de Tickets</span>
                          <strong className="text-lg font-black text-slate-800">~{Math.round(dashboardKPIs.averageResolutionMinutes / 60)} hrs</strong>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-line text-center space-y-1">
                          <Smile className="w-5 h-5 text-amber-500 mx-auto" />
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Índice NPS Net</span>
                          <strong className="text-lg font-black text-slate-800">+{dashboardKPIs.npsScore}</strong>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-line text-center space-y-1">
                          <TrendingUp className="w-5 h-5 text-rose-500 mx-auto" />
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Onboarding Completo</span>
                          <strong className="text-lg font-black text-slate-800">{dashboardKPIs.completedOnboardings} / {dashboardKPIs.totalOnboardingsCount}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Health Table (Module 5) */}
                <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-line bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-black text-base text-ink">Auditoría e Índices de Salud de Clientes SaaS</h3>
                      <p className="text-xs text-muted">Puntuación calculada automáticamente basada en login semanales, adopción de módulos y satisfacción.</p>
                    </div>
                    <button 
                      onClick={() => {
                        healthScores.forEach(h => CustomerSuccessEngine.calculateHealthScore(h.tenantId));
                        reloadData();
                      }}
                      className="p-1.5 rounded bg-white hover:bg-slate-100 border border-line text-slate-500 hover:text-slate-800 cursor-pointer"
                      title="Recalcular todo"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-line">
                          <th className="p-4">Cliente / Resort</th>
                          <th className="p-4">Índice de Salud</th>
                          <th className="p-4">Uso Semanal</th>
                          <th className="p-4">Adopción</th>
                          <th className="p-4">Incidencias</th>
                          <th className="p-4">Estado de Salud</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-xs font-semibold text-slate-700">
                        {healthScores.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-900">{h.companyName}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      h.healthScore >= 80 ? 'bg-emerald-600' : h.healthScore >= 65 ? 'bg-indigo-600' : h.healthScore >= 40 ? 'bg-amber-500' : 'bg-rose-600'
                                    }`}
                                    style={{ width: `${h.healthScore}%` }}
                                  />
                                </div>
                                <span className="font-bold">{h.healthScore}%</span>
                              </div>
                            </td>
                            <td className="p-4">{h.usageFrequency} veces</td>
                            <td className="p-4">{h.featureAdoptionRate}%</td>
                            <td className="p-4">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${h.openIncidentsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                                {h.openIncidentsCount} abiertas
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                h.status === 'Excelente' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                h.status === 'Saludable' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                h.status === 'En riesgo' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: HELP CENTER (MÓDULO 1) */}
            {activeTab === 'help' && (
              <motion.div 
                key="help"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Search Bar Block */}
                <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
                  <div className="max-w-2xl mx-auto text-center space-y-2">
                    <h2 className="font-display font-black text-lg text-ink">¿Cómo te podemos ayudar hoy?</h2>
                    <p className="text-muted text-xs">Explora nuestras guías paso a paso, videos interactivos y respuestas inteligentes.</p>
                  </div>
                  
                  <div className="flex max-w-2xl mx-auto relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="Busca por sincronización, tarifas, app móvil..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-line text-sm bg-white outline-none focus:border-forest shadow-xs font-semibold"
                    />
                  </div>

                  {/* Categories Quick Filter */}
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        selectedCategory === null ? 'bg-forest text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos
                    </button>
                    {HelpCenterService.getCategories().map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          selectedCategory === cat ? 'bg-forest text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Articles List & Details Router */}
                {selectedArticle ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 md:p-8 rounded-2xl border border-line shadow-sm space-y-6"
                  >
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-forest-hover cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Volver al listado de ayuda
                    </button>

                    <div className="space-y-2 border-b border-line pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase bg-forest/10 text-forest border border-forest/20 px-2 py-0.5 rounded-full">{selectedArticle.category}</span>
                        <span className="text-xs text-muted">Versión {selectedArticle.version} · Actualizado el {selectedArticle.publishDate}</span>
                      </div>
                      <h3 className="font-display font-black text-2xl text-ink leading-tight">{selectedArticle.title}</h3>
                    </div>

                    <div className="text-sm text-slate-600 leading-relaxed space-y-4">
                      <p>{selectedArticle.content}</p>

                      {/* Video Embed Simulation */}
                      {selectedArticle.videoUrl && (
                        <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative max-w-xl mx-auto my-6 shadow-md border border-slate-800">
                          <video src={selectedArticle.videoUrl} controls className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Step-by-Step guides */}
                      {selectedArticle.steps && selectedArticle.steps.length > 0 && (
                        <div className="bg-slate-50 p-5 rounded-2xl border border-line space-y-3.5 my-6">
                          <h4 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-forest" /> Guía Paso a Paso:
                          </h4>
                          <ol className="space-y-2.5">
                            {selectedArticle.steps.map((step, idx) => (
                              <li key={idx} className="flex gap-3 text-xs leading-relaxed font-semibold">
                                <span className="grid w-5 h-5 shrink-0 place-content-center bg-forest text-white rounded-full font-bold text-[10px]">{idx + 1}</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* Helpful Vote Form */}
                    <div className="border-t border-line pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-xs text-muted font-bold">
                        ¿Te fue útil este artículo? ({selectedArticle.helpfulCount} personas dijeron que sí)
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleHelpfulVote(selectedArticle.id, true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-line text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          <ThumbsUp className="w-4 h-4 text-emerald-600" /> Sí
                        </button>
                        <button
                          onClick={() => handleHelpfulVote(selectedArticle.id, false)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-line text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          <ThumbsDown className="w-4 h-4 text-rose-600" /> No
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {HelpCenterService.searchArticles(searchQuery)
                      .filter(art => selectedCategory === null || art.category === selectedCategory)
                      .map(art => (
                        <div 
                          key={art.id} 
                          onClick={() => {
                            HelpCenterService.incrementViews(art.id);
                            setSelectedArticle(art);
                          }}
                          className="bg-white p-5 rounded-2xl border border-line hover:border-forest shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                        >
                          <div className="space-y-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                              {art.category}
                            </span>
                            <h4 className="font-display font-extrabold text-sm text-ink leading-snug group-hover:text-forest transition-colors">
                              {art.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {art.content}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                            <span>{art.views} visitas</span>
                            <span className="flex items-center text-forest group-hover:translate-x-1 transition-transform">
                              Leer artículo <ChevronRight className="w-3 h-3 ml-0.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: INTERACTIVE ONBOARDING (MÓDULO 2) */}
            {activeTab === 'onboarding' && onboardingProgress && (
              <motion.div 
                key="onboarding"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Progress Card */}
                <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-black text-lg text-ink">Checklist de Incorporación y Adopción</h3>
                      <p className="text-xs text-muted">Completa los pasos iniciales recomendados para desplegar StayFlow en tu complejo.</p>
                    </div>
                    <div className="text-right">
                      <strong className="text-2xl font-black text-forest">{onboardingProgress.progressPercentage}%</strong>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Avance Completo</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 border border-line/30 overflow-hidden">
                    <div 
                      className="bg-forest h-full rounded-full transition-all duration-500" 
                      style={{ width: `${onboardingProgress.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Onboarding Tasks list */}
                <div className="space-y-3">
                  {onboardingProgress.tasks.map((task) => (
                    <div 
                      key={task.id}
                      className={`p-4 border rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        task.completed ? 'border-emerald-100 bg-emerald-50/20' : 'border-line hover:border-slate-300'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <button
                          disabled={task.completed}
                          onClick={() => handleOnboardingTaskComplete(task.id)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                            task.completed 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-slate-300 hover:border-forest hover:bg-forest/5'
                          }`}
                        >
                          {task.completed ? <Check className="w-3.5 h-3.5" /> : null}
                        </button>

                        <div>
                          <strong className={`text-xs font-extrabold ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {task.title}
                          </strong>
                          <p className="text-muted text-[11px] leading-relaxed mt-0.5">{task.description}</p>
                        </div>
                      </div>

                      {/* Simulate interactive tour button */}
                      {!task.completed && (
                        <button
                          onClick={() => triggerInteractiveTour(1)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest hover:bg-forest-hover text-white text-[10px] font-black uppercase rounded-lg shadow-sm cursor-pointer transition-colors shrink-0"
                        >
                          <Play className="w-3 h-3 fill-white" /> Iniciar Recorrido Guía
                        </button>
                      )}

                      {task.completed && task.completedAt && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/40 border border-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                          Completado el {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: SUPPORT CENTER (MÓDULO 4) */}
            {activeTab === 'support' && (
              <motion.div 
                key="support"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Search, Filter, Action Row */}
                <div className="bg-white p-4 rounded-2xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar tickets por asunto o descripción..."
                      value={ticketSearchQuery}
                      onChange={(e) => setTicketSearchQuery(e.target.value)}
                      className="w-full min-h-[38px] pl-9 pr-3 rounded-xl border border-line text-xs bg-white outline-none focus:border-forest font-semibold"
                    />
                  </div>

                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors shrink-0 self-end sm:self-center"
                  >
                    <Plus className="w-4 h-4" /> Crear Nuevo Ticket
                  </button>
                </div>

                {/* Selected Ticket details or lists router */}
                {selectedTicket ? (
                  <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-5 border-b border-line bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-forest-hover cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" /> Volver al panel de tickets
                        </button>
                        <h3 className="font-display font-black text-lg text-ink leading-tight">#{selectedTicket.id} - {selectedTicket.subject}</h3>
                        <div className="flex flex-wrap gap-2 text-[10px] font-extrabold text-slate-500 uppercase">
                          <span className={`px-2 py-0.5 rounded border ${
                            selectedTicket.priority === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            selectedTicket.priority === 'high' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            Prioridad: {selectedTicket.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100">
                            Categoría: {selectedTicket.category}
                          </span>
                          <span className="text-xs text-muted lowercase">creado el {new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Status select for agents/admins */}
                      {userRole !== 'client' ? (
                        <div className="space-y-1 self-start sm:self-center">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider">Estado de Atención</label>
                          <select
                            value={selectedTicket.status}
                            onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                            className="min-h-[38px] rounded-xl border border-line px-3 text-xs bg-white focus:border-rose-500 font-bold text-rose-700"
                          >
                            <option value="Nuevo">Nuevo</option>
                            <option value="En revisión">En revisión</option>
                            <option value="En progreso">En progreso</option>
                            <option value="Esperando cliente">Esperando cliente</option>
                            <option value="Resuelto">Resuelto</option>
                            <option value="Cerrado">Cerrado</option>
                          </select>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full font-bold text-xs bg-rose-50 border border-rose-100 text-rose-700 self-start sm:self-center">
                          Estado: {selectedTicket.status}
                        </span>
                      )}
                    </div>

                    {/* Chat Comments Stream */}
                    <div className="p-6 space-y-4 bg-slate-50/50 max-h-[350px] overflow-y-auto">
                      <div className="bg-white p-4 rounded-xl border border-line space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-100 pb-1.5">
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-forest" />{selectedTicket.userName} (Cliente)</span>
                          <span>{new Date(selectedTicket.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">{selectedTicket.description}</p>
                        {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                          <div className="pt-2">
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">Archivos Adjuntos:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {selectedTicket.attachments.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="referrer" className="block rounded-lg overflow-hidden border border-line aspect-video max-w-[120px]">
                                  <img src={url} alt="adjunto" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comments mapping */}
                      {ticketComments.map((comment) => (
                        <div 
                          key={comment.id}
                          className={`p-4 rounded-xl border space-y-2 max-w-[85%] ${
                            comment.userRole === 'client' 
                              ? 'bg-white border-line ml-0 mr-auto' 
                              : comment.isInternal 
                                ? 'bg-indigo-50/70 border-indigo-100 ml-auto mr-0'
                                : 'bg-rose-50/70 border-rose-100 ml-auto mr-0'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-100/50 pb-1.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-rose-500" />
                              {comment.userName} {comment.isInternal && <span className="bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded text-[9px]">INTERNO</span>}
                            </span>
                            <span>{new Date(comment.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">{comment.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Comments Input Box */}
                    <form onSubmit={handleAddComment} className="p-4 border-t border-line bg-white space-y-3">
                      <div className="flex items-center gap-4">
                        <textarea
                          placeholder="Escribe tu mensaje o respuesta de soporte..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-1 min-h-[44px] rounded-xl border border-line p-3 text-xs bg-white outline-none focus:border-forest resize-y"
                          required
                        />
                        <button
                          type="submit"
                          className="p-3 bg-forest hover:bg-forest-hover text-white rounded-xl shadow-sm cursor-pointer transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>

                      {/* AI Assit and Internal toggle */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex gap-2">
                          {userRole !== 'client' && (
                            <button
                              type="button"
                              onClick={generateAiDraftComment}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-[10px] text-indigo-700 font-extrabold uppercase rounded-lg cursor-pointer transition-colors"
                            >
                              <Sparkles className="w-3 h-3 text-indigo-500" /> Redactar Borrador con AI
                            </button>
                          )}
                        </div>

                        {userRole !== 'client' && (
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isInternalComment}
                              onChange={(e) => setIsInternalComment(e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Comentario Interno (Solo Agentes)</span>
                          </label>
                        )}
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-line bg-slate-50/50">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Tickets Registrados</h4>
                    </div>
                    <div className="divide-y divide-line text-xs">
                      {tickets
                        .filter(t => ticketSearchQuery === '' || t.subject.toLowerCase().includes(ticketSearchQuery.toLowerCase()))
                        .map(t => (
                          <div 
                            key={t.id}
                            onClick={() => setSelectedTicket(t)}
                            className="p-4 hover:bg-slate-50/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">#{t.id} - {t.subject}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded ${
                                  t.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {t.priority}
                                </span>
                              </div>
                              <p className="text-slate-500 line-clamp-1 max-w-xl text-[11px] leading-relaxed">{t.description}</p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center text-[11px] font-bold">
                              <span className="text-slate-400 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                t.status === 'Nuevo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                t.status === 'En revisión' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                t.status === 'Resuelto' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: KNOWLEDGE BASE MANAGER (MÓDULO 3) */}
            {activeTab === 'kb' && (
              <motion.div 
                key="kb"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Section title & Create new article button */}
                <div className="bg-white p-5 rounded-2xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-black text-lg text-ink">Administrar Base de Conocimientos</h3>
                    <p className="text-xs text-muted">Añade y edita manuales técnicos públicos que alimentarán las sugerencias inteligentes del AI Copilot.</p>
                  </div>
                  {userRole !== 'client' && (
                    <button
                      onClick={() => {
                        setEditingKbArticle({
                          title: '',
                          content: '',
                          category: 'Sincronización',
                          tags: [],
                          language: 'es',
                          status: 'published'
                        });
                        setShowKbArticleForm(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Nuevo Artículo
                    </button>
                  )}
                </div>

                {/* Article edit/create form */}
                {showKbArticleForm && editingKbArticle && (
                  <form onSubmit={handleSaveKbArticle} className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
                    <h3 className="font-display font-black text-base text-ink pb-2 border-b border-line">
                      {editingKbArticle.id ? 'Editar Artículo' : 'Nuevo Artículo de Ayuda'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Título del Artículo *</label>
                        <input
                          type="text"
                          value={editingKbArticle.title || ''}
                          onChange={(e) => setEditingKbArticle({ ...editingKbArticle, title: e.target.value })}
                          className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Categoría *</label>
                        <select
                          value={editingKbArticle.category || 'Sincronización'}
                          onChange={(e) => setEditingKbArticle({ ...editingKbArticle, category: e.target.value })}
                          className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white font-semibold text-slate-700"
                        >
                          <option value="Sincronización">Sincronización</option>
                          <option value="Tarifas">Tarifas</option>
                          <option value="Operaciones">Operaciones</option>
                          <option value="Pagos">Pagos</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Contenido Técnico (Cuerpo del Artículo) *</label>
                      <textarea
                        value={editingKbArticle.content || ''}
                        onChange={(e) => setEditingKbArticle({ ...editingKbArticle, content: e.target.value })}
                        className="w-full min-h-[120px] rounded-xl border border-line p-3 text-xs bg-white outline-none focus:border-forest resize-y"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Idioma</label>
                        <select
                          value={editingKbArticle.language || 'es'}
                          onChange={(e) => setEditingKbArticle({ ...editingKbArticle, language: e.target.value })}
                          className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
                        >
                          <option value="es">Español (es)</option>
                          <option value="en">Inglés (en)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Estado</label>
                        <select
                          value={editingKbArticle.status || 'published'}
                          onChange={(e) => setEditingKbArticle({ ...editingKbArticle, status: e.target.value as any })}
                          className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
                        >
                          <option value="published">Publicado</option>
                          <option value="draft">Borrador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Etiquetas (Separadas por comas)</label>
                        <input
                          type="text"
                          placeholder="airbnb, ical, pagos"
                          onChange={(e) => setEditingKbArticle({ ...editingKbArticle, tags: e.target.value.split(',').map(t => t.trim()) })}
                          className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKbArticle(null);
                          setShowKbArticleForm(false);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl shadow-md"
                      >
                        Guardar Artículo
                      </button>
                    </div>
                  </form>
                )}

                {/* Articles lists in tabular format */}
                <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-line">
                          <th className="p-4">Título</th>
                          <th className="p-4">Categoría</th>
                          <th className="p-4">Idioma</th>
                          <th className="p-4">Versión</th>
                          <th className="p-4">Fecha</th>
                          <th className="p-4">Estado</th>
                          {userRole !== 'client' && <th className="p-4 text-right">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-xs font-semibold text-slate-700">
                        {kbArticles.map((art) => (
                          <tr key={art.id} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-900">{art.title}</td>
                            <td className="p-4">{art.category}</td>
                            <td className="p-4 uppercase">{art.language}</td>
                            <td className="p-4">v{art.version}</td>
                            <td className="p-4">{art.publishDate}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                art.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {art.status === 'published' ? 'Publicado' : 'Borrador'}
                              </span>
                            </td>
                            {userRole !== 'client' && (
                              <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setEditingKbArticle(art);
                                    setShowKbArticleForm(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 cursor-pointer font-extrabold text-[11px]"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteKbArticle(art.id)}
                                  className="text-rose-600 hover:text-rose-900 cursor-pointer font-extrabold text-[11px]"
                                >
                                  Eliminar
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: FEEDBACK & CSAT/NPS PLATFORM (MÓDULO 6) */}
            {activeTab === 'feedback' && (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Left Col: Send feedback */}
                <form onSubmit={handleFeedbackSubmit} className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
                  <div>
                    <h3 className="font-display font-black text-lg text-ink flex items-center gap-1.5">
                      <Smile className="w-5 h-5 text-forest" />
                      <span>Plataforma de Feedback & CSAT</span>
                    </h3>
                    <p className="text-xs text-muted mt-0.5">Envíanos tus sugerencias ligadas a módulos para seguir mejorando la experiencia de StayFlow.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Módulo del Sistema *</label>
                      <select
                        value={selectedFeedbackModule}
                        onChange={(e) => setSelectedFeedbackModule(e.target.value)}
                        className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white font-bold text-slate-700"
                      >
                        <option value="bookings">Calendario & Reservas</option>
                        <option value="payments">Facturación & Pagos</option>
                        <option value="mobile">App Móvil de Operaciones</option>
                        <option value="channel-manager">Channel Manager</option>
                        <option value="revenue">Revenue Engine</option>
                        <option value="settings">Ajustes & Configuración</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Valoración CSAT (1-5 Estrellas) *</label>
                      <div className="flex gap-1 pt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setCsatScore(star)}
                            className="p-1 cursor-pointer"
                          >
                            <Star className={`w-6 h-6 ${star <= csatScore ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Comentario sobre tu Experiencia *</label>
                    <textarea
                      placeholder="Cuéntanos qué te pareció el funcionamiento del módulo..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full min-h-[80px] rounded-xl border border-line p-3 text-xs bg-white outline-none focus:border-forest"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Sugerencia de Mejora (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Nos gustaría que el log muestre IPs autorizadas."
                      value={feedbackSuggestion}
                      onChange={(e) => setFeedbackSuggestion(e.target.value)}
                      className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                  >
                    Enviar Valoración CSAT
                  </button>
                </form>

                {/* Right Col: Net Promoter Score (NPS) */}
                <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ink">¿Qué tan probable es que recomiendes StayFlow?</h3>
                    <p className="text-xs text-muted">Net Promoter Score (NPS) para evaluar la lealtad de marca.</p>
                  </div>

                  <form onSubmit={handleNpsSubmit} className="space-y-4">
                    <div className="flex justify-between gap-1 overflow-x-auto pb-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setNpsScoreState(score)}
                          className={`w-9 h-9 rounded-full font-black text-xs shrink-0 flex items-center justify-center cursor-pointer transition-all border ${
                            score === npsScoreState 
                              ? 'bg-rose-600 border-rose-600 text-white shadow-md' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-line'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 select-none">
                      <span>Nada probable (Detractores)</span>
                      <span>Muy probable (Promotores)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Comentario Adicional (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej: Excelente servicio técnico y alta flexibilidad."
                        value={npsCommentState}
                        onChange={(e) => setNpsCommentState(e.target.value)}
                        className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                    >
                      Enviar Puntuación NPS
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* TAB: PUBLIC STATUS PAGE (MÓDULO 9) */}
            {activeTab === 'status' && (
              <motion.div 
                key="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Active systems card */}
                <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${
                        overallStatus === 'operational' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        <Activity className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-lg text-ink">Estado de Infraestructura y Servicios</h3>
                        <p className="text-xs text-muted">Historial público de incidentes de StayFlow Cloud Services.</p>
                      </div>
                    </div>

                    <span className={`px-4 py-2 rounded-full font-black text-xs border shrink-0 ${
                      overallStatus === 'operational' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {overallStatus === 'operational' ? '🟢 TODOS LOS SISTEMAS OPERATIVOS' : '⚠️ SISTEMAS DEGRADADOS O PARCIALES'}
                    </span>
                  </div>

                  {/* Systems grid details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-line/50">
                    <div className="bg-slate-50 p-3 rounded-xl border border-line text-center">
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">PMS Core Engine</span>
                      <strong className="text-xs font-bold text-emerald-700 block mt-1">100.0% disponible</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-line text-center">
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Booking Engine</span>
                      <strong className="text-xs font-bold text-emerald-700 block mt-1">99.98% disponible</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-line text-center">
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Pago Seguro API</span>
                      <strong className="text-xs font-bold text-emerald-700 block mt-1">100.0% disponible</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-line text-center">
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Channel Manager</span>
                      <strong className={`text-xs font-bold block mt-1 ${overallStatus === 'operational' ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {overallStatus === 'operational' ? '100.0% disponible' : '98.42% degradado'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Incidents timeline historicals */}
                <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-black text-base text-ink">Historial de Incidentes y Mantenimientos</h3>
                    
                    {userRole !== 'client' && (
                      <button
                        onClick={() => setShowIncidentModal(true)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                      >
                        Reportar Incidente
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {incidents.map((inc) => (
                      <div key={inc.id} className="relative space-y-1.5 bg-slate-50/50 p-4 rounded-xl border border-line/60">
                        {/* Timeline dot pointer */}
                        <div className="absolute -left-[16px] top-4 w-2 h-2 rounded-full bg-slate-400" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <strong className="text-xs font-extrabold text-slate-800">{inc.title}</strong>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                            inc.status === 'resolved' ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inc.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">{inc.description}</p>
                        
                        {/* Status updates feed */}
                        <div className="space-y-1.5 pt-2 border-t border-line/40 text-[11px]">
                          {inc.updates.map((up, uidx) => (
                            <div key={uidx} className="text-slate-400 flex items-start gap-1.5 font-semibold">
                              <span className="text-slate-500 font-bold shrink-0">{new Date(up.timestamp).toLocaleTimeString()}:</span>
                              <span>{up.message}</span>
                            </div>
                          ))}
                        </div>

                        {/* Agent simulation controls */}
                        {userRole !== 'client' && inc.status !== 'resolved' && (
                          <div className="pt-3 border-t border-line/40 flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => handleSimulateStatusUpdate(inc.id, 'monitoring')}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded cursor-pointer"
                            >
                              Monitorear parches
                            </button>
                            <button
                              onClick={() => handleSimulateStatusUpdate(inc.id, 'resolved')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded cursor-pointer"
                            >
                              Marcar Solucionado
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Side: AI Assistant Copilot Panel Drawer (Module 8) */}
        <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-line p-5 flex flex-col justify-between shrink-0 select-none">
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                <h4 className="font-display font-black text-xs text-slate-800 uppercase tracking-wider">StayFlow AI Copilot</h4>
              </div>

              {/* Chat Stream messages */}
              <div className="flex-1 space-y-3.5 max-h-[350px] md:max-h-[500px] overflow-y-auto pr-1">
                {aiChatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-2xl text-[11px] leading-relaxed space-y-1 max-w-[90%] font-semibold shadow-xs ${
                      msg.sender === 'user' 
                        ? 'bg-rose-50 border border-rose-100/40 text-slate-800 ml-auto mr-0' 
                        : 'bg-slate-50 border border-line/50 text-slate-600 ml-0 mr-auto'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[9px] text-slate-400 font-normal block text-right">{msg.timestamp}</span>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="bg-slate-50 border border-line/50 p-3 rounded-2xl text-[11px] text-slate-400 font-semibold italic flex items-center gap-2 ml-0 mr-auto">
                    <RefreshCw className="w-3 h-3 animate-spin text-forest" />
                    <span>Redactando respuesta inteligente...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendAiMessage} className="pt-3 border-t border-line">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pregúntame sobre Airbnb iCal, tarifas o soporte..."
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  className="flex-1 min-h-[38px] rounded-xl border border-line px-3 text-xs bg-slate-50 outline-none focus:border-forest"
                />
                <button
                  type="submit"
                  className="px-3 bg-forest hover:bg-forest-hover text-white rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------- */}

      {/* Ticket Creation Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-display font-black text-lg text-ink">Crear Solicitud de Soporte Técnico</h3>
            
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Asunto de la consulta *</label>
                <input
                  type="text"
                  placeholder="Ej: Error de actualización de tarifas base..."
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Categoría *</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as TicketCategory)}
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white font-bold"
                  >
                    <option value="technical">🔧 Falla Técnica / iCal</option>
                    <option value="billing">💳 Facturación / Planes</option>
                    <option value="onboarding">🚀 Onboarding / Guías</option>
                    <option value="feedback">💬 Sugerencia / Mejora</option>
                    <option value="other">📦 Otro tema</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Prioridad *</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as TicketPriority)}
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white font-bold"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">🚨 Crítica / Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Descripción Detallada del Inconveniente *</label>
                <textarea
                  placeholder="Describe detalladamente los pasos para replicar el problema o tu consulta..."
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  className="w-full min-h-[100px] rounded-xl border border-line p-3 text-xs bg-white resize-y"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Enviar Ticket de Soporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incident reporting modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-display font-black text-lg text-ink">Registrar Incidente de Plataforma</h3>
            
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Título del incidente *</label>
                <input
                  type="text"
                  placeholder="Ej: Degradación en procesamiento iCal..."
                  value={newIncidentTitle}
                  onChange={(e) => setNewIncidentTitle(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1 font-sans">Severidad *</label>
                <select
                  value={newIncidentSeverity}
                  onChange={(e) => setNewIncidentSeverity(e.target.value as any)}
                  className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white font-bold"
                >
                  <option value="operational">Mantenimiento Operativo</option>
                  <option value="degraded">Degradación de Latencia</option>
                  <option value="partial_outage">Caída Parcial del Servicio</option>
                  <option value="major_outage">🚨 Caída Mayor (Bloqueante)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Descripción del problema *</label>
                <textarea
                  placeholder="Describe los alcances e infraestructura afectada..."
                  value={newIncidentDesc}
                  onChange={(e) => setNewIncidentDesc(e.target.value)}
                  className="w-full min-h-[80px] rounded-xl border border-line p-3 text-xs bg-white resize-y"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Publicar Incidente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
