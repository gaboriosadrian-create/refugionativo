import React from 'react';
import { Trees, MapPin, Clock3, Phone, Navigation } from 'lucide-react';
import { AppSettings } from '../../types';

interface LocationProps {
  settings: AppSettings | null;
}

export const Location: React.FC<LocationProps> = ({ settings }) => {
  const appName = settings?.appName || "Refugio Nativo";
  const address = settings?.address || "Camino del Bosque 1840, Patagonia Argentina";
  const locationDetails = settings?.locationDetails || "Nos encontramos en el Camino del Bosque 1840, a solo 15 minutos del centro urbano de la localidad y a 8 minutos del lago principal.";
  const hours = settings?.hours || "Recepción: todos los días, 08:00 a 22:00 hs";
  const phone = settings?.phone || "+54 9 294 555 0138";
  const googleMapsLink = settings?.googleMapsLink || "https://www.google.com/maps/search/?api=1&query=Camino+del+Bosque+1840+Patagonia";

  return (
    <div className="pb-28">
      <div className="px-5 py-6">
        <h1 className="font-display font-extrabold text-3xl text-ink">Dónde estamos</h1>
        <p className="text-muted text-sm mt-1 leading-relaxed">Un rincón natural de fácil acceso, lejos del ruido de la ciudad y cerca del lago patagónico.</p>
      </div>

      {/* Styled mockup map */}
      <div className="mx-4 mb-5 overflow-hidden rounded-[23px] border border-line bg-[#dce8db] shadow-sm">
        <div className="map-art relative h-[250px] overflow-hidden">
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            {/* Elegant Map Pin Indicator */}
            <div className="grid w-14 h-14 place-content-center bg-forest text-white rounded-full border-[5px] border-white shadow-xl animate-bounce">
              <Trees className="w-6 h-6 text-white" />
            </div>
            <div className="mt-2.5 bg-white border border-line px-3.5 py-1.5 rounded-full text-[11px] font-extrabold text-forest shadow-md">
              {appName}
            </div>
          </div>
        </div>
      </div>

      {/* How to get there details */}
      <div className="mx-4 p-5 border border-line rounded-[23px] bg-white shadow-sm space-y-4">
        <div>
          <h2 className="font-display font-bold text-xl text-ink mb-1.5">Cómo llegar</h2>
          <p className="text-muted text-xs leading-relaxed">
            {locationDetails}
          </p>
        </div>

        <div className="space-y-3.5 pt-2">
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="grid w-9 h-9 place-content-center bg-sage text-forest rounded-xl shrink-0">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="text-xs">{address}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="grid w-9 h-9 place-content-center bg-sage text-forest rounded-xl shrink-0">
              <Clock3 className="w-4 h-4" />
            </span>
            <span className="text-xs">{hours}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="grid w-9 h-9 place-content-center bg-sage text-forest rounded-xl shrink-0">
              <Phone className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono">{phone}</span>
          </div>
        </div>

        <div className="pt-3">
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-2xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 text-decoration-none"
          >
            <Navigation className="w-4 h-4" />
            Abrir en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};
