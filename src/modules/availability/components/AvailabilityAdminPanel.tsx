import React, { useState } from 'react';
import { useAvailability } from '../hooks/useAvailability';
import { useAccommodations } from '../../accommodations';
import { AvailabilityStatus, BlockType, ValidationResult } from '../types';
import { getTodayDateStr } from '../utils';
import { 
  Calendar, Lock, Unlock, Wrench, AlertTriangle, CheckCircle2, 
  ShieldAlert, List, Clock, Sparkles, Sliders, Play, Trash, Plus, 
  Search, ShieldX, Ban, HelpCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AvailabilityAdminPanel: React.FC = () => {
  const { accommodations, loading: accLoading } = useAccommodations();
  const {
    blocks,
    rules,
    loading: availLoading,
    error,
    createBlock,
    deleteBlock,
    createRule,
    deleteRule,
    validarRangoDeFechas,
    obtenerDisponibilidad,
  } = useAvailability();

  // Active sub-section tab inside Availability Panel
  const [activeSubTab, setActiveSubTab] = useState<'blocks' | 'rules' | 'simulator'>('blocks');

  // Selected accommodation state for overview
  const [selectedAccId, setSelectedAccId] = useState<string | number>('all');

  // Block Form states
  const [blockStart, setBlockStart] = useState(getTodayDateStr());
  const [blockEnd, setBlockEnd] = useState(getTodayDateStr());
  const [blockType, setBlockType] = useState<BlockType>('manual');
  const [blockAccId, setBlockAccId] = useState<string | number>('all');
  const [blockReason, setBlockReason] = useState('');
  const [blockNotes, setBlockNotes] = useState('');
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);

  // Rule Form states
  const [ruleName, setRuleName] = useState('');
  const [ruleAccId, setRuleAccId] = useState<string | number>('all');
  const [ruleStart, setRuleStart] = useState('');
  const [ruleEnd, setRuleEnd] = useState('');
  const [ruleSeasonName, setRuleSeasonName] = useState('');
  const [ruleDaysOfWeek, setRuleDaysOfWeek] = useState<number[]>([]);
  const [ruleMinStay, setRuleMinStay] = useState<number | ''>('');
  const [ruleMaxStay, setRuleMaxStay] = useState<number | ''>('');
  const [ruleClosedToArrival, setRuleClosedToArrival] = useState(false);
  const [ruleClosedToDeparture, setRuleClosedToDeparture] = useState(false);
  const [ruleMinDaysInAdvance, setRuleMinDaysInAdvance] = useState<number | ''>('');
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [ruleSuccess, setRuleSuccess] = useState<string | null>(null);

  // Simulator states
  const [simAccId, setSimAccId] = useState<string | number>('');
  const [simCheckIn, setSimCheckIn] = useState(getTodayDateStr());
  const [simCheckOut, setSimCheckOut] = useState(getTodayDateStr());
  const [simGuests, setSimGuests] = useState<number>(2);
  const [simResult, setSimResult] = useState<ValidationResult | null>(null);
  const [simDetailDays, setSimDetailDays] = useState<any[]>([]);
  const [simLoading, setSimLoading] = useState(false);

  // --- HANDLERS ---

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(null);
    setBlockSuccess(null);

    if (blockStart > blockEnd) {
      setBlockError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    if (!blockReason.trim()) {
      setBlockError('Debe ingresar un motivo para el bloqueo.');
      return;
    }

    try {
      await createBlock({
        accommodationId: blockAccId,
        type: blockType,
        startDate: blockStart,
        endDate: blockEnd,
        reason: blockReason,
        notes: blockNotes
      });
      setBlockSuccess('Bloqueo registrado con éxito.');
      setBlockReason('');
      setBlockNotes('');
    } catch (err: any) {
      setBlockError(err.message || 'Error al guardar el bloqueo.');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleError(null);
    setRuleSuccess(null);

    if (!ruleName.trim()) {
      setRuleError('Debe ingresar un nombre descriptivo para la regla.');
      return;
    }

    if (ruleStart && ruleEnd && ruleStart > ruleEnd) {
      setRuleError('La fecha de inicio de la regla no puede ser posterior a la fecha de fin.');
      return;
    }

    const minStayVal = ruleMinStay === '' ? undefined : Number(ruleMinStay);
    const maxStayVal = ruleMaxStay === '' ? undefined : Number(ruleMaxStay);
    const minDaysInAdvanceVal = ruleMinDaysInAdvance === '' ? undefined : Number(ruleMinDaysInAdvance);

    try {
      await createRule({
        name: ruleName,
        accommodationId: ruleAccId,
        startDate: ruleStart || undefined,
        endDate: ruleEnd || undefined,
        seasonName: ruleSeasonName || undefined,
        daysOfWeek: ruleDaysOfWeek.length > 0 ? ruleDaysOfWeek : undefined,
        minStay: minStayVal,
        maxStay: maxStayVal,
        closedToArrival: ruleClosedToArrival || undefined,
        closedToDeparture: ruleClosedToDeparture || undefined,
        minDaysInAdvance: minDaysInAdvanceVal
      });

      setRuleSuccess('Regla de estadía creada exitosamente.');
      setRuleName('');
      setRuleStart('');
      setRuleEnd('');
      setRuleSeasonName('');
      setRuleDaysOfWeek([]);
      setRuleMinStay('');
      setRuleMaxStay('');
      setRuleClosedToArrival(false);
      setRuleClosedToDeparture(false);
      setRuleMinDaysInAdvance('');
    } catch (err: any) {
      setRuleError(err.message || 'Error al guardar la regla.');
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAccId) {
      alert('Debe seleccionar un alojamiento.');
      return;
    }

    setSimLoading(true);
    setSimResult(null);
    setSimDetailDays([]);

    try {
      // 1. Run engine validation
      const result = await validarRangoDeFechas(simAccId, simCheckIn, simCheckOut, simGuests);
      setSimResult(result);

      // 2. Load daily breakdowns to show the admin
      if (simCheckIn < simCheckOut) {
        const days = await obtenerDisponibilidad(simAccId, simCheckIn, simCheckOut);
        setSimDetailDays(days);
      }
    } catch (err: any) {
      setSimResult({
        isValid: false,
        reason: 'INVALID_DATES',
        message: err.message || 'Error al ejecutar la simulación.'
      });
    } finally {
      setSimLoading(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setRuleDaysOfWeek(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getAccommodationName = (id: string | number) => {
    if (id === 'all') return 'Todos los alojamientos';
    const acc = accommodations.find(a => String(a.id) === String(id));
    return acc ? acc.name : `Alojamiento #${id}`;
  };

  const getBlockTypeBadge = (type: BlockType) => {
    switch (type) {
      case 'closure':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cierre Temporal</span>;
      case 'maintenance':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Mantenimiento</span>;
      case 'manual':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Bloqueo Manual</span>;
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'AVAILABLE':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Disponible</span>;
      case 'BLOCKED':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">Bloqueado</span>;
      case 'MAINTENANCE':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono">Mantenimiento</span>;
      case 'RESERVED':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono">Reservado</span>;
      case 'OUT_OF_SERVICE':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono">Fuera de Servicio</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">{st}</span>;
    }
  };

  // Filter lists based on selectedAccId
  const filteredBlocks = selectedAccId === 'all' 
    ? blocks 
    : blocks.filter(b => b.accommodationId === 'all' || String(b.accommodationId) === String(selectedAccId));

  const filteredRules = selectedAccId === 'all' 
    ? rules 
    : rules.filter(r => r.accommodationId === 'all' || String(r.accommodationId) === String(selectedAccId));

  return (
    <div className="space-y-6">
      {/* Page Description Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-forest text-white rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Motor Inteligente de Disponibilidad</h2>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Soporte completo para multi-tenant. Centraliza el cálculo de disponibilidad real, cruzando reservas confirmadas/pendientes, bloqueos de fechas, mantenimientos preventivos y reglas complejas de estadía (mínimas/máximas, anticipación, no ingresos/salidas).
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <div className="font-mono">{error}</div>
        </div>
      )}

      {/* Primary Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('blocks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'blocks'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Bloqueos & Cierres
          </button>
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'rules'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Reglas de Estadía
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'simulator'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Simulador de Disponibilidad
          </button>
        </div>

        {/* Resort Accommodation Filter (applicable for blocks & rules) */}
        {activeSubTab !== 'simulator' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alojamiento:</span>
            <select
              value={selectedAccId}
              onChange={(e) => setSelectedAccId(e.target.value)}
              className="rounded-lg border-slate-200 text-xs shadow-sm bg-white py-1 focus:border-slate-500 focus:ring-slate-500 font-sans font-semibold text-slate-700"
            >
              <option value="all">Ver Todos</option>
              {accommodations.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'blocks' && (
          <motion.div
            key="blocks"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Form Column */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Lock className="w-4 h-4 text-slate-800" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Crear Bloqueo de Fechas</h3>
              </div>

              <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Alojamiento Destinado</label>
                  <select
                    value={blockAccId}
                    onChange={(e) => setBlockAccId(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="all">Todos los Alojamientos (Cierre Complejo)</option>
                    {accommodations.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Fecha Desde</label>
                    <input
                      type="date"
                      value={blockStart}
                      onChange={(e) => setBlockStart(e.target.value)}
                      className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Fecha Hasta</label>
                    <input
                      type="date"
                      value={blockEnd}
                      onChange={(e) => setBlockEnd(e.target.value)}
                      className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tipo de Bloqueo</label>
                  <select
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as BlockType)}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="manual">Bloqueo Manual (BLOCKED)</option>
                    <option value="maintenance">Mantenimiento Preventivo (MAINTENANCE)</option>
                    <option value="closure">Cierre de Complejo / Temporada (OUT_OF_SERVICE)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Motivo de Bloqueo</label>
                  <input
                    type="text"
                    placeholder="Ej. Refacción de techado, Desinsectación"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Comentarios Adicionales (Opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="Detalles técnicos..."
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                  />
                </div>

                {blockError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg flex items-center gap-2 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{blockError}</span>
                  </div>
                )}

                {blockSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{blockSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={availLoading}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest/90 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Bloqueo
                </button>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-fit">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Historial de Bloqueos Activos</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-800">
                  {filteredBlocks.length} registros
                </span>
              </div>

              <div className="divide-y divide-slate-100 p-4">
                {filteredBlocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-xs space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                    <p className="font-sans font-semibold">Complejo Libre de Bloqueos</p>
                    <p className="text-[10px] text-slate-400 font-sans">(Disponible por defecto en todo el calendario)</p>
                  </div>
                ) : (
                  filteredBlocks
                    .sort((a, b) => b.startDate.localeCompare(a.startDate))
                    .map((block) => (
                      <div key={block.id} className="py-3 flex items-start justify-between gap-4 hover:bg-slate-50 rounded-lg px-2 transition">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {block.startDate} al {block.endDate}
                            </span>
                            {getBlockTypeBadge(block.type)}
                          </div>
                          
                          <div className="text-xs text-slate-600 font-sans">
                            <span className="font-bold text-slate-700">Alojamiento:</span> {getAccommodationName(block.accommodationId)}
                          </div>

                          <div className="text-xs text-slate-600 font-sans">
                            <span className="font-bold text-slate-700">Motivo:</span> {block.reason}
                          </div>

                          {block.notes && (
                            <div className="text-[11px] text-slate-400 italic font-sans">
                              &ldquo;{block.notes}&rdquo;
                            </div>
                          )}
                        </div>

                        <button
                          onClick={async () => {
                            if (window.confirm('¿Está seguro de que desea eliminar este bloqueo? El rango de fechas volverá a estar disponible.')) {
                              try {
                                await deleteBlock(block.id);
                              } catch (err) {
                                console.error('Error delete block:', err);
                              }
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
                          title="Eliminar Bloqueo"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'rules' && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Form Column */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-slate-800" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Crear Regla de Estadía</h3>
              </div>

              <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nombre de la Regla / Temporada</label>
                  <input
                    type="text"
                    placeholder="Ej. Temporada Alta Verano, Fines de semana"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Alojamiento Destinado</label>
                  <select
                    value={ruleAccId}
                    onChange={(e) => setRuleAccId(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="all">Todos los Alojamientos (Regla Global)</option>
                    {accommodations.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Fecha Desde (Opcional)</label>
                    <input
                      type="date"
                      value={ruleStart}
                      onChange={(e) => setRuleStart(e.target.value)}
                      className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Fecha Hasta (Opcional)</label>
                    <input
                      type="date"
                      value={ruleEnd}
                      onChange={(e) => setRuleEnd(e.target.value)}
                      className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Días de la semana aplicables (Opcional)</label>
                  <div className="flex gap-1">
                    {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((name, i) => {
                      const active = ruleDaysOfWeek.includes(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDayOfWeek(i)}
                          className={`w-7 h-7 rounded-full text-[10px] font-bold border transition ${
                            active 
                              ? 'bg-slate-900 text-white border-slate-900' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-dashed border-slate-100">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Estadía Mínima (Noches)</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Ej. 2"
                      value={ruleMinStay}
                      onChange={(e) => setRuleMinStay(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Estadía Máxima (Noches)</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Ej. 14"
                      value={ruleMaxStay}
                      onChange={(e) => setRuleMaxStay(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-2 pb-2 border-b border-dashed border-slate-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="closedToArrival"
                      checked={ruleClosedToArrival}
                      onChange={(e) => setRuleClosedToArrival(e.target.checked)}
                      className="rounded border-slate-300 text-forest focus:ring-forest"
                    />
                    <label htmlFor="closedToArrival" className="font-bold text-slate-700 select-none">
                      Deshabilitar ingresos (No Check-In)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="closedToDeparture"
                      checked={ruleClosedToDeparture}
                      onChange={(e) => setRuleClosedToDeparture(e.target.checked)}
                      className="rounded border-slate-300 text-forest focus:ring-forest"
                    />
                    <label htmlFor="closedToDeparture" className="font-bold text-slate-700 select-none">
                      Deshabilitar egresos (No Check-Out)
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Anticipación Mínima (Días de antelación)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ej. 3 (Reservar al menos 3 días antes)"
                    value={ruleMinDaysInAdvance}
                    onChange={(e) => setRuleMinDaysInAdvance(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                  />
                </div>

                {ruleError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg flex items-center gap-2 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{ruleError}</span>
                  </div>
                )}

                {ruleSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{ruleSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={availLoading}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest/90 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear Regla de Estadía
                </button>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-fit text-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Políticas de Estadía Activas</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-800">
                  {filteredRules.length} reglas
                </span>
              </div>

              <div className="divide-y divide-slate-100 p-4">
                {filteredRules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-xs space-y-2 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                    <p className="font-sans font-semibold">Sin Restricciones Especiales</p>
                    <p className="text-[10px] text-slate-400 font-sans">(Se aplican las condiciones básicas del sistema)</p>
                  </div>
                ) : (
                  filteredRules.map((rule) => (
                    <div key={rule.id} className="py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 rounded-lg px-2 transition">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{rule.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                            {getAccommodationName(rule.accommodationId)}
                          </span>
                        </div>

                        {/* Dates & Days */}
                        <div className="text-[11px] text-slate-500 font-sans flex flex-wrap gap-x-4 gap-y-1">
                          {(rule.startDate || rule.endDate) && (
                            <span>
                              📅 Periodo: <strong className="text-slate-700">{rule.startDate || 'N/A'}</strong> al <strong className="text-slate-700">{rule.endDate || 'N/A'}</strong>
                            </span>
                          )}
                          {rule.daysOfWeek && rule.daysOfWeek.length > 0 && (
                            <span>
                              🗓️ Días: <strong className="text-slate-700">{rule.daysOfWeek.map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d]).join(', ')}</strong>
                            </span>
                          )}
                        </div>

                        {/* Restrictions Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 border border-slate-100">
                          {rule.minStay !== undefined && (
                            <div>
                              🏨 Min Estadía: <strong className="text-slate-800">{rule.minStay} noches</strong>
                            </div>
                          )}
                          {rule.maxStay !== undefined && (
                            <div>
                              🏨 Max Estadía: <strong className="text-slate-800">{rule.maxStay} noches</strong>
                            </div>
                          )}
                          {rule.minDaysInAdvance !== undefined && (
                            <div>
                              ⏳ Anticipación: <strong className="text-slate-800">{rule.minDaysInAdvance} días</strong>
                            </div>
                          )}
                          {rule.closedToArrival && (
                            <div className="text-rose-600 font-semibold flex items-center gap-0.5">
                              <Ban className="w-2.5 h-2.5" /> CTA: No ingreso
                            </div>
                          )}
                          {rule.closedToDeparture && (
                            <div className="text-rose-600 font-semibold flex items-center gap-0.5">
                              <Ban className="w-2.5 h-2.5" /> CTD: No salida
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (window.confirm(`¿Está seguro de que desea eliminar la regla "${rule.name}"?`)) {
                            try {
                              await deleteRule(rule.id);
                            } catch (err) {
                              console.error('Error delete rule:', err);
                            }
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition align-top"
                        title="Eliminar Regla"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'simulator' && (
          <motion.div
            key="simulator"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Form Column */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Search className="w-4 h-4 text-slate-800" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Simular Consulta</h3>
              </div>

              <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Alojamiento a Consultar</label>
                  <select
                    value={simAccId}
                    onChange={(e) => setSimAccId(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                    required
                  >
                    <option value="">-- Selecciona un Alojamiento --</option>
                    {accommodations.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Fecha Ingreso</label>
                    <input
                      type="date"
                      value={simCheckIn}
                      onChange={(e) => setSimCheckIn(e.target.value)}
                      className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Fecha Egreso</label>
                    <input
                      type="date"
                      value={simCheckOut}
                      onChange={(e) => setSimCheckOut(e.target.value)}
                      className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cantidad de Huéspedes</label>
                  <input
                    type="number"
                    min={1}
                    value={simGuests}
                    onChange={(e) => setSimGuests(Number(e.target.value))}
                    className="w-full rounded-lg border-slate-200 text-xs bg-slate-50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={simLoading}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  {simLoading ? 'Analizando...' : 'Verificar Motor de Disponibilidad'}
                </button>
              </form>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-8 space-y-4">
              {simResult === null ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 font-sans">Simulación Lista</p>
                  <p className="font-sans text-slate-400">Ingresa los datos del viaje en el panel izquierdo y haz clic en "Verificar" para auditar en tiempo real la disponibilidad y las reglas de reserva aplicadas.</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-xs"
                >
                  {/* Status Card */}
                  <div className={`p-5 border rounded-xl shadow-sm flex items-start gap-4 ${
                    simResult.isValid 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {simResult.isValid 
                        ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        : <ShieldX className="w-6 h-6 text-rose-600" />
                      }
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold font-sans">
                        Resultado: {simResult.isValid ? 'APROBADO PARA RESERVAR' : 'DENEGADO / NO DISPONIBLE'}
                      </h4>
                      <p className="font-semibold text-slate-700">{simResult.message}</p>
                      {!simResult.isValid && simResult.reason && (
                        <p className="text-[10px] font-mono text-slate-400">Código de Error: {simResult.reason}</p>
                      )}
                    </div>
                  </div>

                  {/* Daily breakdown */}
                  {simDetailDays.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Calendar className="w-4 h-4 text-slate-700" />
                        <span className="font-bold text-slate-900 uppercase tracking-wider">Desglose Diario de la Consulta ({simDetailDays.length} noches)</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {simDetailDays.map((day) => (
                          <div key={day.id} className="p-2.5 border border-slate-100 rounded-lg hover:bg-slate-50 transition text-center space-y-1.5">
                            <div className="text-[10px] font-mono font-bold text-slate-500">{day.date}</div>
                            <div>{getStatusBadge(day.status)}</div>
                            {day.reason !== 'default' && (
                              <div className="text-[9px] text-slate-400 truncate max-w-full" title={day.reason}>
                                {day.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvailabilityAdminPanel;
