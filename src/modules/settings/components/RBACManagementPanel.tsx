import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Users, 
  Plus, 
  Trash2, 
  Copy, 
  Search, 
  Check, 
  AlertTriangle, 
  Edit3, 
  ClipboardList, 
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import { RBACService } from '../../../core/security/rbacService';
import { SYSTEM_PERMISSIONS, CustomRole, RoleAssignment, PermissionDefinition } from '../../../core/security/rbacTypes';
import { TenantManager } from '../../../core/tenant/TenantManager';
import { AuditService } from '../../../core/audit/AuditService';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

interface ResortUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

export const RBACManagementPanel: React.FC = () => {
  const tenantId = TenantManager.getCurrentTenantId();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix' | 'users' | 'audit'>('roles');
  
  // Roles State
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  
  // Form State for creating new role
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleCopyPermissionsFrom, setNewRoleCopyPermissionsFrom] = useState('');
  
  // Users State
  const [users, setUsers] = useState<ResortUser[]>([]);
  const [userAssignments, setUserAssignments] = useState<Record<string, RoleAssignment>>({});
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchLogQuery, setSearchLogQuery] = useState('');
  
  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load Initial Data
  const loadData = () => {
    try {
      // Load Roles
      const tenantRoles = RBACService.getRoles(tenantId);
      setRoles(tenantRoles);
      if (tenantRoles.length > 0 && !selectedRole) {
        setSelectedRole(tenantRoles.find(r => r.id === 'receptionist') || tenantRoles[0]);
      } else if (selectedRole) {
        const updatedSelected = tenantRoles.find(r => r.id === selectedRole.id);
        if (updatedSelected) setSelectedRole(updatedSelected);
      }

      // Load Users / Team Members
      const userStorageKey = `stayflow_resort_users_${tenantId}`;
      let loadedUsers = LocalSaaSDb.get<ResortUser[]>(userStorageKey);
      if (!loadedUsers || loadedUsers.length === 0) {
        // Initialize default simulated team members for a rich backoffice onboarding experience
        loadedUsers = [
          { id: 'usr-1', name: 'Sofía Martínez', email: 'sofia.martinez@stayflow-resort.com', status: 'active' },
          { id: 'usr-2', name: 'Mateo González', email: 'mateo.gonzalez@stayflow-resort.com', status: 'active' },
          { id: 'usr-3', name: 'Camila Rodríguez', email: 'camila.rodriguez@stayflow-resort.com', status: 'active' },
          { id: 'usr-4', name: 'Alejandro Silva', email: 'alejandro.silva@stayflow-resort.com', status: 'active' }
        ];
        LocalSaaSDb.set(userStorageKey, loadedUsers);
      }
      setUsers(loadedUsers);

      // Load User Assignments
      const assignments: Record<string, RoleAssignment> = {};
      loadedUsers.forEach(u => {
        const assignment = RBACService.getUserAssignments(tenantId, u.id);
        if (assignment) {
          assignments[u.id] = assignment;
        } else {
          assignments[u.id] = {
            id: `as_${u.id}`,
            userId: u.id,
            resortId: tenantId,
            roleIds: ['viewer'],
            active: true,
            assignedAt: new Date().toISOString()
          };
        }
      });
      setUserAssignments(assignments);

      // Load Audit logs specific to Security/RBAC asynchronously
      AuditService.getLogs(tenantId).then(allLogs => {
        const logs = allLogs
          .filter(l => l.action.includes('ROLE') || l.action.includes('PERMISSION') || l.action.includes('ASSIGN'))
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setAuditLogs(logs);
      }).catch(err => {
        console.warn('[RBAC_PANEL] Failed to fetch audit logs:', err);
      });

    } catch (err) {
      console.error('[RBAC_PANEL] Error loading security configuration:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Create Custom Role Handler
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      const initialPermissions = newRoleCopyPermissionsFrom
        ? roles.find(r => r.id === newRoleCopyPermissionsFrom)?.permissions || []
        : [];

      const role = await RBACService.createRole(
        tenantId,
        {
          name: newRoleName.trim(),
          description: newRoleDesc.trim(),
          permissions: initialPermissions
        },
        'demo-owner-uid',
        'owner@stayflow.com'
      );

      showToastMsg(`Perfil "${role.name}" creado con éxito.`);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRoleCopyPermissionsFrom('');
      setShowCreateModal(false);
      loadData();
      setSelectedRole(role);
    } catch (err: any) {
      showToastMsg(err.message || 'Error al crear perfil.', 'error');
    }
  };

  // Duplicate Role Handler
  const handleDuplicateRole = async (roleToCopy: CustomRole) => {
    try {
      const duplicated = await RBACService.duplicateRole(
        tenantId,
        roleToCopy.id,
        `Copia de ${roleToCopy.name}`,
        'demo-owner-uid',
        'owner@stayflow.com'
      );
      showToastMsg(`Copia de "${roleToCopy.name}" creada como "${duplicated.name}".`);
      loadData();
      setSelectedRole(duplicated);
    } catch (err: any) {
      showToastMsg(err.message || 'Error al duplicar perfil.', 'error');
    }
  };

  // Delete Role Handler
  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este perfil de acceso? Los usuarios con este rol asignado perderán estas facultades.')) {
      try {
        await RBACService.deleteRole(tenantId, roleId, 'demo-owner-uid', 'owner@stayflow.com');
        showToastMsg('Perfil eliminado de forma segura.');
        setSelectedRole(null);
        loadData();
      } catch (err: any) {
        showToastMsg(err.message || 'Error al eliminar perfil.', 'error');
      }
    }
  };

  // Toggle Granular Permission inside Role
  const handleTogglePermission = async (roleId: string, permissionId: string) => {
    const roleToUpdate = roles.find(r => r.id === roleId);
    if (!roleToUpdate) return;
    
    if (roleToUpdate.isSystem) {
      showToastMsg('Los roles del sistema son inmutables. Duplica este perfil para modificar sus permisos.', 'error');
      return;
    }

    try {
      let updatedPermissions = [...roleToUpdate.permissions];
      if (updatedPermissions.includes(permissionId)) {
        updatedPermissions = updatedPermissions.filter(p => p !== permissionId);
      } else {
        updatedPermissions.push(permissionId);
      }

      await RBACService.updateRole(
        tenantId,
        roleId,
        { permissions: updatedPermissions },
        'demo-owner-uid',
        'owner@stayflow.com'
      );
      loadData();
      showToastMsg('Matriz de permisos actualizada.');
    } catch (err: any) {
      showToastMsg(err.message || 'Error al actualizar permisos.', 'error');
    }
  };

  // Assign multiple roles to employee
  const handleToggleUserRole = async (userId: string, roleId: string) => {
    const assignment = userAssignments[userId] || { roleIds: [] };

    let updatedRoles = [...assignment.roleIds];
    if (updatedRoles.includes(roleId)) {
      updatedRoles = updatedRoles.filter(r => r !== roleId);
    } else {
      updatedRoles.push(roleId);
    }

    try {
      await RBACService.assignRolesToUser(
        tenantId,
        userId,
        updatedRoles,
        'demo-owner-uid',
        'owner@stayflow.com'
      );
      loadData();
      showToastMsg('Roles del colaborador actualizados.');
    } catch (err: any) {
      showToastMsg(err.message || 'Error al asignar roles.', 'error');
    }
  };

  // Add simulated backoffice user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      const userStorageKey = `stayflow_resort_users_${tenantId}`;
      const loadedUsers = LocalSaaSDb.get<ResortUser[]>(userStorageKey) || [];
      
      if (loadedUsers.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
        throw new Error('Ya existe un colaborador con este correo electrónico.');
      }

      const newUserId = `usr-${Date.now()}`;
      const newUserObj: ResortUser = {
        id: newUserId,
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        status: 'active'
      };

      const updatedUsers = [...loadedUsers, newUserObj];
      LocalSaaSDb.set(userStorageKey, updatedUsers);

      // Save Initial Role Assignment
      if (newUserRoles.length > 0) {
        await RBACService.assignRolesToUser(
          tenantId,
          newUserId,
          newUserRoles,
          'demo-owner-uid',
          'owner@stayflow.com'
        );
      } else {
        await RBACService.assignRolesToUser(
          tenantId,
          newUserId,
          ['viewer'],
          'demo-owner-uid',
          'owner@stayflow.com'
        );
      }

      showToastMsg(`Colaborador "${newUserName}" invitado con éxito.`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRoles([]);
      setShowCreateUserModal(false);
      loadData();
    } catch (err: any) {
      showToastMsg(err.message || 'Error al agregar colaborador.', 'error');
    }
  };

  // Group permissions by functional module for matrix
  const permissionsByModule = SYSTEM_PERMISSIONS.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, PermissionDefinition[]>);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
    (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLogQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border transition-all animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/95 border-rose-500/30 text-rose-300'
        }`}>
          <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="text-xs font-bold font-sans">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-display font-black text-white text-lg">Enterprise RBAC & Permission Management</h3>
          </div>
          <p className="text-slate-400 text-xs max-w-xl font-sans">
            Crea perfiles a medida, audita el acceso de colaboradores de forma granular, y administra roles múltiples con aislamiento estricto por resort.
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'users') {
              setShowCreateUserModal(true);
            } else {
              setShowCreateModal(true);
            }
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'users' ? 'Invitar Colaborador' : 'Crear Perfil Personalizado'}</span>
        </button>
      </div>

      {/* Local Tabs Bar */}
      <div className="flex border-b border-line gap-4 font-sans text-xs">
        {[
          { id: 'roles', label: 'Perfiles (Roles)', count: roles.length },
          { id: 'matrix', label: 'Matriz de Permisos', count: SYSTEM_PERMISSIONS.length },
          { id: 'users', label: 'Asignación a Usuarios', count: users.length },
          { id: 'audit', label: 'Auditoría de Seguridad', count: auditLogs.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-bold border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-muted hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab: Roles (List & Editor) */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Roles */}
          <div className="lg:col-span-1 space-y-3 bg-white p-4 rounded-2xl border border-line shadow-sm">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#3d4842] flex items-center gap-1.5 pb-2 border-b border-line/60">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <span>Perfiles Disponibles</span>
            </h4>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {roles.map(role => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950' 
                        : 'bg-[#fafbf9] border-line hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-bold text-xs flex items-center gap-1.5 truncate">
                        {role.isSystem ? <Shield className="w-3.5 h-3.5 text-indigo-500" /> : <Edit3 className="w-3.5 h-3.5 text-slate-400" />}
                        {role.name}
                      </span>
                      {role.isSystem ? (
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200/50">Inmutable</span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-line">Custom</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed line-clamp-2">{role.description}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1">
                      <Lock className="w-3 h-3" />
                      <span>{role.permissions.length} permisos</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Role Permissions Detail View */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-line shadow-sm space-y-6">
            {selectedRole ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-4 border-b border-line">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-slate-900 text-base">{selectedRole.name}</h3>
                      {selectedRole.isSystem ? (
                        <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Rol de Sistema
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-sky-50 border border-sky-200 text-sky-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Personalizado
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-xs font-sans leading-relaxed">{selectedRole.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDuplicateRole(selectedRole)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Duplicar Rol"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>
                    {!selectedRole.isSystem && (
                      <button
                        onClick={() => handleDeleteRole(selectedRole.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Eliminar Rol"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>

                {selectedRole.isSystem && (
                  <div className="bg-amber-50 p-4 border border-amber-200 text-amber-900 rounded-xl flex gap-3 text-xs leading-relaxed font-sans">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Perfil de Sistema Protegido:</strong>
                      <p className="text-[11px] mt-0.5 text-amber-800">
                        Este perfil es parte de la arquitectura Core de StayFlow y no puede ser alterado. Si necesitas cambiar los permisos asignados a este nivel, haz clic en <strong>"Duplicar"</strong> para crear una copia exacta personalizable.
                      </p>
                    </div>
                  </div>
                )}

                {/* Permissions matrix for the selected role */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#3d4842]">Permisos Concedidos ({selectedRole.permissions.length})</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Usa la pestaña de Matriz de Permisos para ediciones masivas</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {SYSTEM_PERMISSIONS.map(p => {
                      const hasPerm = selectedRole.permissions.includes(p.id);
                      return (
                        <div 
                          key={p.id} 
                          className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                            hasPerm 
                              ? 'bg-slate-50 border-slate-200 text-slate-800' 
                              : 'bg-white border-line opacity-50 text-slate-400'
                          }`}
                        >
                          <div className={`mt-0.5 w-4.5 h-4.5 rounded-md flex items-center justify-center border shrink-0 ${
                            hasPerm 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'border-slate-300'
                          }`}>
                            {hasPerm && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[11px] block">{p.name}</span>
                            <span className="text-[9px] text-muted block truncate">{p.description}</span>
                            <span className="inline-block text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded mt-1 bg-slate-200 text-slate-700">
                              {p.module}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-muted text-xs">
                Selecciona un perfil de acceso para auditar o modificar sus facultades.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-line pb-4">
            <div>
              <h3 className="font-display font-black text-slate-900 text-base">Matriz Integral de Permisos</h3>
              <p className="text-muted text-xs mt-0.5">Asigna y remueve privilegios directamente sobre la matriz. Elige un rol modificable para comenzar.</p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">Editando perfil:</span>
              <select
                value={selectedRole?.id || ''}
                onChange={(e) => {
                  const match = roles.find(r => r.id === e.target.value);
                  if (match) setSelectedRole(match);
                }}
                className="min-h-[38px] rounded-lg border border-line text-xs font-bold px-2 py-1.5 bg-white text-indigo-700 outline-none focus:border-indigo-500"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} {r.isSystem ? '(Sistema - Solo Lectura)' : '(Personalizado)'}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedRole?.isSystem && (
            <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200 flex items-center gap-2 text-indigo-800 text-[11px] font-medium font-sans">
              <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Este rol es inmutable. Para aplicar cambios, selecciona o crea un perfil de acceso personalizado.</span>
            </div>
          )}

          {/* Interactive Matrix Grid */}
          <div className="overflow-x-auto border border-line rounded-xl max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-4 border-b border-slate-800 min-w-[160px]">Módulos y Procesos</th>
                  <th className="p-4 border-b border-slate-800 min-w-[200px]">Atributo / Permiso</th>
                  <th className="p-4 border-b border-slate-800 text-center w-[120px]">Estado de Acceso</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-line bg-white">
                {Object.entries(permissionsByModule).map(([modName, perms]) => (
                  <React.Fragment key={modName}>
                    {/* Module Separator Heading */}
                    <tr className="bg-[#fcfdfa] font-black text-[#2e3732] border-t border-line/80">
                      <td colSpan={3} className="px-4 py-2 text-[10px] uppercase tracking-wider font-extrabold bg-[#eef1ed]/50">
                        {modName}
                      </td>
                    </tr>
                    {perms.map(p => {
                      const isChecked = selectedRole?.permissions.includes(p.id) || false;
                      const isReadOnly = selectedRole?.isSystem || false;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-semibold text-slate-800 text-[11px] font-sans pl-6">
                            {p.module}
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 block">{p.name}</span>
                              <span className="text-[10px] text-muted block leading-normal">{p.description}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleTogglePermission(selectedRole!.id, p.id)}
                              className={`mx-auto w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                isReadOnly 
                                  ? 'cursor-not-allowed opacity-80' 
                                  : 'cursor-pointer hover:scale-105 active:scale-95'
                              } ${
                                isChecked 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'bg-slate-100 hover:bg-slate-200 border border-line text-slate-400'
                              }`}
                            >
                              {isChecked ? (
                                <Check className="w-5 h-5 stroke-[3]" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-line pb-4">
            <div>
              <h3 className="font-display font-black text-slate-900 text-base">Equipo del Complejo y Roles Asignados</h3>
              <p className="text-muted text-xs mt-0.5">Administra múltiples perfiles simultáneos para cada colaborador con sincronización e historial de transacciones.</p>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="w-full min-h-[36px] pl-9 pr-3 rounded-lg border border-line text-xs outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted text-xs font-sans">
                No se encontraron colaboradores...
              </div>
            ) : (
              filteredUsers.map(user => {
                const assignment = userAssignments[user.id] || { roleIds: [] };
                return (
                  <div key={user.id} className="p-4 border border-line rounded-2xl bg-[#fafbf9] space-y-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-xs font-extrabold text-slate-900 block">{user.name}</strong>
                          <span className="text-[10px] text-muted block font-mono">{user.email}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800">
                        {user.status}
                      </span>
                    </div>

                    {/* Roles Selector Matrix */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-[#3d4842] uppercase tracking-wider block">Asignar Perfiles de Acceso (Soporta Múltiple):</span>
                      <div className="grid grid-cols-2 gap-2">
                        {roles.map(role => {
                          const hasRole = assignment.roleIds.includes(role.id);
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => handleToggleUserRole(user.id, role.id)}
                              className={`p-2 rounded-lg border text-[10px] font-bold text-left flex items-center gap-2 transition-all cursor-pointer ${
                                hasRole 
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs' 
                                  : 'bg-white border-line text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                hasRole ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {hasRole && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className="truncate">{role.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Audit */}
      {activeTab === 'audit' && (
        <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-line pb-4">
            <div>
              <h3 className="font-display font-black text-slate-900 text-base">Bitácora General de Seguridad (RBAC Logs)</h3>
              <p className="text-muted text-xs mt-0.5">Seguimiento en tiempo real de la creación de roles, asignaciones de privilegios e inicios de sesión.</p>
            </div>

            {/* Filter Logs */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar bitácora..."
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                className="w-full min-h-[36px] pl-9 pr-3 rounded-lg border border-line text-xs outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="border border-line rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 text-white text-[10px] uppercase font-bold tracking-wider grid grid-cols-12 gap-3">
              <span className="col-span-3">Fecha y Hora</span>
              <span className="col-span-3">Operación / Acción</span>
              <span className="col-span-6">Detalles Técnicos de Transacción</span>
            </div>
            <div className="divide-y divide-line max-h-[450px] overflow-y-auto bg-white font-sans text-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-muted italic">
                  No se registran transacciones de seguridad en la bitácora para este resort.
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="px-4 py-3 hover:bg-slate-50/60 transition-colors grid grid-cols-12 gap-3 items-center">
                    <span className="col-span-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('es-AR')}
                    </span>
                    <span className="col-span-3">
                      <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        log.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-700' :
                        log.action.includes('DELETE') ? 'bg-rose-500/10 text-rose-700' :
                        log.action.includes('ASSIGN') ? 'bg-indigo-500/10 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </span>
                    <span className="col-span-6 font-mono text-[10px] text-slate-600 truncate" title={JSON.stringify(log.details)}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE ROLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-2xl overflow-hidden animate-fade-in font-sans">
            <header className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h4 className="font-display font-extrabold text-sm flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-indigo-400" />
                <span>Nuevo Perfil de Acceso Personalizado</span>
              </h4>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </header>
            <form onSubmit={handleCreateRole} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre del Rol (ID único)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Supervisor, Auditor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full min-h-[42px] px-3 border border-line rounded-xl text-xs outline-none focus:border-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Descripción de Responsabilidades</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe qué tareas operativas y accesos de seguridad tiene este perfil..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full p-3 border border-line rounded-xl text-xs outline-none focus:border-indigo-500 bg-slate-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Duplicar permisos de rol existente (Opcional)</label>
                <select
                  value={newRoleCopyPermissionsFrom}
                  onChange={(e) => setNewRoleCopyPermissionsFrom(e.target.value)}
                  className="w-full min-h-[42px] px-2.5 border border-line rounded-xl text-xs bg-white outline-none focus:border-indigo-500"
                >
                  <option value="">Ninguno (Comenzar vacío)</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.permissions.length} permisos)</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE/INVITE COLLABORATOR MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-2xl overflow-hidden animate-fade-in font-sans">
            <header className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h4 className="font-display font-extrabold text-sm flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-indigo-400" />
                <span>Registrar Nuevo Colaborador</span>
              </h4>
              <button 
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </header>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Nicolás Ortega"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full min-h-[42px] px-3 border border-line rounded-xl text-xs outline-none focus:border-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Correo Electrónico (Para credenciales)</label>
                <input
                  type="email"
                  required
                  placeholder="Ej: nicolas@resort.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full min-h-[42px] px-3 border border-line rounded-xl text-xs outline-none focus:border-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Asignar Perfiles Iniciales (Soporta múltiples)</label>
                <div className="grid grid-cols-2 gap-2 border border-line rounded-xl p-3 bg-slate-50/50 max-h-[140px] overflow-y-auto">
                  {roles.map(role => {
                    const isSelected = newUserRoles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewUserRoles(newUserRoles.filter(r => r !== role.id));
                          } else {
                            setNewUserRoles([...newUserRoles, role.id]);
                          }
                        }}
                        className={`p-2 rounded-lg border text-[10px] font-bold text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                            : 'bg-white border-line text-slate-600'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{role.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Registrar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
