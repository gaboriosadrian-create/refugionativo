import React, { useState } from 'react';
import {
  ShieldAlert,
  UserCheck,
  Plus,
  MapPin,
  Building,
  CheckCircle2,
  Lock,
  Globe,
  Key
} from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import { OrganizationService } from '../services/OrganizationService';
import { CorporateRole } from '../types';

export const CorporateRBACManager: React.FC = () => {
  const {
    selectedOrg,
    brands,
    currentRole,
    setRole,
    refreshData
  } = useEnterprise();

  const [orgUsers, setOrgUsers] = useState(
    selectedOrg ? OrganizationService.getOrganizationUsers(selectedOrg.id) : []
  );

  const [regionalManagers, setRegionalManagers] = useState(
    selectedOrg ? OrganizationService.getRegionalManagers(selectedOrg.id) : []
  );

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<CorporateRole>('REGIONAL_MANAGER');
  const [assignedBrands, setAssignedBrands] = useState<string[]>([]);

  // Regional manager modal
  const [isAddingRM, setIsAddingRM] = useState(false);
  const [rmName, setRmName] = useState('');
  const [rmEmail, setRmEmail] = useState('');
  const [rmRegionCode, setRmRegionCode] = useState('LATAM-SOUTH');
  const [rmRegionName, setRmRegionName] = useState('Sudamérica (Chile, Argentina, Brasil)');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !selectedOrg) return;

    OrganizationService.addOrganizationUser({
      organizationId: selectedOrg.id,
      userId: `usr-${Date.now()}`,
      userEmail: newEmail,
      userName: newName,
      corporateRole: newRole,
      assignedBrands: assignedBrands,
      assignedCountries: ['US', 'CL', 'BR'],
      assignedPropertyIds: [],
      status: 'active'
    });

    setNewEmail('');
    setNewName('');
    setIsAddingUser(false);
    setOrgUsers(OrganizationService.getOrganizationUsers(selectedOrg.id));
    refreshData();
  };

  const handleAddRM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmEmail || !rmName || !selectedOrg) return;

    OrganizationService.createRegionalManager({
      organizationId: selectedOrg.id,
      userId: `usr-rm-${Date.now()}`,
      userEmail: rmEmail,
      userName: rmName,
      regionCode: rmRegionCode,
      regionName: rmRegionName,
      assignedCountries: ['CL', 'AR', 'BR'],
      propertyIds: []
    });

    setRmEmail('');
    setRmName('');
    setIsAddingRM(false);
    setRegionalManagers(OrganizationService.getRegionalManagers(selectedOrg.id));
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Role Switcher Sandbox / Context Badge */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-indigo-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>RBAC Enterprise Level Security</span>
          </div>
          <h2 className="text-xl font-extrabold">
            Gestión de Roles Corporativos y Directores Regionales
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Control jerárquico de permisos por organización, marcas y países para administradores ejecutivos, regionales y financieros.
          </p>
        </div>

        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-400 block font-semibold mb-1">Modo de Simulación RBAC</span>
          <select
            value={currentRole}
            onChange={e => setRole(e.target.value as CorporateRole)}
            className="bg-slate-900 text-indigo-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="CORPORATE_ADMIN">👑 Corporate Admin (Acceso Total)</option>
            <option value="REGIONAL_MANAGER">🌍 Regional Manager (Por País/Región)</option>
            <option value="BRAND_MANAGER">🏷️ Brand Manager (Por Cadena/Marca)</option>
            <option value="OPERATIONS_MANAGER">🛠️ Operations Manager (Housekeeping/Ops)</option>
            <option value="FINANCIAL_MANAGER">💰 Financial Manager (Billing/RevPAR)</option>
          </select>
        </div>
      </div>

      {/* Corporate Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <span>Usuarios Corporativos Asignados</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal ejecutivo con roles directivos dentro de {selectedOrg?.name || 'la Organización'}
            </p>
          </div>

          <button
            onClick={() => setIsAddingUser(true)}
            className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Asignar Rol Corporativo
          </button>
        </div>

        {/* Add User Modal */}
        {isAddingUser && (
          <div className="bg-slate-50 p-5 border-b border-slate-200 space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">Nuevo Usuario Ejecutivo</h4>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Valeria Gutierrez"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Institucional</label>
                <input
                  type="email"
                  required
                  placeholder="valeria@stayflow.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol Corporativo</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as CorporateRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="CORPORATE_ADMIN">Corporate Admin</option>
                  <option value="REGIONAL_MANAGER">Regional Manager</option>
                  <option value="BRAND_MANAGER">Brand Manager</option>
                  <option value="OPERATIONS_MANAGER">Operations Manager</option>
                  <option value="FINANCIAL_MANAGER">Financial Manager</option>
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                >
                  Guardar Permisos
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Usuario / Director</th>
                <th className="px-4 py-3.5">Rol Corporativo</th>
                <th className="px-4 py-3.5">Marcas Asignadas</th>
                <th className="px-4 py-3.5">Países Autorizados</th>
                <th className="px-4 py-3.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {orgUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{u.userName}</div>
                    <div className="text-slate-500 text-[11px] font-mono">{u.userEmail}</div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Key className="w-3 h-3" />
                      {u.corporateRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-semibold">
                    {u.assignedBrands.length > 0 ? `${u.assignedBrands.length} marcas vinculadas` : 'Todas las marcas'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      {u.assignedCountries.map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-800">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Managers Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              <span>Directores Regionales (Regional Managers)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión territorial por clusters de países o áreas geográficas
            </p>
          </div>

          <button
            onClick={() => setIsAddingRM(true)}
            className="px-3 py-1.5 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Asignar Región
          </button>
        </div>

        {isAddingRM && (
          <form onSubmit={handleAddRM} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Nombre del Director Regional"
              value={rmName}
              onChange={e => setRmName(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={rmEmail}
              onChange={e => setRmEmail(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
            <input
              type="text"
              required
              placeholder="Código Región (e.g. EU-WEST)"
              value={rmRegionCode}
              onChange={e => setRmRegionCode(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingRM(false)}
                className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800"
              >
                Guardar Director
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regionalManagers.map(rm => (
            <div key={rm.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {rm.regionCode}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {rm.assignedCountries.join(', ')}
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">{rm.userName}</h4>
              <p className="text-xs text-slate-600">{rm.regionName}</p>
              <p className="text-[11px] text-slate-400 font-mono">{rm.userEmail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
