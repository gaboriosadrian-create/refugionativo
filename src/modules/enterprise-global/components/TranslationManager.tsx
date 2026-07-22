import React, { useState } from 'react';
import {
  Globe,
  Languages,
  Plus,
  Save,
  Check,
  Search,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import { TranslationService } from '../services/TranslationService';
import { LocalizationService } from '../services/LocalizationService';

export const TranslationManager: React.FC = () => {
  const {
    availableLanguages,
    currentLanguage,
    setLanguage,
    refreshData
  } = useEnterprise();

  const [selectedEditLang, setSelectedEditLang] = useState<string>('es');
  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // New language form state
  const [isAddingLang, setIsAddingLang] = useState(false);
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [newLangNative, setNewLangNative] = useState('');
  const [newLangFlag, setNewLangFlag] = useState('🌐');

  const fullDict = TranslationService.getFullDictionary(selectedEditLang);

  const filteredKeys = Object.keys(fullDict).filter(k =>
    k.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fullDict[k].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateTranslation = (key: string, val: string) => {
    TranslationService.setTranslation(selectedEditLang, key, val);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddTranslationKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValue) return;

    TranslationService.setTranslation(selectedEditLang, newKey.trim(), newValue.trim());
    setNewKey('');
    setNewValue('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangCode || !newLangName) return;

    LocalizationService.addLanguage({
      code: newLangCode.toLowerCase(),
      name: newLangName,
      nativeName: newLangNative || newLangName,
      flag: newLangFlag,
      enabled: true
    });

    setNewLangCode('');
    setNewLangName('');
    setIsAddingLang(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Languages className="w-6 h-6 text-indigo-600" />
            <span>Internacionalización (i18n) & Diccionario Multilingüe</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administra traducciones dinámicas, soporte multilingüe (Español, Inglés, Portugués) y extensiones i18n para StayFlow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddingLang(true)}
            className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Añadir Nuevo Idioma
          </button>
        </div>
      </div>

      {/* Add Language Modal */}
      {isAddingLang && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Registrar Nuevo Idioma en la Plataforma</span>
          </h3>
          <form onSubmit={handleAddLanguage} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Código ISO (e.g. fr, de, it)</label>
              <input
                type="text"
                required
                placeholder="fr"
                value={newLangCode}
                onChange={e => setNewLangCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Nombre Idioma</label>
              <input
                type="text"
                required
                placeholder="Français"
                value={newLangName}
                onChange={e => setNewLangName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Bandera Emoji</label>
              <input
                type="text"
                placeholder="🇫🇷"
                value={newLangFlag}
                onChange={e => setNewLangFlag(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 font-bold rounded-lg hover:bg-indigo-700 text-white"
              >
                Guardar Idioma
              </button>
              <button
                type="button"
                onClick={() => setIsAddingLang(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold"
              >
                X
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Language Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {availableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelectedEditLang(lang.code)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                selectedEditLang === lang.code
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              <span className="font-mono text-[10px] opacity-75">({lang.code})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>Idioma Activo de UI:</span>
          <select
            value={currentLanguage}
            onChange={e => setLanguage(e.target.value)}
            className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800 cursor-pointer focus:outline-none"
          >
            {availableLanguages.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search & Add Key Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por clave o texto traducido..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium focus:outline-none text-slate-800"
          />
        </div>

        {/* Add New Key */}
        <form onSubmit={handleAddTranslationKey} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <input
            type="text"
            placeholder="Clave (e.g. checkin_time)"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            className="w-1/3 text-xs font-mono px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Traducción..."
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="w-2/3 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 whitespace-nowrap"
          >
            + Añadir
          </button>
        </form>
      </div>

      {/* Dictionary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Diccionario Traducido para ({selectedEditLang.toUpperCase()})</span>
          </h3>
          {isSaved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Cambio guardado en el servidor
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-1/3">Clave i18n (Key)</th>
                <th className="px-4 py-3">Valor Traducido ({selectedEditLang.toUpperCase()})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {filteredKeys.map(key => (
                <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-800 font-bold">
                    {key}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      defaultValue={fullDict[key]}
                      onBlur={e => handleUpdateTranslation(key, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-transparent focus:border-indigo-500 rounded-lg text-slate-900 font-semibold focus:outline-none transition-colors"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
