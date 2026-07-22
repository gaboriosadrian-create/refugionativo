import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { WebsiteContent } from '../types';

export class WebsiteContentRepository extends BaseRepository<WebsiteContent & { id: string }> {
  constructor() {
    super('websiteContent');
  }

  async getContent(resortId: string): Promise<WebsiteContent> {
    const data = await this.getById(resortId, 'general');
    if (!data) {
      return this.getDefaultContent(resortId);
    }
    const { id, ...content } = data;
    return content as WebsiteContent;
  }

  async saveContent(resortId: string, content: WebsiteContent): Promise<void> {
    await this.save(resortId, { id: 'general', ...content, updatedAt: new Date().toISOString() });
  }

  public getDefaultContent(resortId: string): WebsiteContent {
    return {
      resortId,
      home: {
        title: 'Descubre el Refugio Perfecto en la Patagonia',
        subtitle: 'StayFlow Resort combina la calidez patagónica con servicios de primer nivel en un entorno natural de ensueño en San Martín de los Andes.',
        heroImage: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1600&q=80',
        ctaText: 'Reservar Alojamiento',
        ctaLink: 'accommodations'
      },
      about: {
        title: 'Bienvenidos a StayFlow Resort',
        description: 'Un lugar soñado al pie de la montaña, rodeado de bosques milenarios de lengas y coihues, y a pocos minutos del lago Lacar.',
        history: 'Fundado en 2018, StayFlow Resort nació con el sueño de ofrecer un espacio de conexión profunda con la naturaleza patagónica. Lo que comenzó como un pequeño proyecto familiar de dos cabañas de troncos se ha convertido hoy en un complejo exclusivo de categoría que mantiene intacto su espíritu de hospitalidad personalizada.',
        mission: 'Brindar una experiencia de hospitalidad cálida, confortable y sustentable, promoviendo el relax y el disfrute consciente de nuestro entorno natural.',
        vision: 'Ser reconocidos como el complejo de cabañas líder de la Patagonia en sustentabilidad, calidad de atención y diseño de experiencias exclusivas al aire libre.'
      },
      services: [
        {
          id: 'serv_1',
          title: 'WiFi de Alta Velocidad',
          description: 'Conectividad Starlink satelital ilimitada de 200MB en todo el predio, ideal para nómadas digitales.',
          icon: 'Wifi',
          active: true,
          order: 1
        },
        {
          id: 'serv_2',
          title: 'Club House & Wellness',
          description: 'Acceso a nuestro hidromasaje climatizado, sauna seco y área de relax con vista panorámica al bosque.',
          icon: 'Sparkles',
          active: true,
          order: 2
        },
        {
          id: 'serv_3',
          title: 'Desayuno de Campo',
          description: 'Canasta artesanal entregada cada mañana en tu cabaña con pan de campo caliente, mermeladas regionales y delicias caseras.',
          icon: 'Coffee',
          active: true,
          order: 3
        },
        {
          id: 'serv_4',
          title: 'Estacionamiento Privado',
          description: 'Estacionamiento individual techado junto a cada cabaña sin costo adicional y con vigilancia permanente.',
          icon: 'Car',
          active: true,
          order: 4
        }
      ],
      gallery: [
        {
          id: 'img_1',
          url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80',
          type: 'image',
          altText: 'Vista de la cabaña principal rodeada de bosque cubierto de nieve en invierno.',
          order: 1,
          active: true
        },
        {
          id: 'img_2',
          url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
          type: 'image',
          altText: 'Interior acogedor con hogar a leña encendido y ventanales al cerro Chapelco.',
          order: 2,
          active: true
        },
        {
          id: 'img_3',
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
          type: 'image',
          altText: 'Montañas patagónicas iluminadas por el sol del amanecer.',
          order: 3,
          active: true
        }
      ],
      policies: {
        checkIn: 'A partir de las 14:00 hs hasta las 21:00 hs.',
        checkOut: 'Hasta las 10:00 hs (Late check-out sujeto a disponibilidad y recargo).',
        cancellations: 'Cancelación gratuita hasta 7 días antes de la fecha de arribo. Pasado ese lapso se cobrará el valor de la primera noche de estadía.',
        pets: 'Aceptamos mascotas educadas bajo aviso previo en cabañas designadas (se aplica un cargo de limpieza único de ARS 15.000).',
        children: 'Apto para familias. Contamos con practicuna, bañera para bebés y silla de comer disponibles sin cargo adicional (solicitar al reservar).',
        smoking: 'Estrictamente prohibido fumar en el interior de las cabañas según ordenanza municipal. Se permite fumar únicamente en terrazas exteriores.',
        rules: [
          'Mantener silencio nocturno respetuoso entre las 22:00 y las 08:00 hs.',
          'Hacer un uso responsable del agua, la energía y la calefacción.',
          'Prohibido encender fuego fuera de las zonas de parrilla/asadores habilitadas.',
          'No se permite el ingreso de personas ajenas a la reserva al predio del complejo.'
        ]
      },
      faq: [
        {
          id: 'faq_1',
          question: '¿Qué medios de pago aceptan para confirmar la reserva?',
          answer: 'Para garantizar la reserva solicitamos una seña del 50% vía transferencia bancaria o tarjeta de crédito/débito. El saldo restante se abona al momento de realizar el check-in en el complejo.',
          order: 1,
          visible: true
        },
        {
          id: 'faq_2',
          question: '¿A qué distancia se encuentra el complejo del centro comercial?',
          answer: 'Estamos ubicados en una zona residencial muy tranquila, a solo 3.5 km (aproximadamente 6 minutos en auto o 25 minutos caminando) del centro comercial principal de San Martín de los Andes.',
          order: 2,
          visible: true
        },
        {
          id: 'faq_3',
          question: '¿El complejo cuenta con calefacción en todas las áreas?',
          answer: 'Sí, todas nuestras cabañas cuentan con sistema de calefacción central por radiadores de agua regulable, además de estufas de tiro balanceado y chimeneas a leña para brindar el máximo confort invernal.',
          order: 3,
          visible: true
        }
      ],
      contact: {
        phone: '+54 294 4550138',
        whatsapp: '5492945550138',
        email: 'reservas@stayflowpatagonia.com',
        address: 'Calle Los Maitenes 345, San Martín de los Andes, Neuquén, Argentina',
        googleMapsUrl: 'https://maps.app.goo.gl/3f9N7d4d7g8h9j0k',
        instagram: 'https://instagram.com/stayflow.resort',
        facebook: 'https://facebook.com/stayflow.resort',
        tiktok: 'https://tiktok.com/@stayflow.patagonia',
        youtube: 'https://youtube.com/c/stayflowresort'
      },
      footer: {
        text: 'StayFlow Resort - Un oasis de calidez y naturaleza en el corazón de la Patagonia Argentina.',
        copyright: `© ${new Date().getFullYear()} StayFlow Resort. Desarrollado con tecnología StayFlow SaaS Engine.`,
        links: [
          { label: 'Inicio', url: 'home' },
          { label: 'Alojamiento', url: 'accommodations' },
          { label: 'Políticas', url: 'policies' },
          { label: 'Contacto', url: 'contact' }
        ]
      },
      seo: {
        title: 'StayFlow Resort | Cabañas de Montaña en San Martín de los Andes',
        metaDescription: 'Alquiler de cabañas exclusivas equipadas con spa, piscina climatizada, wifi Starlink y desayuno de campo en San Martín de los Andes. ¡Reserva directa sin comisiones!',
        keywords: 'cabañas, san martin de los andes, patagonia, alquiler turistico, turismo neuquen, lago lacar, chapelco, spa de montaña, wifi starlink',
        ogImage: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80',
        twitterCard: 'summary_large_image'
      },
      version: 1,
      updatedAt: new Date().toISOString()
    };
  }
}

export const websiteContentRepository = new WebsiteContentRepository();
