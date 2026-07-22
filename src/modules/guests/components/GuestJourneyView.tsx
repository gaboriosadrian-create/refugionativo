import React, { useState } from 'react';
import { GuestJourneyDashboard } from './GuestJourneyDashboard';
import { GuestJourneyPortal } from './GuestJourneyPortal';
import { Smartphone, ShieldCheck, HelpCircle, X } from 'lucide-react';

export const GuestJourneyView: React.FC = () => {
  const [activeSimBookingId, setActiveSimBookingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Title & Introduction Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-emerald-600 animate-pulse" />
            Digital Guest Journey & Check-in
          </h1>
          <p className="text-sm text-gray-500">
            Administre pre check-ins, contratos firmados, copias de identificación y encuestas de satisfacción.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-100">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Sincronizado con Guest CRM & Booking Engine</span>
        </div>
      </div>

      {/* Main Layout: Dashboard on Left, Interactive Simulator on Right (if active) */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 w-full">
          <GuestJourneyDashboard 
            onSelectBookingForPortal={(bId) => setActiveSimBookingId(bId)} 
          />
        </div>

        {activeSimBookingId && (
          <div className="w-full xl:w-[450px] bg-white p-5 rounded-3xl border border-gray-100 shadow-xl flex flex-col items-center relative shrink-0">
            {/* Simulator Header controls */}
            <div className="w-full flex justify-between items-center pb-3 border-b border-gray-50 mb-4 text-xs">
              <span className="font-bold text-gray-700 flex items-center gap-1">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                Simulador del Huésped
              </span>
              <button 
                onClick={() => setActiveSimBookingId(null)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-colors"
                title="Cerrar Simulador"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <GuestJourneyPortal 
              bookingId={activeSimBookingId} 
              onClose={() => setActiveSimBookingId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
