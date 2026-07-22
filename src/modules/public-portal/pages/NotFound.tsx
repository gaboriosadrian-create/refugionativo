import React from 'react';
import { useWebsite } from '../contexts/WebsiteContext';
import { Compass, ArrowRight } from 'lucide-react';

export const NotFound: React.FC = () => {
  const { navigateTo } = useWebsite();

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32 flex flex-col items-center justify-center text-center space-y-6">
      <div className="p-4 bg-orange/10 text-orange rounded-full animate-bounce">
        <Compass className="w-12 h-12" />
      </div>
      
      <div className="space-y-2">
        <h1 className="font-display font-black text-6xl text-slate-900 leading-none">404</h1>
        <h2 className="font-display font-bold text-xl text-slate-800">Has perdido el rumbo en el bosque</h2>
        <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed font-sans">
          La página que estás intentando buscar no existe, ha cambiado de ubicación o se encuentra temporalmente suspendida.
        </p>
      </div>

      <div className="pt-4">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-xs px-6 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span>Regresar al Inicio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
