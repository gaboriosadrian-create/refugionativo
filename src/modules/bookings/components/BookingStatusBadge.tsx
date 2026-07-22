import React from 'react';

interface BookingStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'in_house' | 'checked_out' | 'completed' | 'no_show' | 'pending_approval' | 'expired';
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status }) => {
  const statusLabels: Record<string, string> = {
    pending_approval: "Por Aprobar",
    pending: "Pendiente",
    confirmed: "Confirmada",
    checked_in: "Check-in",
    in_house: "En Cabaña (In-House)",
    checked_out: "Check-out",
    completed: "Completada",
    cancelled: "Cancelada",
    no_show: "No-Show",
    expired: "Expirada"
  };

  const statusColors: Record<string, string> = {
    pending_approval: "bg-orange/10 text-orange border-orange/30",
    pending: "bg-amber-50 text-amber-800 border-amber-200/60",
    confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    checked_in: "bg-sky-50 text-sky-800 border-sky-200/60",
    in_house: "bg-indigo-50 text-indigo-800 border-indigo-200/60",
    checked_out: "bg-purple-50 text-purple-800 border-purple-200/60",
    completed: "bg-slate-50 text-slate-800 border-slate-200/60",
    cancelled: "bg-rose-50 text-rose-800 border-rose-200/60",
    no_show: "bg-gray-150 text-gray-700 border-gray-300/60",
    expired: "bg-zinc-100 text-zinc-600 border-zinc-200"
  };

  const dotColors: Record<string, string> = {
    pending_approval: "bg-orange",
    pending: "bg-amber-500",
    confirmed: "bg-emerald-500",
    checked_in: "bg-sky-500",
    in_house: "bg-indigo-500",
    checked_out: "bg-purple-500",
    completed: "bg-slate-500",
    cancelled: "bg-rose-500",
    no_show: "bg-gray-500",
    expired: "bg-zinc-400"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[status] || 'bg-slate-400'}`} />
      {statusLabels[status] || status}
    </span>
  );
};

interface PaymentStatusBadgeProps {
  status: 'pending' | 'paid' | 'refunded';
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    refunded: "Reembolsado"
  };

  const colors: Record<string, string> = {
    pending: "bg-slate-50 text-slate-600 border-slate-200",
    paid: "bg-blue-50 text-blue-700 border-blue-200",
    refunded: "bg-purple-50 text-purple-700 border-purple-200"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${colors[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
};
