import React, { useState } from 'react';
import { MoreVertical, Check, X, Copy, Edit2, Trash2, ArrowUpRight, Key, Home, LogOut, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Booking } from '../../../types';
import { useStayOperations } from '../../stay-operations';

interface BookingActionsProps {
  booking: Booking;
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
  onReopen: (id: number) => void;
  onEdit: (booking: Booking) => void;
  onDuplicate: (booking: Booking) => void;
  onDelete: (id: number) => void;
}

export const BookingActions: React.FC<BookingActionsProps> = ({
  booking,
  onConfirm,
  onCancel,
  onReopen,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { executeStayTransition } = useStayOperations();

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (e: React.MouseEvent, actionFn: () => void) => {
    e.stopPropagation();
    actionFn();
    setIsOpen(false);
  };

  const handleStayTransition = async (e: React.MouseEvent, action: string, label: string) => {
    e.stopPropagation();
    setIsOpen(false);
    try {
      await executeStayTransition(booking.id, action);
    } catch (err: any) {
      alert(`Error al ejecutar "${label}": ${err.message || err}`);
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative shrink-0">
      <button
        onClick={toggleDropdown}
        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          
          {/* Confirmed Stay Transitions */}
          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={(e) => handleStayTransition(e, 'check_in', 'Procesar Check-In')}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 flex items-center gap-2 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-sky-500" />
                <span>Procesar Check-In</span>
              </button>

              <button
                onClick={(e) => handleStayTransition(e, 'no_show', 'Marcar No-Show')}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />
                <span>Marcar No-Show</span>
              </button>
            </>
          )}

          {/* Checked-In Transitions */}
          {booking.status === 'checked_in' && (
            <>
              <button
                onClick={(e) => handleStayTransition(e, 'start_stay', 'Iniciar Hospedaje')}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ingresar a Cabaña</span>
              </button>

              <button
                onClick={(e) => handleStayTransition(e, 'check_out', 'Procesar Check-Out')}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-purple-500" />
                <span>Procesar Check-Out</span>
              </button>
            </>
          )}

          {/* In-House Transitions */}
          {booking.status === 'in_house' && (
            <button
              onClick={(e) => handleStayTransition(e, 'check_out', 'Procesar Check-Out')}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-purple-500" />
              <span>Procesar Check-Out</span>
            </button>
          )}

          {/* Checked-Out Transitions */}
          {booking.status === 'checked_out' && (
            <button
              onClick={(e) => handleStayTransition(e, 'complete', 'Completar Estadía')}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Completar Estadía</span>
            </button>
          )}

          {/* No Show for Pending */}
          {booking.status === 'pending' && (
            <button
              onClick={(e) => handleStayTransition(e, 'no_show_pending', 'Marcar No-Show')}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />
              <span>Marcar No-Show</span>
            </button>
          )}

          {(booking.status === 'pending' || booking.status === 'pending_approval') && (
            <button
              onClick={(e) => handleAction(e, () => onConfirm(booking.id))}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50/70 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar Reserva</span>
            </button>
          )}

          {booking.status !== 'cancelled' && (
            <button
              onClick={(e) => handleAction(e, () => onCancel(booking.id))}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50/70 flex items-center gap-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Anular / Cancelar</span>
            </button>
          )}

          {booking.status === 'cancelled' && (
            <button
              onClick={(e) => handleAction(e, () => onReopen(booking.id))}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Reabrir Reserva</span>
            </button>
          )}

          <div className="border-t border-slate-100 my-1" />

          <button
            onClick={(e) => handleAction(e, () => onEdit(booking))}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Editar Reserva</span>
          </button>

          <button
            onClick={(e) => handleAction(e, () => onDuplicate(booking))}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Duplicar Reserva</span>
          </button>

          <div className="border-t border-slate-100 my-1" />

          <button
            onClick={(e) => handleAction(e, () => {
              if (window.confirm('¿Estás seguro de que deseas eliminar esta reserva de forma permanente? Esta acción no se puede deshacer.')) {
                onDelete(booking.id);
              }
            })}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Eliminar (Físico)</span>
          </button>
        </div>
      )}
    </div>
  );
};
