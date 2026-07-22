import React, { useState } from 'react';
import {
  Globe,
  Building2,
  Languages,
  Coins,
  ShieldCheck,
  Activity,
  Layers,
  Key
} from 'lucide-react';
import { EnterpriseProvider, useEnterprise } from '../context/EnterpriseContext';
import { CrossPropertyDashboard } from './CrossPropertyDashboard';
import { OrganizationChainManager } from './OrganizationChainManager';
import { TranslationManager } from './TranslationManager';
import { LocalizationCurrencyManager } from './LocalizationCurrencyManager';
import { CorporateRBACManager } from './CorporateRBACManager';
import { ComplianceAuditManager } from './ComplianceAuditManager';
import { EnterpriseObservabilityPanel } from './EnterpriseObservabilityPanel';

const EnterpriseSuiteContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'chains' | 'i18n' | 'l10n' | 'rbac' | 'compliance' | 'observability'
  >('dashboard');

  const { selectedOrg, currentLanguage, setLanguage, availableLanguages } = useEnterprise();

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Dashboard Corporativo</span>
          </button>

          <button
            onClick={() => setActiveTab('chains')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'chains'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Multi-Org & Cadenas</span>
          </button>

          <button
            onClick={() => setActiveTab('i18n')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'i18n'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Languages className="w-4 h-4 text-indigo-400" />
            <span>Traducciones (i18n)</span>
          </button>

          <button
            onClick={() => setActiveTab('l10n')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'l10n'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-4 h-4 text-indigo-400" />
            <span>Monedas & Formatos (l10n)</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rbac'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Roles Corporativos</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'compliance'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Cumplimiento & Bóveda</span>
          </button>

          <button
            onClick={() => setActiveTab('observability')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'observability'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Observabilidad</span>
          </button>
        </div>

        {/* Quick Language Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={currentLanguage}
            onChange={e => setLanguage(e.target.value)}
            className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
          >
            {availableLanguages.map(l => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name} ({l.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tab Render */}
      {activeTab === 'dashboard' && <CrossPropertyDashboard />}
      {activeTab === 'chains' && <OrganizationChainManager />}
      {activeTab === 'i18n' && <TranslationManager />}
      {activeTab === 'l10n' && <LocalizationCurrencyManager />}
      {activeTab === 'rbac' && <CorporateRBACManager />}
      {activeTab === 'compliance' && <ComplianceAuditManager />}
      {activeTab === 'observability' && <EnterpriseObservabilityPanel />}
    </div>
  );
};

export const EnterpriseSuite: React.FC = () => {
  return (
    <EnterpriseProvider>
      <EnterpriseSuiteContent />
    </EnterpriseProvider>
  );
};
