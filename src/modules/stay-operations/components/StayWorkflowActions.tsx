import React, { useState } from 'react';
import { 
  Check, 
  HelpCircle, 
  UserCheck, 
  Key, 
  Home, 
  LogOut, 
  CheckCircle2, 
  AlertOctagon, 
  XCircle, 
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Booking } from '../../../types';
import { useStayOperations } from '../hooks/useStayOperations';
import { StayStatus, StayTransition } from '../types';

interface StayWorkflowActionsProps {
  booking: Booking;
  onTransitionSuccess?: (updatedBooking: Booking) => void;
}

export const StayWorkflowActions: React.FC<StayWorkflowActionsProps> = ({
  booking,
  onTransitionSuccess
}) => {
  const { executeStayTransition, getAllowedTransitions, loading, error, clearError } = useStayOperations();
  const [confirmingTransition, setConfirmingTransition] = useState<StayTransition | null>(null);

  const allowedTransitions = getAllowedTransitions(booking);

  const steps: { status: StayStatus; label: string; Icon: React.ComponentType<any>; color: string }[] = [
    { status: 'pending', label: 'Pendiente', Icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { status: 'confirmed', label: 'Confirmada', Icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { status: 'checked_in', label: 'Check-in', Icon: Key, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { status: 'in_house', label: 'In-House', Icon: Home, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { status: 'checked_out', label: 'Check-out', Icon: LogOut, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { status: 'completed', label: 'Completada', Icon: CheckCircle2, color: 'text-slate-600 bg-slate-50 border-slate-200' }
  ];

  const currentStatus = booking.status as StayStatus;
  const currentStepIndex = steps.findIndex(s => s.status === currentStatus);

  const handleActionClick = (transition: StayTransition) => {
    setConfirmingTransition(transition);
  };

  const handleConfirmTransition = async () => {
    if (!confirmingTransition) return;
    try {
      const updated = await executeStayTransition(booking.id, confirmingTransition.action);
      setConfirmingTransition(null);
      if (onTransitionSuccess) {
        onTransitionSuccess(updated);
      }
    } catch (err) {
      // Error is stored in context
    }
  };

  const isTerminalState = currentStatus === 'cancelled' || currentStatus === 'no_show' || currentStatus === 'expired';

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ciclo Operativo de la Estadía
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Flujo guiado de estados y reglas de negocio para check-in y check-out.
          </p>
        </div>
        {loading && (
          <span className="text-[11px] font-bold text-forest animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-forest animate-ping" />
            Transicionando...
          </span>
        )}
      </div>

      {/* Visual Stepper */}
      {!isTerminalState ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-150 -z-10 hidden md:block" />
          
          <div className="grid grid-cols-2 md:flex md:justify-between gap-4 md:gap-2 relative z-10">
            {steps.map((step, idx) => {
              const isCurrent = step.status === currentStatus;
              const isPast = idx < currentStepIndex && currentStepIndex !== -1;
              const isFuture = idx > currentStepIndex || currentStepIndex === -1;
              
              let statusClasses = "border-slate-200 bg-white text-slate-400";
              let iconBg = "bg-slate-100 text-slate-400";
              
              if (isCurrent) {
                statusClasses = "border-forest bg-forest/5 text-forest font-bold shadow-xs scale-105 ring-2 ring-forest/10";
                iconBg = "bg-forest/10 text-forest";
              } else if (isPast) {
                statusClasses = "border-emerald-200 bg-emerald-50/20 text-emerald-700";
                iconBg = "bg-emerald-100 text-emerald-600";
              }

              return (
                <div 
                  key={step.status} 
                  className={`flex items-center gap-3 md:flex-col md:items-center md:text-center p-3 md:p-1.5 rounded-xl border md:border-0 md:bg-transparent ${
                    isCurrent ? 'border-2' : 'border-slate-150 md:border-0'
                  } ${statusClasses}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} transition-all duration-300`}>
                    {isPast ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <step.Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className={`text-xs ${isCurrent ? 'font-black' : 'font-semibold'}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-400 md:hidden mt-0.5">
                      {isCurrent ? 'Estado actual' : isPast ? 'Completado' : 'Próximamente'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          currentStatus === 'cancelled' 
            ? 'bg-rose-50 border-rose-150 text-rose-800' 
            : currentStatus === 'expired'
            ? 'bg-zinc-50 border-zinc-200 text-zinc-700'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          {currentStatus === 'cancelled' ? (
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          ) : currentStatus === 'expired' ? (
            <Clock className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          )}
          <div>
            <h5 className="font-bold text-xs">
              Estado Terminal: {currentStatus === 'cancelled' ? 'Reserva Cancelada' : currentStatus === 'expired' ? 'Reserva Expirada' : 'Pasajero No-Show'}
            </h5>
            <p className="text-[11px] mt-1 leading-relaxed opacity-90">
              Esta reserva ha finalizado su ciclo operativo por {
                currentStatus === 'cancelled' 
                  ? 'cancelación. La cabaña y las fechas han sido liberadas.' 
                  : currentStatus === 'expired'
                  ? 'expiración de cortesía por superar el límite de tiempo. Las fechas han sido liberadas.'
                  : 'falta de presentación (No-Show). Se ha liberado la disponibilidad.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Error feedback banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-150 text-rose-800 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error de Regla de Negocio</p>
            <p className="mt-0.5 text-[11px] leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={clearError} 
            className="text-[10px] font-bold uppercase text-rose-700 hover:text-rose-900 px-2 py-0.5 rounded-lg hover:bg-rose-100 shrink-0 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Quick Actions Buttons Panel */}
      {allowedTransitions.length > 0 && !loading && (
        <div className="space-y-3">
          <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Acciones de Transición Disponibles
          </h5>
          
          <div className="flex flex-wrap gap-2.5">
            {allowedTransitions.map((transition) => {
              // Custom buttons styles based on the transition action
              let btnStyle = "bg-slate-200 hover:bg-slate-300 text-slate-800";
              if (transition.action === 'confirm') {
                btnStyle = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs";
              } else if (transition.action === 'check_in') {
                btnStyle = "bg-sky-600 hover:bg-sky-700 text-white shadow-xs";
              } else if (transition.action === 'start_stay') {
                btnStyle = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs";
              } else if (transition.action === 'check_out') {
                btnStyle = "bg-purple-600 hover:bg-purple-700 text-white shadow-xs";
              } else if (transition.action === 'complete') {
                btnStyle = "bg-slate-700 hover:bg-slate-800 text-white shadow-xs";
              } else if (transition.action.startsWith('cancel')) {
                btnStyle = "border border-rose-200 hover:bg-rose-50 text-rose-700";
              } else if (transition.action.startsWith('no_show')) {
                btnStyle = "border border-slate-300 hover:bg-slate-100 text-slate-700";
              }

              return (
                <button
                  key={transition.action}
                  onClick={() => handleActionClick(transition)}
                  className={`min-h-[40px] px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer`}
                >
                  <span>{transition.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Dialog Overlays (In-line visual style) */}
      {confirmingTransition && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-in zoom-in-95 duration-150">
          <div className="flex gap-2.5">
            <HelpCircle className="w-5 h-5 text-forest shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-xs text-slate-800">
                ¿Confirmar acción: "{confirmingTransition.label}"?
              </h5>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {confirmingTransition.description}
              </p>
              <p className="text-[10px] text-red-600 font-bold mt-1 bg-red-50 p-1 px-1.5 rounded-md inline-block">
                Esta acción ejecutará reglas operativas en tiempo real.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60">
            <button
              onClick={() => setConfirmingTransition(null)}
              disabled={loading}
              className="min-h-[32px] px-3.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmTransition}
              disabled={loading}
              className="min-h-[32px] px-4 rounded-lg bg-[#1e3a2b] hover:bg-[#14281e] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Ejecutar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default StayWorkflowActions;
