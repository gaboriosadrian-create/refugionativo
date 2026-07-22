import React, { useState } from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import { Step1ResortData } from '../components/Step1ResortData';
import { Step2Contact } from '../components/Step2Contact';
import { Step3Accommodation } from '../components/Step3Accommodation';
import { Step4Rates } from '../components/Step4Rates';
import { Step5Website } from '../components/Step5Website';
import { Step6Summary } from '../components/Step6Summary';
import { useResort } from '../../../shared/contexts/ResortContext';
import { 
  Building, 
  Phone, 
  Bed, 
  Coins, 
  Globe, 
  Sparkles, 
  CheckCircle, 
  Compass, 
  ArrowRight,
  Sparkle
} from 'lucide-react';

export const OnboardingWizardPage: React.FC<{ onCompleteRedirect: () => void }> = ({ onCompleteRedirect }) => {
  const { progress, loading, error, saveStep, completeOnboarding, jumpToStep } = useOnboarding();
  const { resort } = useResort();
  const [justFinished, setJustFinished] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest" />
        <p className="text-xs text-muted mt-3 font-semibold">Cargando asistente de configuración...</p>
      </div>
    );
  }

  if (!resort || !progress) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-8 text-center">
        <p className="text-sm font-bold text-ink">No se detectó ningún complejo turístico activo para configurar.</p>
        <p className="text-xs text-muted mt-1">Por favor, inicia sesión o selecciona un resort.</p>
      </div>
    );
  }

  const stepsMetadata = [
    { step: 1, label: 'Datos Básicos', desc: 'Identidad y moneda', icon: Building, isSaved: progress.stepsSaved.step1 },
    { step: 2, label: 'Contacto', desc: 'Canales y ubicación', icon: Phone, isSaved: progress.stepsSaved.step2 },
    { step: 3, label: 'Alojamiento', desc: 'Primera cabaña', icon: Bed, isSaved: progress.stepsSaved.step3 },
    { step: 4, label: 'Tarifas & Normas', desc: 'Precios y horarios', icon: Coins, isSaved: progress.stepsSaved.step4 },
    { step: 5, label: 'Sitio Web', desc: 'Diseño de portada', icon: Globe, isSaved: progress.stepsSaved.step5 },
    { step: 6, label: 'Lanzamiento', desc: 'Revisión y activación', icon: Sparkles, isSaved: progress.stepsSaved.step6 }
  ];

  const currentStep = progress.currentStep;

  const handleStepSave = async (data: any) => {
    await saveStep(currentStep, data);
  };

  const handleFinalPublish = async () => {
    await completeOnboarding();
    setJustFinished(true);
  };

  if (justFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-line rounded-3xl p-8 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-forest/10 text-forest rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl text-ink">¡Enhorabuena!</h1>
            <p className="text-xs text-muted leading-relaxed">
              El complejo <strong>"{progress.stepData.step1?.name || resort.name}"</strong> se ha configurado con éxito. Tus datos operativos, tarifas y portal CMS ya están listos para recibir reservas públicas.
            </p>
          </div>

          <div className="p-4 bg-[#fafbf9] border border-green-50/50 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex gap-2 text-forest font-bold items-center">
              <Sparkle className="w-4 h-4 shrink-0" />
              <span>Canales activados correctamente:</span>
            </div>
            <ul className="text-[#4c544f] pl-1.5 space-y-1">
              <li>✓ Primer Alojamiento: <strong>"{progress.stepData.step3?.name}"</strong></li>
              <li>✓ Tarifas base e impuestos configurados</li>
              <li>✓ Portada del sitio web CMS actualizada y publicada</li>
              <li>✓ Reglas de Check-in y políticas de cancelación</li>
            </ul>
          </div>

          <button
            onClick={onCompleteRedirect}
            className="w-full min-h-[44px] bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Ir al Panel de Control</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Left side progress banner */}
      <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-line p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-forest text-white rounded-lg flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="font-display font-extrabold text-lg text-ink tracking-tight">StayFlow</span>
            <span className="text-[10px] text-forest font-extrabold bg-forest/10 px-1.5 py-0.5 rounded-full tracking-wide">SAAS</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-[#344139] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-forest" />
              <span>Paso a Paso</span>
            </h2>

            <div className="space-y-1">
              {stepsMetadata.map((m) => {
                const isActive = currentStep === m.step;
                const canJump = m.step < currentStep || m.isSaved || stepsMetadata.slice(0, m.step - 1).every(prev => prev.isSaved);
                return (
                  <button
                    key={m.step}
                    type="button"
                    onClick={() => canJump && jumpToStep(m.step)}
                    disabled={!canJump}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-left group ${
                      isActive 
                        ? 'bg-forest/5 border border-forest text-forest shadow-2xs font-bold' 
                        : canJump
                          ? 'border border-transparent text-ink hover:bg-slate-50 cursor-pointer'
                          : 'border border-transparent text-muted cursor-not-allowed opacity-40'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-forest text-white' 
                        : m.isSaved 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-muted'
                    }`}>
                      {m.isSaved && !isActive ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <m.icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] leading-tight font-bold truncate">Paso {m.step}: {m.label}</span>
                      <span className="block text-[9px] text-muted truncate">{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Support helper card */}
        <div className="mt-8 p-4 border border-line rounded-2xl bg-slate-50 text-[10px] text-muted leading-relaxed space-y-1">
          <p className="font-bold text-ink">¿Necesitas ayuda?</p>
          <p>
            StayFlow cuenta con asistentes automatizados en cada paso. Si tienes dudas, ponte en contacto con nuestro equipo de arquitectura SaaS.
          </p>
        </div>
      </div>

      {/* Right side form block */}
      <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-bold text-forest uppercase tracking-wider">Asistente de Configuración Inicial</span>
              <h1 className="font-display font-extrabold text-2xl text-ink mt-0.5">Lanzamiento de Nuevo Complejo</h1>
              <p className="text-xs text-muted mt-0.5">Configuración básica para {resort.name} (ID: {resort.id})</p>
            </div>
            
            <div className="text-xs font-bold text-[#2d6a4f] bg-forest/5 px-3.5 py-1.5 rounded-xl border border-green-100/50">
              Progreso: {Math.round(((currentStep - 1) / 5) * 100)}%
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-line shadow-sm">
            {currentStep === 1 && (
              <Step1ResortData
                initialData={progress.stepData.step1}
                onSave={handleStepSave}
              />
            )}
            {currentStep === 2 && (
              <Step2Contact
                initialData={progress.stepData.step2}
                onSave={handleStepSave}
                onBack={() => jumpToStep(1)}
              />
            )}
            {currentStep === 3 && (
              <Step3Accommodation
                initialData={progress.stepData.step3}
                onSave={handleStepSave}
                onBack={() => jumpToStep(2)}
              />
            )}
            {currentStep === 4 && (
              <Step4Rates
                initialData={progress.stepData.step4}
                onSave={handleStepSave}
                onBack={() => jumpToStep(3)}
              />
            )}
            {currentStep === 5 && (
              <Step5Website
                initialData={progress.stepData.step5}
                onSave={handleStepSave}
                onBack={() => jumpToStep(4)}
              />
            )}
            {currentStep === 6 && (
              <Step6Summary
                progress={progress}
                onComplete={handleFinalPublish}
                onBack={() => jumpToStep(5)}
              />
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
export default OnboardingWizardPage;
