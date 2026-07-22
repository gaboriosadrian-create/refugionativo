import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { Cabin } from '../../types';

interface PaymentModalProps {
  cabin: Cabin;
  nights: number;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestPhone: string;
  guestsCount: number;
  onPaymentSuccess: (paymentMethod: string) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  cabin,
  nights,
  checkIn,
  checkOut,
  guestName,
  guestPhone,
  guestsCount,
  onPaymentSuccess,
  onClose,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const effectivePrice = Math.round(cabin.price * (1 - (cabin.discount || 0) / 100));
  const subtotal = cabin.price * nights;
  const discountAmount = Math.round(cabin.price * (cabin.discount / 100)) * nights;
  const totalAmount = effectivePrice * nights;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvc(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const plainCardNumber = cardNumber.replace(/\s/g, '');
    if (plainCardNumber.length < 15) {
      setError('Número de tarjeta inválido.');
      return;
    }
    if (!cardName.trim()) {
      setError('Por favor, ingresa el nombre impreso en la tarjeta.');
      return;
    }
    if (expiry.length < 5) {
      setError('Fecha de vencimiento inválida. Formato: MM/AA');
      return;
    }
    if (cvc.length < 3) {
      setError('Código CVC/CVV inválido.');
      return;
    }

    setIsProcessing(true);

    // Simulate secure transaction request with random bank authorization latency
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess('visa');
    }, 2200);
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#07140e]/58 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="w-full max-w-[450px] overflow-y-auto max-h-[92dvh] rounded-3xl bg-cream shadow-2xl p-5 border border-line">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-forest font-bold text-lg">
            <Lock className="w-5 h-5 text-success" />
            <span>Pago Seguro Online</span>
          </div>
          {!isProcessing && (
            <button 
              onClick={onClose}
              className="grid w-8 h-8 place-content-center rounded-full bg-white border border-line text-ink hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic visual card mockup */}
        <div className="relative overflow-hidden w-full aspect-[1.58/1] rounded-2xl bg-gradient-to-br from-forest-hover to-forest p-5 text-white shadow-md mb-5 flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-10 pointer-events-none">
            <ShieldCheck className="w-full h-full" />
          </div>

          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-sage/70 font-semibold">Refugio Nativo</span>
              <span className="text-xs font-medium text-white/90">Hospedaje de Cabañas</span>
            </div>
            <CreditCard className="w-8 h-8 text-white/80" />
          </div>

          <div className="my-3">
            <span className="font-mono text-lg tracking-[3px] block">
              {cardNumber || '•••• •••• •••• ••••'}
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] uppercase tracking-wider text-sage/70">Titular de Tarjeta</span>
              <span className="text-xs font-bold font-mono tracking-wide uppercase line-clamp-1">
                {cardName || 'NOMBRE Y APELLIDO'}
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col text-right">
                <span className="text-[8px] uppercase tracking-wider text-sage/70">Vence</span>
                <span className="text-xs font-bold font-mono tracking-wide">{expiry || 'MM/AA'}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] uppercase tracking-wider text-sage/70">CVV</span>
                <span className="text-xs font-bold font-mono tracking-wide">{cvc || '•••'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing breakdown summary */}
        <div className="bg-white border border-line rounded-2xl p-4 mb-5">
          <h4 className="font-display font-bold text-sm text-ink border-b border-line pb-2 mb-2">Detalle del Cobro</h4>
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span>{cabin.name} ({nights} {nights === 1 ? 'noche' : 'noches'})</span>
            <span>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(subtotal)}</span>
          </div>
          {cabin.discount > 0 && (
            <div className="flex justify-between text-xs text-success mb-1.5">
              <span>Descuento aplicado (-{cabin.discount}%)</span>
              <span>-{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-display font-extrabold text-base text-forest pt-1.5 border-t border-line/50">
            <span>Total a transferir</span>
            <span>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalAmount)}</span>
          </div>
        </div>

        {/* Billing details form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">Número de Tarjeta</label>
            <input 
              type="text"
              placeholder="4512 3456 7890 1234"
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={isProcessing}
              className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">Nombre en la Tarjeta</label>
            <input 
              type="text"
              placeholder="Juan Pérez"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              disabled={isProcessing}
              className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Vencimiento</label>
              <input 
                type="text"
                placeholder="MM/AA"
                value={expiry}
                onChange={handleExpiryChange}
                disabled={isProcessing}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Código CVC/CVV</label>
              <input 
                type="password"
                placeholder="123"
                value={cvc}
                onChange={handleCvcChange}
                disabled={isProcessing}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-xs px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-2xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando Pago Seguro...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pagar {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalAmount)}
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted">
              <Lock className="w-3.5 h-3.5 text-success" />
              <span>Conexión cifrada SSL de 256 bits · PCI-DSS Compliant</span>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
