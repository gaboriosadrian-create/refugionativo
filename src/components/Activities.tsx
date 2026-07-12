import React from 'react';
import { Mountain, Flame, Compass, Eye } from 'lucide-react';
import { Activity } from '../types';

export const Activities: React.FC = () => {
  const activities: Activity[] = [
    {
      id: 1,
      title: "Senderismo guiado",
      description: "Recorre senderos entre bosques milenarios, miradores espectaculares y arroyos cristalinos de montaña.",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=82"
    },
    {
      id: 2,
      title: "Noches de fogón",
      description: "Disfruta de cielos limpios y estrellados junto a un cálido fuego patagónico con fogones grupales organizados.",
      image: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=900&q=82"
    },
    {
      id: 3,
      title: "Kayak y pesca",
      description: "Explora la inmensidad del lago a remo o disfruta de una pacífica jornada de pesca recreativa con guías locales.",
      image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=82"
    },
    {
      id: 4,
      title: "Avistamiento de aves",
      description: "Descubre especies nativas exclusivas del ecosistema andino-patagónico con telescopios y lentes profesionales.",
      image: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=900&q=82"
    }
  ];

  return (
    <div className="pb-28">
      <div className="px-5 py-6">
        <h1 className="font-display font-extrabold text-3xl text-ink">Actividades en la zona</h1>
        <p className="text-muted text-sm mt-1 leading-relaxed">Experiencias y paseos diseñados para conectar con la Patagonia durante todo el año.</p>
      </div>

      <div className="grid gap-5 px-4">
        {activities.map((act) => (
          <article 
            key={act.id}
            className="activity-card relative min-h-[196px] overflow-hidden rounded-[23px] text-white shadow-md group cursor-default"
          >
            <img 
              src={act.image} 
              alt={act.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              <h3 className="font-display font-bold text-xl mb-1.5">{act.title}</h3>
              <p className="text-white/85 text-xs leading-relaxed">{act.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
