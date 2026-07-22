import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Send, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Settings, 
  FileCode, 
  Copy, 
  Play, 
  Code,
  Globe,
  Wifi,
  MapPin,
  ChevronRight,
  Eye
} from 'lucide-react';
import { NotificationRepository } from '../../../core/notifications/NotificationRepository';
import { TemplateService } from '../../../core/notifications/TemplateService';
import { QueueService } from '../../../core/notifications/QueueService';
import { NotificationEngine } from '../../../core/notifications/NotificationEngine';
import { 
  NotificationTemplate, 
  NotificationSettings, 
  NotificationQueueItem, 
  NotificationLog, 
  NotificationEvent, 
  NotificationChannel, 
  NotificationStatus,
  NotificationStats
} from '../../../core/notifications/NotificationTypes';
import { Logger } from '../../../core/logger/Logger';

export const NotificationManagerPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'settings'>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [queue, setQueue] = useState<NotificationQueueItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  // Editing state
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<NotificationQueueItem | null>(null);
  
  // Settings Form State
  const [wifiName, setWifiName] = useState('StayFlow_HighSpeed');
  const [wifiPassword, setWifiPassword] = useState('stayflow2026');
  const [mapUrl, setMapUrl] = useState('https://maps.google.com/?q=Patagonia+Argentina');
  const [appName, setAppName] = useState('Refugio StayFlow');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const statsData = await NotificationEngine.getStats();
      const logsData = await NotificationRepository.getLogs();
      const queueData = await NotificationRepository.getQueue();
      const templatesData = await NotificationRepository.getTemplates();
      const settingsData = await NotificationRepository.getSettings();

      setStats(statsData);
      setLogs(logsData.reverse()); // Latest logs first
      setQueue(queueData.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()));
      setTemplates(templatesData);
      setSettings(settingsData);

      // Pre-fill helper contact info
      if (settingsData) {
        setWifiName((settingsData as any).contactInfo?.wifiName || 'StayFlow_HighSpeed');
        setWifiPassword((settingsData as any).contactInfo?.wifiPassword || 'stayflow2026');
        setMapUrl((settingsData as any).contactInfo?.mapUrl || 'https://maps.google.com/?q=Patagonia+Argentina');
        setAppName((settingsData as any).appName || 'Refugio StayFlow');
      }
    } catch (err) {
      Logger.error('Error loading notification manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessQueue = async () => {
    setLoading(true);
    try {
      const processed = await QueueService.processQueue();
      await loadAllData();
      alert(`¡Se procesó la cola de salida con éxito! Eventos procesados: ${processed}`);
    } catch (err) {
      Logger.error('Error processing queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('¿Estás seguro de que deseas cancelar todos los envíos pendientes de la cola?')) {
      setLoading(true);
      try {
        await QueueService.clearQueue();
        await loadAllData();
      } catch (err) {
        Logger.error('Error clearing queue:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      await TemplateService.saveTemplate(editingTemplate);
      setEditingTemplate(null);
      await loadAllData();
    } catch (err) {
      Logger.error('Error saving template:', err);
    }
  };

  const handleToggleTemplate = async (template: NotificationTemplate) => {
    try {
      await TemplateService.saveTemplate({
        ...template,
        active: !template.active
      });
      await loadAllData();
    } catch (err) {
      Logger.error('Error toggling template state:', err);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('¿Deseas restablecer las plantillas predeterminadas de StayFlow? Esto sobrescribirá los cambios.')) {
      setLoading(true);
      try {
        const tid = settings?.tenantId || 'default-resort';
        // Clear templates in LocalSaaSDb and reload will seed defaults
        localStorage.removeItem(`notificationTemplates_${tid}`);
        await loadAllData();
      } catch (err) {
        Logger.error('Error resetting default templates:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const updatedSettings: NotificationSettings = {
        ...settings,
        appName: appName,
        contactInfo: {
          ...settings.contactInfo,
          wifiName,
          wifiPassword,
          mapUrl
        } as any
      };
      await NotificationRepository.saveSettings(updatedSettings);
      await loadAllData();
      alert('¡Configuración de comunicaciones guardada con éxito!');
    } catch (err) {
      Logger.error('Error saving settings:', err);
    }
  };

  const handleToggleChannel = async (channel: NotificationChannel) => {
    if (!settings) return;
    
    let enabled = [...settings.enabledChannels];
    if (enabled.includes(channel)) {
      enabled = enabled.filter(c => c !== channel);
    } else {
      enabled.push(channel);
    }

    try {
      await NotificationRepository.saveSettings({
        ...settings,
        enabledChannels: enabled
      });
      await loadAllData();
    } catch (err) {
      Logger.error('Error toggling channel preference:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(text);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return <Mail className="w-4 h-4 text-blue-500" />;
      case NotificationChannel.WHATSAPP:
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case NotificationChannel.SMS:
        return <Smartphone className="w-4 h-4 text-purple-500" />;
      case NotificationChannel.PUSH:
        return <Bell className="w-4 h-4 text-amber-500" />;
      case NotificationChannel.INTERNAL:
        return <Code className="w-4 h-4 text-slate-500" />;
      case NotificationChannel.WEBHOOK:
        return <FileCode className="w-4 h-4 text-rose-500" />;
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.SENT:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">🟢 Enviado</span>;
      case NotificationStatus.FAILED:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">🔴 Fallido</span>;
      case NotificationStatus.RETRYING:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">🔄 Reintentando</span>;
      case NotificationStatus.QUEUED:
      case NotificationStatus.PENDING:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">🕒 En Cola</span>;
      case NotificationStatus.CANCELLED:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">⚪ Cancelado</span>;
    }
  };

  const getEventFriendlyName = (event: NotificationEvent) => {
    return event.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const variablesHelperList = [
    { token: '{{guest.name}}', desc: 'Nombre completo del huésped' },
    { token: '{{booking.code}}', desc: 'ID o Código alfanumérico de la reserva' },
    { token: '{{checkin.date}}', desc: 'Fecha de ingreso (Check-In)' },
    { token: '{{checkout.date}}', desc: 'Fecha de salida (Check-Out)' },
    { token: '{{room.name}}', desc: 'Nombre del alojamiento reservado' },
    { token: '{{payment.amount}}', desc: 'Monto total facturado' },
    { token: '{{wifi.name}}', desc: 'Nombre de la red WiFi del resort' },
    { token: '{{wifi.password}}', desc: 'Contraseña de la red WiFi' },
    { token: '{{map.url}}', desc: 'Enlace de geolocalización o mapa' },
  ];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-forest animate-spin" />
        <p className="text-sm font-semibold text-muted">Cargando Notification Engine Suite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub tabs inside panel */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard' ? 'bg-forest text-white' : 'hover:bg-slate-100 text-muted'
          }`}
        >
          Visualizador y Cola
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'templates' ? 'bg-forest text-white' : 'hover:bg-slate-100 text-muted'
          }`}
        >
          Plantillas Dinámicas
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'settings' ? 'bg-forest text-white' : 'hover:bg-slate-100 text-muted'
          }`}
        >
          Preferencias de Canal
        </button>
      </div>

      {/* TAB 1: DASHBOARD & QUEUE MONITOR */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          {/* Executive Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-line shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Enviados (OK)</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-slate-900">{stats.sentCount}</span>
                <span className="text-xs font-bold text-emerald-500">100% real</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-line shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Pendientes / Cola</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-blue-600">{stats.queuedCount + stats.pendingCount}</span>
                <span className="text-xs font-bold text-blue-500">Planificados</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-line shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Reintentando</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-amber-500">{stats.retryingCount}</span>
                <span className="text-xs font-bold text-amber-500">Backoff</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-line shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Fallidos Permanentes</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-rose-600">{stats.failedCount}</span>
                <span className="text-xs font-bold text-rose-500">Exhaustos</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-line shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Latencia Promedio</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-slate-700">{stats.averageLatencyMs}ms</span>
                <span className="text-xs font-bold text-indigo-500">Conexión</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-slate-50 border border-line p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800">Sincronización manual de tareas</h4>
              <p className="text-[11px] text-muted leading-relaxed">Trigger manual para procesar mensajes programados listos para envío.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleProcessQueue}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                Procesar Cola
              </button>
              <button
                onClick={handleClearQueue}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Vaciar Cola
              </button>
              <button
                onClick={loadAllData}
                className="inline-flex items-center justify-center p-2 bg-white text-slate-600 rounded-xl border border-line hover:bg-slate-50 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Queue list */}
            <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" /> Cola de Salida Activa ({queue.length})
                </h3>
              </div>

              {queue.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs space-y-1">
                  <p>No hay comunicaciones planificadas en cola.</p>
                  <p className="text-[10px]">Las tareas programadas aparecerán aquí cuando crees o confirmes reservas.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {queue.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedQueue(item)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-line/60 transition-all cursor-pointer flex justify-between items-start text-xs"
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(item.channel)}
                          <span className="font-extrabold text-slate-800 truncate">{getEventFriendlyName(item.event)}</span>
                        </div>
                        <p className="text-slate-500 truncate">{item.recipient}</p>
                        <p className="text-[10px] text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Prog: {new Date(item.scheduledFor).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ({new Date(item.scheduledFor).toLocaleDateString()})
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        {getStatusBadge(item.status)}
                        <p className="text-[10px] text-muted font-mono font-bold">Intentos: {item.attempts}/{item.maxAttempts}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live audit logs feed */}
            <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-forest" /> Historial de Envío y Auditoría ({logs.length})
                </h3>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 text-muted text-xs">
                  Aún no se registran envíos en esta sesión.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {logs.map(log => (
                    <div 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className="p-3 border border-line/60 rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex justify-between items-start text-xs"
                    >
                      <div className="space-y-1 max-w-[75%]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getChannelIcon(log.channel)}
                          <span className="font-extrabold text-slate-800">{getEventFriendlyName(log.event)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{log.id.slice(-4)}</span>
                        </div>
                        <p className="text-slate-600 truncate font-semibold">{log.recipient}</p>
                        {log.subject && <p className="text-slate-500 truncate italic">Asunto: {log.subject}</p>}
                        <p className="text-[10px] text-slate-400">
                          Enviado: {new Date(log.createdAt).toLocaleDateString()} a las {new Date(log.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1 shrink-0">
                        {getStatusBadge(log.status)}
                        {log.latencyMs !== undefined && (
                          <p className="text-[10px] text-indigo-500 font-bold font-mono">{log.latencyMs}ms</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE MANAGEMENT */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 border border-line rounded-2xl flex-wrap gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800">Configuración de Plantillas StayFlow</h4>
              <p className="text-[11px] text-muted">Las plantillas soportan etiquetas dinámicas de renderizado.</p>
            </div>
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-1.5 bg-white border border-line hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Restaurar Valores por Defecto
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List templates */}
            <div className="space-y-3 lg:col-span-5 max-h-[550px] overflow-y-auto pr-1">
              {templates.map(tmpl => (
                <div 
                  key={tmpl.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                    editingTemplate?.id === tmpl.id 
                      ? 'border-forest bg-forest/5 shadow-xs' 
                      : 'border-line/80 bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => setEditingTemplate(tmpl)}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {getChannelIcon(tmpl.channel)}
                        <span className="font-extrabold text-xs text-slate-900">{tmpl.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">{tmpl.event}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">{tmpl.language}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTemplate(tmpl);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          tmpl.active 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {tmpl.active ? 'Activo' : 'Desactivado'}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-muted line-clamp-2 italic border-t border-slate-100 pt-2">
                    "{tmpl.content}"
                  </div>
                </div>
              ))}
            </div>

            {/* Template editor form */}
            <div className="lg:col-span-7 bg-white border border-line rounded-2xl p-6 shadow-xs space-y-4">
              {editingTemplate ? (
                <form onSubmit={handleSaveTemplate} className="space-y-4">
                  <div className="border-b border-line pb-3 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <h3 className="font-display font-extrabold text-sm text-slate-950">Editar Plantilla</h3>
                      <p className="text-[10px] font-mono text-muted">{editingTemplate.id}</p>
                    </div>
                    <span className="text-xs font-bold text-forest uppercase">{editingTemplate.channel}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Descriptivo</label>
                      <input 
                        type="text"
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                        className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Idioma</label>
                      <select
                        value={editingTemplate.language}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, language: e.target.value })}
                        className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                      >
                        <option value="es">Español (es)</option>
                        <option value="en">Inglés (en)</option>
                        <option value="pt">Portugués (pt)</option>
                      </select>
                    </div>
                  </div>

                  {editingTemplate.channel === NotificationChannel.EMAIL && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Asunto del Correo (Subject)</label>
                      <input 
                        type="text"
                        value={editingTemplate.subject || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                        className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                        required
                      />
                    </div>
                  )}

                  {editingTemplate.channel === NotificationChannel.EMAIL && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Título del Banner (Header)</label>
                      <input 
                        type="text"
                        value={editingTemplate.title || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                        className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contenido de la Notificación</label>
                    <textarea 
                      value={editingTemplate.content}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                      rows={6}
                      className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none resize-y"
                      required
                    />
                  </div>

                  {/* Variables Copy Helper Tool */}
                  <div className="bg-slate-50 border border-line/60 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-forest block">Variables Dinámicas Disponibles (Haz clic para copiar)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {variablesHelperList.map(item => (
                        <button
                          key={item.token}
                          type="button"
                          onClick={() => copyToClipboard(item.token)}
                          title={item.desc}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-forest/5 hover:border-forest transition-colors cursor-pointer"
                        >
                          {item.token}
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                    {copiedVar && (
                      <span className="text-[10px] text-emerald-600 font-bold block">¡Copiado {copiedVar} al portapapeles!</span>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(null)}
                      className="px-4 py-2 border border-line text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted text-xs space-y-3">
                  <FileCode className="w-10 h-10 text-slate-300" />
                  <p>Selecciona una plantilla del listado para ver su editor dinámico y variables de mapeo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & CHANNEL PREFERENCES */}
      {activeTab === 'settings' && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Channel configuration toggles */}
          <div className="bg-white border border-line rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-5">
            <h3 className="font-display font-extrabold text-sm text-slate-900 border-b border-line pb-2 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-500" /> Canales de Transmisión Habilitados
            </h3>
            
            <p className="text-[11px] text-muted leading-relaxed">
              Activa o desactiva de forma global la entrega de notificaciones en cada plataforma. StayFlow rutea eventos únicamente a los canales aprobados aquí.
            </p>

            <div className="space-y-3.5 pt-2">
              <div 
                onClick={() => handleToggleChannel(NotificationChannel.EMAIL)}
                className="p-3 border border-line/60 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getChannelIcon(NotificationChannel.EMAIL)}
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-800">Correo Electrónico (Email)</span>
                    <span className="text-[10px] text-slate-400 block">Envío oficial de confirmación HTML</span>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${settings.enabledChannels.includes(NotificationChannel.EMAIL) ? 'bg-forest' : 'bg-slate-200'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${settings.enabledChannels.includes(NotificationChannel.EMAIL) ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              <div 
                onClick={() => handleToggleChannel(NotificationChannel.WHATSAPP)}
                className="p-3 border border-line/60 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getChannelIcon(NotificationChannel.WHATSAPP)}
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-800">WhatsApp (Meta API)</span>
                    <span className="text-[10px] text-slate-400 block">Mensajería instantánea directa al móvil</span>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${settings.enabledChannels.includes(NotificationChannel.WHATSAPP) ? 'bg-forest' : 'bg-slate-200'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${settings.enabledChannels.includes(NotificationChannel.WHATSAPP) ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              <div 
                onClick={() => handleToggleChannel(NotificationChannel.SMS)}
                className="p-3 border border-line/60 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getChannelIcon(NotificationChannel.SMS)}
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-800">Mensajes de Texto (SMS)</span>
                    <span className="text-[10px] text-slate-400 block">Mensajes cortos tradicionales de respaldo</span>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${settings.enabledChannels.includes(NotificationChannel.SMS) ? 'bg-forest' : 'bg-slate-200'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${settings.enabledChannels.includes(NotificationChannel.SMS) ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              <div 
                onClick={() => handleToggleChannel(NotificationChannel.PUSH)}
                className="p-3 border border-line/60 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getChannelIcon(NotificationChannel.PUSH)}
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-800">Notificaciones Push</span>
                    <span className="text-[10px] text-slate-400 block">Notificaciones móviles instantáneas</span>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${settings.enabledChannels.includes(NotificationChannel.PUSH) ? 'bg-forest' : 'bg-slate-200'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${settings.enabledChannels.includes(NotificationChannel.PUSH) ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              <div 
                onClick={() => handleToggleChannel(NotificationChannel.WEBHOOK)}
                className="p-3 border border-line/60 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getChannelIcon(NotificationChannel.WEBHOOK)}
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-800">Webhook Integration</span>
                    <span className="text-[10px] text-slate-400 block">Disparar HTTP POST a endpoints externos</span>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${settings.enabledChannels.includes(NotificationChannel.WEBHOOK) ? 'bg-forest' : 'bg-slate-200'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${settings.enabledChannels.includes(NotificationChannel.WEBHOOK) ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Contact settings details form */}
          <div className="bg-white border border-line rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-7">
            <h3 className="font-display font-extrabold text-sm text-slate-900 border-b border-line pb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-forest" /> Datos de Propiedad y Variables Estáticas
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial de la Propiedad</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">@</span>
                    <input 
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full rounded-xl border border-line pl-8 pr-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación (Enlace Google Maps)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="url"
                      value={mapUrl}
                      onChange={(e) => setMapUrl(e.target.value)}
                      className="w-full rounded-xl border border-line pl-9 pr-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border border-line/60 rounded-xl space-y-3">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-forest flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> Credenciales WiFi oficiales de los Dormitorios
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Red WiFi (wifi.name)</label>
                    <input 
                      type="text"
                      value={wifiName}
                      onChange={(e) => setWifiName(e.target.value)}
                      className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Contraseña WiFi (wifi.password)</label>
                    <input 
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Restricción Silencio (Inicio)</label>
                  <input 
                    type="time"
                    value={settings.allowedHoursStart || '08:00'}
                    onChange={(e) => setSettings({ ...settings, allowedHoursStart: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Restricción Silencio (Fin)</label>
                  <input 
                    type="time"
                    value={settings.allowedHoursEnd || '22:00'}
                    onChange={(e) => setSettings({ ...settings, allowedHoursEnd: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Idioma Predeterminado</label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  >
                    <option value="es">Español (es)</option>
                    <option value="en">Inglés (en)</option>
                    <option value="pt">Portugués (pt)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: CHOSEN QUEUE LOG VIEW */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-line shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-line flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-1.5">
                {getChannelIcon(selectedLog.channel)}
                <span className="font-extrabold text-xs text-slate-900">Auditoría del Mensaje</span>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-muted hover:text-ink font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-line/60">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Canal</span>
                  <span className="font-extrabold text-slate-800 uppercase">{selectedLog.channel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Estado</span>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Destinatario</span>
                  <span className="font-semibold text-slate-800">{selectedLog.recipient}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Latencia</span>
                  <span className="font-mono text-indigo-500 font-bold">{selectedLog.latencyMs || 0} ms</span>
                </div>
              </div>

              {selectedLog.subject && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Asunto (Subject)</span>
                  <div className="p-2.5 bg-slate-100 rounded-lg border border-line text-[11px] font-semibold text-slate-800">
                    {selectedLog.subject}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Cuerpo del Mensaje (Compiled Content)</span>
                <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto">
                  {selectedLog.content}
                </div>
              </div>

              {selectedLog.error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Error de Transmisión:</span>
                    <p className="text-[10px] font-mono mt-0.5">{selectedLog.error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHOSEN QUEUE ITEM DETAILS */}
      {selectedQueue && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-line shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-line flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-1.5">
                {getChannelIcon(selectedQueue.channel)}
                <span className="font-extrabold text-xs text-slate-900">Detalles de Tarea en Cola</span>
              </div>
              <button 
                onClick={() => setSelectedQueue(null)}
                className="text-muted hover:text-ink font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-line/60">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Planificado Para</span>
                  <span className="font-extrabold text-slate-800">
                    {new Date(selectedQueue.scheduledFor).toLocaleTimeString()} ({new Date(selectedQueue.scheduledFor).toLocaleDateString()})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Estado</span>
                  {getStatusBadge(selectedQueue.status)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Destinatario</span>
                  <span className="font-semibold text-slate-800">{selectedQueue.recipient}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Intentos</span>
                  <span className="font-mono text-slate-800 font-bold">{selectedQueue.attempts} / {selectedQueue.maxAttempts}</span>
                </div>
              </div>

              {selectedQueue.subject && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Asunto (Subject)</span>
                  <div className="p-2.5 bg-slate-100 rounded-lg border border-line text-[11px] font-semibold text-slate-800">
                    {selectedQueue.subject}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Contenido Compilado</span>
                <div className="p-3 bg-slate-950 text-blue-400 font-mono text-[11px] rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto">
                  {selectedQueue.content}
                </div>
              </div>

              {selectedQueue.error && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Detalles de la Falla:</span>
                    <p className="text-[10px] font-mono mt-0.5">{selectedQueue.error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
