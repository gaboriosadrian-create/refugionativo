import React from 'react';
import { Star } from 'lucide-react';
import { Cabin } from '../../types';

interface CabinCardProps {
  cabin: Cabin;
  onOpen: (id: number) => void;
}

export const CabinCard: React.FC<CabinCardProps> = ({ cabin, onOpen }) => {
  const finalPrice = Math.round(cabin.price * (1 - (cabin.discount || 0) / 100));

  return (
    <article 
      onClick={() => onOpen(cabin.id)}
      className="group relative flex flex-col overflow-hidden rounded-[21px] border border-line bg-white shadow-[0_7px_20px_rgba(25,47,36,0.07)] hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
      tabIndex={0}
      aria-label={`Ver cabaña ${cabin.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpen(cabin.id);
        }
      }}
    >
      <div className="relative overflow-hidden aspect-[4/3] w-full">
        <img 
          src={cabin.image} 
          alt={cabin.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80';
          }}
        />
        {cabin.offer && (
          <span className="absolute top-2.5 left-2.5 max-w-[calc(100%-18px)] rounded-full bg-orange px-2.5 py-1 text-[9px] font-extrabold uppercase text-white shadow-sm overflow-hidden text-ellipsis whitespace-nowrap">
            {cabin.offer}
          </span>
        )}
        {cabin.discount > 0 && (
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-extrabold text-forest">
            -{cabin.discount}%
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3.5">
        <h3 className="font-display font-bold text-base text-ink line-clamp-1 mb-1">{cabin.name}</h3>
        <p className="text-muted text-[11px] leading-relaxed line-clamp-2 mb-3 flex-1">{cabin.description}</p>
        
        <div className="flex items-center justify-between border-t border-line/60 pt-2.5 mt-auto">
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-base text-forest">
              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(finalPrice)}
            </span>
            <span className="text-[9px] text-muted font-medium mt-0.5">por noche</span>
          </div>
          <span className="flex items-center gap-0.5 text-warning font-bold text-xs">
            <Star className="w-3 h-3 text-warning fill-warning" />
            {cabin.rating ? cabin.rating.toFixed(1) : "5.0"}
          </span>
        </div>
      </div>
    </article>
  );
};
