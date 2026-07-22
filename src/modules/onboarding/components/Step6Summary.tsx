import React, { useState } from 'react';
import { OnboardingProgress } from '../types';
import { CheckCircle2, ShieldAlert, ArrowLeft, Loader2, Sparkles, Building, Phone, Bed, Coins, Globe } from 'lucide-react';

interface Step6Props {
  progress: OnboardingProgress;
  onComplete: () => Promise<void>;
  onBack: () => void;
}

export const Step6Summary: React.FC<Step6Props> = ({ progress, onComplete, onBack }) => {
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { step1, step2, step3, step4, step5 } = progress.stepData;

  const handleComplete = async () => {
    setPublishError(null);
    setPublishing(true);
    try {
      await onComplete();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Error al finalizar la publicación del complejo.');
      setPublishing(false);
    }
  };

  const stepsList = [
    {
      num: 1,
      title: 'Identidad y Datos Comerciales',
      data: step1,
      desc: step1 ? `Nombre comercial: "${step1.name}" (${step1.currency} / ${step1.language})` : 'Pendiente',
      icon: Building
    },
    {
      num: 2,
      title: 'Canales de Contacto',
      data: step2,
      desc: step2 ? `Email: ${step2.email} / Teléfono: ${step2.phone}` : 'Pendiente',
      icon: Phone
    },
    {
      num: 3,
      title: 'Alojamiento Inaugural',
      data: step3,
      desc: step3 ? `"${step3.name}" (${step3.capacity} huéspedes) - Base: $${step3.price}/noche` : 'Pendiente',
      icon: Bed
    },
    {
      num: 4,
      title: 'Tarifas y Reglas Operativas',
      data: step4,
      desc: step4 ? `Estadía mín.: ${step4.minStay} noches | Check-in: ${step4.checkInTime} / Check-out: ${step4.checkOutTime}` : 'Pendiente',
      icon: Coins
    },
    {
      num: 5,
      title: 'Sitio Web Corporativo',
      data: step5,
      desc: step5 ? `Título: "${step5.title}" | Botón: "${step5.ctaText}"` : 'Pendiente',
      icon: Globe
    }
  ];

  const allReady = stepsList.every(s => !!s.data);

  return (
    <div className="space-y-6">
      <div className="bg-[#f0f9f4] border border-green-100 p-4 rounded-2xl flex gap-3">
        <Sparkles className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-ink">Paso 6: Revisión y Lanzamiento</h3>
          <p className="text-xs text-muted mt-0.5">
            ¡Todo listo! Revisa la configuración de tu complejo turístico antes de compilar y activar los canales operativos del sistema.
          </p>
        </div>
      </div>

      {publishError && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      {/* Recap steps cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stepsList.map((step) => {
          const isConfigured = !!step.data;
          const IconComponent = step.icon;
          return (
            <div 
              key={step.num}
              className={`p-4 rounded-xl border flex gap-3.5 transition-all bg-white ${
                isConfigured ? 'border-line shadow-2xs' : 'border-dashed border-slate-200 opacity-60'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isConfigured ? 'bg-forest/10 text-forest' : 'bg-slate-100 text-muted'
              }`}>
                <IconComponent className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink truncate">Paso {step.num}: {step.title}</span>
                  {isConfigured ? (
                    <span className="text-[10px] text-forest font-bold bg-green-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-forest" /> Listo
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted font-bold bg-slate-50 px-1.5 py-0.5 rounded-full shrink-0">Incompleto</span>
                  )}
                </div>
                <p className="text-[11px] text-muted mt-1 leading-relaxed truncate">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 border border-line rounded-2xl bg-[#fafbf9] space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-forest">¿Qué sucederá al hacer clic en "Compilar y Publicar"?</h4>
        <ul className="text-xs text-[#4b534d] space-y-1.5 leading-relaxed list-disc list-inside">
          <li>Se actualizará tu perfil oficial en la base de datos de StayFlow.</li>
          <li>Se registrará tu primera unidad habitacional disponible para reservas.</li>
          <li>Se publicará el contenido estético en tu portal de CMS para búsquedas públicas.</li>
          <li>Se inicializarán los planes tarifarios, comisiones y reglas de temporada baja/alta.</li>
        </ul>
      </div>

      <div className="flex justify-between pt-4 border-t border-line/60">
        <button
          type="button"
          disabled={publishing}
          onClick={onBack}
          className="min-h-[44px] px-5 rounded-xl border border-line text-ink font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        <button
          type="button"
          disabled={!allReady || publishing}
          onClick={handleComplete}
          className="min-h-[44px] px-6 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {publishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publicando Complejo...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Compilar y Publicar Complejo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
