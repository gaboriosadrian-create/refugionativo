import React from 'react';
import { Home, House, CalendarDays, Mountain, MapPin } from 'lucide-react';
import { useSettings } from '../../modules/settings/contexts/SettingsContext';

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  const { terminology } = useSettings();

  const navItems = [
    { key: 'home', label: 'Inicio', icon: Home },
    { key: 'cabins', label: terminology.plural, icon: House },
    { key: 'booking', label: 'Reservas', icon: CalendarDays },
    { key: 'activities', label: 'Actividades', icon: Mountain },
    { key: 'location', label: 'Ubicación', icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-[480px] md:bottom-7 border-t border-forest/8 bg-white/94 px-2 py-2 pb-safe shadow-[0_-10px_30px_rgba(24,39,31,0.1)] backdrop-blur-[16px] md:rounded-b-[31px]">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl cursor-pointer transition-all ${
                isActive 
                  ? 'bg-sage text-forest font-semibold' 
                  : 'text-[#7a827e] hover:text-forest hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
