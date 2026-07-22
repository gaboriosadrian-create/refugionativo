import React, { useState } from 'react';
import { 
  Tag, 
  Sparkles, 
  Shield, 
  Sliders, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Check, 
  X, 
  Layers, 
  Info, 
  Palette, 
  Eye, 
  EyeOff, 
  Clock, 
  PlusCircle, 
  ArrowUp, 
  ArrowDown, 
  Activity,
  Flame,
  Wifi,
  Trees,
  Tent,
  Hotel
} from 'lucide-react';
import { useAccommodationConfig } from '../hooks/useAccommodationConfig';
import { 
  AccommodationType, 
  Amenity, 
  AccommodationPolicies, 
  CustomFieldConfig, 
  CapacityOptions, 
  StatusOption 
} from '../types';
import { validateAccommodationType, validateAmenity, validateCustomField } from '../validators';

const ICON_OPTIONS = ['trees', 'tent', 'hotel', 'mountain', 'palmtree', 'compass', 'home', 'star', 'heart', 'shield', 'wifi', 'flame', 'tv', 'utensils', 'coffee'];
const COLOR_OPTIONS = [
  { name: 'Forest', hex: '#15803d' },
  { name: 'Blue', hex: '#0369a1' },
  { name: 'Purple', hex: '#6d28d9' },
  { name: 'Amber', hex: '#b45309' },
  { name: 'Rose', hex: '#be123c' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Dark', hex: '#0f172a' }
];

export const AccommodationConfigPanel: React.FC = () => {
  const { 
    config, 
    loading, 
    error, 
    saveAccommodationType, 
    deleteAccommodationType, 
    saveAmenity, 
    deleteAmenity, 
    savePolicies, 
    saveCustomField, 
    deleteCustomField, 
    saveCapacityOptions, 
    saveStatusOptions 
  } = useAccommodationConfig();

  const [activeSubTab, setActiveSubTab] = useState<'types' | 'amenities' | 'policies' | 'fields' | 'capacity'>('types');

  // --- Type States ---
  const [editingType, setEditingType] = useState<Partial<AccommodationType> | null>(null);
  const [isAddingType, setIsAddingType] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);
  
  // Custom field on type builder state
  const [newTypeCFKey, setNewTypeCFKey] = useState('');
  const [newTypeCFLabel, setNewTypeCFLabel] = useState('');
  const [newTypeCFType, setNewTypeCFType] = useState<'string' | 'number' | 'boolean'>('string');

  // --- Amenity States ---
  const [editingAmenity, setEditingAmenity] = useState<Partial<Amenity> | null>(null);
  const [isAddingAmenity, setIsAddingAmenity] = useState(false);
  const [amenityError, setAmenityError] = useState<string | null>(null);
  const [amenityFilterCategory, setAmenityFilterCategory] = useState<string>('all');

  // --- Policy States ---
  const [policyForm, setPolicyForm] = useState<AccommodationPolicies | null>(null);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);
  const [policySuccess, setPolicySuccess] = useState(false);

  // --- Custom Field States ---
  const [editingField, setEditingField] = useState<Partial<CustomFieldConfig> | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [newFieldOptionText, setNewFieldOptionText] = useState('');

  // --- Capacity States ---
  const [capacityForm, setCapacityForm] = useState<CapacityOptions | null>(null);
  const [isSavingCapacity, setIsSavingCapacity] = useState(false);
  const [capacitySuccess, setCapacitySuccess] = useState(false);

  // --- Status States ---
  const [statusSuccess, setStatusSuccess] = useState(false);

  if (loading || (!config && !error)) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-line">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted">Cargando configuración de alojamientos...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <h3 className="font-bold text-lg mb-1">Error de configuración</h3>
        <p className="text-sm">{error || 'No se pudo inicializar la configuración'}</p>
      </div>
    );
  }

  // --- HANDLERS FOR TYPES ---
  const handleAddTypeClick = () => {
    setEditingType({
      id: '',
      displayName: '',
      icon: 'trees',
      active: true,
      sortOrder: (config.accommodationTypes.length + 1),
      color: '#15803d',
      defaultAmenities: [],
      customFields: []
    });
    setIsAddingType(true);
    setTypeError(null);
  };

  const handleEditTypeClick = (type: AccommodationType) => {
    setEditingType({ ...type });
    setIsAddingType(false);
    setTypeError(null);
  };

  const handleSaveType = async () => {
    if (!editingType) return;
    try {
      setTypeError(null);
      const finalized = {
        ...editingType,
        id: editingType.id?.trim() || editingType.displayName?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || ''
      } as AccommodationType;

      if (isAddingType) {
        validateAccommodationType(finalized, config.accommodationTypes);
      } else {
        if (!finalized.displayName || finalized.displayName.trim() === '') {
          throw new Error('El nombre visible es obligatorio');
        }
      }

      await saveAccommodationType(finalized);
      setEditingType(null);
      setIsAddingType(false);
    } catch (err: any) {
      setTypeError(err.message || 'Error al guardar tipo');
    }
  };

  const handleAddTypeCF = () => {
    if (!newTypeCFKey || !newTypeCFLabel || !editingType) return;
    const key = newTypeCFKey.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const fields = [...(editingType.customFields || [])];
    if (fields.some(f => f.key === key)) {
      alert('Ya existe un campo personalizado con esta clave');
      return;
    }
    fields.push({ key, label: newTypeCFLabel, type: newTypeCFType });
    setEditingType({ ...editingType, customFields: fields });
    setNewTypeCFKey('');
    setNewTypeCFLabel('');
  };

  // --- HANDLERS FOR AMENITIES ---
  const handleAddAmenityClick = () => {
    setEditingAmenity({
      id: '',
      name: '',
      icon: 'Wifi',
      category: 'General',
      description: '',
      visible: true,
      sortOrder: (config.amenities.length + 1)
    });
    setIsAddingAmenity(true);
    setAmenityError(null);
  };

  const handleEditAmenityClick = (amenity: Amenity) => {
    setEditingAmenity({ ...amenity });
    setIsAddingAmenity(false);
    setAmenityError(null);
  };

  const handleSaveAmenity = async () => {
    if (!editingAmenity) return;
    try {
      setAmenityError(null);
      const finalized = {
        ...editingAmenity,
        id: editingAmenity.id?.trim() || editingAmenity.name?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || ''
      } as Amenity;

      if (isAddingAmenity) {
        validateAmenity(finalized, config.amenities);
      } else {
        if (!finalized.name || finalized.name.trim() === '') {
          throw new Error('El nombre es obligatorio');
        }
      }

      await saveAmenity(finalized);
      setEditingAmenity(null);
      setIsAddingAmenity(false);
    } catch (err: any) {
      setAmenityError(err.message || 'Error al guardar amenity');
    }
  };

  // --- HANDLERS FOR POLICIES ---
  const initPolicyForm = () => {
    if (!policyForm) {
      setPolicyForm({ ...config.policies });
    }
  };

  const handleSavePoliciesClick = async () => {
    if (!policyForm) return;
    setIsSavingPolicies(true);
    try {
      await savePolicies(policyForm);
      setPolicySuccess(true);
      setTimeout(() => setPolicySuccess(false), 3000);
    } catch (err) {
      alert('Error al guardar políticas');
    } finally {
      setIsSavingPolicies(false);
    }
  };

  // --- HANDLERS FOR CUSTOM FIELDS ---
  const handleAddFieldClick = () => {
    setEditingField({
      key: '',
      label: '',
      type: 'text',
      required: false,
      visible: true,
      filterable: false,
      searchable: false,
      sortOrder: (config.customFields.length + 1),
      options: []
    });
    setIsAddingField(true);
    setFieldError(null);
  };

  const handleEditFieldClick = (field: CustomFieldConfig) => {
    setEditingField({ ...field });
    setIsAddingField(false);
    setFieldError(null);
  };

  const handleSaveField = async () => {
    if (!editingField) return;
    try {
      setFieldError(null);
      const finalized = {
        ...editingField,
        key: editingField.key?.trim() || ''
      } as CustomFieldConfig;

      if (isAddingField) {
        validateCustomField(finalized, config.customFields);
      } else {
        if (!finalized.label || finalized.label.trim() === '') {
          throw new Error('La etiqueta es obligatoria');
        }
      }

      await saveCustomField(finalized);
      setEditingField(null);
      setIsAddingField(false);
    } catch (err: any) {
      setFieldError(err.message || 'Error al guardar campo personalizado');
    }
  };

  const handleAddFieldOption = () => {
    if (!newFieldOptionText || !editingField) return;
    const opts = [...(editingField.options || [])];
    if (!opts.includes(newFieldOptionText)) {
      opts.push(newFieldOptionText);
    }
    setEditingField({ ...editingField, options: opts });
    setNewFieldOptionText('');
  };

  // --- HANDLERS FOR CAPACITY & STATUS ---
  const initCapacityForm = () => {
    if (!capacityForm) {
      setCapacityForm({ ...config.capacityOptions });
    }
  };

  const handleSaveCapacityClick = async () => {
    if (!capacityForm) return;
    setIsSavingCapacity(true);
    try {
      await saveCapacityOptions(capacityForm);
      setCapacitySuccess(true);
      setTimeout(() => setCapacitySuccess(false), 3000);
    } catch (err) {
      alert('Error al guardar capacidades');
    } finally {
      setIsSavingCapacity(false);
    }
  };

  const handleToggleStatus = async (statusId: 'available' | 'maintenance' | 'occupied' | 'inactive') => {
    const updated = config.statusOptions.map(opt => {
      if (opt.id === statusId) {
        return { ...opt, active: !opt.active };
      }
      return opt;
    });
    await saveStatusOptions(updated);
    setStatusSuccess(true);
    setTimeout(() => setStatusSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex border-b border-line overflow-x-auto gap-2 pb-px">
        <button
          onClick={() => { setActiveSubTab('types'); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'types' 
              ? 'border-forest text-forest' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Tipos de Alojamiento
        </button>
        <button
          onClick={() => { setActiveSubTab('amenities'); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'amenities' 
              ? 'border-forest text-forest' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Amenities
        </button>
        <button
          onClick={() => { setActiveSubTab('policies'); initPolicyForm(); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'policies' 
              ? 'border-forest text-forest' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Políticas
        </button>
        <button
          onClick={() => { setActiveSubTab('fields'); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'fields' 
              ? 'border-forest text-forest' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Campos Personalizados
        </button>
        <button
          onClick={() => { setActiveSubTab('capacity'); initCapacityForm(); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'capacity' 
              ? 'border-forest text-forest' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Capacidad & Estado
        </button>
      </div>

      {/* --- SUB TAB 1: ACCOMMODATION TYPES --- */}
      {activeSubTab === 'types' && (
        <div className="space-y-6">
          {!editingType ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Formatos de Alojamiento</h3>
                  <p className="text-xs text-muted">Modelos estructurales habilitados para registrar unidades de alojamiento.</p>
                </div>
                <button
                  onClick={handleAddTypeClick}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Tipo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.accommodationTypes.map(t => (
                  <div 
                    key={t.id} 
                    className={`p-4 border border-line rounded-2xl bg-white flex flex-col justify-between hover:shadow-sm transition-all relative ${!t.active ? 'opacity-60' : ''}`}
                    style={{ borderLeftWidth: '5px', borderLeftColor: t.color || '#15803d' }}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                            {t.icon === 'trees' && <Trees className="w-4 h-4" />}
                            {t.icon === 'tent' && <Tent className="w-4 h-4" />}
                            {t.icon === 'hotel' && <Hotel className="w-4 h-4" />}
                            {!['trees', 'tent', 'hotel'].includes(t.icon) && <Tag className="w-4 h-4" />}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-ink block">{t.displayName}</span>
                            <span className="text-[10px] text-muted font-mono bg-slate-50 px-1 py-0.5 rounded border border-line">ID: {t.id}</span>
                          </div>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${t.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {t.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      {t.defaultAmenities && t.defaultAmenities.length > 0 && (
                        <div className="mt-3.5">
                          <span className="text-[10px] font-bold text-[#3d4842] block mb-1">Amenities por defecto:</span>
                          <div className="flex flex-wrap gap-1">
                            {t.defaultAmenities.map(aid => {
                              const found = config.amenities.find(a => a.id === aid);
                              return (
                                <span key={aid} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-line/50">
                                  {found?.name || aid}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {t.customFields && t.customFields.length > 0 && (
                        <div className="mt-3">
                          <span className="text-[10px] font-bold text-[#3d4842] block mb-1">Atributos personalizados ({t.customFields.length}):</span>
                          <div className="grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded-xl border border-line/60">
                            {t.customFields.map(f => (
                              <div key={f.key} className="text-[9px] text-[#3d4842] flex items-center justify-between">
                                <span className="font-semibold truncate mr-1">{f.label}</span>
                                <span className="text-[8px] text-muted font-mono uppercase bg-white px-1 rounded border border-line/55">{f.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-line/50">
                      <button
                        onClick={() => handleEditTypeClick(t)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`¿Estás seguro de que deseas eliminar el tipo "${t.displayName}"?`)) {
                            await deleteAccommodationType(t.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg cursor-pointer transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* --- EDITING / ADDING TYPE FORM --- */
            <div className="bg-white p-5 rounded-2xl border border-line space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h4 className="font-bold text-sm text-ink">
                  {isAddingType ? 'Crear Nuevo Tipo de Alojamiento' : `Editar Tipo: ${editingType.displayName}`}
                </h4>
                <button
                  onClick={() => setEditingType(null)}
                  className="p-1 text-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {typeError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                  {typeError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Nombre Visible (ej: Tiny House)</label>
                  <input
                    type="text"
                    value={editingType.displayName || ''}
                    onChange={(e) => setEditingType({ ...editingType, displayName: e.target.value })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white"
                    placeholder="ej: Tiny House"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">ID Único (solo letras y guión bajo)</label>
                  <input
                    type="text"
                    disabled={!isAddingType}
                    value={editingType.id || ''}
                    onChange={(e) => setEditingType({ ...editingType, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white disabled:opacity-60"
                    placeholder="ej: tiny_house"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Icono Representativo</label>
                  <div className="grid grid-cols-5 gap-2 border border-line p-2.5 rounded-xl bg-slate-50">
                    {ICON_OPTIONS.slice(0, 10).map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setEditingType({ ...editingType, icon })}
                        className={`p-2 rounded-lg border text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer ${
                          editingType.icon === icon ? 'bg-white border-forest shadow-sm text-forest' : 'border-transparent'
                        }`}
                      >
                        {icon === 'trees' && <Trees className="w-4 h-4" />}
                        {icon === 'tent' && <Tent className="w-4 h-4" />}
                        {icon === 'hotel' && <Hotel className="w-4 h-4" />}
                        {!['trees', 'tent', 'hotel'].includes(icon) && <span className="text-[10px] font-mono">{icon.substring(0, 4)}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Color de Marca / Borde</label>
                  <div className="flex flex-wrap gap-2.5 border border-line p-2.5 rounded-xl bg-slate-50 h-full max-h-[110px] items-center">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEditingType({ ...editingType, color: c.hex })}
                        className={`w-7 h-7 rounded-full cursor-pointer relative flex items-center justify-center border hover:scale-105 transition-transform ${
                          editingType.color === c.hex ? 'border-ink scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {editingType.color === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status & Sort Order */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-line">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="type-active-checkbox"
                    checked={editingType.active !== false}
                    onChange={(e) => setEditingType({ ...editingType, active: e.target.checked })}
                    className="w-4 h-4 rounded text-forest"
                  />
                  <label htmlFor="type-active-checkbox" className="text-xs font-bold text-ink select-none cursor-pointer">
                    Tipo de Alojamiento Activo
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Orden de visualización</label>
                  <input
                    type="number"
                    value={editingType.sortOrder || 0}
                    onChange={(e) => setEditingType({ ...editingType, sortOrder: Number(e.target.value) })}
                    className="w-24 min-h-[36px] rounded-lg border border-line px-2 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Default Amenities */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink">Amenities asignadas por defecto:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-line p-3.5 rounded-2xl max-h-[180px] overflow-y-auto bg-slate-50">
                  {config.amenities.map(amenity => {
                    const currentList = editingType.defaultAmenities || [];
                    const isChecked = currentList.includes(amenity.id);
                    return (
                      <div key={amenity.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          id={`def-amenity-${amenity.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            const updatedList = e.target.checked 
                              ? [...currentList, amenity.id]
                              : currentList.filter(id => id !== amenity.id);
                            setEditingType({ ...editingType, defaultAmenities: updatedList });
                          }}
                          className="w-3.5 h-3.5 text-forest"
                        />
                        <label htmlFor={`def-amenity-${amenity.id}`} className="truncate text-slate-700 cursor-pointer select-none">
                          {amenity.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Type-Specific Custom Fields Builder */}
              <div className="border border-line rounded-2xl p-4 bg-slate-50 space-y-3">
                <span className="block text-xs font-bold text-ink">Campos Personalizados del Tipo (ej: salamandra, jacuzzi, telescopio):</span>
                
                {editingType.customFields && editingType.customFields.length > 0 && (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto bg-white p-2 rounded-xl border border-line/60">
                    {editingType.customFields.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 border border-line bg-slate-50 rounded-lg">
                        <span className="font-medium text-[#3d4842]">{f.label} <span className="text-muted text-[10px]">({f.key} · {f.type})</span></span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingType.customFields || []).filter((_, i) => i !== idx);
                            setEditingType({ ...editingType, customFields: updated });
                          }}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Clave (ej: telescopio)"
                    value={newTypeCFKey}
                    onChange={(e) => setNewTypeCFKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="rounded-lg border border-line p-2 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Nombre (ej: Telescopio)"
                    value={newTypeCFLabel}
                    onChange={(e) => setNewTypeCFLabel(e.target.value)}
                    className="rounded-lg border border-line p-2 text-xs bg-white"
                  />
                  <select
                    value={newTypeCFType}
                    onChange={(e) => setNewTypeCFType(e.target.value as any)}
                    className="rounded-lg border border-line p-2 text-xs bg-white"
                  >
                    <option value="string">Texto</option>
                    <option value="number">Número</option>
                    <option value="boolean">Verdadero/Falso</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddTypeCF}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-ink text-xs font-bold py-1.5 rounded-lg cursor-pointer"
                >
                  + Agregar Atributo Específico
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 border border-line text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveType}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isAddingType ? 'Crear Tipo' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB TAB 2: AMENITIES --- */}
      {activeSubTab === 'amenities' && (
        <div className="space-y-6">
          {!editingAmenity ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Catálogo de Amenities</h3>
                  <p className="text-xs text-muted">Amenities que el resort puede habilitar para describir sus alojamientos.</p>
                </div>
                <button
                  onClick={handleAddAmenityClick}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Amenity
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex gap-1 overflow-x-auto pb-1 border-b border-line/40">
                {['all', 'General', 'Cocina', 'Exterior', 'Wellness', 'Entretenimiento', 'Servicios'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setAmenityFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      amenityFilterCategory === cat 
                        ? 'bg-forest text-white' 
                        : 'bg-slate-100 text-muted hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Todas' : cat}
                  </button>
                ))}
              </div>

              {/* List Amenities */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {config.amenities
                  .filter(a => amenityFilterCategory === 'all' || a.category === amenityFilterCategory)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map(a => (
                    <div 
                      key={a.id} 
                      className={`p-3 border border-line rounded-xl bg-white hover:shadow-sm transition-all flex items-center justify-between gap-2.5 ${!a.visible ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1.5 bg-forest/10 text-forest rounded-lg">
                          {a.icon === 'Wifi' && <Wifi className="w-4 h-4" />}
                          {a.icon === 'Flame' && <Flame className="w-4 h-4" />}
                          {a.icon === 'Activity' && <Activity className="w-4 h-4" />}
                          {!['Wifi', 'Flame', 'Activity'].includes(a.icon || '') && <Sparkles className="w-4 h-4" />}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-ink truncate block">{a.name}</span>
                          <span className="text-[9px] text-muted block">{a.category || 'General'} · ID: {a.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditAmenityClick(a)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`¿Estás seguro de que deseas eliminar la amenity "${a.name}"?`)) {
                              await deleteAmenity(a.id);
                            }
                          }}
                          className="p-1 text-red-400 hover:text-red-600 rounded cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* --- EDITING / ADDING AMENITY FORM --- */
            <div className="bg-white p-5 rounded-2xl border border-line space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h4 className="font-bold text-sm text-ink">
                  {isAddingAmenity ? 'Crear Nueva Amenidad' : `Editar Amenidad: ${editingAmenity.name}`}
                </h4>
                <button
                  onClick={() => setEditingAmenity(null)}
                  className="p-1 text-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {amenityError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                  {amenityError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Nombre (ej: Jacuzzi Exterior)</label>
                  <input
                    type="text"
                    value={editingAmenity.name || ''}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, name: e.target.value })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white"
                    placeholder="ej: WiFi Starlink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">ID Único (ej: wifi_starlink)</label>
                  <input
                    type="text"
                    disabled={!isAddingAmenity}
                    value={editingAmenity.id || ''}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, id: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white disabled:opacity-60"
                    placeholder="ej: wifi_starlink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Categoría</label>
                  <select
                    value={editingAmenity.category || 'General'}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, category: e.target.value })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Cocina">Cocina</option>
                    <option value="Exterior">Exterior</option>
                    <option value="Wellness">Wellness & Spa</option>
                    <option value="Entretenimiento">Entretenimiento</option>
                    <option value="Servicios">Servicios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Icono</label>
                  <select
                    value={editingAmenity.icon || 'Wifi'}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, icon: e.target.value })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white"
                  >
                    <option value="Wifi">WiFi (Antena)</option>
                    <option value="Flame">Flame (Calefacción / Parrilla)</option>
                    <option value="Activity">Wellness / Actividad</option>
                    <option value="Sparkles">Sparkles (Estrella / Premium)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-ink mb-1">Descripción Breve</label>
                  <textarea
                    value={editingAmenity.description || ''}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, description: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-line px-3 py-2 text-sm bg-white"
                    placeholder="Escribe detalles adicionales..."
                  />
                </div>
              </div>

              {/* Status and Sort Order */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-line">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="amenity-visible-checkbox"
                    checked={editingAmenity.visible !== false}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, visible: e.target.checked })}
                    className="w-4 h-4 rounded text-forest"
                  />
                  <label htmlFor="amenity-visible-checkbox" className="text-xs font-bold text-ink select-none cursor-pointer">
                    Amenidad Visible al Cliente
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Orden de visualización</label>
                  <input
                    type="number"
                    value={editingAmenity.sortOrder || 0}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, sortOrder: Number(e.target.value) })}
                    className="w-24 min-h-[36px] rounded-lg border border-line px-2 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingAmenity(null)}
                  className="px-4 py-2 border border-line text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAmenity}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isAddingAmenity ? 'Crear Amenidad' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB TAB 3: POLICIES --- */}
      {activeSubTab === 'policies' && policyForm && (
        <div className="bg-white p-5 rounded-2xl border border-line space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="text-sm font-bold text-ink">Políticas Globales del Resort</h3>
              <p className="text-xs text-muted">Establece pautas predeterminadas de convivencia, pagos y reservas.</p>
            </div>
            {policySuccess && (
              <span className="text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-lg">
                ✓ Guardado con éxito
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hours */}
            <div className="bg-slate-50 p-4 rounded-xl border border-line space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-forest flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Horarios de Recepción
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#3d4842] mb-1">Check-In Estándar</label>
                  <input
                    type="text"
                    value={policyForm.checkInTime}
                    onChange={(e) => setPolicyForm({ ...policyForm, checkInTime: e.target.value })}
                    className="w-full rounded-lg border border-line px-2 py-1.5 text-xs bg-white"
                    placeholder="14:00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#3d4842] mb-1">Check-Out Máximo</label>
                  <input
                    type="text"
                    value={policyForm.checkOutTime}
                    onChange={(e) => setPolicyForm({ ...policyForm, checkOutTime: e.target.value })}
                    className="w-full rounded-lg border border-line px-2 py-1.5 text-xs bg-white"
                    placeholder="10:00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#3d4842] mb-1">Instrucciones Check-In</label>
                <textarea
                  value={policyForm.checkInInstructions || ''}
                  onChange={(e) => setPolicyForm({ ...policyForm, checkInInstructions: e.target.value })}
                  className="w-full rounded-lg border border-line p-2 text-xs bg-white"
                  placeholder="Detalla cómo es el ingreso..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#3d4842] mb-1">Instrucciones Check-Out</label>
                <textarea
                  value={policyForm.checkOutInstructions || ''}
                  onChange={(e) => setPolicyForm({ ...policyForm, checkOutInstructions: e.target.value })}
                  className="w-full rounded-lg border border-line p-2 text-xs bg-white"
                  placeholder="Detalla el procedimiento de salida..."
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-slate-50 p-4 rounded-xl border border-line space-y-3.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-forest flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Permisos & Normas
              </h4>
              
              {/* Pets */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pets-allowed-checkbox"
                    checked={policyForm.petsAllowed}
                    onChange={(e) => setPolicyForm({ ...policyForm, petsAllowed: e.target.checked })}
                    className="w-3.5 h-3.5"
                  />
                  <label htmlFor="pets-allowed-checkbox" className="text-xs font-bold text-ink cursor-pointer select-none">
                    Se permiten mascotas
                  </label>
                </div>
                {policyForm.petsAllowed && (
                  <input
                    type="text"
                    value={policyForm.petsPolicy || ''}
                    onChange={(e) => setPolicyForm({ ...policyForm, petsPolicy: e.target.value })}
                    className="w-full rounded-lg border border-line px-2 py-1 text-xs bg-white"
                    placeholder="Normas o recargos de mascotas..."
                  />
                )}
              </div>

              {/* Children */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="children-allowed-checkbox"
                    checked={policyForm.childrenAllowed}
                    onChange={(e) => setPolicyForm({ ...policyForm, childrenAllowed: e.target.checked })}
                    className="w-3.5 h-3.5"
                  />
                  <label htmlFor="children-allowed-checkbox" className="text-xs font-bold text-ink cursor-pointer select-none">
                    Se permiten niños / familias
                  </label>
                </div>
                {policyForm.childrenAllowed && (
                  <input
                    type="text"
                    value={policyForm.childrenPolicy || ''}
                    onChange={(e) => setPolicyForm({ ...policyForm, childrenPolicy: e.target.value })}
                    className="w-full rounded-lg border border-line px-2 py-1 text-xs bg-white"
                    placeholder="Edades sin cargo, cunas, etc..."
                  />
                )}
              </div>

              {/* Smoking */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smoking-allowed-checkbox"
                  checked={policyForm.smokingAllowed}
                  onChange={(e) => setPolicyForm({ ...policyForm, smokingAllowed: e.target.checked })}
                  className="w-3.5 h-3.5"
                />
                <label htmlFor="smoking-allowed-checkbox" className="text-xs font-bold text-ink cursor-pointer select-none">
                  Permitido fumar dentro de las unidades
                </label>
              </div>
            </div>

            {/* Cancellations & Deposits */}
            <div className="bg-slate-50 p-4 rounded-xl border border-line space-y-3 md:col-span-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-forest">Finanzas & Cancelación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#3d4842] mb-1">Política de Cancelación *</label>
                  <textarea
                    value={policyForm.cancellationPolicy}
                    onChange={(e) => setPolicyForm({ ...policyForm, cancellationPolicy: e.target.value })}
                    className="w-full rounded-lg border border-line p-2 text-xs bg-white"
                    placeholder="Detalla si es reembolsable o gratuita..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#3d4842] mb-1">Política de Seña o Depósito</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="dep-req-checkbox"
                      checked={policyForm.depositRequired}
                      onChange={(e) => setPolicyForm({ ...policyForm, depositRequired: e.target.checked })}
                      className="w-3.5 h-3.5"
                    />
                    <label htmlFor="dep-req-checkbox" className="text-xs font-bold text-ink cursor-pointer select-none">
                      Requiere depósito/seña previa
                    </label>
                  </div>
                  {policyForm.depositRequired && (
                    <textarea
                      value={policyForm.depositPolicy || ''}
                      onChange={(e) => setPolicyForm({ ...policyForm, depositPolicy: e.target.value })}
                      className="w-full rounded-lg border border-line p-2 text-xs bg-white"
                      placeholder="Monto, plazos de pago y medios de pago..."
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Observations */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-ink mb-1">Observaciones Generales de Convivencia</label>
              <textarea
                value={policyForm.observations || ''}
                onChange={(e) => setPolicyForm({ ...policyForm, observations: e.target.value })}
                className="w-full rounded-xl border border-line p-3 text-xs bg-white"
                placeholder="Ruidos molestos, uso de parrillas comunitarias, horarios de piscina..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-line">
            <button
              onClick={handleSavePoliciesClick}
              disabled={isSavingPolicies}
              className="px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSavingPolicies ? 'Guardando...' : 'Guardar Políticas Globales'}
            </button>
          </div>
        </div>
      )}

      {/* --- SUB TAB 4: CUSTOM FIELDS --- */}
      {activeSubTab === 'fields' && (
        <div className="space-y-6">
          {!editingField ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Campos Personalizados Globales</h3>
                  <p className="text-xs text-muted">Define nuevos atributos del resort para calificar todas las propiedades.</p>
                </div>
                <button
                  onClick={handleAddFieldClick}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Campo
                </button>
              </div>

              {config.customFields.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-line rounded-2xl bg-slate-50 text-muted text-xs">
                  No hay campos personalizados globales configurados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.customFields
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(f => (
                      <div key={f.key} className="p-4 border border-line rounded-2xl bg-white flex flex-col justify-between hover:shadow-sm transition-all">
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-sm text-ink block">{f.label}</span>
                              <span className="text-[10px] text-muted font-mono bg-slate-50 px-1 py-0.5 rounded border border-line">Clave: {f.key}</span>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 bg-slate-100 border border-line rounded-full font-bold uppercase text-slate-600">
                              {f.type}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3.5 border-t border-line/50 text-[10px]">
                            <div className="flex items-center gap-1 text-slate-600">
                              <span className={f.required ? 'text-forest font-bold' : 'text-slate-400'}>{f.required ? '✓' : '✗'}</span> Obligatorio
                            </div>
                            <div className="flex items-center gap-1 text-slate-600">
                              <span className={f.visible ? 'text-forest font-bold' : 'text-slate-400'}>{f.visible ? '✓' : '✗'}</span> Visible en Web
                            </div>
                            <div className="flex items-center gap-1 text-slate-600">
                              <span className={f.filterable ? 'text-forest font-bold' : 'text-slate-400'}>{f.filterable ? '✓' : '✗'}</span> Filtrable
                            </div>
                            <div className="flex items-center gap-1 text-slate-600">
                              <span className={f.searchable ? 'text-forest font-bold' : 'text-slate-400'}>{f.searchable ? '✓' : '✗'}</span> Buscable
                            </div>
                          </div>

                          {f.options && f.options.length > 0 && (
                            <div className="mt-3">
                              <span className="text-[10px] font-bold text-[#3d4842] block mb-1">Opciones de lista:</span>
                              <div className="flex flex-wrap gap-1">
                                {f.options.map(opt => (
                                  <span key={opt} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-line/50">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-line/50">
                          <button
                            onClick={() => handleEditFieldClick(f)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`¿Estás seguro de que deseas eliminar el campo "${f.label}"?`)) {
                                await deleteCustomField(f.key);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg cursor-pointer transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            /* --- EDITING / ADDING CUSTOM FIELD FORM --- */
            <div className="bg-white p-5 rounded-2xl border border-line space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h4 className="font-bold text-sm text-ink">
                  {isAddingField ? 'Crear Nuevo Campo Personalizado' : `Editar Campo: ${editingField.label}`}
                </h4>
                <button
                  onClick={() => setEditingField(null)}
                  className="p-1 text-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {fieldError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                  {fieldError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Etiqueta Visible (ej: Distancia al Lago)</label>
                  <input
                    type="text"
                    value={editingField.label || ''}
                    onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white"
                    placeholder="ej: Distancia al Lago"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Clave (ID único en minúsculas, ej: dist_lago)</label>
                  <input
                    type="text"
                    disabled={!isAddingField}
                    value={editingField.key || ''}
                    onChange={(e) => setEditingField({ ...editingField, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white disabled:opacity-60"
                    placeholder="ej: dist_lago"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Tipo de Campo</label>
                  <select
                    value={editingField.type || 'text'}
                    onChange={(e) => setEditingField({ ...editingField, type: e.target.value as any })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white"
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número Entero</option>
                    <option value="decimal">Número Decimal</option>
                    <option value="boolean">Verdadero/Falso</option>
                    <option value="date">Fecha</option>
                    <option value="select">Lista de Selección (Dropdown)</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="textarea">Área de Texto Amplia</option>
                    <option value="url">Dirección URL</option>
                    <option value="email">Correo Electrónico</option>
                    <option value="tel">Teléfono</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Valor por Defecto</label>
                  <input
                    type="text"
                    value={editingField.defaultValue !== undefined ? String(editingField.defaultValue) : ''}
                    onChange={(e) => setEditingField({ ...editingField, defaultValue: e.target.value })}
                    className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white"
                    placeholder="Opcional..."
                  />
                </div>
              </div>

              {/* Behavior Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-line">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cf-required-checkbox"
                    checked={!!editingField.required}
                    onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                    className="w-4 h-4 text-forest"
                  />
                  <label htmlFor="cf-required-checkbox" className="text-xs font-bold text-ink cursor-pointer select-none">
                    Obligatorio
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cf-visible-checkbox"
                    checked={editingField.visible !== false}
                    onChange={(e) => setEditingField({ ...editingField, visible: e.target.checked })}
                    className="w-4 h-4 text-forest"
                  />
                  <label htmlFor="cf-visible-checkbox" className="text-xs font-bold text-ink cursor-pointer select-none">
                    Visible en Web
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cf-filterable-checkbox"
                    checked={!!editingField.filterable}
                    onChange={(e) => setEditingField({ ...editingField, filterable: e.target.checked })}
                    className="w-4 h-4 text-forest"
                  />
                  <label htmlFor="cf-filterable-checkbox" className="text-xs font-bold text-ink cursor-pointer select-none">
                    Filtrable
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cf-searchable-checkbox"
                    checked={!!editingField.searchable}
                    onChange={(e) => setEditingField({ ...editingField, searchable: e.target.checked })}
                    className="w-4 h-4 text-forest"
                  />
                  <label htmlFor="cf-searchable-checkbox" className="text-xs font-bold text-ink cursor-pointer select-none">
                    Buscable
                  </label>
                </div>
              </div>

              {/* Options Builder for SELECT dropdown */}
              {editingField.type === 'select' && (
                <div className="border border-line rounded-2xl p-4 bg-slate-50 space-y-3">
                  <span className="block text-xs font-bold text-ink">Opciones de la Lista de Selección:</span>
                  
                  {editingField.options && editingField.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-line">
                      {editingField.options.map((opt, idx) => (
                        <span key={idx} className="text-xs bg-slate-100 border border-line text-slate-700 pl-2 pr-1 py-1 rounded-lg flex items-center gap-1 font-mono">
                          {opt}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingField.options || []).filter((_, i) => i !== idx);
                              setEditingField({ ...editingField, options: updated });
                            }}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nueva opción (ej: Vista Directa)"
                      value={newFieldOptionText}
                      onChange={(e) => setNewFieldOptionText(e.target.value)}
                      className="flex-1 rounded-lg border border-line px-2 py-1 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddFieldOption}
                      className="px-4 bg-[#f1f5f9] hover:bg-slate-200 text-ink font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              )}

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Orden de visualización</label>
                <input
                  type="number"
                  value={editingField.sortOrder || 0}
                  onChange={(e) => setEditingField({ ...editingField, sortOrder: Number(e.target.value) })}
                  className="w-24 min-h-[36px] rounded-lg border border-line px-2 text-sm bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  className="px-4 py-2 border border-line text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveField}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isAddingField ? 'Crear Campo' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB TAB 5: CAPACITY & STATUS --- */}
      {activeSubTab === 'capacity' && capacityForm && (
        <div className="bg-white p-5 rounded-2xl border border-line space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="text-sm font-bold text-ink">Límites de Capacidad & Estados</h3>
              <p className="text-xs text-muted">Configura los topes máximos por tipo de pasajero y los estados operativos.</p>
            </div>
            {(capacitySuccess || statusSuccess) && (
              <span className="text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-lg">
                ✓ Cambios guardados
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passenger capacities */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-line space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-forest">Categorías de Pasajeros</h4>
              
              {/* Adults */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="font-bold text-xs text-ink block">{capacityForm.adults.label}</span>
                  <span className="text-[10px] text-muted">Huéspedes mayores de 12 años</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={capacityForm.adults.enabled}
                    onChange={(e) => setCapacityForm({
                      ...capacityForm,
                      adults: { ...capacityForm.adults, enabled: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <input
                    type="number"
                    value={capacityForm.adults.max}
                    onChange={(e) => setCapacityForm({
                      ...capacityForm,
                      adults: { ...capacityForm.adults, max: Number(e.target.value) }
                    })}
                    className="w-16 min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white text-center"
                    min="1"
                    disabled={!capacityForm.adults.enabled}
                  />
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="font-bold text-xs text-ink block">{capacityForm.children.label}</span>
                  <span className="text-[10px] text-muted">Huéspedes de 2 a 12 años</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={capacityForm.children.enabled}
                    onChange={(e) => setCapacityForm({
                      ...capacityForm,
                      children: { ...capacityForm.children, enabled: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <input
                    type="number"
                    value={capacityForm.children.max}
                    onChange={(e) => setCapacityForm({
                      ...capacityForm,
                      children: { ...capacityForm.children, max: Number(e.target.value) }
                    })}
                    className="w-16 min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white text-center"
                    min="0"
                    disabled={!capacityForm.children.enabled}
                  />
                </div>
              </div>

              {/* Babies */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="font-bold text-xs text-ink block">{capacityForm.babies.label}</span>
                  <span className="text-[10px] text-muted">Lactantes o bebés de 0 a 2 años</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={capacityForm.babies.enabled}
                    onChange={(e) => setCapacityForm({
                      ...capacityForm,
                      babies: { ...capacityForm.babies, enabled: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <input
                    type="number"
                    value={capacityForm.babies.max}
                    onChange={(e) => setCapacityForm({
                      ...capacityForm,
                      babies: { ...capacityForm.babies, max: Number(e.target.value) }
                    })}
                    className="w-16 min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white text-center"
                    min="0"
                    disabled={!capacityForm.babies.enabled}
                  />
                </div>
              </div>

              {/* Pets */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="font-bold text-xs text-ink block">{capacityForm.pets.label}</span>
                  <span className="text-[10px] text-muted">Mascotas autorizadas</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={capacityForm.pets.enabled}
                    onChange={(e) => setCapacityForm({
                      ...capacityForm,
                      pets: { ...capacityForm.pets, enabled: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <input
                    type="number"
                    value={capacityForm.pets.max}
                    onChange={(e) => setCapacityForm({
                      ...capacityForm,
                      pets: { ...capacityForm.pets, max: Number(e.target.value) }
                    })}
                    className="w-16 min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white text-center"
                    min="0"
                    disabled={!capacityForm.pets.enabled}
                  />
                </div>
              </div>

              {/* Total Limit */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-bold text-xs text-forest block">Límite Absoluto de Huéspedes</span>
                  <span className="text-[10px] text-muted">Tope total permitido por cabaña</span>
                </div>
                <input
                  type="number"
                  value={capacityForm.maxGuestsLimit}
                  onChange={(e) => setCapacityForm({ ...capacityForm, maxGuestsLimit: Number(e.target.value) })}
                  className="w-20 min-h-[36px] rounded-lg border border-forest px-2 text-xs bg-white text-center font-bold text-forest"
                  min="1"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSaveCapacityClick}
                  disabled={isSavingCapacity}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {isSavingCapacity ? 'Guardando...' : 'Guardar Capacidades'}
                </button>
              </div>
            </div>

            {/* Status configuration */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-line space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-forest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Estados Operativos
              </h4>
              <p className="text-[11px] text-muted">Indica qué estados de disponibilidad están habilitados para seleccionar en cada propiedad.</p>
              
              <div className="space-y-2.5">
                {config.statusOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between p-3 border border-line bg-white rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full bg-${opt.color === 'green' ? 'green-500' : opt.color === 'orange' ? 'orange-500' : opt.color === 'blue' ? 'blue-500' : 'red-500'}`} />
                      <span className="font-bold text-xs text-ink">{opt.label}</span>
                      <span className="text-[9px] text-muted font-mono">({opt.id})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(opt.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer border transition-colors ${
                        opt.active
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {opt.active ? 'Habilitado' : 'Deshabilitado'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
