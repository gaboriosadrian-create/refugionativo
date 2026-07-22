import React, { useState } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  Lock,
  Wallet,
  Building,
  DollarSign
} from 'lucide-react';
import { PaymentService } from '../services/PaymentService';

interface PaymentSimulatorProps {
  params: {
    prefId: string;
    bookingId: number;
    amount: number;
    resortId: string;
  };
  onClose: () => void;
}

export const PaymentSimulator: React.FC<PaymentSimulatorProps> = ({ params, onClose }) => {
  const [step, setStep] = useState<'checkout' | 'processing' | 'success' | 'rejected'>('checkout');
  const [method, setMethod] = useState<'card' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('4509 0122 3948 5720');
  const [cardHolder, setCardHolder] = useState('John Doe');
  const [expiry, setExpiry] = useState('11/29');
  const [cvv, setCvv] = useState('883');
  const [processMessage, setProcessMessage] = useState('Conectando con pasarela Mercado Pago...');

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleProcessPayment = async (simulateSuccess: boolean) => {
    setStep('processing');
    
    setProcessMessage('Estableciendo conexión encriptada de canal seguro SSL...');
    await delay(1200);
    setProcessMessage('Verificando firmas de autenticación del resort...');
    await delay(1000);
    setProcessMessage(simulateSuccess ? 'Autorizando fondos bancarios...' : 'Verificando límite crediticio disponible...');
    await delay(1200);
    setProcessMessage('Registrando firmas criptográficas de idempotencia...');
    await delay(800);

    const paymentId = `pay_sim_${Date.now().toString(36)}`;

    try {
      if (simulateSuccess) {
        // 1. Send simulated approved webhook to our Express backend
        await fetch('/api/payments/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            simulated: true,
            bookingId: params.bookingId,
            status: 'approved',
            paymentId,
            resortId: params.resortId
          })
        });

        // 2. Also record approved payment details in client repository (SaaS database)
        await PaymentService.updatePaymentStatus(
          params.resortId,
          params.prefId,
          'approved',
          'Pago aprobado de forma segura e instantánea mediante el simulador interactivo StayFlow',
          paymentId,
          { cardBrand: 'visa', cardLastFour: '5720', holderName: cardHolder }
        );

        setStep('success');
      } else {
        // 1. Send simulated rejected webhook to Express backend
        await fetch('/api/payments/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            simulated: true,
            bookingId: params.bookingId,
            status: 'rejected',
            paymentId,
            resortId: params.resortId
          })
        });

        // 2. Update payment status to rejected in client database
        await PaymentService.updatePaymentStatus(
          params.resortId,
          params.prefId,
          'rejected',
          'Intento de pago rechazado en pasarela por saldo insuficiente o denegación bancaria',
          paymentId
        );

        setStep('rejected');
      }
    } catch (err) {
      console.error('Error recording simulated payment:', err);
      setStep('rejected');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 overflow-y-auto flex items-center justify-center p-4 antialiased">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden my-6">
        
        {/* Header Indicator */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-display font-black text-xs">SF</span>
            <div>
              <h2 className="font-display font-extrabold text-xs">Pasarela Inteligente de Cobros</h2>
              <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase font-mono flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-emerald-400" />
                <span>StayFlow Payment Sandbox</span>
              </span>
            </div>
          </div>
          <span className="text-[9.5px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase">Entorno Seguro</span>
        </div>

        {step === 'checkout' && (
          <div className="p-6 space-y-6">
            {/* Purchase breakdown summary */}
            <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-muted font-bold uppercase font-sans">Pago correspondiente a</span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">Reserva #ID: {params.bookingId}</h3>
                <p className="text-[10.5px] text-muted font-sans font-medium mt-0.5">Mantenido por Resort: {params.resortId}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted font-bold uppercase font-sans">Importe Total</span>
                <div className="text-xl font-black text-forest mt-0.5">{formatAmount(params.amount)}</div>
              </div>
            </div>

            {/* Selector Options */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-muted uppercase font-sans tracking-wide block">Método de Pago Preferido</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`p-4 rounded-xl border-2 text-left space-y-2 transition-all cursor-pointer ${
                    method === 'card' 
                      ? 'border-blue-500 bg-blue-500/5 text-blue-900 font-bold' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div className="text-xs">Tarjeta de Crédito / Débito</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('wallet')}
                  className={`p-4 rounded-xl border-2 text-left space-y-2 transition-all cursor-pointer ${
                    method === 'wallet' 
                      ? 'border-blue-500 bg-blue-500/5 text-blue-900 font-bold' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-sky-500" />
                  <div className="text-xs">Dinero en Cuenta MP</div>
                </button>
              </div>
            </div>

            {/* Interactive Forms */}
            {method === 'card' ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">Titular de la Tarjeta</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">Número de Tarjeta</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-ink text-center"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">Expiración</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-mono font-bold text-ink text-center"
                        placeholder="MM/AA"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">CVC/CVV</label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-mono font-bold text-ink text-center"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-800">Conexión con cuenta @mercadopago</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Utiliza los fondos disponibles en tu billetera digital de Mercado Pago. Al confirmar, se debitarán <strong className="text-forest font-bold">{formatAmount(params.amount)}</strong> de tu saldo de cuenta.
                </p>
              </div>
            )}

            {/* Split controls */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleProcessPayment(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar Pago Seguro</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleProcessPayment(false)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simular Rechazo Bancario</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancelar y Volver</span>
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Procesando Pago Seguro</h3>
              <p className="text-xs text-muted font-sans max-w-sm mx-auto h-8 animate-pulse">{processMessage}</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display font-black text-xl text-slate-900">¡Pago Transaccionado con Éxito!</h3>
              <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
                Mercado Pago ha aprobado la transacción y enviado la firma digital webhook. Tu reserva en StayFlow ha sido confirmada automáticamente.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-left text-xs space-y-1 max-w-sm mx-auto">
              <div className="flex justify-between text-[11px] text-muted font-sans font-semibold">
                <span>RESERVA ID</span>
                <span className="text-slate-800 font-mono font-bold">#{params.bookingId}</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted font-sans font-semibold">
                <span>ESTADO DE RESERVA</span>
                <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">Confirmada / Pagada</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all active:scale-95"
            >
              Volver a StayFlow
            </button>
          </div>
        )}

        {step === 'rejected' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display font-black text-xl text-slate-900">Transacción Rechazada</h3>
              <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
                La entidad bancaria ha devuelto un código de error (Saldo Insuficiente / Tarjeta Inválida). Por favor revisa tus credenciales bancarias o intenta con otro método.
              </p>
            </div>

            <button
              onClick={() => setStep('checkout')}
              className="w-full max-w-xs py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
            >
              Reintentar con Otra Tarjeta
            </button>
            <button
              onClick={onClose}
              className="text-xs text-muted font-bold hover:text-slate-700 block mx-auto pt-1 transition-colors cursor-pointer"
            >
              Cancelar y volver a la reserva
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
