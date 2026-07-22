import React, { useState } from 'react';
import { OnboardingStep4Data } from '../types';
import { Coins, Clock, ArrowLeft, HelpCircle } from 'lucide-react';

interface Step4Props {
  initialData?: OnboardingStep4Data;
  onSave: (data: OnboardingStep4Data) => Promise<void>;
  onBack: () => void;
}

const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible: Cancelación gratuita hasta 24 hs antes de la llegada.' },
  { value: 'moderada', label: 'Moderada: Cancelación gratuita hasta 7 días antes de la llegada.' },
  { value: 'estricta', label: 'Estricta: No reembolsable en caso de cancelación o no presentación.' },
  { value: 'custom', label: 'Personalizada (escribir abajo)' }
];

export const Step4Rates: React.FC<Step4Props> = ({ initialData, onSave, onBack }) => {
  const [seasonName, setSeasonName] = useState(initialData?.seasonName || 'Temporada Regular');
  const [basePrice, setBasePrice] = useState(initialData?.basePrice || 15000);
  const [minStay, setMinStay] = useState(initialData?.minStay || 2);
  const [selectedPolicyType, setSelectedPolicyType] = useState('moderada');
  const [customCancellationPolicy, setCustomCancellationPolicy] = useState(initialData?.cancellationPolicy || '');
  const [checkInTime, setCheckInTime] = useState(initialData?.checkInTime || '14:00');
  const [checkOutTime, setCheckOutTime] = useState(initialData?.checkOutTime || '10:00');
  const [loading, setLoading] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const getFinalCancellationPolicy = () => {
    if (selectedPolicyType === 'custom') {
      return customCancellationPolicy || 'Política de cancelación a coordinar.';
    }
    const policy = CANCELLATION_POLICIES.find(p => p.value === selectedPolicyType);
    return policy ? policy.label : 'Cancelación flexible.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors([]);

    const errors: string[] = [];
    if (!seasonName.trim()) errors.push('El nombre de la temporada base es obligatorio.');
    if (basePrice <= 0) errors.push('El precio base de la temporada debe ser mayor a 0.');
    if (minStay <= 0) errors.push('La estadía mínima de noches debe ser mayor a 0.');
    if (!checkInTime.trim()) errors.push('La hora de Check-in es obligatoria.');
    if (!checkOutTime.trim()) errors.push('La hora de Check-out es obligatoria.');

    const cancellationPolicy = getFinalCancellationPolicy();
    if (!cancellationPolicy.trim()) errors.push('La política de cancelación es obligatoria.');

    if (errors.length > 0) {
      setLocalErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        seasonName: seasonName.trim(),
        basePrice,
        minStay,
        cancellationPolicy: cancellationPolicy.trim(),
        checkInTime: checkInTime.trim(),
        checkOutTime: checkOutTime.trim()
      });
    } catch (err) {
      setLocalErrors([err instanceof Error ? err.message : 'Error al guardar el Paso 4.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="step4-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#f0f9f4] border border-green-100 p-4 rounded-2xl flex gap-3">
        <Coins className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-ink">Paso 4: Configuración de Tarifas y Normativas</h3>
          <p className="text-xs text-muted mt-0.5">
            Define la tarifa estándar base para tus huéspedes, los mínimos de noches requeridas para reservar y las políticas de check-in / check-out que regirán tu complejo.
          </p>
        </div>
      </div>

      {localErrors.length > 0 && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs space-y-1">
          {localErrors.map((err, idx) => (
            <p key={idx}>• {err}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="rate-season-name" className="block text-xs font-bold text-ink">
            Nombre de la Temporada Base <span className="text-danger">*</span>
          </label>
          <input
            id="rate-season-name"
            type="text"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
            placeholder="ej: Temporada Regular, Tarifa Base"
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rate-base-price" className="block text-xs font-bold text-ink">
            Tarifa Base de Hospedaje por Noche <span className="text-danger">*</span>
          </label>
          <input
            id="rate-base-price"
            type="number"
            min={1}
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rate-min-stay" className="block text-xs font-bold text-ink">
            Estadía Mínima Recomendada <span className="text-xs text-muted font-normal">(Noches)</span> <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="rate-min-stay"
              type="range"
              min={1}
              max={7}
              value={minStay}
              onChange={(e) => setMinStay(Number(e.target.value))}
              className="flex-1 accent-forest cursor-pointer"
            />
            <span className="text-sm font-bold bg-[#f1f5f9] px-3 py-1.5 rounded-lg border border-line min-w-[50px] text-center">
              {minStay} {minStay === 1 ? 'noche' : 'noches'}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rate-policy-type" className="block text-xs font-bold text-ink">
            Política de Cancelación Estándar <span className="text-danger">*</span>
          </label>
          <select
            id="rate-policy-type"
            value={selectedPolicyType}
            onChange={(e) => setSelectedPolicyType(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-line px-3 text-sm bg-white focus:outline-forest"
          >
            {CANCELLATION_POLICIES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {selectedPolicyType === 'custom' && (
          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label htmlFor="rate-policy-custom" className="block text-xs font-bold text-ink">Escribe tu política de cancelación personalizada</label>
            <textarea
              id="rate-policy-custom"
              rows={2}
              value={customCancellationPolicy}
              onChange={(e) => setCustomCancellationPolicy(e.target.value)}
              placeholder="ej: Cancelación libre de cargos si se realiza con más de 15 días de antelación..."
              className="w-full rounded-xl border border-line p-3.5 text-sm bg-white focus:outline-forest"
            />
          </div>
        )}

        <div className="space-y-1.5 border-t border-line/50 pt-4 mt-2 col-span-1 md:col-span-2">
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="w-4 h-4 text-forest" />
            <h4 className="text-xs font-bold text-ink">Horarios de Entrada & Salida (Check-in / Check-out)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="rate-checkin" className="block text-[11px] font-bold text-ink">Horario de Check-in (Entrada)</label>
              <input
                id="rate-checkin"
                type="text"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                placeholder="ej: 14:00"
                className="w-full min-h-[40px] rounded-xl border border-line px-3 text-sm bg-white focus:outline-forest"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rate-checkout" className="block text-[11px] font-bold text-ink">Horario de Check-out (Salida)</label>
              <input
                id="rate-checkout"
                type="text"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                placeholder="ej: 10:00"
                className="w-full min-h-[40px] rounded-xl border border-line px-3 text-sm bg-white focus:outline-forest"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-line/60">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-5 rounded-xl border border-line text-ink font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] px-6 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Siguiente Paso'}
        </button>
      </div>
    </form>
  );
};
