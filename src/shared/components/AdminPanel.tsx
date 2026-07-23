import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  House, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  CheckCircle, 
  XCircle, 
  Shield,
  Sliders, 
  Trees, 
  Tent, 
  Mountain, 
  Palmtree, 
  Compass, 
  TreePine, 
  Download, 
  Database,
  Plus,
  Trash2,
  Tag,
  Info,
  Layers,
  Lock,
  Unlock,
  Clock,
  Coins,
  Bed,
  Sparkles,
  MapPin,
  Star,
  Eye,
  EyeOff,
  Copy,
  Search,
  ArrowUpDown,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  Image as ImageIcon,
  Users,
  CreditCard,
  Bell,
  Shuffle,
  TrendingUp,
  Wrench,
  LineChart,
  BarChart,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useSidebarCollapse } from '../hooks/useSidebarCollapse';
import { Cabin, Booking, AppSettings, AccommodationType, Amenity } from '../../types';
import { Calendar } from './Calendar';
import { useSettings } from '../../modules/settings/contexts/SettingsContext';
import { useAccommodationTypes } from '../hooks/useAccommodationTypes';
import { useAmenities } from '../hooks/useAmenities';
import { useAccommodations } from '../hooks/useAccommodations';
import { useResort } from '../contexts/ResortContext';
import { useTenant } from '../../core/tenant/TenantContext';
import { MediaManagerModal } from '../../modules/media/components/MediaManagerModal';
import { AccommodationConfigPanel } from '../../modules/accommodation-config';
import { AvailabilityAdminPanel } from '../../modules/availability';
import { BookingsManager } from '../../modules/bookings/components/BookingsManager';
import { TimelineCalendar } from '../../modules/backoffice-calendar';
import { GuestManagement } from '../../modules/guests/components/GuestManagement';
import { GuestJourneyView } from '../../modules/guests/components/GuestJourneyView';
import { PricingDashboard } from '../../modules/pricing/components/PricingDashboard';
import { WebsiteSettingsEditor } from '../../modules/public-portal/components/WebsiteSettingsEditor';
import { WebsiteCMSEditor } from '../../modules/website-cms/components/WebsiteCMSEditor';
import { useOnboarding, OnboardingWizardPage } from '../../modules/onboarding';
import { PaymentsManager } from '../../modules/payments/components/PaymentsManager';
import { SaaSConfigEditor } from '../../core/tenant/components/SaaSConfigEditor';
import { RBACManagementPanel } from '../../modules/settings/components/RBACManagementPanel';
import { NotificationManagerPanel } from '../../modules/notifications/components/NotificationManagerPanel';
import { ChannelManagerDashboard } from '../../modules/channel-manager/components/ChannelManagerDashboard';
import { RevenueDashboard } from '../../modules/revenue/components/RevenueDashboard';
import { OperationsDashboard } from '../../modules/stay-operations/components/OperationsDashboard';
import { BIEngineDashboard } from '../../modules/business-intelligence/components/BIEngineDashboard';
import { Heart, Globe } from 'lucide-react';
import { CustomerSuccessSuite } from '../../modules/customer-success/components/CustomerSuccessSuite';
import { EnterpriseSuite } from '../../modules/enterprise-global/components/EnterpriseSuite';


interface AdminPanelProps {
  cabins: Cabin[];
  bookings: Booking[];
  settings: AppSettings | null;
  onUpdateCabin: (id: number, updatedData: Partial<Cabin>) => Promise<void>;
  onUpdateBookingStatus: (id: number, status: 'confirmed' | 'cancelled') => Promise<void>;
  onUpdateSettings: (updatedData: Partial<AppSettings>) => Promise<void>;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  cabins,
  bookings,
  settings,
  onUpdateCabin,
  onUpdateBookingStatus,
  onUpdateSettings,
  onLogout,
}) => {
  const { terminology } = useSettings();
  const { isFeatureEnabled, plan } = useTenant();
  const { types: accommodationTypes, saveType, deleteType } = useAccommodationTypes();
  const { amenities: resortAmenities, saveAmenity, deleteAmenity } = useAmenities();

  const [activeTab, setActiveTab] = useState<'cabins' | 'types' | 'calendar' | 'bookings' | 'settings' | 'availability' | 'guests' | 'pricing' | 'payments' | 'notifications' | 'channels' | 'guestJourney' | 'revenue' | 'operations' | 'analytics' | 'customerSuccess' | 'enterpriseGlobal'>('cabins');
  const [settingsSubTab, setSettingsSubTab] = useState<'tenant' | 'saas' | 'website' | 'cms' | 'wizard' | 'rbac'>('tenant');
  const [openCabinId, setOpenCabinId] = useState<number | null>(null);
  const [selectedCalendarCabinId, setSelectedCalendarCabinId] = useState<number>(() => cabins[0]?.id || 1);

  // New Type Form State
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('trees');
  const [newTypeDefaultAmenities, setNewTypeDefaultAmenities] = useState<string[]>([]);
  const [newTypeCustomFields, setNewTypeCustomFields] = useState<{key: string; label: string; type: 'string' | 'number' | 'boolean'}[]>([]);
  const [newCFKey, setNewCFKey] = useState('');
  const [newCFLabel, setNewCFLabel] = useState('');
  const [newCFType, setNewCFType] = useState<'string' | 'number' | 'boolean'>('string');

  // New Amenity Form State
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityIcon, setNewAmenityIcon] = useState('Wifi');
  const [newAmenityCategory, setNewAmenityCategory] = useState('General');

  // Sorting bookings to show latest first
  const sortedBookings = [...bookings].sort((a, b) => b.id - a.id);

  // State for cabins forms
  const [editingCabins, setEditingCabins] = useState<Record<number, Partial<Cabin>>>({});

  // Onboarding Context
  const { progress, loading: onboardingLoading } = useOnboarding();
  const [showWizard, setShowWizard] = useState(false);

  // Resort Context
  const { resort } = useResort();

  // Sidebar collapse hook
  const { isCollapsed: sidebarCollapsed, toggleCollapse: toggleSidebar } = useSidebarCollapse();

  // Media Modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState<'cover' | 'gallery'>('cover');
  const [activeCabinIdForMedia, setActiveCabinIdForMedia] = useState<number | 'new' | null>(null);

  // Helper to reorder array items
  const moveGalleryItem = (cabinId: number | 'new', index: number, direction: 'left' | 'right') => {
    const currentList = cabinId === 'new'
      ? [...(newCabin.images || [])]
      : [...(editingCabins[cabinId as number]?.images || cabins.find(c => c.id === cabinId)?.images || [])];
    
    if (direction === 'left' && index > 0) {
      const temp = currentList[index];
      currentList[index] = currentList[index - 1];
      currentList[index - 1] = temp;
    } else if (direction === 'right' && index < currentList.length - 1) {
      const temp = currentList[index];
      currentList[index] = currentList[index + 1];
      currentList[index + 1] = temp;
    }

    if (cabinId === 'new') {
      setNewCabin(prev => ({ ...prev, images: currentList }));
    } else {
      handleFieldChange(cabinId as number, 'images', currentList);
    }
  };

  // Helper to set an existing gallery image as the cover image
  const setGalleryImageAsCover = (cabinId: number | 'new', imgUrl: string) => {
    if (cabinId === 'new') {
      setNewCabin(prev => ({ ...prev, image: imgUrl }));
    } else {
      handleFieldChange(cabinId as number, 'image', imgUrl);
    }
  };

  // CRUD Hook
  const { 
    saveAccommodation: saveCabin, 
    deleteAccommodation: deleteCabin 
  } = useAccommodations();

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortOption, setSortOption] = useState('sortOrder-asc');

  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newCabin, setNewCabin] = useState<Partial<Cabin>>({
    name: '',
    slug: '',
    type: 'cabana',
    status: 'available',
    description: '',
    shortDescription: '',
    price: 15000,
    discount: 0,
    offer: '',
    category: 'standard',
    capacity: 2,
    maxGuests: 4,
    minGuests: 1,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    squareMeters: 30,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80',
    images: [],
    amenities: [],
    customFields: {},
    featured: false,
    active: true,
    location: '',
    coordinates: { lat: -34.6037, lng: -58.3816 },
    policies: {
      checkInTime: '14:00',
      checkOutTime: '10:00',
      rules: ['Prohibido fumar en interiores', 'Mascotas permitidas con aviso previo'],
      cancellationPolicy: 'Cancelación gratuita hasta 7 días antes del check-in'
    },
    availabilityBlockedDates: []
  });

  // Action Handlers
  const handleToggleFeatured = async (cabin: Cabin) => {
    try {
      await saveCabin({
        ...cabin,
        featured: !cabin.featured
      });
    } catch (err) {
      console.error('Error toggling featured status:', err);
    }
  };

  const handleToggleActive = async (cabin: Cabin) => {
    try {
      await saveCabin({
        ...cabin,
        active: cabin.active === false ? true : false
      });
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  const handleDuplicateCabin = async (cabin: Cabin) => {
    try {
      const duplicated: Cabin = {
        ...cabin,
        id: Date.now(),
        name: `${cabin.name} (Copia)`,
        slug: cabin.slug ? `${cabin.slug}-copia` : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveCabin(duplicated);
    } catch (err) {
      console.error('Error duplicating cabin:', err);
    }
  };

  const handleDeleteCabin = async (cabinId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este alojamiento? Esta acción no se puede deshacer.')) {
      try {
        await deleteCabin(cabinId);
        if (openCabinId === cabinId) {
          setOpenCabinId(null);
        }
      } catch (err) {
        console.error('Error deleting cabin:', err);
      }
    }
  };

  const handleCreateCabin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCabin.name) return;
    try {
      await saveCabin({
        ...newCabin,
        id: Date.now()
      } as Cabin);
      setIsCreating(false);
      // Reset
      setNewCabin({
        name: '',
        slug: '',
        type: 'cabana',
        status: 'available',
        description: '',
        shortDescription: '',
        price: 15000,
        discount: 0,
        offer: '',
        category: 'standard',
        capacity: 2,
        maxGuests: 4,
        minGuests: 1,
        bedrooms: 1,
        beds: 2,
        bathrooms: 1,
        squareMeters: 30,
        rating: 5,
        image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80',
        images: [],
        amenities: [],
        customFields: {},
        featured: false,
        active: true,
        location: '',
        coordinates: { lat: -34.6037, lng: -58.3816 },
        policies: {
          checkInTime: '14:00',
          checkOutTime: '10:00',
          rules: ['Prohibido fumar en interiores'],
          cancellationPolicy: 'Cancelación gratuita'
        },
        availabilityBlockedDates: []
      });
    } catch (err) {
      console.error('Error creating cabin:', err);
    }
  };

  const handleNewCabinFieldChange = (field: keyof Cabin, value: any) => {
    setNewCabin(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewCabinNestedFieldChange = (parentField: string, childField: string, value: any) => {
    const parentObj = (newCabin as any)[parentField] || {};
    setNewCabin(prev => ({
      ...prev,
      [parentField]: {
        ...parentObj,
        [childField]: value
      }
    }));
  };

  const handleNewCabinCustomFieldChange = (fieldKey: string, value: any) => {
    const currentCustomFields = newCabin.customFields || {};
    setNewCabin(prev => ({
      ...prev,
      customFields: {
        ...currentCustomFields,
        [fieldKey]: value
      }
    }));
  };

  // Memoized filter & sort logic
  const filteredAndSortedCabins = React.useMemo(() => {
    let result = [...cabins];

    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query) ||
        (c.slug && c.slug.toLowerCase().includes(query))
      );
    }

    // 2. Status Filter
    if (statusFilter !== '') {
      result = result.filter(c => c.status === statusFilter);
    }

    // 3. Type Filter
    if (typeFilter !== '') {
      result = result.filter(c => c.type === typeFilter);
    }

    // 4. Sorting
    result.sort((a, b) => {
      const [field, direction] = sortOption.split('-');
      const isAsc = direction === 'asc';

      if (field === 'price') {
        return isAsc ? a.price - b.price : b.price - a.price;
      }
      if (field === 'name') {
        return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (field === 'sortOrder') {
        const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : 0;
        const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : 0;
        return isAsc ? orderA - orderB : orderB - orderA;
      }
      if (field === 'updatedAt') {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return isAsc ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });

    return result;
  }, [cabins, searchQuery, statusFilter, typeFilter, sortOption]);

  // State for Settings form
  const [editingSettings, setEditingSettings] = useState<AppSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (settings) {
      setEditingSettings(settings);
    }
  }, [settings]);

  const handleSettingsFieldChange = (field: keyof AppSettings, value: any) => {
    if (!editingSettings) return;
    setEditingSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleTerminologyChange = (field: 'singular' | 'plural', value: string) => {
    if (!editingSettings) return;
    const currentTerm = editingSettings.terminology || { singular: '', plural: '' };
    setEditingSettings(prev => prev ? {
      ...prev,
      terminology: {
        ...currentTerm,
        [field]: value
      }
    } : null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSettings) return;
    setSaveStatus('saving');
    try {
      await onUpdateSettings(editingSettings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleDownloadFile = (data: any, filename: string) => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const handleFieldChange = (cabinId: number, field: keyof Cabin, value: any) => {
    setEditingCabins(prev => ({
      ...prev,
      [cabinId]: {
        ...prev[cabinId],
        [field]: value
      }
    }));
  };

  const handleNestedFieldChange = (cabinId: number, parentField: string, childField: string, value: any) => {
    const originalCabin = cabins.find(c => c.id === cabinId) || {};
    const currentCabinEdit = editingCabins[cabinId] || {};
    const parentObj = (currentCabinEdit as any)[parentField] || (originalCabin as any)[parentField] || {};
    setEditingCabins(prev => ({
      ...prev,
      [cabinId]: {
        ...prev[cabinId],
        [parentField]: {
          ...parentObj,
          [childField]: value
        }
      }
    }));
  };

  const handleCustomFieldChange = (cabinId: number, fieldKey: string, value: any) => {
    const originalCabin = cabins.find(c => c.id === cabinId) || {};
    const currentCabinEdit = editingCabins[cabinId] || {};
    const currentCustomFields = (currentCabinEdit as any).customFields || (originalCabin as any).customFields || {};
    setEditingCabins(prev => ({
      ...prev,
      [cabinId]: {
        ...prev[cabinId],
        customFields: {
          ...currentCustomFields,
          [fieldKey]: value
        }
      }
    }));
  };

  const handleArrayAdd = (cabinId: number, field: string, value: any) => {
    const originalCabin = cabins.find(c => c.id === cabinId) || {};
    const currentCabinEdit = editingCabins[cabinId] || {};
    const currentArr = (currentCabinEdit as any)[field] || (originalCabin as any)[field] || [];
    setEditingCabins(prev => ({
      ...prev,
      [cabinId]: {
        ...prev[cabinId],
        [field]: [...currentArr, value]
      }
    }));
  };

  const handleArrayRemove = (cabinId: number, field: string, indexToRemove: number) => {
    const originalCabin = cabins.find(c => c.id === cabinId) || {};
    const currentCabinEdit = editingCabins[cabinId] || {};
    const currentArr = (currentCabinEdit as any)[field] || (originalCabin as any)[field] || [];
    setEditingCabins(prev => ({
      ...prev,
      [cabinId]: {
        ...prev[cabinId],
        [field]: currentArr.filter((_: any, i: number) => i !== indexToRemove)
      }
    }));
  };

  const handleSaveCabin = async (e: React.FormEvent, cabinId: number) => {
    e.preventDefault();
    const updatedFields = editingCabins[cabinId] || {};
    await onUpdateCabin(cabinId, updatedFields);
    // Remove from editing dictionary
    const copy = { ...editingCabins };
    delete copy[cabinId];
    setEditingCabins(copy);
    setOpenCabinId(null);
  };

  if (showWizard) {
    return <OnboardingWizardPage onCompleteRedirect={() => setShowWizard(false)} />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)] w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar - responsive: dark vertical sidebar on desktop, compact horizontal bar on mobile */}
      <aside className={`w-full ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} bg-slate-900 dark:bg-slate-950 text-slate-300 shrink-0 border-r border-slate-800 lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] flex flex-col z-20 transition-all duration-300 ease-in-out`}>
        
        {/* Sidebar Header with Hamburger Toggle */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
          {!sidebarCollapsed && (
            <div className="min-w-0 pr-2">
              <h3 className="font-display font-extrabold text-sm text-white truncate">{resort?.name || 'Mi Complejo'}</h3>
              <span className="text-[10px] text-slate-400 font-bold truncate block">{resort?.country || 'Ubicación General'}</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 mx-auto"
            title={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            aria-label="Alternar menú lateral"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 text-indigo-400" /> : <PanelLeftClose className="w-5 h-5 text-slate-400" />}
          </button>
        </div>

        {/* Onboarding progress inside sidebar */}
        {progress && !progress.completed && (
          sidebarCollapsed ? (
            <div className="hidden lg:flex justify-center p-3 border-b border-slate-800/80">
              <button
                onClick={() => setShowWizard(true)}
                className="p-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all"
                title="Asistente de Onboarding Pendiente"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 m-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Asistente de Onboarding</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${Math.round(((progress.currentStep - 1) / 5) * 100)}%` }}
                />
              </div>
              <button
                onClick={() => setShowWizard(true)}
                className="w-full py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer"
              >
                Completar Asistente
              </button>
            </div>
          )
        )}

        {/* Navigation buttons */}
        <nav className="flex-1 px-3 py-4 space-y-1 sidebar-scroll max-lg:flex max-lg:space-y-0 max-lg:gap-1.5 max-lg:py-2.5 max-lg:px-4 max-lg:overflow-x-auto max-lg:no-scrollbar">
          <button
            onClick={() => {
              setActiveTab('settings');
              setSettingsSubTab('wizard');
            }}
            title="Asistente Inicial"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'settings' && settingsSubTab === 'wizard'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === 'settings' && settingsSubTab === 'wizard' ? 'text-slate-950' : 'text-amber-400 animate-pulse'}`} />
              {!sidebarCollapsed && <span>Asistente Inicial</span>}
            </div>
            {!sidebarCollapsed && progress && !progress.completed && (
              <span className="text-[9px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">Pendiente</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cabins')}
            title={terminology.plural}
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'cabins' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <House className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>{terminology.plural}</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('types')}
            title="Tipos & Extras"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'types' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Tipos & Extras</span>}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            title="Calendario"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'calendar' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Calendario</span>}
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            title="Reservas"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'bookings' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Reservas</span>}
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            title="Pagos"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'payments' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Pagos</span>}
          </button>

          <button
            onClick={() => setActiveTab('guests')}
            title="Huéspedes"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'guests' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Huéspedes</span>}
          </button>

          <button
            onClick={() => setActiveTab('guestJourney')}
            title="Check-in Digital"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'guestJourney' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Check-in Digital</span>}
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            title="Tarifas"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'pricing' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Tarifas</span>}
          </button>

          <button
            onClick={() => setActiveTab('revenue')}
            title="Revenue Engine"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'revenue' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Revenue Engine</span>}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            title="Business Intelligence"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'analytics' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <LineChart className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Business Intelligence</span>}
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            title="Disponibilidad"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'availability' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Disponibilidad</span>}
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            title="Operaciones"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'operations' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Wrench className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Operaciones</span>}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            title="Notificaciones"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'notifications' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Notificaciones</span>}
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            title="Channel Manager"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'channels' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Shuffle className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Channel Manager</span>}
          </button>

          <button
            onClick={() => setActiveTab('customerSuccess')}
            title="Soporte & CS Hub"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'customerSuccess' ? 'bg-rose-700 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Heart className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Soporte & CS Hub</span>}
          </button>

          <button
            onClick={() => setActiveTab('enterpriseGlobal')}
            title="Global Enterprise"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'enterpriseGlobal' ? 'bg-indigo-700 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0 text-indigo-400" />
            {!sidebarCollapsed && <span>Global Enterprise</span>}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            title="Ajustes"
            className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center px-2' : 'px-3.5'} gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:py-2 max-lg:px-3 max-lg:rounded-lg shrink-0 ${
              activeTab === 'settings' ? 'bg-forest text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Ajustes</span>}
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="hidden lg:flex p-4 border-t border-slate-800 bg-slate-950/20 flex-col gap-2">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono">Modo Online SaaS</span>
              </div>
              <button 
                onClick={onLogout}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <div className="flex justify-center py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Modo Online SaaS" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28">
        
        {/* Onboarding progress alert (if viewed on mobile or tablet) */}
        {progress && !progress.completed && (
          <div className="lg:hidden mb-6 p-5 rounded-2xl border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Asistente de Configuración Inicial Pendiente</span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Completa el asistente paso a paso para configurar tu primer alojamiento, tarifas base, información de contacto oficial y publicar tu sitio web.
              </p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer shrink-0"
            >
              Continuar Asistente
            </button>
          </div>
        )}

        {activeTab !== 'customerSuccess' && activeTab !== 'enterpriseGlobal' && (
          <div className="flex justify-between items-center mb-5 border-b border-line pb-3.5">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-ink">
                {activeTab === 'cabins' && `Gestión de ${terminology.plural}`}
                {activeTab === 'types' && "Tipos de Alojamiento & Extras"}
                {activeTab === 'calendar' && "Calendario General"}
                {activeTab === 'bookings' && "Gestión de Reservas"}
                {activeTab === 'payments' && "Control de Transacciones y Pagos"}
                {activeTab === 'guests' && "Base de Huéspedes"}
                {activeTab === 'pricing' && "Planificación de Tarifas"}
                {activeTab === 'availability' && "Bloqueos de Disponibilidad"}
                {activeTab === 'notifications' && "Motor de Automatización de Comunicaciones"}
                {activeTab === 'channels' && "Channel Manager - Sincronización OTA"}
                {activeTab === 'settings' && "Ajustes de Configuración"}
              </h2>
              <p className="text-xs text-muted">
                {activeTab === 'cabins' && `Crea, edita y configura las características de tus ${terminology.plural.toLowerCase()}.`}
                {activeTab === 'types' && "Define categorías de habitaciones, amenities del resort e inventarios generales."}
                {activeTab === 'calendar' && "Línea de tiempo interactiva con visualización de reservas por alojamiento."}
                {activeTab === 'bookings' && "Control de check-in/check-out, estados de pago y solicitudes pendientes."}
                {activeTab === 'payments' && "Auditoría de cobros, reembolsos, estado de pasarelas y trazabilidad de transacciones."}
                {activeTab === 'guests' && "Base de Huéspedes."}
                {activeTab === 'pricing' && "Planificación de Tarifas."}
                {activeTab === 'availability' && "Cierre de fechas por mantenimiento, temporadas bajas o reservas externas."}
                {activeTab === 'notifications' && "Monitorea la cola de mensajes salientes, reintentos y plantillas dinámicas multicanal (Email, WhatsApp, SMS)."}
                {activeTab === 'channels' && "Sincroniza inventario, tarifas y restricciones con múltiples canales como Booking.com y Airbnb con un motor desacoplado."}
                {activeTab === 'settings' && "Personaliza el branding, dominio del sitio web público y contenidos del CMS."}
              </p>
            </div>
          </div>
        )}

      {/* Tab: Customer Success Suite */}
      {activeTab === 'customerSuccess' && (
        <CustomerSuccessSuite />
      )}

      {/* Tab: Global Enterprise Suite */}
      {activeTab === 'enterpriseGlobal' && (
        <EnterpriseSuite />
      )}

      {/* Tab: Notifications Manager */}
      {activeTab === 'notifications' && (
        <NotificationManagerPanel />
      )}

      {/* Tab: Channel Manager Dashboard */}
      {activeTab === 'channels' && (
        <ChannelManagerDashboard />
      )}

      {/* Tab 1: Cabins Manager */}
      {activeTab === 'cabins' && (
        <div className="space-y-6">
          {/* Toolbar: Search, Filters & Sorting */}
          <div className="bg-white p-4 rounded-2xl border border-line shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción o slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-line text-xs bg-white outline-none focus:border-forest"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                >
                  <option value="">Todos los Estados</option>
                  <option value="available">🟢 Disponible</option>
                  <option value="maintenance">🔧 En Mantenimiento</option>
                  <option value="occupied">🔴 Ocupado</option>
                  <option value="inactive">⚪ Inactivo</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="w-full md:w-48">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                >
                  <option value="">Todos los Tipos</option>
                  {accommodationTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.displayName}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div className="w-full md:w-48">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                >
                  <option value="sortOrder-asc">Orden (Menor a Mayor)</option>
                  <option value="sortOrder-desc">Orden (Mayor a Menor)</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="name-asc">Nombre: A-Z</option>
                  <option value="name-desc">Nombre: Z-A</option>
                  <option value="updatedAt-desc">Última Actualización</option>
                </select>
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-end pt-2 border-t border-line/50">
              <button
                type="button"
                onClick={() => setIsCreating(!isCreating)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? 'Cancelar Creación' : 'Crear Nuevo Alojamiento'}</span>
              </button>
            </div>
          </div>

          {/* Creation Form */}
          {isCreating && (
            <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-forest flex items-center gap-2 pb-3 border-b border-line">
                <Plus className="w-5 h-5" /> Crear Nuevo Alojamiento (Formulario de Alta)
              </h2>

              <form onSubmit={handleCreateCabin} className="space-y-6">
                {/* Sección 1: Información Básica */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-line/60 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                    <House className="w-3.5 h-3.5" /> 1. Información Básica
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Nombre *</label>
                      <input 
                        type="text"
                        value={newCabin.name || ''}
                        onChange={(e) => handleNewCabinFieldChange('name', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Tipo de Alojamiento *</label>
                      <select 
                        value={newCabin.type || ''}
                        onChange={(e) => handleNewCabinFieldChange('type', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest font-semibold"
                        required
                      >
                        <option value="">-- Seleccionar Tipo --</option>
                        {accommodationTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.displayName} ({t.id})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Slug (URL amigable)</label>
                      <input 
                        type="text"
                        value={newCabin.slug || ''}
                        placeholder="Auto-generar si vacío"
                        onChange={(e) => handleNewCabinFieldChange('slug', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Orden de Visualización</label>
                      <input 
                        type="number"
                        value={newCabin.sortOrder || 0}
                        onChange={(e) => handleNewCabinFieldChange('sortOrder', Number(e.target.value))}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Estado de Disponibilidad</label>
                      <select 
                        value={newCabin.status || 'available'}
                        onChange={(e) => handleNewCabinFieldChange('status', e.target.value as any)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest font-bold text-forest"
                      >
                        <option value="available">🟢 Disponible / Reservable</option>
                        <option value="maintenance">🔧 En Mantenimiento</option>
                        <option value="occupied">🔴 Ocupado</option>
                        <option value="inactive">⚪ Inactivo / No listar</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-6 items-center bg-[#f8fafc] p-3 rounded-xl border border-line/50 md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold select-none">
                        <input 
                          type="checkbox"
                          checked={newCabin.active !== false}
                          onChange={(e) => handleNewCabinFieldChange('active', e.target.checked)}
                          className="w-4 h-4 rounded text-forest focus:ring-forest"
                        />
                        <span>Visible en el Catálogo</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold select-none">
                        <input 
                          type="checkbox"
                          checked={!!newCabin.featured}
                          onChange={(e) => handleNewCabinFieldChange('featured', e.target.checked)}
                          className="w-4 h-4 rounded text-forest focus:ring-forest"
                        />
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Destacado
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">URL de Imagen Principal *</label>
                      <div className="flex gap-2">
                        <input 
                          type="url"
                          value={newCabin.image || ''}
                          onChange={(e) => handleNewCabinFieldChange('image', e.target.value)}
                          className="flex-1 min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCabinIdForMedia('new');
                            setMediaModalMode('cover');
                            setIsMediaModalOpen(true);
                          }}
                          className="px-4 bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          Explorar Storage
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Descripción Corta (Folleto)</label>
                      <input 
                        type="text"
                        value={newCabin.shortDescription || ''}
                        placeholder="Breve descripción de una línea"
                        onChange={(e) => handleNewCabinFieldChange('shortDescription', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Descripción Detallada *</label>
                      <textarea 
                        value={newCabin.description || ''}
                        onChange={(e) => handleNewCabinFieldChange('description', e.target.value)}
                        rows={1}
                        className="w-full rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest resize-y min-h-[44px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-ink mb-1">Texto de Oferta / Promoción</label>
                      <input 
                        type="text"
                        value={newCabin.offer || ''}
                        placeholder="Ej: Escapada de fin de semana"
                        onChange={(e) => handleNewCabinFieldChange('offer', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Categoría</label>
                      <select 
                        value={newCabin.category || 'standard'}
                        onChange={(e) => handleNewCabinFieldChange('category', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                      >
                        <option value="couples">Parejas</option>
                        <option value="family">Familias</option>
                        <option value="luxury">Lujo / Premium</option>
                        <option value="standard">Estándar</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sección 2: Tarifas y Capacidad */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-line/60 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                    <Coins className="w-3.5 h-3.5" /> 2. Tarifas, Precios y Capacidad
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Precio Base / noche *</label>
                      <input 
                        type="number"
                        value={newCabin.price || 0}
                        min={0}
                        onChange={(e) => handleNewCabinFieldChange('price', Number(e.target.value))}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Descuento (%)</label>
                      <input 
                        type="number"
                        value={newCabin.discount || 0}
                        min={0}
                        max={100}
                        onChange={(e) => handleNewCabinFieldChange('discount', Number(e.target.value))}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Capacidad Estándar *</label>
                      <input 
                        type="number"
                        value={newCabin.capacity || 2}
                        min={1}
                        onChange={(e) => handleNewCabinFieldChange('capacity', Number(e.target.value))}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Mín. Huéspedes</label>
                      <input 
                        type="number"
                        value={newCabin.minGuests || 1}
                        min={1}
                        onChange={(e) => handleNewCabinFieldChange('minGuests', Number(e.target.value))}
                        className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Máx. Huéspedes</label>
                      <input 
                        type="number"
                        value={newCabin.maxGuests || 4}
                        min={1}
                        onChange={(e) => handleNewCabinFieldChange('maxGuests', Number(e.target.value))}
                        className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Dormitorios</label>
                      <input 
                        type="number"
                        value={newCabin.bedrooms || 1}
                        min={0}
                        onChange={(e) => handleNewCabinFieldChange('bedrooms', Number(e.target.value))}
                        className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Camas</label>
                      <input 
                        type="number"
                        value={newCabin.beds || 2}
                        min={1}
                        onChange={(e) => handleNewCabinFieldChange('beds', Number(e.target.value))}
                        className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Baños</label>
                      <input 
                        type="number"
                        value={newCabin.bathrooms || 1}
                        min={0}
                        onChange={(e) => handleNewCabinFieldChange('bathrooms', Number(e.target.value))}
                        className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Metros Cuadrados (m²)</label>
                      <input 
                        type="number"
                        value={newCabin.squareMeters || 30}
                        min={1}
                        onChange={(e) => handleNewCabinFieldChange('squareMeters', Number(e.target.value))}
                        className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 3: Atributos Dinámicos y Amenities */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-line/60 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                    <Sliders className="w-3.5 h-3.5" /> 3. Campos Personalizados & Amenities
                  </h3>

                  {/* Custom Fields depending on type */}
                  <div>
                    <span className="block text-xs font-bold text-ink mb-2">Metadata del Tipo Seleccionado:</span>
                    {(() => {
                      const selectedTypeObj = accommodationTypes.find(t => t.id === newCabin.type);
                      if (!selectedTypeObj || !selectedTypeObj.customFields || selectedTypeObj.customFields.length === 0) {
                        return <p className="text-xs text-muted italic">Selecciona un tipo de alojamiento que contenga campos personalizados para completarlos aquí.</p>;
                      }
                      const cFields = newCabin.customFields || {};
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-line">
                          {selectedTypeObj.customFields.map((f) => (
                            <div key={f.key}>
                              <label className="block text-[11px] font-bold text-[#3d4842] mb-1">{f.label}</label>
                              {f.type === 'boolean' ? (
                                <select
                                  value={cFields[f.key] === undefined ? 'false' : String(cFields[f.key])}
                                  onChange={(e) => handleNewCabinCustomFieldChange(f.key, e.target.value === 'true')}
                                  className="w-full min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                                >
                                  <option value="true">Sí</option>
                                  <option value="false">No</option>
                                </select>
                              ) : f.type === 'number' ? (
                                <input
                                  type="number"
                                  value={cFields[f.key] || ''}
                                  onChange={(e) => handleNewCabinCustomFieldChange(f.key, Number(e.target.value))}
                                  className="w-full min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={cFields[f.key] || ''}
                                  onChange={(e) => handleNewCabinCustomFieldChange(f.key, e.target.value)}
                                  className="w-full min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Checkbox list of resort amenities */}
                  <div>
                    <span className="block text-xs font-bold text-ink mb-1.5">Amenities Disponibles:</span>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto border border-line p-2.5 bg-white rounded-lg">
                      {resortAmenities.map((amenity) => {
                        const isChecked = (newCabin.amenities || []).includes(amenity.id);
                        return (
                          <label key={amenity.id} className="flex items-center gap-2 cursor-pointer text-xs p-1 hover:bg-slate-50 rounded select-none">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentList = newCabin.amenities || [];
                                if (e.target.checked) {
                                  handleNewCabinFieldChange('amenities', [...currentList, amenity.id]);
                                } else {
                                  handleNewCabinFieldChange('amenities', currentList.filter(id => id !== amenity.id));
                                }
                              }}
                              className="rounded text-forest focus:ring-forest"
                            />
                            <span className="font-medium text-ink truncate">{amenity.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sección 4: Ubicación, Políticas y Reglas */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-line/60 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                    <MapPin className="w-3.5 h-3.5" /> 4. Ubicación y Políticas
                  </h3>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Ubicación / Sector</label>
                      <input 
                        type="text"
                        value={newCabin.location || ''}
                        placeholder="Ej: Sector Bosque Alto"
                        onChange={(e) => handleNewCabinFieldChange('location', e.target.value)}
                        className="w-full min-h-[40px] rounded-lg border border-line px-2.5 py-1 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Tags (coma)</label>
                      <input 
                        type="text"
                        value={(newCabin.tags || []).join(', ')}
                        placeholder="ej: lujo, vista-lago"
                        onChange={(e) => handleNewCabinFieldChange('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full min-h-[40px] rounded-lg border border-line px-2.5 py-1 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Policies */}
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Check-In</label>
                        <input 
                          type="text"
                          value={newCabin.policies?.checkInTime || '14:00'}
                          onChange={(e) => handleNewCabinNestedFieldChange('policies', 'checkInTime', e.target.value)}
                          className="w-full min-h-[38px] rounded-lg border border-line px-2.5 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Check-Out</label>
                        <input 
                          type="text"
                          value={newCabin.policies?.checkOutTime || '10:00'}
                          onChange={(e) => handleNewCabinNestedFieldChange('policies', 'checkOutTime', e.target.value)}
                          className="w-full min-h-[38px] rounded-lg border border-line px-2.5 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Política de Cancelación</label>
                      <textarea 
                        value={newCabin.policies?.cancellationPolicy || 'Cancelación gratuita'}
                        onChange={(e) => handleNewCabinNestedFieldChange('policies', 'cancellationPolicy', e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-4 pt-4 border-t border-line">
                  <button 
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-ink font-bold text-sm transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Nuevo Alojamiento</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {filteredAndSortedCabins.map((cabin) => {
            const isOpen = openCabinId === cabin.id;
            const currentEdit = editingCabins[cabin.id] || {};
            const finalFields = { ...cabin, ...currentEdit };

            return (
              <div 
                key={cabin.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all"
              >
                {/* Header accordion */}
                <div 
                  onClick={() => setOpenCabinId(isOpen ? null : cabin.id)}
                  className="flex items-center gap-3.5 p-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <img 
                    src={cabin.image} 
                    alt={cabin.name}
                    className="w-[62px] h-[55px] object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-ink truncate">{cabin.name}</strong>
                      {cabin.featured && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-full font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> DESTACADO
                        </span>
                      )}
                      {cabin.active === false && (
                        <span className="inline-flex items-center text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.2 rounded-full font-bold">
                          OCULTO
                        </span>
                      )}
                    </div>
                    <small className="block text-xs text-muted mt-1">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cabin.price)} / noche
                      {cabin.discount > 0 && ` · ${cabin.discount}% desc`}
                      {cabin.location && ` · 📍 ${cabin.location}`}
                    </small>
                  </div>

                  {/* Fast Actions Group */}
                  <div className="flex items-center gap-1.5 pr-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Featured toggle */}
                    <button 
                      type="button"
                      onClick={() => handleToggleFeatured(cabin)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        cabin.featured 
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                          : 'text-slate-400 bg-slate-50 hover:bg-slate-100 border border-line/40'
                      }`}
                      title={cabin.featured ? "Quitar destacado" : "Destacar"}
                    >
                      <Star className={`w-3.5 h-3.5 ${cabin.featured ? 'fill-amber-500' : ''}`} />
                    </button>

                    {/* Active toggle */}
                    <button 
                      type="button"
                      onClick={() => handleToggleActive(cabin)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        cabin.active !== false 
                          ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                          : 'text-slate-400 bg-slate-50 hover:bg-slate-100 border border-line/40'
                      }`}
                      title={cabin.active !== false ? "Ocultar en el catálogo" : "Mostrar en el catálogo"}
                    >
                      {cabin.active !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Duplicate button */}
                    <button 
                      type="button"
                      onClick={() => handleDuplicateCabin(cabin)}
                      className="p-1.5 rounded-lg text-slate-500 bg-slate-50 hover:bg-slate-100 border border-line/40 transition-colors cursor-pointer"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button 
                      type="button"
                      onClick={() => handleDeleteCabin(cabin.id)}
                      className="p-1.5 rounded-lg text-danger bg-rose-50 hover:bg-rose-100 border border-line/40 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Sort Order Indicator */}
                    <div className="hidden sm:block text-[9px] font-bold text-muted bg-slate-100 px-2 py-1 rounded font-mono" title="Orden de visualización">
                      #{cabin.sortOrder || 0}
                    </div>
                  </div>

                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </div>

                {/* Form Editor content */}
                {isOpen && (
                  <form onSubmit={(e) => handleSaveCabin(e, cabin.id)} className="p-5 border-t border-line bg-[#fafbf9] space-y-6">
                    
                    {/* Sección 1: Información Básica */}
                    <div className="bg-white p-4 rounded-xl border border-line/60 shadow-xs space-y-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                        <House className="w-3.5 h-3.5" /> 1. Información Básica del Alojamiento
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Nombre del Alojamiento</label>
                          <input 
                            type="text"
                            value={finalFields.name}
                            onChange={(e) => handleFieldChange(cabin.id, 'name', e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Tipo de Alojamiento (SaaS Config)</label>
                          <select 
                            value={finalFields.type || ''}
                            onChange={(e) => handleFieldChange(cabin.id, 'type', e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest font-semibold"
                            required
                          >
                            <option value="">-- Seleccionar Tipo --</option>
                            {accommodationTypes.map(t => (
                              <option key={t.id} value={t.id}>{t.displayName} ({t.id})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Slug (URL amigable)</label>
                          <input 
                            type="text"
                            value={finalFields.slug || ''}
                            placeholder="Auto-generar si vacío"
                            onChange={(e) => handleFieldChange(cabin.id, 'slug', e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Orden de Visualización</label>
                          <input 
                            type="number"
                            value={finalFields.sortOrder || 0}
                            onChange={(e) => handleFieldChange(cabin.id, 'sortOrder', Number(e.target.value))}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Estado de Disponibilidad</label>
                          <select 
                            value={finalFields.status || 'available'}
                            onChange={(e) => handleFieldChange(cabin.id, 'status', e.target.value as any)}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest font-bold text-forest"
                          >
                            <option value="available">🟢 Disponible / Reservable</option>
                            <option value="maintenance">🔧 En Mantenimiento</option>
                            <option value="occupied">🔴 Ocupado</option>
                            <option value="inactive">⚪ Inactivo / No listar</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-6 items-center bg-[#f8fafc] p-3 rounded-xl border border-line/50 md:col-span-2">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold select-none">
                            <input 
                              type="checkbox"
                              checked={finalFields.active !== false}
                              onChange={(e) => handleFieldChange(cabin.id, 'active', e.target.checked)}
                              className="w-4 h-4 rounded text-forest focus:ring-forest"
                            />
                            <span>Visible en el Catálogo</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold select-none">
                            <input 
                              type="checkbox"
                              checked={!!finalFields.featured}
                              onChange={(e) => handleFieldChange(cabin.id, 'featured', e.target.checked)}
                              className="w-4 h-4 rounded text-forest focus:ring-forest"
                            />
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Destacado
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">URL de Imagen Principal</label>
                          <div className="flex gap-2">
                            <input 
                              type="url"
                              value={finalFields.image}
                              onChange={(e) => handleFieldChange(cabin.id, 'image', e.target.value)}
                              className="flex-1 min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCabinIdForMedia(cabin.id);
                                setMediaModalMode('cover');
                                setIsMediaModalOpen(true);
                              }}
                              className="px-4 bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              Explorar Storage
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Descripción Corta (Folleto)</label>
                          <input 
                            type="text"
                            value={finalFields.shortDescription || ''}
                            placeholder="Breve descripción de una línea"
                            onChange={(e) => handleFieldChange(cabin.id, 'shortDescription', e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Descripción Detallada</label>
                          <textarea 
                            value={finalFields.description}
                            onChange={(e) => handleFieldChange(cabin.id, 'description', e.target.value)}
                            rows={1}
                            className="w-full rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest resize-y min-h-[44px]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-ink mb-1">Texto de Oferta / Promoción</label>
                          <input 
                            type="text"
                            value={finalFields.offer || ''}
                            placeholder="Ej: Escapada de fin de semana"
                            onChange={(e) => handleFieldChange(cabin.id, 'offer', e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Categoría</label>
                          <select 
                            value={finalFields.category}
                            onChange={(e) => handleFieldChange(cabin.id, 'category', e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                          >
                            <option value="couples">Parejas</option>
                            <option value="family">Familias</option>
                            <option value="luxury">Lujo / Premium</option>
                            <option value="standard">Estándar</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Sección 2: Tarifas y Capacidad */}
                    <div className="bg-white p-4 rounded-xl border border-line/60 shadow-xs space-y-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                        <Coins className="w-3.5 h-3.5" /> 2. Tarifas, Precios y Capacidad
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Precio Base / noche</label>
                          <input 
                            type="number"
                            value={finalFields.price}
                            min={0}
                            onChange={(e) => handleFieldChange(cabin.id, 'price', Number(e.target.value))}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Descuento (%)</label>
                          <input 
                            type="number"
                            value={finalFields.discount}
                            min={0}
                            max={100}
                            onChange={(e) => handleFieldChange(cabin.id, 'discount', Number(e.target.value))}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Capacidad Estándar</label>
                          <input 
                            type="number"
                            value={finalFields.capacity}
                            min={1}
                            onChange={(e) => handleFieldChange(cabin.id, 'capacity', Number(e.target.value))}
                            className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Mín. Huéspedes</label>
                          <input 
                            type="number"
                            value={finalFields.minGuests || 1}
                            min={1}
                            onChange={(e) => handleFieldChange(cabin.id, 'minGuests', Number(e.target.value))}
                            className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Máx. Huéspedes</label>
                          <input 
                            type="number"
                            value={finalFields.maxGuests || finalFields.capacity + 2}
                            min={1}
                            onChange={(e) => handleFieldChange(cabin.id, 'maxGuests', Number(e.target.value))}
                            className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Dormitorios</label>
                          <input 
                            type="number"
                            value={finalFields.bedrooms || 1}
                            min={0}
                            onChange={(e) => handleFieldChange(cabin.id, 'bedrooms', Number(e.target.value))}
                            className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Camas</label>
                          <input 
                            type="number"
                            value={finalFields.beds || 1}
                            min={1}
                            onChange={(e) => handleFieldChange(cabin.id, 'beds', Number(e.target.value))}
                            className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Baños</label>
                          <input 
                            type="number"
                            value={finalFields.bathrooms || 1}
                            min={0}
                            onChange={(e) => handleFieldChange(cabin.id, 'bathrooms', Number(e.target.value))}
                            className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Metros Cuadrados (m²)</label>
                          <input 
                            type="number"
                            value={finalFields.squareMeters || 35}
                            min={1}
                            onChange={(e) => handleFieldChange(cabin.id, 'squareMeters', Number(e.target.value))}
                            className="w-full min-h-[40px] rounded-lg border border-line px-2 py-1 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 3: Atributos Dinámicos y Amenities */}
                    <div className="bg-white p-4 rounded-xl border border-line/60 shadow-xs space-y-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                        <Sliders className="w-3.5 h-3.5" /> 3. Campos Personalizados & Amenities
                      </h3>

                      {/* Custom Fields depending on type */}
                      <div>
                        <span className="block text-xs font-bold text-ink mb-2">Metadata del Tipo Seleccionado:</span>
                        {(() => {
                          const selectedTypeObj = accommodationTypes.find(t => t.id === finalFields.type);
                          if (!selectedTypeObj || !selectedTypeObj.customFields || selectedTypeObj.customFields.length === 0) {
                            return <p className="text-xs text-muted italic">Selecciona un tipo de alojamiento que contenga campos personalizados para completarlos aquí.</p>;
                          }
                          const cFields = finalFields.customFields || {};
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-line">
                              {selectedTypeObj.customFields.map((f) => (
                                <div key={f.key}>
                                  <label className="block text-[11px] font-bold text-[#3d4842] mb-1">{f.label}</label>
                                  {f.type === 'boolean' ? (
                                    <select
                                      value={cFields[f.key] === undefined ? 'false' : String(cFields[f.key])}
                                      onChange={(e) => handleCustomFieldChange(cabin.id, f.key, e.target.value === 'true')}
                                      className="w-full min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                                    >
                                      <option value="true">Sí</option>
                                      <option value="false">No</option>
                                    </select>
                                  ) : f.type === 'number' ? (
                                    <input
                                      type="number"
                                      value={cFields[f.key] || ''}
                                      onChange={(e) => handleCustomFieldChange(cabin.id, f.key, Number(e.target.value))}
                                      className="w-full min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={cFields[f.key] || ''}
                                      onChange={(e) => handleCustomFieldChange(cabin.id, f.key, e.target.value)}
                                      className="w-full min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Checkbox list of resort amenities */}
                      <div>
                        <span className="block text-xs font-bold text-ink mb-1.5">Amenities Disponibles:</span>
                        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto border border-line p-2.5 rounded-lg">
                          {resortAmenities.map((amenity) => {
                            const isChecked = (finalFields.amenities || []).includes(amenity.id);
                            return (
                              <label key={amenity.id} className="flex items-center gap-2 cursor-pointer text-xs p-1 hover:bg-slate-50 rounded select-none">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentList = finalFields.amenities || [];
                                    if (e.target.checked) {
                                      handleFieldChange(cabin.id, 'amenities', [...currentList, amenity.id]);
                                    } else {
                                      handleFieldChange(cabin.id, 'amenities', currentList.filter(id => id !== amenity.id));
                                    }
                                  }}
                                  className="rounded text-forest focus:ring-forest"
                                />
                                <span className="font-medium text-ink truncate">{amenity.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Sección 4: Ubicación, Políticas y Reglas */}
                    <div className="bg-white p-4 rounded-xl border border-line/60 shadow-xs space-y-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                        <MapPin className="w-3.5 h-3.5" /> 4. Ubicación y Políticas del Resort
                      </h3>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Ubicación / Sector</label>
                          <input 
                            type="text"
                            value={finalFields.location || ''}
                            placeholder="Ej: Sector Bosque Alto"
                            onChange={(e) => handleFieldChange(cabin.id, 'location', e.target.value)}
                            className="w-full min-h-[40px] rounded-lg border border-line px-2.5 py-1 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Tags (separados por coma)</label>
                          <input 
                            type="text"
                            value={(finalFields.tags || []).join(', ')}
                            placeholder="ej: lujo, vista-lago"
                            onChange={(e) => handleFieldChange(cabin.id, 'tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full min-h-[40px] rounded-lg border border-line px-2.5 py-1 text-xs bg-white"
                          />
                        </div>
                      </div>

                      {/* Policies */}
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Horario Check-In (Check-In Time)</label>
                            <input 
                              type="text"
                              value={finalFields.policies?.checkInTime || '14:00'}
                              onChange={(e) => handleNestedFieldChange(cabin.id, 'policies', 'checkInTime', e.target.value)}
                              className="w-full min-h-[38px] rounded-lg border border-line px-2.5 text-xs bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Horario Check-Out (Check-Out Time)</label>
                            <input 
                              type="text"
                              value={finalFields.policies?.checkOutTime || '10:00'}
                              onChange={(e) => handleNestedFieldChange(cabin.id, 'policies', 'checkOutTime', e.target.value)}
                              className="w-full min-h-[38px] rounded-lg border border-line px-2.5 text-xs bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#3d4842] mb-1">Política de Cancelación</label>
                          <textarea 
                            value={finalFields.policies?.cancellationPolicy || 'Cancelación gratuita hasta 7 días antes de la llegada.'}
                            onChange={(e) => handleNestedFieldChange(cabin.id, 'policies', 'cancellationPolicy', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white resize-none"
                          />
                        </div>

                        {/* Rules list */}
                        <div>
                          <label className="block text-[11px] font-bold text-ink mb-1">Reglas de Convivencia / Normas:</label>
                          <div className="space-y-1 mb-2">
                            {(finalFields.policies?.rules || []).map((rule, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-[#fcfdfa] p-1.5 rounded-lg border border-line text-xs">
                                <span>• {rule}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rulesList = finalFields.policies?.rules || [];
                                    handleNestedFieldChange(cabin.id, 'policies', 'rules', rulesList.filter((_, i) => i !== idx));
                                  }}
                                  className="text-danger hover:text-danger-hover cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <input 
                              type="text"
                              placeholder="Nueva regla (ej: No se permiten fiestas)"
                              id={`new-rule-input-${cabin.id}`}
                              className="flex-1 min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`new-rule-input-${cabin.id}`) as HTMLInputElement;
                                if (el && el.value) {
                                  const rulesList = finalFields.policies?.rules || [];
                                  handleNestedFieldChange(cabin.id, 'policies', 'rules', [...rulesList, el.value]);
                                  el.value = '';
                                }
                              }}
                              className="px-3 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-lg cursor-pointer"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección 5: Temporadas y Bloqueos de Disponibilidad */}
                    <div className="bg-white p-4 rounded-xl border border-line/60 shadow-xs space-y-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5 pb-2 border-b border-line/50">
                        <CalendarIcon className="w-3.5 h-3.5" /> 5. Temporadas y Bloqueos
                      </h3>

                      {/* Season Multipliers */}
                      <div>
                        <span className="block text-[11px] font-bold text-ink mb-1.5">Precios Especiales por Temporada:</span>
                        <div className="space-y-1.5 mb-2">
                          {(finalFields.seasonPrices || []).map((season, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-line text-xs">
                              <div>
                                <span className="font-bold text-ink">{season.seasonName}</span>
                                <span className="text-muted ml-2">Multiplicador: {season.priceMultiplier}x {season.priceOverride ? `(Fijo: $${season.priceOverride})` : ''}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleArrayRemove(cabin.id, 'seasonPrices', idx)}
                                className="text-danger hover:text-danger-hover cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1.5">
                          <input 
                            type="text"
                            placeholder="Nombre (ej: Invierno)"
                            id={`new-season-name-${cabin.id}`}
                            className="rounded-lg border border-line p-1 text-xs bg-white"
                          />
                          <input 
                            type="number"
                            step="0.1"
                            placeholder="Mult (ej: 1.5)"
                            id={`new-season-multiplier-${cabin.id}`}
                            className="rounded-lg border border-line p-1 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nameEl = document.getElementById(`new-season-name-${cabin.id}`) as HTMLInputElement;
                              const multEl = document.getElementById(`new-season-multiplier-${cabin.id}`) as HTMLInputElement;
                              if (nameEl && nameEl.value && multEl && multEl.value) {
                                handleArrayAdd(cabin.id, 'seasonPrices', {
                                  seasonName: nameEl.value,
                                  priceMultiplier: Number(multEl.value)
                                });
                                nameEl.value = '';
                                multEl.value = '';
                              }
                            }}
                            className="bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-lg cursor-pointer py-1"
                          >
                            + Agregar
                          </button>
                        </div>
                      </div>

                      {/* Blocked Dates */}
                      <div>
                        <span className="block text-[11px] font-bold text-ink mb-1.5">Bloqueos de Calendario (Fechas Clave):</span>
                        {finalFields.availabilityBlockedDates && finalFields.availabilityBlockedDates.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {finalFields.availabilityBlockedDates.map((date, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                                <span>{date}</span>
                                <button
                                  type="button"
                                  onClick={() => handleArrayRemove(cabin.id, 'availabilityBlockedDates', idx)}
                                  className="text-red-500 hover:text-red-900 font-bold cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <input 
                            type="date"
                            id={`new-blocked-date-${cabin.id}`}
                            className="flex-1 min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`new-blocked-date-${cabin.id}`) as HTMLInputElement;
                              if (el && el.value) {
                                const currentList = finalFields.availabilityBlockedDates || [];
                                if (!currentList.includes(el.value)) {
                                  handleFieldChange(cabin.id, 'availabilityBlockedDates', [...currentList, el.value]);
                                }
                                el.value = '';
                              }
                            }}
                            className="px-4 bg-[#f1f5f9] hover:bg-slate-200 text-ink font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Bloquear Fecha
                          </button>
                        </div>
                      </div>

                      {/* Additional Gallery Images */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="block text-[11px] font-bold text-ink">Galería de Imágenes del Alojamiento:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCabinIdForMedia(cabin.id);
                              setMediaModalMode('gallery');
                              setIsMediaModalOpen(true);
                            }}
                            className="text-xs text-forest hover:text-forest-hover font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            Agregar desde Storage
                          </button>
                        </div>
                        
                        {finalFields.images && finalFields.images.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {finalFields.images.map((imgUrl, idx) => {
                              const isCurrentCover = finalFields.image === imgUrl;
                              return (
                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-line aspect-video bg-slate-50">
                                  <img src={imgUrl} alt="galería" className="w-full h-full object-cover" />
                                  
                                  {/* Overlays on hover */}
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                                    <div className="flex justify-between items-start">
                                      {/* Make Cover Button */}
                                      <button
                                        type="button"
                                        disabled={isCurrentCover}
                                        onClick={() => setGalleryImageAsCover(cabin.id, imgUrl)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                          isCurrentCover
                                            ? 'bg-green-500 text-white cursor-default'
                                            : 'bg-white text-slate-800 hover:bg-slate-100 cursor-pointer'
                                        }`}
                                      >
                                        {isCurrentCover ? '✓ Portada' : 'Hacer Portada'}
                                      </button>

                                      {/* Delete image from gallery */}
                                      <button
                                        type="button"
                                        onClick={() => handleArrayRemove(cabin.id, 'images', idx)}
                                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors cursor-pointer"
                                        title="Quitar de galería"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Sorting controls */}
                                    <div className="flex justify-center gap-2">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => moveGalleryItem(cabin.id, idx, 'left')}
                                        className="bg-white/90 hover:bg-white text-slate-700 disabled:opacity-40 p-1 rounded-md transition-all cursor-pointer flex items-center justify-center"
                                        title="Mover Izquierda"
                                      >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === finalFields.images.length - 1}
                                        onClick={() => moveGalleryItem(cabin.id, idx, 'right')}
                                        className="bg-white/90 hover:bg-white text-slate-700 disabled:opacity-40 p-1 rounded-md transition-all cursor-pointer flex items-center justify-center"
                                        title="Mover Derecha"
                                      >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Badge showing if this is active cover */}
                                  {isCurrentCover && (
                                    <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow z-0">
                                      Portada Activa
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                            <ImageIcon className="w-8 h-8 mx-auto stroke-[1.2] text-slate-300 mb-1" />
                            <p className="text-xs">No hay imágenes en la galería adicional</p>
                          </div>
                        )}

                        {/* Manual entry fallback */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400 block">
                            O pegar URL de imagen manualmente:
                          </label>
                          <div className="flex gap-1.5">
                            <input 
                              type="url"
                              placeholder="https://ejemplo.com/imagen.jpg"
                              id={`new-gallery-url-${cabin.id}`}
                              className="flex-1 min-h-[36px] rounded-lg border border-line px-2 text-xs bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`new-gallery-url-${cabin.id}`) as HTMLInputElement;
                                if (el && el.value) {
                                  const currentList = finalFields.images || [];
                                  handleFieldChange(cabin.id, 'images', [...currentList, el.value]);
                                  el.value = '';
                                }
                              }}
                              className="px-4 bg-[#f1f5f9] hover:bg-slate-200 text-ink font-bold text-xs rounded-lg cursor-pointer transition-colors"
                            >
                              Agregar URL
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Guardar */}
                    <button 
                      type="submit"
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios de {finalFields.name}</span>
                    </button>
                  </form>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Tab: Types & Amenities Manager */}
      {activeTab === 'types' && (
        <AccommodationConfigPanel />
      )}

      {/* Legacy hidden manager */}
      {false && activeTab === 'types' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Col 1: Accommodation Types */}
          <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
                <Tag className="w-5 h-5 text-forest" />
                <span>Tipos de Alojamiento</span>
              </h2>
              <p className="text-muted text-xs mt-1">Configura los formatos soportados por tu establecimiento (ej: Cabaña, Domo, Habitación de Hotel, Hostal, Tiny House) y sus campos personalizados.</p>
            </div>

            {/* List existing types */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#3d4842]">Tipos Registrados</h3>
              {accommodationTypes.length === 0 ? (
                <p className="text-xs text-muted italic">No hay tipos configurados o están cargando...</p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {accommodationTypes.map((t) => (
                    <div key={t.id} className="p-3.5 border border-line rounded-xl bg-slate-50 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-forest/10 text-forest font-semibold text-xs font-mono">{t.id}</span>
                          <span className="font-bold text-sm text-ink">{t.displayName}</span>
                        </div>
                        <p className="text-xs text-muted mt-1">Icono: <span className="font-mono text-ink bg-slate-100 px-1 py-0.5 rounded text-[10px]">{t.icon}</span></p>
                        {t.defaultAmenities && t.defaultAmenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="text-[10px] text-muted mr-1 font-semibold">Amenities por defecto:</span>
                            {t.defaultAmenities.map(amenityId => (
                              <span key={amenityId} className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">{amenityId}</span>
                            ))}
                          </div>
                        )}
                        {t.customFields && t.customFields.length > 0 && (
                          <div className="mt-2 space-y-1 bg-white p-2 rounded-lg border border-line/60">
                            <span className="text-[10px] text-muted font-bold block">Campos Personalizados ({t.customFields.length}):</span>
                            {t.customFields.map(f => (
                              <div key={f.key} className="text-[10px] text-[#3d4842] flex items-center justify-between">
                                <span>{f.label} <span className="text-muted">({f.key})</span></span>
                                <span className="font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded text-[9px]">{f.type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteType(t.id)}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                        title="Eliminar Tipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to create new type */}
            <div className="p-4 border border-line/80 rounded-xl bg-[#fafbf9] space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-forest flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Nuevo Tipo de Alojamiento
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">ID Único (ej: glamping, tiny_house)</label>
                  <input
                    type="text"
                    value={newTypeName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="ej: cabana, glamping, tiny_house"
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 py-1.5 text-sm bg-white outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Nombre Display (ej: Domo Glamping)</label>
                  <input
                    type="text"
                    id="new-type-display-name-input"
                    placeholder="ej: Domo Glamping"
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 py-1.5 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Icono Lucide (ej: trees, tent, mountain, bed)</label>
                  <select
                    value={newTypeIcon}
                    onChange={(e) => setNewTypeIcon(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 py-1.5 text-sm bg-white"
                  >
                    <option value="trees">Trees (Bosque)</option>
                    <option value="tent">Tent (Glamping)</option>
                    <option value="mountain">Mountain (Montaña)</option>
                    <option value="bed">Bed (Habitación)</option>
                    <option value="sparkles">Sparkles (Lujo)</option>
                    <option value="map-pin">Map Pin (Ubicación)</option>
                  </select>
                </div>

                {/* Add Custom Fields Config */}
                <div className="border-t border-line/80 pt-3 space-y-2">
                  <label className="block text-[11px] font-bold text-ink">Campos Personalizados (Metadata específica del tipo)</label>
                  {newTypeCustomFields.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {newTypeCustomFields.map((cf, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded-lg border border-line text-xs">
                          <span>{cf.label} ({cf.key}) - <strong className="font-mono text-[10px]">{cf.type}</strong></span>
                          <button
                            type="button"
                            onClick={() => setNewTypeCustomFields(prev => prev.filter((_, i) => i !== index))}
                            className="text-danger hover:text-danger-hover cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      placeholder="key (ej: jacuzzi)"
                      value={newCFKey}
                      onChange={(e) => setNewCFKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="rounded-lg border border-line p-1 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Etiqueta (ej: Jacuzzi)"
                      value={newCFLabel}
                      onChange={(e) => setNewCFLabel(e.target.value)}
                      className="rounded-lg border border-line p-1 text-xs bg-white"
                    />
                    <select
                      value={newCFType}
                      onChange={(e) => setNewCFType(e.target.value as any)}
                      className="rounded-lg border border-line p-1 text-xs bg-white"
                    >
                      <option value="string">Texto</option>
                      <option value="number">Número</option>
                      <option value="boolean">Verdadero/Falso</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCFKey || !newCFLabel) return;
                      setNewTypeCustomFields(prev => [...prev, { key: newCFKey, label: newCFLabel, type: newCFType }]);
                      setNewCFKey('');
                      setNewCFLabel('');
                    }}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-ink text-xs font-bold py-1.5 rounded-lg cursor-pointer"
                  >
                    + Agregar Campo Personalizado
                  </button>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const inputEl = document.getElementById('new-type-display-name-input') as HTMLInputElement;
                    const displayName = inputEl?.value || '';
                    const id = newTypeName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    if (!id || !displayName) return;
                    await saveType({
                      id,
                      displayName,
                      icon: newTypeIcon,
                      defaultAmenities: newTypeDefaultAmenities,
                      customFields: newTypeCustomFields
                    });
                    setNewTypeName('');
                    if (inputEl) inputEl.value = '';
                    setNewTypeCustomFields([]);
                  }}
                  className="w-full bg-forest hover:bg-forest-hover text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Guardar Tipo de Alojamiento
                </button>
              </div>
            </div>
          </div>

          {/* Col 2: Amenities Configuration */}
          <div className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-forest" />
                <span>Amenities & Comodidades</span>
              </h2>
              <p className="text-muted text-xs mt-1">Crea y edita las amenidades configurables disponibles para asignarle a cada alojamiento individual (ej: Parrilla, Jacuzzi, WiFi Starlink, Telescopio).</p>
            </div>

            {/* List existing amenities */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#3d4842]">Comodidades Registradas</h3>
              {resortAmenities.length === 0 ? (
                <p className="text-xs text-muted italic">No hay amenities configuradas...</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {resortAmenities.map((amenity) => (
                    <div key={amenity.id} className="p-2.5 border border-line rounded-lg bg-slate-50 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-ink truncate block">{amenity.name}</span>
                        <span className="text-[9px] text-muted">{amenity.category || 'General'} · ID: {amenity.id}</span>
                      </div>
                      <button
                        onClick={() => deleteAmenity(amenity.id)}
                        className="text-danger hover:text-danger-hover p-1 cursor-pointer"
                        title="Eliminar Amenity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to create new amenity */}
            <div className="p-4 border border-line/80 rounded-xl bg-[#fafbf9] space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-forest flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Nueva Amenidad / Extra
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">ID Único (ej: wifi_starlink, jacuzzi)</label>
                  <input
                    type="text"
                    value={newAmenityName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}
                    onChange={(e) => setNewAmenityName(e.target.value)}
                    placeholder="ej: wifi_starlink, jacuzzi"
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 py-1.5 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Nombre Display (ej: WiFi Starlink 200MB)</label>
                  <input
                    type="text"
                    id="new-amenity-display-name-input"
                    placeholder="ej: WiFi Starlink"
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 py-1.5 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Categoría</label>
                  <select
                    value={newAmenityCategory}
                    onChange={(e) => setNewAmenityCategory(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 py-1.5 text-sm bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Cocina">Cocina</option>
                    <option value="Exterior">Exterior</option>
                    <option value="Wellness">Wellness & Spa</option>
                    <option value="Entretenimiento">Entretenimiento</option>
                    <option value="Servicios">Servicios</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const inputEl = document.getElementById('new-amenity-display-name-input') as HTMLInputElement;
                    const name = inputEl?.value || '';
                    const id = newAmenityName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    if (!id || !name) return;
                    await saveAmenity({
                      id,
                      name,
                      icon: newAmenityIcon,
                      category: newAmenityCategory
                    });
                    setNewAmenityName('');
                    if (inputEl) inputEl.value = '';
                  }}
                  className="w-full bg-forest hover:bg-forest-hover text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Guardar Amenidad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Calendar Visualization */}
      {activeTab === 'calendar' && (
        <TimelineCalendar />
      )}

      {/* Tab 3: Backoffice Reservations Manager */}
      {activeTab === 'bookings' && (
        <BookingsManager bookings={bookings} cabins={cabins} />
      )}

      {/* Tab: Payments Engine Dashboard */}
      {activeTab === 'payments' && (
        isFeatureEnabled('payments') ? (
          <PaymentsManager />
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-line shadow-sm max-w-2xl mx-auto text-center space-y-6 my-8">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-black text-xl text-ink">Módulo de Pagos Bloqueado</h3>
              <p className="text-muted text-xs leading-relaxed max-w-md mx-auto">
                La pasarela de pagos integrada de Mercado Pago y conciliación automática requiere el <strong>Plan Professional</strong> o superior. Tu plan actual es <strong>{plan}</strong>.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-line flex items-center gap-3 justify-center text-xs text-left max-w-md mx-auto">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <strong className="text-slate-900 font-bold">¡Desbloquea automatizaciones!</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">El Plan Professional incluye cobros con tarjeta, Webhooks seguros, idempotencia y reportes de facturación.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('settings');
                setSettingsSubTab('saas');
              }}
              className="px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-black tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Mejorar Mi Plan
            </button>
          </div>
        )
      )}

      {/* Tab: Guest Management Dashboard */}
      {activeTab === 'guests' && (
        <GuestManagement />
      )}

      {/* Tab: Guest Digital Journey Dashboard */}
      {activeTab === 'guestJourney' && (
        <GuestJourneyView />
      )}

      {/* Tab: Pricing Engine & Seasons Dashboard */}
      {activeTab === 'pricing' && (
        <PricingDashboard />
      )}

      {/* Tab: Revenue Management & Dynamic Pricing */}
      {activeTab === 'revenue' && (
        <RevenueDashboard />
      )}

      {/* Tab: Availability Engine Dashboard */}
      {activeTab === 'availability' && (
        <AvailabilityAdminPanel />
      )}

      {/* Tab: Smart Operations Management */}
      {activeTab === 'operations' && (
        <OperationsDashboard />
      )}

      {/* Tab: Business Intelligence & Executive Analytics */}
      {activeTab === 'analytics' && (
        <BIEngineDashboard />
      )}

      {/* Tab 4: Configuración */}
      {activeTab === 'settings' && !editingSettings && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-line shadow-sm min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest mx-auto mb-3" />
          <p className="text-xs text-muted font-semibold text-center font-sans">Cargando ajustes de configuración...</p>
        </div>
      )}

      {activeTab === 'settings' && editingSettings && (
        <>
          {/* Sub-Tabs: General vs Website vs CMS vs Wizard */}
          <div className="flex gap-2 p-1 rounded-xl bg-slate-100 max-w-2xl mb-6 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setSettingsSubTab('tenant')}
              className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'tenant' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              General del Complejo
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('saas')}
              className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 bg-sky-50/50 ${
                settingsSubTab === 'saas' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-muted hover:text-sky-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>Plataforma SaaS</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('cms')}
              className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'cms' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Editor de Contenidos (CMS)
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('website')}
              className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'website' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Ajustes Técnicos Web
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('wizard')}
              className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'wizard' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Asistente Inicial
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('rbac')}
              className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
                settingsSubTab === 'rbac' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-muted hover:text-indigo-700'
              }`}
            >
              <Shield className="w-3 h-3 text-indigo-500" />
              <span>Roles y Permisos</span>
            </button>
          </div>

          {settingsSubTab === 'wizard' ? (
            <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-line pb-4">
                <div>
                  <h3 className="font-display font-black text-lg text-ink flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span>Asistente de Configuración Inicial (Onboarding)</span>
                  </h3>
                  <p className="text-muted text-xs mt-1">
                    Controla y completa la configuración automatizada de StayFlow para poner en marcha tu resort turístico.
                  </p>
                </div>
                <button
                  onClick={() => setShowWizard(true)}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                >
                  {progress?.completed ? 'Volver a Ejecutar Asistente' : 'Iniciar Asistente'}
                </button>
              </div>

              {/* Steps Progress Visualizer */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-4 rounded-xl border border-line">
                  <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center text-forest text-lg font-black shrink-0">
                    {progress ? Math.min(progress.currentStep, 6) : 1}/6
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="font-bold text-xs text-ink">Progreso Total de Onboarding</div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-forest h-full rounded-full transition-all duration-300" 
                        style={{ width: `${Math.round(((progress ? progress.currentStep - 1 : 0) / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-forest whitespace-nowrap bg-forest/5 px-2.5 py-1 rounded-lg">
                    {progress?.completed ? '¡Completado!' : 'En Curso'}
                  </span>
                </div>

                {/* Steps List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                  {[
                    { step: 1, title: 'Identidad del Complejo', desc: 'Define nombre, teléfono, email de contacto y tipo de complejo.' },
                    { step: 2, title: 'Amenities y Servicios', desc: 'Configura las características y servicios complementarios que ofreces.' },
                    { step: 3, title: 'Categorías de Alojamiento', desc: 'Define los tipos de alojamiento (ej: Cabaña Standard, Suite Familiar).' },
                    { step: 4, title: 'Unidades de Alojamiento', desc: 'Registra los alojamientos físicos específicos en tu inventario.' },
                    { step: 5, title: 'Tarifas y Temporadas', desc: 'Configura los precios por noche, reglas de cobro y temporadas.' },
                    { step: 6, title: 'Lanzar Portal Público', desc: 'Publica el sitio web final y configura la personalización de marca.' },
                  ].map((s) => {
                    const isCompleted = progress ? progress.completed || progress.currentStep > s.step : false;
                    const isActive = progress ? !progress.completed && progress.currentStep === s.step : s.step === 1;
                    return (
                      <div 
                        key={s.step} 
                        className={`p-4 rounded-xl border transition-all ${
                          isActive 
                            ? 'border-amber-400 bg-amber-50/20' 
                            : isCompleted 
                              ? 'border-emerald-200 bg-emerald-50/10' 
                              : 'border-line bg-white opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCompleted 
                                ? 'bg-emerald-500 text-white' 
                                : isActive 
                                  ? 'bg-amber-400 text-slate-900 animate-pulse' 
                                  : 'bg-slate-100 text-slate-500'
                            }`}>
                              {s.step}
                            </span>
                            <span className="font-extrabold text-xs text-ink">{s.title}</span>
                          </div>
                          {isCompleted && (
                            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded">Completado</span>
                          )}
                          {isActive && (
                            <span className="text-[10px] text-amber-600 font-extrabold bg-amber-400/10 px-1.5 py-0.5 rounded">Pendiente</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted leading-normal mt-1.5">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : settingsSubTab === 'cms' ? (
            <WebsiteCMSEditor />
          ) : settingsSubTab === 'saas' ? (
            <SaaSConfigEditor />
          ) : settingsSubTab === 'website' ? (
            <WebsiteSettingsEditor />
          ) : settingsSubTab === 'rbac' ? (
            <RBACManagementPanel />
          ) : (
            <>
              <form onSubmit={handleSaveSettings} className="space-y-4 bg-white p-5 rounded-2xl border border-line shadow-sm">
                <h2 className="font-display font-bold text-lg text-ink pb-2 border-b border-line">Configuración General del Complejo (Tenant)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={editingSettings.appName}
                  onChange={(e) => handleSettingsFieldChange('appName', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Título del Sitio (Slogan)</label>
                <input
                  type="text"
                  value={editingSettings.appSubtitle}
                  onChange={(e) => handleSettingsFieldChange('appSubtitle', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-line/50 pt-3">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Terminología Singular (ej: Cabaña)</label>
                <input
                  type="text"
                  value={editingSettings.terminology?.singular || ''}
                  onChange={(e) => handleTerminologyChange('singular', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  placeholder="ej: Cabaña, Domo, Habitación"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Terminología Plural (ej: Cabañas)</label>
                <input
                  type="text"
                  value={editingSettings.terminology?.plural || ''}
                  onChange={(e) => handleTerminologyChange('plural', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  placeholder="ej: Cabañas, Domos, Habitaciones"
                  required
                />
              </div>
            </div>

            <div className="border-t border-line/50 pt-3">
              <label className="block text-xs font-bold text-ink mb-2">Icono del Logo</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'trees', label: 'Arboleda', Icon: Trees },
                  { id: 'tent', label: 'Carpa', Icon: Tent },
                  { id: 'mountain', label: 'Montaña', Icon: Mountain },
                  { id: 'palmtree', label: 'Palmera', Icon: Palmtree },
                  { id: 'compass', label: 'Brújula', Icon: Compass },
                  { id: 'treepine', label: 'Pino', Icon: TreePine },
                ].map((opt) => {
                  const isSelected = editingSettings.logoIcon === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSettingsFieldChange('logoIcon', opt.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs gap-1 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-forest bg-forest/5 text-forest font-bold shadow-xs' 
                          : 'border-line bg-white text-muted hover:text-ink'
                      }`}
                    >
                      <opt.Icon className="w-5 h-5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-line/50 pt-3">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={editingSettings.address}
                  onChange={(e) => handleSettingsFieldChange('address', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Enlace de Google Maps</label>
                <input
                  type="text"
                  value={editingSettings.googleMapsLink}
                  onChange={(e) => handleSettingsFieldChange('googleMapsLink', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Detalles de Ubicación</label>
              <textarea
                value={editingSettings.locationDetails}
                onChange={(e) => handleSettingsFieldChange('locationDetails', e.target.value)}
                className="w-full min-h-[70px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest resize-y"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Horarios de Recepción</label>
                <input
                  type="text"
                  value={editingSettings.hours}
                  onChange={(e) => handleSettingsFieldChange('hours', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={editingSettings.phone}
                  onChange={(e) => handleSettingsFieldChange('phone', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Número de WhatsApp (ej: 5492945550138)</label>
                <input
                  type="text"
                  value={editingSettings.whatsapp}
                  onChange={(e) => handleSettingsFieldChange('whatsapp', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Correo Electrónico de Contacto</label>
                <input
                  type="email"
                  value={editingSettings.email}
                  onChange={(e) => handleSettingsFieldChange('email', e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                {saveStatus === 'saving' && (
                  <span className="text-xs text-forest animate-pulse font-medium">Guardando ajustes...</span>
                )}
                {saveStatus === 'success' && (
                  <span className="text-xs text-success font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> ¡Ajustes guardados correctamente!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-xs text-danger font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Error al guardar ajustes. Inténtalo de nuevo.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className="min-h-[44px] px-6 rounded-2xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </form>

          <div className="mt-6 bg-white p-5 rounded-2xl border border-line shadow-sm space-y-4">
            <h2 className="font-display font-bold text-lg text-ink pb-2 border-b border-line flex items-center gap-2">
              <Database className="w-5 h-5 text-forest" />
              <span>SaaS Backup Engine</span>
            </h2>
            <p className="text-muted text-xs leading-relaxed">
              Tus datos están persistidos de forma segura en la base de datos central. Si lo necesitas, puedes descargar tus datos en formato estructurado JSON para copias de seguridad:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadFile(cabins, 'cabins.json')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-line hover:border-forest bg-white hover:bg-forest/5 text-ink font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-forest" />
                <span>Descargar cabins.json</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadFile(settings, 'settings.json')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-line hover:border-forest bg-white hover:bg-forest/5 text-ink font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-forest" />
                <span>Descargar settings.json</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadFile(bookings, 'bookings.json')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-line hover:border-forest bg-white hover:bg-forest/5 text-ink font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-forest" />
                <span>Descargar bookings.json</span>
              </button>
            </div>
          </div>
            </>
          )}
        </>
      )}

      </main>

      {/* Media Manager Modal Integration */}
      <MediaManagerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        resortId={resort?.id || 'default-resort'}
        entityType="accommodations"
        entityId={
          activeCabinIdForMedia === 'new'
            ? 'new-accommodation'
            : activeCabinIdForMedia
              ? String(activeCabinIdForMedia)
              : 'general'
        }
        onSelect={(media) => {
          if (activeCabinIdForMedia === 'new') {
            if (mediaModalMode === 'cover') {
              setNewCabin(prev => ({ ...prev, image: media.downloadURL }));
            } else {
              setNewCabin(prev => ({ ...prev, images: [...(prev.images || []), media.downloadURL] }));
            }
          } else if (activeCabinIdForMedia !== null) {
            if (mediaModalMode === 'cover') {
              handleFieldChange(activeCabinIdForMedia, 'image', media.downloadURL);
            } else {
              const currentImages = editingCabins[activeCabinIdForMedia]?.images || cabins.find(c => c.id === activeCabinIdForMedia)?.images || [];
              handleFieldChange(activeCabinIdForMedia, 'images', [...currentImages, media.downloadURL]);
            }
          }
          setIsMediaModalOpen(false);
        }}
      />
    </div>
  );
};
