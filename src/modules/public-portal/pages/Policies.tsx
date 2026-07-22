import React from 'react';
import { useWebsite } from '../contexts/WebsiteContext';
import { ShieldAlert, BookOpen, Clock, Heart, HelpCircle, AlertCircle } from 'lucide-react';

export const Policies: React.FC = () => {
  const { settings, websiteContent } = useWebsite();

  if (!settings) return null;

  // Use dynamic content from CMS if loaded
  const cmsPolicies = websiteContent?.policies as any;

  const policySections = [
    {
      icon: <Clock className="w-5 h-5 text-orange" />,
      title: 'Políticas de Horarios y Estancia',
      items: cmsPolicies ? [
        `Horario de Check-In (Entrada): A partir de las ${cmsPolicies.checkInTime || '14:00'} horas.`,
        `Horario de Check-Out (Salida): Hasta las ${cmsPolicies.checkOutTime || '10:00'} horas.`,
        cmsPolicies.petFriendly 
          ? 'Mascotas: Se admiten mascotas (Complejo catalogado como Pet-Friendly, por favor avisar previamente).' 
          : 'Mascotas: No se admiten mascotas en el complejo para garantizar la tranquilidad general.',
        'Early Check-In / Late Check-Out: Sujeto a disponibilidad y con recargo previo aviso.'
      ] : [
        'Horario de Check-In (Entrada): A partir de las 14:00 horas.',
        'Horario de Check-Out (Salida): Hasta las 10:00 horas.',
        'Early Check-In / Late Check-Out: Sujeto a disponibilidad y con recargo previo aviso.',
        'Estancia mínima: Varía según temporada turística o fines de semana largos (verificar al consultar).'
      ]
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-orange" />,
      title: 'Cancelación y Reservas',
      items: cmsPolicies?.cancellationPolicy ? [
        ...cmsPolicies.cancellationPolicy.split('\n').filter(line => line.trim().length > 0)
      ] : [
        'Garantía: La solicitud de reserva requiere un depósito/transferencia de seña para quedar firme.',
        'Cancelación flexible: Cancelaciones con hasta 14 días de antelación reciben el 100% del reembolso o crédito.',
        'Cancelación fuera de término: Menos de 14 días de aviso implicará la pérdida de la seña abonada.',
        'No show (No presentación): Implica la pérdida total de la reserva sin derecho a reprogramación.'
      ]
    },
    {
      icon: <Heart className="w-5 h-5 text-orange" />,
      title: 'Normas de Convivencia y Reglas del Complejo',
      items: cmsPolicies?.rules && cmsPolicies.rules.length > 0 ? [
        ...cmsPolicies.rules
      ] : [
        'Prohibido fumar: Totalmente prohibido fumar tabaco o vaper dentro de los alojamientos cerrados.',
        'Descanso y silencio: Se solicita mantener ruidos moderados de 22:00 hs a 08:00 hs para favorecer el descanso de todos.',
        'Cuidado del entorno: Prohibido encender fuego fuera de las áreas explícitamente designadas como fogones.',
        'Capacidad máxima: No se permite exceder la capacidad de huéspedes contratada bajo ningún concepto.'
      ]
    }
  ];

  // Append custom policies if configured in CMS
  if (cmsPolicies?.customPolicies && cmsPolicies.customPolicies.length > 0) {
    cmsPolicies.customPolicies.forEach((p) => {
      policySections.push({
        icon: <AlertCircle className="w-5 h-5 text-orange" />,
        title: p.title,
        items: p.content.split('\n').filter(line => line.trim().length > 0)
      });
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 pb-24">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-full text-[var(--public-primary)] mx-auto">
          <BookOpen className="w-5 h-5" />
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-none">
          Políticas Generales del Resort
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-medium">
          Te invitamos a leer atentamente nuestras pautas generales de reserva y convivencia para garantizar una estancia placentera y coordinada para todos nuestros huéspedes.
        </p>
      </div>

      {/* Sections Grid */}
      <div className="space-y-8">
        {policySections.map((sec, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-orange/10 rounded-xl">
                {sec.icon}
              </div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                {sec.title}
              </h2>
            </div>
            <ul className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-sans list-none pl-0">
              {sec.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--public-primary)] mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Help card */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <span>¿Tienes dudas adicionales sobre nuestras políticas de reserva? Estamos para responderte.</span>
        </div>
        <a 
          href={`https://wa.me/${cmsPolicies?.whatsapp || settings.whatsapp || "5492945550138"}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex min-h-[38px] items-center justify-center px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          Consultar Administración
        </a>
      </div>
    </div>
  );
};
