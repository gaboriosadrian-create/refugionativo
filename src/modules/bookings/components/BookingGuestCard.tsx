import React from 'react';
import { User, Phone, Mail, Globe, MessageSquare, AlertCircle } from 'lucide-react';
import { Booking } from '../../../types';

interface BookingGuestCardProps {
  booking: Booking;
}

export const BookingGuestCard: React.FC<BookingGuestCardProps> = ({ booking }) => {
  const b = booking as any;
  const adults = b.adults ?? b.guests ?? 1;
  const children = b.children ?? 0;
  const babies = b.babies ?? 0;
  const pets = b.pets ?? 0;
  const origin = b.origin || (booking.paymentMethod ? 'Directo (Web)' : 'Manual');

  return (
    <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-3.5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1e3a2b]/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-[#1e3a2b]" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-slate-800 text-sm truncate">{booking.name}</h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Huésped Principal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium truncate">{booking.phone || 'Sin teléfono'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium truncate">{booking.email || 'Sin correo electrónico'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium">Origen: <span className="text-slate-800 font-semibold">{origin}</span></span>
        </div>
      </div>

      <div className="border-t border-slate-200/60 pt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
        <div>
          Adultos: <span className="font-bold text-slate-800">{adults}</span>
        </div>
        {children > 0 && (
          <div>
            Niños: <span className="font-bold text-slate-800">{children}</span>
          </div>
        )}
        {babies > 0 && (
          <div>
            Bebés: <span className="font-bold text-slate-800">{babies}</span>
          </div>
        )}
        {pets > 0 && (
          <div>
            Mascotas: <span className="font-bold text-slate-800">{pets}</span>
          </div>
        )}
      </div>

      {booking.notes && (
        <div className="bg-white rounded-lg p-2.5 border border-slate-100 flex gap-2 text-xs text-slate-600">
          <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-700 block">Notas del Huésped:</span>
            <p className="italic text-slate-500 leading-relaxed">{booking.notes}</p>
          </div>
        </div>
      )}

      {b.internalRemarks && (
        <div className="bg-rose-50/50 rounded-lg p-2.5 border border-rose-100/60 flex gap-2 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-rose-800 block">Observaciones Internas:</span>
            <p className="text-rose-700 font-medium leading-relaxed">{b.internalRemarks}</p>
          </div>
        </div>
      )}
    </div>
  );
};
