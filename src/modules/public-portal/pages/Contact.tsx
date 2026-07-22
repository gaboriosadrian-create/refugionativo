import React, { useState } from 'react';
import { useWebsite } from '../contexts/WebsiteContext';
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle, HelpCircle, ChevronDown } from 'lucide-react';

export const Contact: React.FC = () => {
  const { settings, websiteContent } = useWebsite();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [formSent, setFormSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  if (!settings) return null;

  const cmsContact = websiteContent?.contact;
  const cmsFaqs = websiteContent?.faq;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API payload or storage
    setTimeout(() => {
      setLoading(false);
      setFormSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }, 1200);
  };

  const handleWhatsAppClick = () => {
    const number = cmsContact?.whatsapp || settings.whatsapp || "5492945550138";
    const appName = settings.businessName || "StayFlow Resort";
    const msg = encodeURIComponent(`Hola ${appName}, les escribo desde la sección de contacto de la web.`);
    window.open(`https://wa.me/${number}?text=${msg}`, "_blank", "noopener noreferrer");
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  // Standard FAQs to fall back on if CMS doesn't have active FAQs
  const fallbackFaqs = [
    {
      question: '¿Cuáles son los medios de pago aceptados?',
      answer: 'Aceptamos transferencias bancarias, depósitos, tarjetas de crédito y débito. Al confirmar tu consulta, te enviaremos los datos de facturación necesarios.',
      active: true,
      order: 1
    },
    {
      question: '¿El complejo cuenta con grupo electrógeno?',
      answer: 'Sí, contamos con grupo electrógeno automático propio para garantizar el suministro eléctrico continuo en todas las cabañas frente a cualquier eventualidad climática.',
      active: true,
      order: 2
    },
    {
      question: '¿Tienen cunas o equipamiento para bebés?',
      answer: 'Sí, disponemos de practicunas, sillas de comer y bañeritas de bebé sin cargo adicional. Rogamos solicitar estos elementos al momento de realizar la reserva para asegurar stock.',
      active: true,
      order: 3
    }
  ];

  const activeFaqs = cmsFaqs && cmsFaqs.length > 0
    ? cmsFaqs.filter((f: any) => f.active).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    : fallbackFaqs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 pb-24">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <h1 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight">
          Ponte en Contacto
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          ¿Tienes alguna consulta especial, duda sobre servicios o deseas asistencia con tu viaje? Escríbenos o llámanos. Estamos aquí para ayudarte a planificar la mejor estadía.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Contact details */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
            <h2 className="font-display font-black text-xl text-slate-900">Información de Contacto</h2>

            <div className="space-y-5 text-sm text-slate-600">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-100 text-orange">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Dirección Física</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{cmsContact?.address || settings.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-100 text-orange">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Línea Telefónica</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{cmsContact?.phone || settings.phone || '+54 294 455-0138'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-100 text-orange">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Correo de Atención</h4>
                  <p className="text-slate-500 text-xs mt-0.5 break-all">{cmsContact?.email || settings.email}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/50 space-y-4">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Atención Directa</h4>
              <button
                onClick={handleWhatsAppClick}
                className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#20a95a] text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Escribir por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          {formSent ? (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-display font-black text-2xl text-slate-900">¡Mensaje Enviado con éxito!</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                Gracias por ponerte en contacto. Un representante de nuestro equipo de reservas se comunicará contigo a la brevedad.
              </p>
              <button 
                onClick={() => setFormSent(false)}
                className="text-xs font-bold text-[var(--public-primary)] hover:underline"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="font-display font-black text-xl text-slate-900">Formulario de Consulta</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="ej: Juan Pérez"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 text-xs text-slate-700 focus:outline-none focus:border-[var(--public-primary)] bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teléfono Celular</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="ej: +54 9 294 555-0138"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 text-xs text-slate-700 focus:outline-none focus:border-[var(--public-primary)] bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ej: juan@gmail.com"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 text-xs text-slate-700 focus:outline-none focus:border-[var(--public-primary)] bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tu Mensaje o Consulta</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Escribe aquí los detalles de tu consulta..."
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-700 focus:outline-none focus:border-[var(--public-primary)] bg-slate-50/50 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="text-xs font-semibold animate-pulse">Enviando...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Consulta</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      {activeFaqs.length > 0 && (
        <div className="pt-8 border-t border-slate-100 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--public-primary)] uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" /> Centro de Ayuda
            </span>
            <h2 className="font-display font-black text-3xl text-slate-900 tracking-tight">Preguntas Frecuentes</h2>
            <p className="text-slate-500 text-xs">Despeja tus dudas rápidas sobre el funcionamiento del complejo y las reservas.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {activeFaqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-sans font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50/50 transition-all focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'transform rotate-180 text-[var(--public-primary)]' : ''}`} />
                  </button>
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100 border-t border-slate-50' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="p-5 text-xs text-slate-500 leading-relaxed font-sans bg-slate-50/30">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
