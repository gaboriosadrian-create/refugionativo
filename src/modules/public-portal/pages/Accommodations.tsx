import React, { useState } from 'react';
import { useWebsite } from '../contexts/WebsiteContext';
import { Star, Users, MapPin, Sparkles } from 'lucide-react';

export const Accommodations: React.FC = () => {
  const { settings, accommodations, navigateTo } = useWebsite();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!settings) return null;

  // Filter accommodations by category
  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'couples', label: 'Parejas' },
    { id: 'family', label: 'Familias' },
    { id: 'luxury', label: 'Premium' }
  ];

  const filtered = accommodations.filter(acc => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'couples') return (acc as any).category === 'couples';
    if (activeCategory === 'family') return (acc as any).category === 'family';
    if (activeCategory === 'luxury') return (acc as any).category === 'luxury' || (acc as any).featured;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 pb-24">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <h1 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight leading-none">
          Nuestros Alojamientos
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          Diseñados para mimetizarse con el entorno natural sin renunciar al máximo confort. Encuentra el refugio perfecto para tus próximas vacaciones en la Patagonia.
        </p>
      </div>

      {/* Filter Categories */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-none border-b border-slate-100">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-none min-h-[40px] px-5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'border-[var(--public-primary)] bg-[var(--public-primary)] text-white'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <p className="text-slate-400 font-bold text-sm">No se encontraron alojamientos disponibles en esta categoría.</p>
          <button 
            onClick={() => setActiveCategory('all')}
            className="text-xs font-bold text-[var(--public-primary)] hover:underline"
          >
            Ver todos los alojamientos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((acc) => {
            const formattedPrice = new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: settings.currency || 'ARS',
              maximumFractionDigits: 0
            }).format(acc.pricing?.basePrice || 0);

            const maxCapacity = acc.capacity?.maxGuests || (Number(acc.capacity?.adults || 0) + Number(acc.capacity?.children || 0));

            return (
              <div 
                key={acc.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full group"
              >
                <div 
                  onClick={() => navigateTo('accommodation-detail', acc.slug)}
                  className="relative overflow-hidden aspect-[16/11] cursor-pointer"
                >
                  <img 
                    src={acc.gallery?.coverImage || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'} 
                    alt={acc.name} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-all duration-500"
                    loading="lazy"
                  />
                  {acc.featured && (
                    <span className="absolute top-4 left-4 bg-orange text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Recomendada
                    </span>
                  )}
                  {acc.capacity?.pets && (
                    <span className="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-md tracking-wider">
                      Pet Friendly
                    </span>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 
                        onClick={() => navigateTo('accommodation-detail', acc.slug)}
                        className="font-display font-black text-xl text-slate-900 hover:text-[var(--public-primary)] cursor-pointer"
                      >
                        {acc.name}
                      </h3>
                      <span className="flex items-center gap-1 text-amber-500 font-extrabold text-xs flex-shrink-0 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        5.0
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Hasta {maxCapacity} personas
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Categoría: {(acc as any).category === 'couples' ? 'Parejas' : (acc as any).category === 'family' ? 'Familias' : 'Estándar'}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 pt-1">
                      {acc.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Tarifa base desde</span>
                      <span className="font-display font-black text-lg text-[var(--public-primary)]">
                        {formattedPrice} <span className="text-xs font-normal text-slate-500">/ noche</span>
                      </span>
                    </div>
                    <button 
                      onClick={() => navigateTo('accommodation-detail', acc.slug)}
                      className="inline-flex min-h-[40px] items-center justify-center px-4.5 rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Ver Ficha Completa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
