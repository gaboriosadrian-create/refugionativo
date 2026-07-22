import React, { useState, useMemo } from 'react';
import { Plus, Sliders, Calendar, DollarSign, Users, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { Booking, Cabin } from '../../../types';
import { BookingsTable, SortKey, SortOrder } from './BookingsTable';
import { BookingFilters } from './BookingFilters';
import { BookingForm } from './BookingForm';
import { BookingDetailsDrawer } from './BookingDetailsDrawer';
import { BookingService } from '../services/BookingService';
import { useResort } from '../../../shared/contexts/ResortContext';

interface BookingsManagerProps {
  bookings: Booking[];
  cabins: Cabin[];
}

export const BookingsManager: React.FC<BookingsManagerProps> = ({
  bookings,
  cabins
}) => {
  const { resort } = useResort();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [cabinFilter, setCabinFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals & Panels State
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState<Booking | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Status / Feedback alerts
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Expiration config
  const [expirationMinutes, setExpirationMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('stayflow_expiration_minutes');
    return saved ? Number(saved) : 30;
  });
  const [isProcessingExpiration, setIsProcessingExpiration] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleProcessExpiration = async () => {
    if (!resort) return;
    setIsProcessingExpiration(true);
    try {
      const expiredCount = await BookingService.expirePendingBookings(resort.id, expirationMinutes);
      if (expiredCount > 0) {
        showNotification(`Éxito: Se procesaron ${expiredCount} reservas vencidas. Su estado cambió a "Expirada" y la disponibilidad fue liberada automáticamente.`, 'success');
      } else {
        showNotification('No se encontraron reservas pendientes que superen el límite de tiempo configurado.', 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al procesar la expiración', 'error');
    } finally {
      setIsProcessingExpiration(false);
    }
  };

  const handleSaveExpirationMinutes = (mins: number) => {
    setExpirationMinutes(mins);
    localStorage.setItem('stayflow_expiration_minutes', String(mins));
    showNotification(`Límite de tiempo de expiración configurado en ${mins} minutos.`, 'success');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setCabinFilter('all');
    setOriginFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // 1. Searching, Filtering, and Sorting logic
  const processedBookings = useMemo(() => {
    let result = [...bookings];

    // Search term matching
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(b => {
        const nameMatch = b.name.toLowerCase().includes(q);
        const emailMatch = b.email?.toLowerCase().includes(q) || false;
        const phoneMatch = b.phone.includes(q);
        const idMatch = String(b.id).includes(q);
        return nameMatch || emailMatch || phoneMatch || idMatch;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      result = result.filter(b => (b.paymentStatus || 'pending') === paymentFilter);
    }

    // Cabin filter
    if (cabinFilter !== 'all') {
      const cabinIdNum = Number(cabinFilter);
      result = result.filter(b => Number(b.cabinId) === cabinIdNum);
    }

    // Origin filter
    if (originFilter !== 'all') {
      result = result.filter(b => {
        const bOrigin = (b as any).origin || (b.paymentMethod ? 'Directo (Web)' : 'Manual');
        return bOrigin === originFilter;
      });
    }

    // Dates filter range (overlaps checkIn/checkOut boundaries)
    if (startDate !== '') {
      result = result.filter(b => b.checkIn >= startDate);
    }
    if (endDate !== '') {
      result = result.filter(b => b.checkOut <= endDate);
    }

    // Sort order
    result.sort((a, b) => {
      let valA: any = a[sortKey as keyof Booking] ?? '';
      let valB: any = b[sortKey as keyof Booking] ?? '';

      // Handle case-insensitive strings
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [bookings, searchTerm, statusFilter, paymentFilter, cabinFilter, originFilter, startDate, endDate, sortKey, sortOrder]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = processedBookings.length;
    const confirmed = processedBookings.filter(b => b.status === 'confirmed').length;
    const pending = processedBookings.filter(b => b.status === 'pending').length;
    const revenue = processedBookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return { total, confirmed, pending, revenue };
  }, [processedBookings]);

  // 2. Sorting click handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // 3. Actions / operations using BookingService
  const handleConfirmStatus = async (id: number) => {
    if (!resort) return;
    try {
      await BookingService.updateBookingStatus(resort.id, id, 'confirmed', 'Backoffice');
      showNotification(`La reserva #${id} ha sido confirmada exitosamente.`);
    } catch (err: any) {
      showNotification(err.message || 'Error al confirmar la reserva', 'error');
    }
  };

  const handleCancelStatus = async (id: number) => {
    if (!resort) return;
    try {
      await BookingService.cancelBooking(resort.id, id, 'Backoffice');
      showNotification(`La reserva #${id} ha sido cancelada y las fechas liberadas.`);
    } catch (err: any) {
      showNotification(err.message || 'Error al cancelar la reserva', 'error');
    }
  };

  const handleReopenStatus = async (id: number) => {
    if (!resort) return;
    try {
      await BookingService.updateBookingStatus(resort.id, id, 'pending', 'Backoffice');
      showNotification(`La reserva #${id} ha sido reabierta en estado Pendiente.`);
    } catch (err: any) {
      showNotification(err.message || 'Error al reabrir la reserva', 'error');
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!resort) return;
    try {
      await BookingService.deleteBooking(resort.id, id, 'Backoffice');
      showNotification(`La reserva #${id} y sus bloqueos fueron eliminados permanentemente.`);
      if (selectedBookingForDrawer?.id === id) {
        setSelectedBookingForDrawer(null);
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar la reserva', 'error');
    }
  };

  const handleOpenEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setIsDuplicate(false);
    setIsFormOpen(true);
  };

  const handleOpenDuplicate = (booking: Booking) => {
    setEditingBooking(booking);
    setIsDuplicate(true);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (payload: any) => {
    if (!resort) return;

    if (editingBooking && !isDuplicate) {
      // Edit mode
      await BookingService.updateBooking(resort.id, editingBooking.id, payload, 'Backoffice');
      showNotification(`La reserva #${editingBooking.id} se actualizó con éxito.`);
    } else {
      // Create or Duplicate mode
      const newBooking = await BookingService.createBooking(resort.id, payload, 'Backoffice');
      showNotification(`Se creó la reserva #${newBooking.id} correctamente.`);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      
      {/* Notifications banner */}
      {notification && (
        <div className={`fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 rounded-2xl p-4 shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 ${notification.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span className="text-xs font-bold leading-relaxed">{notification.message}</span>
        </div>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Administración de Reservas</span>
            <span className="inline-block bg-forest/10 text-forest text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Backoffice
            </span>
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Cree, edite, cancele y audite todas las reservas del complejo con validación en tiempo real.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBooking(null);
            setIsDuplicate(false);
            setIsFormOpen(true);
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1e3a2b] hover:bg-[#14281e] text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Reserva</span>
        </button>
      </div>

      {/* Booking Engine Admin Strip */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-[#1e3a2b] mt-0.5 shrink-0 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Booking Engine Profesional (SP 6.2)</h3>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Configure la expiración parametrizable y libere disponibilidad automáticamente de reservas vencidas.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">Límite Expiración:</span>
            <select
              value={expirationMinutes}
              onChange={(e) => handleSaveExpirationMinutes(Number(e.target.value))}
              className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none shadow-xs"
            >
              <option value={1}>1 Minuto (Pruebas)</option>
              <option value={5}>5 Minutos</option>
              <option value={15}>15 Minutos</option>
              <option value={30}>30 Minutos</option>
              <option value={60}>1 Hora</option>
            </select>
          </div>
          <button
            onClick={handleProcessExpiration}
            disabled={isProcessingExpiration}
            className="h-9 px-4 rounded-lg bg-[#1e3a2b] hover:bg-[#14281e] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            {isProcessingExpiration ? (
              <span>Procesando...</span>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Procesar Expiraciones</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reservas Filtradas</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-850">{metrics.total}</p>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Registros en grilla</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Confirmadas</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{metrics.confirmed}</p>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Activas / Bloqueadas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pendientes</span>
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{metrics.pending}</p>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Esperando acción</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ingresos Totales</span>
            <DollarSign className="w-4 h-4 text-forest" />
          </div>
          <p className="text-2xl font-black text-forest">{formatPrice(metrics.revenue)}</p>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Excluyendo cancelaciones</span>
        </div>
      </div>

      {/* Advanced Filters block */}
      <BookingFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
        cabinFilter={cabinFilter}
        onCabinFilterChange={setCabinFilter}
        originFilter={originFilter}
        onOriginFilterChange={setOriginFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        cabins={cabins}
        onReset={handleResetFilters}
      />

      {/* Main reservation table */}
      <BookingsTable
        bookings={processedBookings}
        cabins={cabins}
        onViewDetails={setSelectedBookingForDrawer}
        onEdit={handleOpenEdit}
        onDuplicate={handleOpenDuplicate}
        onConfirmStatus={handleConfirmStatus}
        onCancelStatus={handleCancelStatus}
        onReopenStatus={handleReopenStatus}
        onDeleteBooking={handleDeleteBooking}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Create / Edit Form Drawer overlay */}
      {isFormOpen && (
        <BookingForm
          booking={editingBooking}
          cabins={cabins}
          isDuplicate={isDuplicate}
          onClose={() => {
            setIsFormOpen(false);
            setEditingBooking(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Detail Sliding Drawer */}
      {selectedBookingForDrawer && (
        <BookingDetailsDrawer
          booking={selectedBookingForDrawer}
          cabins={cabins}
          onClose={() => setSelectedBookingForDrawer(null)}
        />
      )}

    </div>
  );
};
