import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CreditCard, 
  Coins, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  X, 
  Clock, 
  ArrowUpDown, 
  Sliders,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { Payment, PaymentStatus } from '../types';
import { PaymentService } from '../services/PaymentService';
import { useResort } from '../../../shared/contexts/ResortContext';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { Booking, Cabin } from '../../../types';
import { useAccommodations } from '../../../shared/hooks/useAccommodations';

export const PaymentsManager: React.FC = () => {
  const { resort } = useResort();
  const { accommodations } = useAccommodations();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'createdAt' | 'amount'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Drawer / Details State
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRefunding, setIsRefunding] = useState<boolean>(false);
  
  const resortId = resort?.id || 'default-resort';

  const loadData = async () => {
    setLoading(true);
    try {
      const pmts = await PaymentService.getPayments(resortId);
      const bks = await bookingRepository.getAll(resortId);
      setPayments(pmts);
      setBookings(bks);
    } catch (err) {
      console.error('Error loading payments manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resortId]);

  // Handle Refund Action
  const handleRefund = async (paymentId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas reembolsar este pago? Esta acción es irreversible, registrará un evento de reembolso y actualizará el estado financiero de la reserva.')) {
      return;
    }
    setIsRefunding(true);
    try {
      const updated = await PaymentService.refundPayment(resortId, paymentId);
      if (updated) {
        setSelectedPayment(updated);
        await loadData();
      }
    } catch (err) {
      console.error('Error refunding payment:', err);
      alert('Error al procesar el reembolso.');
    } finally {
      setIsRefunding(false);
    }
  };

  // Helper to map booking info
  const getBookingDetails = (bookingId: number) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return { guestName: 'Desconocido', cabinName: 'Alojamiento Desconocido', dates: 'N/A' };
    const cabin = accommodations.find(c => c.id === b.cabinId);
    return {
      guestName: b.name,
      cabinName: cabin ? cabin.name : `Alojamiento #${b.cabinId}`,
      dates: `${b.checkIn} al ${b.checkOut}`
    };
  };

  // Status Badge Mapper
  const getStatusBadge = (status: PaymentStatus) => {
    const base = "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border";
    switch (status) {
      case 'approved':
        return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'pending':
        return `${base} bg-amber-50 text-amber-700 border-amber-200`;
      case 'processing':
        return `${base} bg-blue-50 text-blue-700 border-blue-200`;
      case 'rejected':
        return `${base} bg-rose-50 text-rose-700 border-rose-200`;
      case 'cancelled':
        return `${base} bg-slate-50 text-slate-500 border-slate-200`;
      case 'expired':
        return `${base} bg-purple-50 text-purple-700 border-purple-200`;
      case 'refunded':
        return `${base} bg-cyan-50 text-cyan-700 border-cyan-200`;
      default:
        return `${base} bg-slate-50 text-slate-600 border-slate-200`;
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'processing': return 'En Proceso';
      case 'rejected': return 'Rechazado';
      case 'cancelled': return 'Cancelado';
      case 'expired': return 'Expirado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  // Sort and Filter logic
  const filteredAndSortedPayments = React.useMemo(() => {
    let result = [...payments];

    // 1. Search Query (id, guest name, booking id)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => {
        const bk = getBookingDetails(p.bookingId);
        return (
          p.id.toLowerCase().includes(q) ||
          String(p.bookingId).includes(q) ||
          (p.externalId && p.externalId.toLowerCase().includes(q)) ||
          bk.guestName.toLowerCase().includes(q) ||
          bk.cabinName.toLowerCase().includes(q)
        );
      });
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    // 3. Provider filter
    if (providerFilter !== 'all') {
      result = result.filter(p => p.provider === providerFilter);
    }

    // 4. Sort
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [payments, searchQuery, statusFilter, providerFilter, sortField, sortDirection, bookings, accommodations]);

  // Financial Summary stats
  const stats = React.useMemo(() => {
    const approved = payments.filter(p => p.status === 'approved');
    const pending = payments.filter(p => p.status === 'pending');
    const refunded = payments.filter(p => p.status === 'refunded');

    const totalApproved = approved.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = refunded.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalApproved,
      totalPending,
      totalRefunded,
      approvedCount: approved.length,
      pendingCount: pending.length,
    };
  }, [payments]);

  // Format amount
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration status cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-line shadow-xs">
          <div className="flex justify-between items-center text-forest">
            <span className="text-[11px] font-extrabold uppercase tracking-wider font-sans text-muted">Aprobado / Cobrado</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-ink mt-2">{formatCurrency(stats.totalApproved)}</div>
          <div className="text-[10px] text-muted mt-1 font-sans">{stats.approvedCount} transacciones aprobadas</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-line shadow-xs">
          <div className="flex justify-between items-center text-forest">
            <span className="text-[11px] font-extrabold uppercase tracking-wider font-sans text-muted">Pendiente de Pago</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-ink mt-2">{formatCurrency(stats.totalPending)}</div>
          <div className="text-[10px] text-muted mt-1 font-sans">{stats.pendingCount} enlaces pendientes</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-line shadow-xs">
          <div className="flex justify-between items-center text-forest">
            <span className="text-[11px] font-extrabold uppercase tracking-wider font-sans text-muted">Devoluciones / Reembolsos</span>
            <XCircle className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl font-black text-ink mt-2">{formatCurrency(stats.totalRefunded)}</div>
          <div className="text-[10px] text-cyan-600 font-bold mt-1 font-sans">Fondos retornados a clientes</div>
        </div>

        <div className="bg-slate-900 text-white p-4.5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Estado de Pasarela</span>
              <h4 className="text-xs font-black text-white mt-0.5">Mercado Pago Sandbox</h4>
            </div>
            <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">CONECTADO</span>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-tight mt-1.5 font-sans">
            Las credenciales de producción se gestionan mediante variables de entorno seguras (.env) para evitar la fuga de secretos.
          </p>
        </div>
      </div>

      {/* Main Payment Section */}
      <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
        
        {/* Filter Toolbar */}
        <div className="p-4.5 border-b border-line bg-slate-50/45 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por ID, Reserva, Huésped, Cabaña..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-line bg-white focus:outline-none focus:border-forest"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Status Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted uppercase shrink-0 font-sans">Estado:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[34px] rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="processing">En Proceso</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
                <option value="cancelled">Cancelado</option>
                <option value="expired">Expirado</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </div>

            {/* Provider Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted uppercase shrink-0 font-sans">Pasarela:</span>
              <select 
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="min-h-[34px] rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink"
              >
                <option value="all">Todas</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="visa">Visa/Manual</option>
                <option value="mastercard">Mastercard/Manual</option>
              </select>
            </div>

            {/* Reload button */}
            <button 
              onClick={loadData}
              className="p-2 rounded-lg border border-line hover:border-forest hover:text-forest bg-white text-muted transition-colors cursor-pointer shrink-0"
              title="Recargar pagos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted flex flex-col items-center justify-center gap-2 font-sans">
              <RefreshCw className="w-6 h-6 animate-spin text-forest" />
              <span>Cargando transacciones financieras...</span>
            </div>
          ) : filteredAndSortedPayments.length === 0 ? (
            <div className="p-16 text-center text-xs text-muted font-sans">
              No se encontraron pagos con los filtros seleccionados.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-line text-[10px] font-bold text-muted uppercase font-sans tracking-wider">
                  <th className="py-3 px-4">Pago ID / Fecha</th>
                  <th className="py-3 px-4">Reserva ID</th>
                  <th className="py-3 px-4">Huésped / Estadía</th>
                  <th className="py-3 px-4">Medio / Pasarela</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs text-ink">
                {filteredAndSortedPayments.map((p) => {
                  const bk = getBookingDetails(p.bookingId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold block text-forest text-[11px]">{p.id}</span>
                        <span className="text-[10px] text-muted font-sans">{new Date(p.createdAt).toLocaleString('es-AR')}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        #{p.bookingId}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <strong className="block text-ink text-xs">{bk.guestName}</strong>
                        <span className="text-[10px] text-muted block truncate max-w-[200px]">{bk.cabinName} ({bk.dates})</span>
                      </td>
                      <td className="py-3.5 px-4 uppercase font-bold text-[10px] font-mono text-slate-500">
                        {p.provider === 'mercado_pago' ? 'Mercado Pago' : p.provider}
                      </td>
                      <td className="py-3.5 px-4 font-black text-ink text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={getStatusBadge(p.status)}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-2.5 py-1 text-[11px] font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Auditoría</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Side Audit Drawer / Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-100 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-[500px] h-full bg-white shadow-2xl flex flex-col animate-slide-in">
            
            {/* Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted font-sans">Historial de Auditoría de Pago</span>
                <h3 className="font-mono font-black text-base text-forest mt-0.5">{selectedPayment.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Payment Details Card */}
              <div className="bg-slate-50 border border-line p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#3d4842]">Detalle de la Operación</h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted block text-[10px] font-semibold uppercase">Reserva ID</span>
                    <strong className="text-slate-800">#{selectedPayment.bookingId}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] font-semibold uppercase">Huésped</span>
                    <strong className="text-slate-800">{getBookingDetails(selectedPayment.bookingId).guestName}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] font-semibold uppercase">Monto de la Reserva</span>
                    <strong className="text-forest font-black text-sm">{formatCurrency(selectedPayment.amount)}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] font-semibold uppercase">Estado Actual</span>
                    <div className="mt-0.5">
                      <span className={getStatusBadge(selectedPayment.status)}>
                        {getStatusLabel(selectedPayment.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] font-semibold uppercase">Pasarela de Pago</span>
                    <strong className="text-slate-700 capitalize">{selectedPayment.provider === 'mercado_pago' ? 'Mercado Pago' : selectedPayment.provider}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] font-semibold uppercase">ID de Transmisión / Preferencia</span>
                    <span className="font-mono text-[10px] font-bold text-slate-500 truncate block max-w-[150px]">{selectedPayment.externalId || 'N/A'}</span>
                  </div>
                </div>

                {selectedPayment.status === 'approved' && (
                  <div className="pt-3 border-t border-line/60 flex justify-end">
                    <button
                      onClick={() => handleRefund(selectedPayment.id)}
                      disabled={isRefunding}
                      className="px-4 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isRefunding ? 'Procesando Reembolso...' : 'Registrar Reembolso'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Event audit timeline */}
              <div className="space-y-3.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-forest flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Bitácora de Eventos (Trazabilidad)</span>
                </h4>
                
                <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                  {selectedPayment.history.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative">
                      {/* Node point */}
                      <span className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full border-2 bg-white ${
                        evt.status === 'approved' ? 'border-emerald-500' :
                        evt.status === 'refunded' ? 'border-cyan-500' :
                        evt.status === 'rejected' ? 'border-rose-500' : 'border-amber-400'
                      }`} />
                      
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink">{getStatusLabel(evt.status)}</span>
                          <span className="text-[10px] text-muted font-sans">{new Date(evt.timestamp).toLocaleString('es-AR')}</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed font-sans">{evt.message}</p>
                        
                        {evt.payload && (
                          <pre className="text-[9px] bg-slate-50 border border-line p-2 rounded-lg font-mono text-slate-500 overflow-x-auto max-h-[100px] mt-1.5 leading-tight">
                            {JSON.stringify(evt.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/40 p-4 border border-blue-200/50 rounded-xl text-xs leading-relaxed text-blue-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-blue-500shrink-0" />
                  <span>Trazabilidad Idempotente</span>
                </div>
                <p className="font-sans text-[11px] leading-relaxed">
                  StayFlow registra firmas de eventos de webhook de Mercado Pago para garantizar que ninguna notificación duplicada altere el historial financiero o corrompa los saldos de la reserva.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-line bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-ink text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
