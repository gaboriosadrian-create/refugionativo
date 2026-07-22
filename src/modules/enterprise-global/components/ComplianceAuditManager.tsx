import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Download,
  Trash2,
  Clock,
  UserCheck,
  Search,
  CheckCircle2,
  Lock,
  Eye,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import { ComplianceService } from '../services/ComplianceService';

export const ComplianceAuditManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audits' | 'consents' | 'retention'>('audits');
  const [settings, setSettings] = useState(ComplianceService.getComplianceSettings());
  const [auditLogs, setAuditLogs] = useState(ComplianceService.getAuditLogs());
  const [consents, setConsents] = useState(ComplianceService.getConsents());

  const [exportEmail, setExportEmail] = useState('');
  const [exportedData, setExportedData] = useState<any | null>(null);

  const [searchAudit, setSearchAudit] = useState('');

  const filteredAudits = auditLogs.filter(a =>
    a.actorEmail.toLowerCase().includes(searchAudit.toLowerCase()) ||
    a.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
    a.targetResource.toLowerCase().includes(searchAudit.toLowerCase())
  );

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    ComplianceService.updateComplianceSettings(settings);
    alert('Políticas de cumplimiento e inmutabilidad actualizadas correctamente.');
  };

  const handleExportData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportEmail) return;

    const data = ComplianceService.exportGuestData(exportEmail);
    setExportedData(data);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compliance Ready (GDPR / LGPD / CCPA)</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Centro de Cumplimiento Normativo & Bóveda de Auditoría
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Registro inmutable de trazabilidad de acciones, logs de consentimiento de huéspedes, retención auditada de datos y solicitudes de portabilidad.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('audits')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audits' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Auditoría
            </button>
            <button
              onClick={() => setActiveTab('consents')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'consents' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Consentimientos
            </button>
            <button
              onClick={() => setActiveTab('retention')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'retention' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Políticas Retención
            </button>
          </div>
        </div>
      </div>

      {/* Tab: Audit Logs */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <span>Registro de Auditoría Inmutable (Audit Trail)</span>
            </h3>

            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por usuario, acción o recurso..."
                value={searchAudit}
                onChange={e => setSearchAudit(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Fecha / Hora (UTC)</th>
                  <th className="px-4 py-3">Actor / Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Acción Registrada</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Recurso Afectado</th>
                  <th className="px-4 py-3">Dirección IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {filteredAudits.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-ES')}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {log.actorEmail}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-900">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">
                      {log.category}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {log.targetResource}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Consents */}
      {activeTab === 'consents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Logs de Consentimiento Informado (GDPR / LGPD)</span>
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Huésped / Email</th>
                  <th className="px-4 py-3">Tipo Consentimiento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">IP Origen</th>
                  <th className="px-4 py-3">Fecha Otorgamiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {consents.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {c.guestEmail}
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-indigo-700">
                      {c.consentType}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Otorgado
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{c.ipAddress}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(c.timestamp).toLocaleString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export Guest Data Tool */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Exportar Datos Personales del Huésped (Derecho de Portabilidad)</span>
            </h4>
            <form onSubmit={handleExportData} className="flex gap-2 max-w-md text-xs">
              <input
                type="email"
                required
                placeholder="Email del huésped..."
                value={exportEmail}
                onChange={e => setExportEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 whitespace-nowrap"
              >
                Generar Paquete JSON
              </button>
            </form>

            {exportedData && (
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto">
                <pre>{JSON.stringify(exportedData, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Retention Settings */}
      {activeTab === 'retention' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Políticas de Retención y Anonimización de Datos</span>
          </h3>

          <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Días de Retención de Logs de Auditoría</label>
              <input
                type="number"
                value={settings.dataRetentionDays}
                onChange={e => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) || 365 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Días para Anonimización Automática de Huéspedes</label>
              <input
                type="number"
                value={settings.automaticAnonymizationDays}
                onChange={e => setSettings({ ...settings, automaticAnonymizationDays: parseInt(e.target.value) || 730 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email del Oficial de Protección de Datos (DPO)</label>
              <input
                type="email"
                value={settings.dpoEmail}
                onChange={e => setSettings({ ...settings, dpoEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">URL de Política de Privacidad</label>
              <input
                type="text"
                value={settings.privacyPolicyUrl}
                onChange={e => setSettings({ ...settings, privacyPolicyUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={settings.gdprEnabled}
                  onChange={e => setSettings({ ...settings, gdprEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>GDPR (Unión Europea) Activo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={settings.lgpdEnabled}
                  onChange={e => setSettings({ ...settings, lgpdEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>LGPD (Brasil) Activo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={settings.ccpaEnabled}
                  onChange={e => setSettings({ ...settings, ccpaEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>CCPA (California) Activo</span>
              </label>
            </div>

            <div className="md:col-span-2 pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm"
              >
                Guardar Políticas de Cumplimiento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
