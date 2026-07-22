import React, { createContext, useContext, useState, useEffect } from 'react';
import { OnboardingProgress } from '../types';
import { OnboardingService } from '../services/OnboardingService';
import { useResort } from '../../../shared/contexts/ResortContext';
import { Logger } from '../../../core/logger/Logger';

interface OnboardingContextType {
  progress: OnboardingProgress | null;
  loading: boolean;
  error: string | null;
  saveStep: (step: number, data: any) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  jumpToStep: (step: number) => Promise<void>;
  reloadProgress: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = async () => {
    if (!resort) {
      setProgress(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await OnboardingService.getProgress(resort.id);
      setProgress(data);
    } catch (err) {
      Logger.error(`Error loading onboarding progress in context:`, err);
      setError('No se pudo cargar el progreso del asistente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [resort?.id]);

  const saveStep = async (step: number, data: any) => {
    if (!resort) throw new Error('No hay un complejo activo seleccionado.');
    setError(null);
    try {
      let updatedProgress: OnboardingProgress;
      switch (step) {
        case 1:
          updatedProgress = await OnboardingService.saveStep1(resort.id, data);
          break;
        case 2:
          updatedProgress = await OnboardingService.saveStep2(resort.id, data);
          break;
        case 3:
          updatedProgress = await OnboardingService.saveStep3(resort.id, data);
          break;
        case 4:
          updatedProgress = await OnboardingService.saveStep4(resort.id, data);
          break;
        case 5:
          updatedProgress = await OnboardingService.saveStep5(resort.id, data);
          break;
        default:
          throw new Error('Paso inválido.');
      }
      setProgress(updatedProgress);
    } catch (err) {
      Logger.error(`Error saving step ${step}:`, err);
      const errMsg = err instanceof Error ? err.message : 'Error al guardar los datos del paso.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const completeOnboarding = async () => {
    if (!resort) throw new Error('No hay un complejo activo seleccionado.');
    setError(null);
    setLoading(true);
    try {
      const completedProgress = await OnboardingService.publishAndComplete(resort.id);
      setProgress(completedProgress);
    } catch (err) {
      Logger.error('Error completing onboarding:', err);
      const errMsg = err instanceof Error ? err.message : 'Error al completar el asistente de onboarding.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const jumpToStep = async (step: number) => {
    if (!resort || !progress) return;
    if (step < 1 || step > 6) return;
    
    // Only allow jumping forward to steps we have already saved or are up next
    if (step > progress.currentStep && !progress.stepsSaved[`step${step - 1}` as keyof typeof progress.stepsSaved]) {
      return;
    }

    try {
      const updatedProgress = await OnboardingService.updateCurrentStep(resort.id, step);
      setProgress(updatedProgress);
    } catch (err) {
      Logger.error(`Error jumping to step ${step}:`, err);
      // Just visually update the step if we can't save (or let it go quietly)
      setProgress(prev => prev ? { ...prev, currentStep: step } : null);
    }
  };

  return (
    <OnboardingContext.Provider 
      value={{ 
        progress, 
        loading, 
        error, 
        saveStep, 
        completeOnboarding, 
        jumpToStep,
        reloadProgress: loadProgress 
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;
