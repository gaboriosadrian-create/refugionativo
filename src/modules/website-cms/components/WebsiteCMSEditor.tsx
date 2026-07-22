import React, { useState, useEffect } from 'react';
import { useWebsiteCMS } from '../contexts/WebsiteCMSContext';
import { WebsiteContent, ServiceItem, GalleryItem, FaqItem } from '../types';
import { 
  Home, 
  Info, 
  Layers, 
  Image as ImageIcon, 
  FileText, 
  HelpCircle, 
  Phone, 
  Layout, 
  Globe, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  Send, 
  Sparkles, 
  Smartphone, 
  Laptop, 
  Video, 
  MapPin, 
  Settings, 
  AlertCircle, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { MediaManagerModal } from '../../media/components/MediaManagerModal';
import { useResort } from '../../../shared/contexts/ResortContext';

export const WebsiteCMSEditor: React.FC = () => {
  const { resort } = useResort();
  const resortId = resort?.id || 'demo_resort';

  const { 
    content, 
    loading, 
    saving, 
    publishing, 
    error: contextError, 
    saveContent, 
    publishContent, 
    resetToDefaults 
  } = useWebsiteCMS();

  // Local editing state
  const [localContent, setLocalContent] = useState<WebsiteContent | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'services' | 'gallery' | 'policies' | 'faq' | 'contact' | 'footer' | 'seo'>('home');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  // Media selection modal states
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{ path: string; index?: number } | null>(null);

  // Status and error messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync from context when loaded
  useEffect(() => {
    if (content) {
      setLocalContent(JSON.parse(JSON.stringify(content)));
    }
  }, [content]);

  // Sync contextual errors
  useEffect(() => {
    if (contextError) {
      setErrorMsg(contextError);
    }
  }, [contextError]);

  if (loading || !localContent) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-forest" />
        <span className="text-sm font-bold tracking-wide">Cargando Gestor de Contenidos (CMS)...</span>
      </div>
    );
  }

  const handleFieldChange = (section: string, field: string, value: any) => {
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [section]: {
          ...(prev as any)[section],
          [field]: value
        }
      };
    });
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  // Actions
  const handleSaveDraft = async () => {
    if (!localContent) return;
    try {
      await saveContent(localContent);
      showSuccess('¡Borrador guardado con éxito! Los cambios se guardaron localmente.');
    } catch (err: any) {
      showError(err.message || 'Error al guardar el borrador.');
    }
  };

  const handlePublish = async () => {
    if (!localContent) return;
    if (window.confirm('¿Estás seguro de que deseas publicar estos cambios? Se reflejarán inmediatamente en el Portal Público Web.')) {
      try {
        await publishContent(localContent);
        showSuccess(`¡Sitio publicado con éxito! Versión actual publicada.`);
      } catch (err: any) {
        showError(err.message || 'Error al publicar los cambios.');
      }
    }
  };

  const handleReset = async () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer TODO el contenido a los valores predeterminados de fábrica? Esta acción sobrescribirá tus cambios actuales.')) {
      try {
        await resetToDefaults();
        showSuccess('Se han restablecido los valores de fábrica con éxito.');
      } catch (err: any) {
        showError(err.message || 'Error al restablecer valores por defecto.');
      }
    }
  };

  // Services actions
  const handleAddService = () => {
    const newService: ServiceItem = {
      id: `serv_${Date.now()}`,
      title: 'Nuevo Servicio',
      description: 'Descripción breve de este servicio destacado.',
      icon: 'Sparkles',
      active: true,
      order: localContent.services.length + 1
    };
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        services: [...prev.services, newService]
      };
    });
  };

  const handleUpdateService = (id: string, field: keyof ServiceItem, value: any) => {
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s)
      };
    });
  };

  const handleDeleteService = (id: string) => {
    setLocalContent(prev => {
      if (!prev) return null;
      const filtered = prev.services.filter(s => s.id !== id);
      // Re-index order
      return {
        ...prev,
        services: filtered.map((s, idx) => ({ ...s, order: idx + 1 }))
      };
    });
  };

  const handleMoveService = (index: number, direction: 'up' | 'down') => {
    setLocalContent(prev => {
      if (!prev) return null;
      const services = [...prev.services].sort((a, b) => a.order - b.order);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= services.length) return prev;

      // Swap
      const temp = services[index];
      services[index] = services[targetIndex];
      services[targetIndex] = temp;

      // Update orders
      return {
        ...prev,
        services: services.map((s, idx) => ({ ...s, order: idx + 1 }))
      };
    });
  };

  // FAQ actions
  const handleAddFaq = () => {
    const newFaq: FaqItem = {
      id: `faq_${Date.now()}`,
      question: 'Pregunta Frecuente',
      answer: 'Respuesta correspondiente.',
      order: localContent.faq.length + 1,
      visible: true
    };
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        faq: [...prev.faq, newFaq]
      };
    });
  };

  const handleUpdateFaq = (id: string, field: keyof FaqItem, value: any) => {
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        faq: prev.faq.map(f => f.id === id ? { ...f, [field]: value } : f)
      };
    });
  };

  const handleDeleteFaq = (id: string) => {
    setLocalContent(prev => {
      if (!prev) return null;
      const filtered = prev.faq.filter(f => f.id !== id);
      return {
        ...prev,
        faq: filtered.map((f, idx) => ({ ...f, order: idx + 1 }))
      };
    });
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    setLocalContent(prev => {
      if (!prev) return null;
      const faq = [...prev.faq].sort((a, b) => a.order - b.order);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= faq.length) return prev;

      const temp = faq[index];
      faq[index] = faq[targetIndex];
      faq[targetIndex] = temp;

      return {
        ...prev,
        faq: faq.map((f, idx) => ({ ...f, order: idx + 1 }))
      };
    });
  };

  // Gallery actions
  const handleAddGalleryItem = () => {
    const newItem: GalleryItem = {
      id: `gal_${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80',
      type: 'image',
      altText: 'Nueva fotografía de nuestro complejo.',
      order: localContent.gallery.length + 1,
      active: true
    };
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        gallery: [...prev.gallery, newItem]
      };
    });
  };

  const handleUpdateGalleryItem = (id: string, field: keyof GalleryItem, value: any) => {
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        gallery: prev.gallery.map(g => g.id === id ? { ...g, [field]: value } : g)
      };
    });
  };

  const handleDeleteGalleryItem = (id: string) => {
    setLocalContent(prev => {
      if (!prev) return null;
      const filtered = prev.gallery.filter(g => g.id !== id);
      return {
        ...prev,
        gallery: filtered.map((g, idx) => ({ ...g, order: idx + 1 }))
      };
    });
  };

  const handleMoveGalleryItem = (index: number, direction: 'up' | 'down') => {
    setLocalContent(prev => {
      if (!prev) return null;
      const gallery = [...prev.gallery].sort((a, b) => a.order - b.order);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= gallery.length) return prev;

      const temp = gallery[index];
      gallery[index] = gallery[targetIndex];
      gallery[targetIndex] = temp;

      return {
        ...prev,
        gallery: gallery.map((g, idx) => ({ ...g, order: idx + 1 }))
      };
    });
  };

  // Rules actions
  const handleAddRule = () => {
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        policies: {
          ...prev.policies,
          rules: [...prev.policies.rules, 'Nueva norma del establecimiento.']
        }
      };
    });
  };

  const handleUpdateRule = (index: number, value: string) => {
    setLocalContent(prev => {
      if (!prev) return null;
      const updatedRules = [...prev.policies.rules];
      updatedRules[index] = value;
      return {
        ...prev,
        policies: {
          ...prev.policies,
          rules: updatedRules
        }
      };
    });
  };

  const handleDeleteRule = (index: number) => {
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        policies: {
          ...prev.policies,
          rules: prev.policies.rules.filter((_, idx) => idx !== index)
        }
      };
    });
  };

  // Footer Links actions
  const handleAddFooterLink = () => {
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        footer: {
          ...prev.footer,
          links: [...prev.footer.links, { label: 'Nuevo Enlace', url: 'home' }]
        }
      };
    });
  };

  const handleUpdateFooterLink = (index: number, field: 'label' | 'url', value: string) => {
    setLocalContent(prev => {
      if (!prev) return null;
      const updatedLinks = [...prev.footer.links];
      updatedLinks[index] = { ...updatedLinks[index], [field]: value };
      return {
        ...prev,
        footer: {
          ...prev.footer,
          links: updatedLinks
        }
      };
    });
  };

  const handleDeleteFooterLink = (index: number) => {
    setLocalContent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        footer: {
          ...prev.footer,
          links: prev.footer.links.filter((_, idx) => idx !== index)
        }
      };
    });
  };

  const openMediaFor = (path: string, index?: number) => {
    setMediaTarget({ path, index });
    setIsMediaOpen(true);
  };

  const handleMediaSelect = (media: any) => {
    if (!mediaTarget) return;
    const { path, index } = mediaTarget;

    if (path === 'home.heroImage') {
      handleFieldChange('home', 'heroImage', media.downloadURL);
    } else if (path === 'seo.ogImage') {
      handleFieldChange('seo', 'ogImage', media.downloadURL);
    } else if (path === 'gallery' && index !== undefined) {
      setLocalContent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          gallery: prev.gallery.map((g, idx) => idx === index ? { ...g, url: media.downloadURL } : g)
        };
      });
    } else if (path === 'services' && index !== undefined) {
      setLocalContent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          services: prev.services.map((s, idx) => idx === index ? { ...s, image: media.downloadURL } : s)
        };
      });
    }

    setIsMediaOpen(false);
    setMediaTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* CMS Action Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 text-white p-5 rounded-2xl gap-4 shadow-md border border-slate-850">
        <div className="space-y-1">
          <h2 className="font-display font-black text-lg tracking-tight flex items-center gap-2">
            <Layout className="w-5 h-5 text-emerald-400" />
            <span>Gestor de Contenido (CMS) - Portal Web</span>
          </h2>
          <p className="text-slate-400 text-xs">
            Personaliza el contenido, imágenes, secciones y SEO de tu sitio web sin tocar una sola línea de código.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 md:flex-initial min-h-[38px] px-3.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Restablecer a valores de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            className="flex-1 md:flex-initial min-h-[38px] px-3.5 rounded-xl bg-slate-800 text-white hover:bg-slate-750 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando...' : 'Guardar Borrador'}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={saving || publishing}
            className="flex-1 md:flex-initial min-h-[38px] px-4.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{publishing ? 'Publicando...' : 'Publicar Sitio'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Editors */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-6">
          
          {/* CMS Sub-navigation Tabs */}
          <div className="flex gap-1.5 pb-2 border-b border-slate-100 overflow-x-auto scrollbar-thin">
            {[
              { id: 'home', label: 'Inicio', Icon: Home },
              { id: 'about', label: 'Nosotros', Icon: Info },
              { id: 'services', label: 'Servicios', Icon: Sparkles },
              { id: 'gallery', label: 'Galería', Icon: ImageIcon },
              { id: 'policies', label: 'Políticas', Icon: FileText },
              { id: 'faq', label: 'FAQ', Icon: HelpCircle },
              { id: 'contact', label: 'Contacto', Icon: Phone },
              { id: 'footer', label: 'Footer', Icon: Layout },
              { id: 'seo', label: 'SEO', Icon: Globe },
            ].map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                    isSelected 
                      ? 'bg-slate-100 text-slate-800 border-slate-200' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <tab.Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content: Home & Hero */}
          {activeTab === 'home' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Hospedaje / Home Hero Banner</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Título Principal del Hero</label>
                <input
                  type="text"
                  value={localContent.home.title}
                  onChange={(e) => handleFieldChange('home', 'title', e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  placeholder="ej: Descubre la Patagonia con Nosotros"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Subtítulo Descriptivo</label>
                <textarea
                  value={localContent.home.subtitle}
                  onChange={(e) => handleFieldChange('home', 'subtitle', e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-none"
                  placeholder="Describe la experiencia general del complejo..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Texto del Botón (CTA)</label>
                  <input
                    type="text"
                    value={localContent.home.ctaText}
                    onChange={(e) => handleFieldChange('home', 'ctaText', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Destino del Botón (CTA Link)</label>
                  <select
                    value={localContent.home.ctaLink}
                    onChange={(e) => handleFieldChange('home', 'ctaLink', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  >
                    <option value="home">Ir al Buscador (Inicio)</option>
                    <option value="accommodations">Listado de Alojamientos</option>
                    <option value="policies">Normas y Políticas</option>
                    <option value="contact">Contacto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Imagen de Fondo (Hero Image)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localContent.home.heroImage}
                    onChange={(e) => handleFieldChange('home', 'heroImage', e.target.value)}
                    className="flex-1 min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaFor('home.heroImage')}
                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Elegir de Galería
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Inserta una URL válida de imagen o elígela de tu administrador de archivos multimedia.</p>
              </div>
            </div>
          )}

          {/* Tab Content: About Us */}
          {activeTab === 'about' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Sobre Nosotros / Reseña</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Título de la Sección</label>
                <input
                  type="text"
                  value={localContent.about.title}
                  onChange={(e) => handleFieldChange('about', 'title', e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Descripción Principal (Breve Reseña)</label>
                <textarea
                  value={localContent.about.description}
                  onChange={(e) => handleFieldChange('about', 'description', e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Historia del Establecimiento</label>
                <textarea
                  value={localContent.about.history}
                  onChange={(e) => handleFieldChange('about', 'history', e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-y"
                  placeholder="Cuenta el origen y evolución del complejo..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Misión</label>
                  <textarea
                    value={localContent.about.mission}
                    onChange={(e) => handleFieldChange('about', 'mission', e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Visión</label>
                  <textarea
                    value={localContent.about.vision}
                    onChange={(e) => handleFieldChange('about', 'vision', e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Services */}
          {activeTab === 'services' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Servicios & Amenities Destacados</h3>
                <button
                  onClick={handleAddService}
                  className="min-h-[34px] px-3 rounded-lg bg-forest hover:bg-forest-hover text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Servicio</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {localContent.services.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No hay servicios guardados. Agrega uno nuevo.</p>
                ) : (
                  localContent.services
                    .sort((a, b) => a.order - b.order)
                    .map((serv, index) => (
                      <div key={serv.id} className="p-4 border border-slate-150 rounded-xl space-y-3 bg-slate-50/50 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Servicio #{index + 1}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMoveService(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveService(index, 'down')}
                              disabled={index === localContent.services.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateService(serv.id, 'active', !serv.active)}
                              className={`p-1 rounded cursor-pointer ${serv.active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}
                              title={serv.active ? 'Desactivar' : 'Activar'}
                            >
                              {serv.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteService(serv.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Título</label>
                            <input
                              type="text"
                              value={serv.title}
                              onChange={(e) => handleUpdateService(serv.id, 'title', e.target.value)}
                              className="w-full min-h-[36px] rounded-lg border border-slate-200 px-3 text-xs bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Icono (Lucide)</label>
                            <select
                              value={serv.icon}
                              onChange={(e) => handleUpdateService(serv.id, 'icon', e.target.value)}
                              className="w-full min-h-[36px] rounded-lg border border-slate-200 px-2.5 text-xs bg-white font-mono"
                            >
                              <option value="Wifi">Wifi (WiFi/Internet)</option>
                              <option value="Sparkles">Sparkles (Spa/Lujo)</option>
                              <option value="Coffee">Coffee (Desayuno/Café)</option>
                              <option value="Car">Car (Cochera/Estacionamiento)</option>
                              <option value="Tv">Tv (Televisión/Cable)</option>
                              <option value="Flame">Flame (Hogar/Calefacción)</option>
                              <option value="Sun">Sun (Aire Libre/Solarium)</option>
                              <option value="Waves">Waves (Piscina/Agua)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción</label>
                          <input
                            type="text"
                            value={serv.description}
                            onChange={(e) => handleUpdateService(serv.id, 'description', e.target.value)}
                            className="w-full min-h-[36px] rounded-lg border border-slate-200 px-3 text-xs bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Imagen Opcional (URL)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={serv.image || ''}
                              onChange={(e) => handleUpdateService(serv.id, 'image', e.target.value)}
                              className="flex-1 min-h-[36px] rounded-lg border border-slate-200 px-3 text-xs bg-white font-mono"
                              placeholder="https://ejemplo.com/imagen.jpg"
                            />
                            <button
                              type="button"
                              onClick={() => openMediaFor('services', index)}
                              className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Elegir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Gallery */}
          {activeTab === 'gallery' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Galería de Fotos & Videos</h3>
                <button
                  onClick={handleAddGalleryItem}
                  className="min-h-[34px] px-3 rounded-lg bg-forest hover:bg-forest-hover text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Imagen</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {localContent.gallery.length === 0 ? (
                  <div className="col-span-2 text-xs text-slate-400 text-center py-6">No hay ítems en la galería. Crea uno nuevo.</div>
                ) : (
                  localContent.gallery
                    .sort((a, b) => a.order - b.order)
                    .map((item, index) => (
                      <div key={item.id} className="p-3 border border-slate-150 rounded-xl space-y-2.5 bg-slate-50/30 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Imagen #{index + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryItem(index, 'up')}
                                disabled={index === 0}
                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryItem(index, 'down')}
                                disabled={index === localContent.gallery.length - 1}
                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateGalleryItem(item.id, 'active', !item.active)}
                                className={`p-0.5 rounded cursor-pointer ${item.active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}
                                title={item.active ? 'Visible' : 'Oculto'}
                              >
                                {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGalleryItem(item.id)}
                                className="p-0.5 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-150 relative">
                            <img src={item.url} alt={item.altText} className="w-full h-full object-cover" />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Tipo</label>
                            <select
                              value={item.type}
                              onChange={(e) => handleUpdateGalleryItem(item.id, 'type', e.target.value)}
                              className="w-full min-h-[30px] rounded-md border border-slate-200 px-1.5 text-xs bg-white"
                            >
                              <option value="image">Fotografía (Imagen)</option>
                              <option value="video">Estructura Video (Streaming)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">URL Multimedia</label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) => handleUpdateGalleryItem(item.id, 'url', e.target.value)}
                                className="flex-1 min-h-[30px] rounded-md border border-slate-200 px-2 text-xs bg-white font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => openMediaFor('gallery', index)}
                                className="px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[10px] font-bold cursor-pointer"
                              >
                                Elegir
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Texto Alternativo (SEO)</label>
                            <input
                              type="text"
                              value={item.altText}
                              onChange={(e) => handleUpdateGalleryItem(item.id, 'altText', e.target.value)}
                              className="w-full min-h-[30px] rounded-md border border-slate-200 px-2 text-xs bg-white"
                              placeholder="ej: Dormitorio con cama matrimonial"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Policies */}
          {activeTab === 'policies' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Políticas & Normas Generales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Check-in (Llegada)</label>
                  <input
                    type="text"
                    value={localContent.policies.checkIn}
                    onChange={(e) => handleFieldChange('policies', 'checkIn', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Check-out (Salida)</label>
                  <input
                    type="text"
                    value={localContent.policies.checkOut}
                    onChange={(e) => handleFieldChange('policies', 'checkOut', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Políticas de Cancelación</label>
                <textarea
                  value={localContent.policies.cancellations}
                  onChange={(e) => handleFieldChange('policies', 'cancellations', e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mascotas (Política)</label>
                  <input
                    type="text"
                    value={localContent.policies.pets}
                    onChange={(e) => handleFieldChange('policies', 'pets', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Niños & Cunas</label>
                  <input
                    type="text"
                    value={localContent.policies.children}
                    onChange={(e) => handleFieldChange('policies', 'children', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Fumar (Normativa)</label>
                  <input
                    type="text"
                    value={localContent.policies.smoking}
                    onChange={(e) => handleFieldChange('policies', 'smoking', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Normas del Establecimiento list */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Normas o Reglas Internas</label>
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="min-h-[30px] px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Norma</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {localContent.policies.rules.map((rule, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs font-mono font-bold text-slate-400 w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => handleUpdateRule(idx, e.target.value)}
                        className="flex-1 min-h-[36px] rounded-lg border border-slate-200 px-3 text-xs bg-slate-50/20 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Preguntas Frecuentes (FAQ)</h3>
                <button
                  onClick={handleAddFaq}
                  className="min-h-[34px] px-3 rounded-lg bg-forest hover:bg-forest-hover text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar FAQ</span>
                </button>
              </div>

              <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                {localContent.faq.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No hay preguntas cargadas. Comienza agregando una.</p>
                ) : (
                  localContent.faq
                    .sort((a, b) => a.order - b.order)
                    .map((faqItem, index) => (
                      <div key={faqItem.id} className="p-3.5 border border-slate-150 rounded-xl space-y-2 bg-slate-50/50">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Pregunta #{index + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveFaq(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveFaq(index, 'down')}
                              disabled={index === localContent.faq.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateFaq(faqItem.id, 'visible', !faqItem.visible)}
                              className={`p-1 rounded cursor-pointer ${faqItem.visible ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}
                            >
                              {faqItem.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFaq(faqItem.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Pregunta</label>
                          <input
                            type="text"
                            value={faqItem.question}
                            onChange={(e) => handleUpdateFaq(faqItem.id, 'question', e.target.value)}
                            className="w-full min-h-[36px] rounded-lg border border-slate-200 px-3 text-xs bg-white font-semibold text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Respuesta</label>
                          <textarea
                            value={faqItem.answer}
                            onChange={(e) => handleUpdateFaq(faqItem.id, 'answer', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 p-2.5 text-xs bg-white resize-y"
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Contact */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Contacto & Canales Oficiales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Teléfono</label>
                  <input
                    type="text"
                    value={localContent.contact.phone}
                    onChange={(e) => handleFieldChange('contact', 'phone', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">WhatsApp</label>
                  <input
                    type="text"
                    value={localContent.contact.whatsapp}
                    onChange={(e) => handleFieldChange('contact', 'whatsapp', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Oficial</label>
                <input
                  type="email"
                  value={localContent.contact.email}
                  onChange={(e) => handleFieldChange('contact', 'email', e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Dirección Física Completa</label>
                <input
                  type="text"
                  value={localContent.contact.address}
                  onChange={(e) => handleFieldChange('contact', 'address', e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Google Maps Embed URL / Enlace Compartir</label>
                <input
                  type="text"
                  value={localContent.contact.googleMapsUrl}
                  onChange={(e) => handleFieldChange('contact', 'googleMapsUrl', e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50 font-mono"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {/* Redes sociales */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Enlaces de Redes Sociales (URLs Completas)</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-16 font-semibold text-slate-500">Instagram:</span>
                    <input
                      type="url"
                      value={localContent.contact.instagram}
                      onChange={(e) => handleFieldChange('contact', 'instagram', e.target.value)}
                      className="flex-1 min-h-[34px] rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 font-semibold text-slate-500">Facebook:</span>
                    <input
                      type="url"
                      value={localContent.contact.facebook}
                      onChange={(e) => handleFieldChange('contact', 'facebook', e.target.value)}
                      className="flex-1 min-h-[34px] rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 font-semibold text-slate-500">TikTok:</span>
                    <input
                      type="url"
                      value={localContent.contact.tiktok}
                      onChange={(e) => handleFieldChange('contact', 'tiktok', e.target.value)}
                      className="flex-1 min-h-[34px] rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 font-semibold text-slate-500">YouTube:</span>
                    <input
                      type="url"
                      value={localContent.contact.youtube}
                      onChange={(e) => handleFieldChange('contact', 'youtube', e.target.value)}
                      className="flex-1 min-h-[34px] rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Footer */}
          {activeTab === 'footer' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Pie de Página (Footer)</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Texto Descriptivo del Footer</label>
                <textarea
                  value={localContent.footer.text}
                  onChange={(e) => handleFieldChange('footer', 'text', e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Copyright o Crédito</label>
                <input
                  type="text"
                  value={localContent.footer.copyright}
                  onChange={(e) => handleFieldChange('footer', 'copyright', e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                />
              </div>

              {/* Links */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Enlaces Adicionales del Footer</label>
                  <button
                    type="button"
                    onClick={handleAddFooterLink}
                    className="min-h-[30px] px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Enlace</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {localContent.footer.links.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleUpdateFooterLink(idx, 'label', e.target.value)}
                        placeholder="Etiqueta"
                        className="flex-1 min-h-[36px] rounded-lg border border-slate-200 px-3 text-xs bg-white"
                      />
                      <select
                        value={link.url}
                        onChange={(e) => handleUpdateFooterLink(idx, 'url', e.target.value)}
                        className="w-40 min-h-[36px] rounded-lg border border-slate-200 px-2 text-xs bg-white"
                      >
                        <option value="home">Inicio (Buscador)</option>
                        <option value="accommodations">Alojamientos</option>
                        <option value="policies">Políticas</option>
                        <option value="contact">Contacto</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDeleteFooterLink(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Optimización SEO & Indexación</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Título Meta (SEO Title)</label>
                <input
                  type="text"
                  value={localContent.seo.title}
                  onChange={(e) => handleFieldChange('seo', 'title', e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50 font-semibold"
                  placeholder="ej: StayFlow Resort | Cabañas Exclusivas"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Meta-Descripción (Snippet del Buscador)</label>
                <textarea
                  value={localContent.seo.metaDescription}
                  onChange={(e) => handleFieldChange('seo', 'metaDescription', e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-none"
                  placeholder="Descripción concisa de 150-160 caracteres..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Keywords (Palabras clave, separadas por coma)</label>
                <input
                  type="text"
                  value={localContent.seo.keywords}
                  onChange={(e) => handleFieldChange('seo', 'keywords', e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50 font-mono"
                  placeholder="ej: cabañas, patagonia, alojamiento, resort"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Twitter Card (Formato)</label>
                  <select
                    value={localContent.seo.twitterCard}
                    onChange={(e) => handleFieldChange('seo', 'twitterCard', e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                  >
                    <option value="summary">Summary (Resumen pequeño)</option>
                    <option value="summary_large_image">Summary with Large Image (Imagen destacada grande)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Imagen Social (Compartir / OG Image)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localContent.seo.ogImage}
                      onChange={(e) => handleFieldChange('seo', 'ogImage', e.target.value)}
                      className="flex-1 min-h-[40px] rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => openMediaFor('seo.ogImage')}
                      className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Elegir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Mockup View Preview */}
        <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-24">
          <div className="flex justify-between items-center bg-slate-100 p-2 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider pl-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Vista Previa del Sitio (CMS Preview)</span>
            </span>
            <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-250">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-md cursor-pointer transition-all ${previewDevice === 'desktop' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}
                title="Vista de Computadora"
              >
                <Laptop className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-md cursor-pointer transition-all ${previewDevice === 'mobile' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}
                title="Vista de Teléfono"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Device Mockup Wrapper */}
          <div className="w-full bg-slate-100 border border-slate-200 rounded-3xl p-4 overflow-hidden relative shadow-inner">
            <div className={`mx-auto bg-white rounded-2xl overflow-hidden border border-slate-250 flex flex-col shadow-lg transition-all duration-300 ${
              previewDevice === 'mobile' ? 'max-w-[340px] h-[580px]' : 'w-full h-[580px]'
            }`}>
              
              {/* Fake Browser/Phone Top Bar */}
              <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center justify-between text-[10px] text-slate-400 shrink-0 font-mono select-none">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                </div>
                <div className="truncate max-w-[150px] bg-slate-200 px-3 py-0.5 rounded text-center text-[9px] font-bold tracking-wide">
                  {localContent.seo.title || 'Mi Sitio Web'}
                </div>
                <div className="flex items-center gap-1 text-[8px] font-bold">
                  <span>SSL</span>
                  <Check className="w-3 h-3 text-emerald-600 font-black" />
                </div>
              </div>

              {/* Fake Website Main Body Frame */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden text-xs text-slate-800 space-y-6">
                
                {/* Simulated Portal Header */}
                <header className="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center select-none sticky top-0 z-10 shadow-xs">
                  <strong className="text-slate-800 font-extrabold text-sm font-display tracking-tight flex items-center gap-1">
                    <div className="w-5 h-5 bg-emerald-700 text-white rounded flex items-center justify-center font-black text-[10px]">S</div>
                    <span>StayFlow Resort</span>
                  </strong>
                  <nav className="flex gap-2 text-[10px] font-bold text-slate-500">
                    <span className="text-emerald-700">Inicio</span>
                    <span>Alojamiento</span>
                    <span>Políticas</span>
                  </nav>
                </header>

                {/* Simulated Hero Section */}
                <section className="relative h-44 flex items-center justify-center text-center overflow-hidden bg-slate-950 text-white px-4">
                  <img 
                    src={localContent.home.heroImage || 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=400&q=80'} 
                    alt="Hero" 
                    className="absolute inset-0 w-full h-full object-cover opacity-50 select-none"
                  />
                  <div className="relative z-10 space-y-1.5 max-w-md">
                    <h1 className="font-display font-extrabold text-base leading-tight tracking-tight drop-shadow-sm">
                      {localContent.home.title || 'Título del Sitio'}
                    </h1>
                    <p className="text-[10px] text-slate-200 drop-shadow-xs line-clamp-2 max-w-sm mx-auto">
                      {localContent.home.subtitle || 'Subtítulo del hero descriptivo.'}
                    </p>
                    <button className="inline-block mt-2 bg-emerald-600 text-white font-bold text-[9px] px-3.5 py-1 rounded shadow-md select-none pointer-events-none">
                      {localContent.home.ctaText || 'Reservar'}
                    </button>
                  </div>
                </section>

                {/* Simulated About Section */}
                <section className="px-4 space-y-2 select-none">
                  <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider block">Sobre Nosotros</span>
                  <h3 className="font-display font-bold text-slate-800 text-sm leading-snug">{localContent.about.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{localContent.about.description}</p>
                  
                  {localContent.about.history && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] text-slate-400 italic leading-relaxed">
                      {localContent.about.history}
                    </div>
                  )}
                </section>

                {/* Simulated Services Section */}
                <section className="px-4 space-y-3 select-none">
                  <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider block">Servicios Destacados</span>
                  <div className="grid grid-cols-2 gap-2">
                    {localContent.services.filter(s => s.active).map(serv => (
                      <div key={serv.id} className="p-2 border border-slate-100 rounded-lg space-y-1 bg-white shadow-xs">
                        <div className="w-6 h-6 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center shrink-0">
                          <Sparkles className="w-3 h-3" />
                        </div>
                        <h4 className="font-bold text-[10.5px] text-slate-800">{serv.title}</h4>
                        <p className="text-[9px] text-slate-400 leading-tight line-clamp-2">{serv.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Simulated Gallery Section */}
                <section className="px-4 space-y-2 select-none">
                  <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider block">Nuestra Galería</span>
                  <div className="grid grid-cols-3 gap-1">
                    {localContent.gallery.filter(g => g.active).map(g => (
                      <div key={g.id} className="h-12 bg-slate-100 rounded overflow-hidden border border-slate-150">
                        <img src={g.url} alt={g.altText} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Simulated Policies Section */}
                <section className="px-4 space-y-2.5 bg-slate-50 py-3 border-y border-slate-100 select-none">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Horarios & Políticas</span>
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="space-y-0.5">
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Llegada (Check-in)</span>
                      <p className="font-bold text-slate-700">{localContent.policies.checkIn}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Salida (Check-out)</span>
                      <p className="font-bold text-slate-700">{localContent.policies.checkOut}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Cancelaciones</span>
                    <p className="text-slate-500 leading-snug">{localContent.policies.cancellations}</p>
                  </div>
                </section>

                {/* Simulated Contact Footer Area */}
                <footer className="bg-slate-900 text-white p-4 space-y-4 text-[10px] select-none">
                  <div className="space-y-2">
                    <strong className="text-sm font-extrabold text-slate-300 block">{localContent.contact.email}</strong>
                    <div className="text-slate-400 space-y-1">
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {localContent.contact.address}</p>
                      <p>WhatsApp: {localContent.contact.whatsapp}</p>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-800 text-[9px] text-slate-500">
                    <p className="mb-1">{localContent.footer.text}</p>
                    <p>{localContent.footer.copyright}</p>
                  </div>
                </footer>

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Media Manager Integration Modal */}
      <MediaManagerModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        resortId={resortId}
        entityType="website"
        entityId="website_cms_assets"
        onSelect={handleMediaSelect}
      />
    </div>
  );
};
