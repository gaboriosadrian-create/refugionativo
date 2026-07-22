import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Layers,
  Globe,
  Settings,
  ShieldCheck,
  Check,
  Tag,
  Palette,
  ExternalLink,
  Users
} from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import { OrganizationService } from '../services/OrganizationService';
import { BrandService } from '../services/BrandService';

export const OrganizationChainManager: React.FC = () => {
  const {
    organizations,
    selectedOrg,
    setSelectedOrg,
    brands,
    refreshData
  } = useEnterprise();

  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [newOrgCountry, setNewOrgCountry] = useState('US');
  const [newOrgCurrency, setNewOrgCurrency] = useState('USD');

  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandSlug, setNewBrandSlug] = useState('');
  const [newBrandColor, setNewBrandColor] = useState('#0f766e');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgCode) return;

    OrganizationService.createOrganization({
      name: newOrgName,
      code: newOrgCode.toUpperCase(),
      country: newOrgCountry,
      baseCurrency: newOrgCurrency,
      defaultTimezone: 'UTC',
      plan: 'enterprise',
      status: 'active',
      brandIds: [],
      propertyCount: 0
    });

    setNewOrgName('');
    setNewOrgCode('');
    setIsCreatingOrg(false);
    refreshData();
  };

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName || !selectedOrg) return;

    BrandService.createBrand({
      organizationId: selectedOrg.id,
      name: newBrandName,
      slug: newBrandSlug || newBrandName.toLowerCase().replace(/\s+/g, '-'),
      brandColor: newBrandColor,
      description: newBrandDesc,
      propertyIds: []
    });

    setNewBrandName('');
    setNewBrandSlug('');
    setNewBrandDesc('');
    setIsCreatingBrand(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Organizations Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Estructura de Organizaciones y Cadenas Hoteleras</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administra grupos empresariales, marcas asociadas, propiedades vinculadas y branding por cadena.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreatingOrg(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Organización
          </button>
        </div>
      </div>

      {/* Create Org Modal */}
      {isCreatingOrg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">
              Crear Nueva Organización Empresarial
            </h3>
            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Organización</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Wyndham Latam Holdings"
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Código Corporativo (ID Único)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. WYNDHAM-LATAM"
                  value={newOrgCode}
                  onChange={e => setNewOrgCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">País Sede</label>
                  <select
                    value={newOrgCountry}
                    onChange={e => setNewOrgCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="US">Estados Unidos</option>
                    <option value="CL">Chile</option>
                    <option value="ES">España</option>
                    <option value="BR">Brasil</option>
                    <option value="MX">México</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Moneda Base</label>
                  <select
                    value={newOrgCurrency}
                    onChange={e => setNewOrgCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="BRL">BRL (R$)</option>
                    <option value="CLP">CLP ($)</option>
                    <option value="ARS">ARS ($)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingOrg(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Guardar Organización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organizations List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organizations.map(org => {
          const isSelected = selectedOrg?.id === org.id;
          return (
            <div
              key={org.id}
              onClick={() => setSelectedOrg(org)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-indigo-500 shadow-xl ring-2 ring-indigo-500/50'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl font-bold text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">{org.name}</h3>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                      Código: <span className="font-mono font-bold">{org.code}</span>
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {org.plan}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/20 text-xs">
                <div>
                  <span className={`block font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Sede</span>
                  <span className="font-bold">{org.country}</span>
                </div>
                <div>
                  <span className={`block font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Moneda Base</span>
                  <span className="font-bold">{org.baseCurrency}</span>
                </div>
                <div>
                  <span className={`block font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Marcas / Cadenas</span>
                  <span className="font-bold">{org.brandIds.length} registradas</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chain & Brand Management Section for Selected Org */}
      {selectedOrg && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <span>Marcas y Cadenas de {selectedOrg.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura el branding, logotipos, esquemas de color y propiedades asignadas por cada marca.
              </p>
            </div>

            <button
              onClick={() => setIsCreatingBrand(true)}
              className="px-3.5 py-2 bg-teal-700 text-white text-xs font-bold rounded-xl hover:bg-teal-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Marca Hotelera
            </button>
          </div>

          {/* Create Brand Modal */}
          {isCreatingBrand && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Registrar Nueva Marca en la Cadena</h4>
              <form onSubmit={handleCreateBrand} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Comercial de la Marca</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Terra Eco Glamping Collection"
                    value={newBrandName}
                    onChange={e => setNewBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Color de Marca (HEX)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newBrandColor}
                      onChange={e => setNewBrandColor(e.target.value)}
                      className="w-10 h-9 p-1 bg-white border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newBrandColor}
                      onChange={e => setNewBrandColor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Descripción / Posicionamiento</label>
                  <textarea
                    rows={2}
                    placeholder="Descripción del concepto de hospitalificación..."
                    value={newBrandDesc}
                    onChange={e => setNewBrandDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingBrand(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800"
                  >
                    Guardar Marca
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Brands List Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brands.map(brand => (
              <div key={brand.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: brand.brandColor }}
                    />
                    <h4 className="font-extrabold text-slate-900 text-sm">{brand.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    /{brand.slug}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {brand.description || 'Sin descripción asignada.'}
                </p>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">
                    {brand.propertyIds.length} propiedades asignadas
                  </span>
                  <span className="text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-1">
                    Configurar <Palette className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
