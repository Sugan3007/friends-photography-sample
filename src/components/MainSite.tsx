import React, { useState, useEffect } from 'react';
import {
  Camera,
  ArrowRight,
  Shield,
  KeyRound,
  Sparkles,
  Check,
  Mail,
  Phone,
  MapPin,
  Clock,
  Eye,
  Lock,
  Heart,
  Send,
  FolderKey,
  Calendar,
  Layers,
  ChevronRight,
  User,
  Pencil,
  Plus,
  DollarSign,
  Settings,
  Upload,
  Star,
  Loader2,
  X,
  Tag,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { studioStore } from '../services/studioStore';
import { ClientFolder, PortfolioShowcase, PricingPackage } from '../types/index';
import { EditableText } from './EditableText';
import { EditPackageModal } from './EditPackageModal';
import { uploadEventPhotoToStorage } from '../services/firebaseService';

interface MainSiteProps {
  activeTab?: 'showcase' | 'works' | 'pricing' | 'contact';
  onNavigateTab?: (tab: 'showcase' | 'works' | 'pricing' | 'contact') => void;
  onOpenFolder?: (folder: ClientFolder) => void;
  onNavigateToAdmin: () => void;
  onSelectEvent: (event: PortfolioShowcase) => void;
  isAdmin?: boolean;
  onToggleEditMode?: () => void;
}

export const MainSite: React.FC<MainSiteProps> = ({
  activeTab = 'showcase',
  onNavigateTab,
  onNavigateToAdmin,
  onSelectEvent,
  isAdmin = false,
  onToggleEditMode,
}) => {
  // Category filter state for portfolio
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Dynamic portfolio list, packages & categories synced with studioStore
  const [portfolioList, setPortfolioList] = useState<PortfolioShowcase[]>(() => studioStore.getPortfolio());
  const [packagesList, setPackagesList] = useState<PricingPackage[]>(() => studioStore.getPackages());
  const [categoriesList, setCategoriesList] = useState<string[]>(() => studioStore.getCategories());
  const [, setStoreTick] = useState(0);

  // Package editing state
  const [editingPkg, setEditingPkg] = useState<PricingPackage | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Cover image uploading & drag state for Selected Works
  const [uploadingCoverEventId, setUploadingCoverEventId] = useState<string | null>(null);
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);

  // Add Category Modal State (Selected Works)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryTag, setNewCategoryTag] = useState('');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategoryFile, setNewCategoryFile] = useState<File | null>(null);
  const [newCategoryPreview, setNewCategoryPreview] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);
  const [isCategoryDragOver, setIsCategoryDragOver] = useState(false);

  // Delete Category Modal State (Selected Works)
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [isDeletingCategoryName, setIsDeletingCategoryName] = useState<string | null>(null);

  // New Category inline creation inside folder creation grid
  const [isAddingNewCatInModal, setIsAddingNewCatInModal] = useState(false);
  const [newCatCustomInput, setNewCatCustomInput] = useState('');

  useEffect(() => {
    const unsub = studioStore.subscribe(() => {
      setPortfolioList(studioStore.getPortfolio());
      setPackagesList(studioStore.getPackages());
      setCategoriesList(studioStore.getCategories());
      setStoreTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // Dynamic category pills derived from categoriesList
  const availableCategories = React.useMemo(() => {
    return ['All', ...categoriesList];
  }, [categoriesList]);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactService, setContactService] = useState('Wedding Photography');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  const filteredPortfolio = React.useMemo(() => {
    const list =
      activeCategory === 'All'
        ? portfolioList
        : portfolioList.filter(
            (item) => item.category.trim().toLowerCase() === activeCategory.trim().toLowerCase()
          );

    const seen = new Set<string>();
    return list.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [activeCategory, portfolioList]);

  const handleCategoryFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAddCategoryError('Please choose a valid image file (PNG, JPG, WebP).');
      return;
    }
    setAddCategoryError(null);
    setNewCategoryFile(file);
    const objectUrl = URL.createObjectURL(file);
    setNewCategoryPreview(objectUrl);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingCategory) return;
    if (!newCategoryTag.trim()) {
      setAddCategoryError('Please enter a category tag.');
      return;
    }
    if (!newCategoryFile) {
      setAddCategoryError('Please select or drop a cover image for this category.');
      return;
    }

    try {
      setIsAddingCategory(true);
      setAddCategoryError(null);

      const tempId = `cat-${Date.now()}`;
      // Upload cover image to Firebase Storage
      const coverUrl = await uploadEventPhotoToStorage(newCategoryFile, tempId);

      const tag = newCategoryTag.trim();
      const title = newCategoryTitle.trim() || tag;

      await studioStore.addCategory(tag);
      await studioStore.addEvent({
        title,
        category: tag,
        imageUrl: coverUrl,
        client: '',
        year: new Date().getFullYear().toString(),
        description: '',
        images: [
          {
            id: `img-${Date.now()}`,
            url: coverUrl,
            caption: '',
            orientation: 'landscape',
          },
        ],
      });

      setCategoriesList(studioStore.getCategories());
      setPortfolioList(studioStore.getPortfolio());
      setActiveCategory(tag);
      setIsAddCategoryOpen(false);
      setNewCategoryTag('');
      setNewCategoryTitle('');
      setNewCategoryFile(null);
      setNewCategoryPreview(null);
    } catch (err: any) {
      console.error('Failed to create category:', err);
      setAddCategoryError(err?.message || 'Failed to create category. Please try again.');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) return;
    setContactSuccess(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
      setContactSuccess(false);
    }, 4000);
  };

  const handleCreateNewPackage = async () => {
    const newPkg = await studioStore.addPackage({
      name: 'New Bespoke Package',
      price: '$1,500',
      duration: '3 Hours Production',
      tagline: 'Custom photography collection crafted to your exacting specifications.',
      deliverables: ['DRM-Protected Proofing Gallery', '15 Hand-Retouched High Res Photos'],
      features: ['Personalized moodboard consultation'],
      popular: false,
    });
    setEditingPkg(newPkg);
    setIsEditModalOpen(true);
  };

  const handleUploadCoverImage = async (eventId: string, file: File) => {
    try {
      setUploadingCoverEventId(eventId);
      const downloadUrl = await uploadEventPhotoToStorage(file, eventId);
      await studioStore.addImageToEvent(eventId, {
        url: downloadUrl,
        caption: '',
        orientation: 'landscape',
      });
      await studioStore.updateEventCover(eventId, downloadUrl);
      setPortfolioList(studioStore.getPortfolio());
    } catch (err) {
      console.error('Failed to set cover image:', err);
    } finally {
      setUploadingCoverEventId(null);
    }
  };

  // Delete a specific folder (does NOT delete the category)
  const handleDeleteFolder = async (eventId: string, title: string, category: string) => {
    if (
      !window.confirm(
        `Delete folder "${title}"? The category "${category}" will remain intact.`
      )
    ) {
      return;
    }
    try {
      await studioStore.deleteEvent(eventId);
      setPortfolioList(studioStore.getPortfolio());
    } catch (err) {
      console.error('Failed to delete folder:', err);
      alert('Failed to delete folder.');
    }
  };

  const handleAddNewCategoryFromGrid = async () => {
    const clean = newCatCustomInput.trim();
    if (!clean) return;
    await studioStore.addCategory(clean);
    setCategoriesList(studioStore.getCategories());
    setNewCategoryTag(clean);
    setNewCatCustomInput('');
    setIsAddingNewCatInModal(false);
  };

  // Delete an entire category (does NOT delete the categories folder!)
  const handleDeleteEntireCategory = async (catName: string) => {
    try {
      setIsDeletingCategoryName(catName);
      await studioStore.deleteCategory(catName);
      const remaining = studioStore.getCategories();
      setCategoriesList(remaining);
      setPortfolioList(studioStore.getPortfolio());
      if (activeCategory.toLowerCase() === catName.toLowerCase()) {
        setActiveCategory('All');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setIsDeletingCategoryName(null);
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-4 space-y-6">
      {/* ── Admin Edit Mode Notice Banner ─────────────────────────────────── */}
      {isAdmin && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-stone-900 border border-amber-500/40 shadow-lg flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0">
              <Pencil className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-semibold text-amber-300 block leading-tight">Admin Edit Portal Active</span>
              <span className="text-[10px] text-stone-300">Click any pencil icon to edit texts or prices</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleEditMode && (
              <button
                type="button"
                onClick={onToggleEditMode}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-bold uppercase transition-colors"
                title="Finish editing and hide pencil icons"
              >
                Done
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-mono tracking-wider uppercase transition-colors"
            >
              Portal →
            </button>
          </div>
        </div>
      )}

      {/* 1. MOBILE HERO (SHOWCASE TAB) */}
      {(activeTab === 'showcase' || !activeTab) && (
        <>
          {/* Mobile Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl p-6 text-center">
            {/* Background Image with Dark Vignette */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80"
                alt="Studio Editorial"
                className="w-full h-full object-cover filter brightness-[0.25] contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent" />
            </div>

            <div className="relative z-10">
              {/* Atelier Badge */}
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono tracking-widest uppercase">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <EditableText
                    textKey="hero.badge"
                    defaultText="Fine Art Atelier"
                    isAdmin={isAdmin}
                  />
                </span>
              </div>

              {/* Hero Title */}
              <div className="mb-2">
                <EditableText
                  textKey="hero.title"
                  defaultText="Cinematic Art & Editorial Photography"
                  as="h1"
                  multiline={true}
                  className="text-3xl font-serif text-white tracking-wide font-normal leading-tight block"
                  isAdmin={isAdmin}
                />
              </div>

              {/* Hero Subtitle */}
              <div className="mt-2.5">
                <EditableText
                  textKey="hero.subtitle"
                  defaultText="Capturing heirloom moments with painterly light and timeless composition."
                  as="p"
                  multiline={true}
                  className="text-xs text-stone-300 leading-relaxed font-light block"
                  isAdmin={isAdmin}
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('works')}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <EditableText
                    textKey="hero.btnWorks"
                    defaultText="Explore Works"
                    isAdmin={isAdmin}
                  />
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('contact')}
                  className="py-2.5 px-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <EditableText
                    textKey="hero.btnContact"
                    defaultText="Inquire Dates"
                    isAdmin={isAdmin}
                  />
                </button>
              </div>

              {/* Private Client Vault Key Icon Hint */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-stone-400">
                <span className="w-5 h-5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <KeyRound className="w-3 h-3" />
                </span>
                <EditableText
                  textKey="hero.vaultHint"
                  defaultText="Client Vault? Tap the key icon at top right to unlock proofs."
                  as="span"
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('works')}
              className="p-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-left transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-xs font-serif font-semibold text-white">
                <EditableText textKey="hero.card1Title" defaultText="Portfolio" isAdmin={isAdmin} />
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                <EditableText textKey="hero.card1Subtitle" defaultText="Explore weddings & portraits" isAdmin={isAdmin} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('contact')}
              className="p-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-left transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-xs font-serif font-semibold text-white">
                <EditableText textKey="hero.card2Title" defaultText="Contact Studio" isAdmin={isAdmin} />
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                <EditableText textKey="hero.card2Subtitle" defaultText="Inquiries & bespoke bookings" isAdmin={isAdmin} />
              </div>
            </button>
          </div>
        </>
      )}

      {/* 2. MOBILE WORKS / PORTFOLIO TAB */}
      {(activeTab === 'works' || activeTab === 'showcase') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                <EditableText textKey="works.badge" defaultText="Works Showcase" isAdmin={isAdmin} />
              </span>
              <h2 className="text-xl font-serif text-white tracking-wide">
                <EditableText textKey="works.title" defaultText="Selected Works" isAdmin={isAdmin} />
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all shrink-0"
                    title="Add new category with cover image and tag"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Category</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteCategoryModalOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-stone-800 hover:border-rose-500/40 font-semibold text-xs flex items-center gap-1 transition-all shrink-0"
                    title="Select and delete categories"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Category</span>
                  </button>
                </>
              )}
              {activeTab === 'showcase' && (
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('works')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  View All →
                </button>
              )}
            </div>
          </div>

          {/* Category Filters: Dynamic Horizontal Swipeable Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                    : 'bg-stone-900 text-stone-300 hover:text-white border border-stone-800'
                }`}
              >
                {cat}
              </button>
            ))}
            {isAdmin && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-500/40 whitespace-nowrap flex items-center gap-1 transition-all"
                  title="Add new category"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>Category</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteCategoryModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900 hover:bg-rose-500/20 text-rose-400 border border-stone-800 hover:border-rose-500/40 whitespace-nowrap flex items-center gap-1 transition-all"
                  title="Select and delete categories"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Portfolio Event Cards */}
          <div className="space-y-4">
            {filteredPortfolio.length === 0 && (
              <div className="py-10 px-4 rounded-2xl bg-stone-900/40 border border-stone-800 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-serif text-white font-medium">
                  No folders in category "{activeCategory}"
                </h3>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                  The category "{activeCategory}" exists, but has no folders right now.
                </p>
                {isAdmin && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryTag(activeCategory === 'All' ? 'Weddings' : activeCategory);
                        setIsAddCategoryOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Folder</span>
                    </button>
                    {activeCategory !== 'All' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEntireCategory(activeCategory)}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Category</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {filteredPortfolio.map((item) => {
              const isUploadingThisCover = uploadingCoverEventId === item.id;
              const isDraggingThis = draggingEventId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectEvent(item)}
                  onDragOver={(e) => {
                    if (isAdmin) {
                      e.preventDefault();
                      e.stopPropagation();
                      setDraggingEventId(item.id);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (isAdmin) {
                      e.preventDefault();
                      e.stopPropagation();
                      setDraggingEventId(null);
                    }
                  }}
                  onDrop={async (e) => {
                    if (isAdmin) {
                      e.preventDefault();
                      e.stopPropagation();
                      setDraggingEventId(null);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        await handleUploadCoverImage(item.id, file);
                      }
                    }
                  }}
                  className={`group cursor-pointer rounded-2xl bg-stone-900 border overflow-hidden shadow-lg transition-all relative ${
                    isDraggingThis
                      ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                      : 'border-stone-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-950">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Category & Cover Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-md text-[10px] font-mono tracking-wider uppercase text-amber-300 border border-amber-500/30">
                        {item.category}
                      </span>
                      {isAdmin && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[9px] font-mono font-bold uppercase shadow-sm flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Cover
                        </span>
                      )}
                    </div>

                    {/* Admin Drag & Drop / Change Cover & Delete Folder Buttons */}
                    {isAdmin && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5"
                      >
                        <label
                          className={`px-2.5 py-1 rounded-xl bg-stone-950/90 hover:bg-amber-500 hover:text-stone-950 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 cursor-pointer backdrop-blur-md shadow-lg transition-all ${
                            isUploadingThisCover ? 'opacity-50 pointer-events-none' : ''
                          }`}
                          title="Drop photo here or click to set new category cover"
                        >
                          {isUploadingThisCover ? (
                            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          <span>{isUploadingThisCover ? 'Uploading…' : 'Set Cover'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingThisCover}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleUploadCoverImage(item.id, file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDeleteFolder(item.id, item.title, item.category);
                          }}
                          className="p-1.5 rounded-xl bg-stone-950/90 hover:bg-rose-600 text-stone-400 hover:text-white border border-stone-800 hover:border-rose-500 text-[10px] flex items-center justify-center cursor-pointer backdrop-blur-md shadow-lg transition-all"
                          title="Delete folder (the category will not be deleted)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400 hover:text-white" />
                        </button>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
                      <span className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                        <span>View Full Event Folio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-serif text-white font-medium group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {item.client || item.year
                          ? `${item.client || ''}${item.client && item.year ? ' • ' : ''}${item.year || ''}`
                          : item.category}
                        {item.location ? ` • ${item.location}` : ''}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-stone-800 text-stone-300 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Admin Add New Category Quick Card */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-stone-800 hover:border-amber-500/60 bg-stone-900/30 hover:bg-amber-500/5 text-stone-400 hover:text-amber-300 flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <div className="w-10 h-10 rounded-2xl bg-stone-800 group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-serif font-medium text-stone-200 block group-hover:text-amber-300">
                    + Add New Category
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Upload cover image & category tag (no image description needed)
                  </span>
                </div>
              </button>
            )}
          </div>
        </section>
      )}

      {/* 3. MOBILE PRICING & COLLECTIONS TAB */}
      {(activeTab === 'pricing' || activeTab === 'showcase') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                <EditableText textKey="pricing.badge" defaultText="Investment" isAdmin={isAdmin} />
              </span>
              <h2 className="text-xl font-serif text-white tracking-wide">
                <EditableText textKey="pricing.title" defaultText="Studio Packages" isAdmin={isAdmin} />
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleCreateNewPackage}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-colors"
                  title="Add new pricing package"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Package</span>
                </button>
              )}
              {activeTab === 'showcase' && !isAdmin && (
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('pricing')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  All Packages →
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {packagesList.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-5 rounded-2xl bg-stone-900 border transition-all relative ${
                  pkg.popular ? 'border-amber-400/80 shadow-lg shadow-amber-500/5' : 'border-stone-800'
                }`}
              >
                {/* Admin Quick Edit Button for Entire Package */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPkg(pkg);
                      setIsEditModalOpen(true);
                    }}
                    className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 text-xs flex items-center gap-1 transition-all z-20 shadow-md"
                    title="Edit complete package details"
                  >
                    <Pencil className="w-3 h-3" />
                    <span className="text-[10px] font-semibold uppercase">Edit Package</span>
                  </button>
                )}

                {pkg.popular && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[9px] font-bold tracking-widest uppercase mb-2">
                    Popular Atelier Choice
                  </span>
                )}

                <div className="flex items-start justify-between pr-24">
                  <div>
                    {/* Editable Package Name */}
                    <div className="text-base font-serif text-white font-medium">
                      <EditableText
                        textKey={`pkg.${pkg.id}.name`}
                        defaultText={pkg.name}
                        isAdmin={isAdmin}
                        onSave={async (newVal) => {
                          await studioStore.updatePackage(pkg.id, { name: newVal });
                        }}
                      />
                    </div>
                    {/* Editable Duration */}
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      <EditableText
                        textKey={`pkg.${pkg.id}.duration`}
                        defaultText={pkg.duration}
                        isAdmin={isAdmin}
                        onSave={async (newVal) => {
                          await studioStore.updatePackage(pkg.id, { duration: newVal });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Editable Price Tag */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-serif text-amber-300 font-semibold">
                    <EditableText
                      textKey={`pkg.${pkg.id}.price`}
                      defaultText={pkg.price}
                      isAdmin={isAdmin}
                      onSave={async (newVal) => {
                        await studioStore.updatePackage(pkg.id, { price: newVal });
                      }}
                    />
                  </span>
                </div>

                {/* Editable Tagline */}
                <div className="text-xs text-stone-300 mt-2 leading-relaxed">
                  <EditableText
                    textKey={`pkg.${pkg.id}.tagline`}
                    defaultText={pkg.tagline}
                    multiline={true}
                    isAdmin={isAdmin}
                    onSave={async (newVal) => {
                      await studioStore.updatePackage(pkg.id, { tagline: newVal });
                    }}
                  />
                </div>

                {/* Deliverables List */}
                <div className="mt-3 pt-3 border-t border-stone-800 space-y-1.5 text-xs text-stone-300">
                  {pkg.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight flex-1">
                        <EditableText
                          textKey={`pkg.${pkg.id}.deliv.${idx}`}
                          defaultText={item}
                          isAdmin={isAdmin}
                          onSave={async (newVal) => {
                            const updatedDelivs = [...pkg.deliverables];
                            updatedDelivs[idx] = newVal;
                            await studioStore.updatePackage(pkg.id, { deliverables: updatedDelivs });
                          }}
                        />
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('contact');
                    setContactService(pkg.name);
                  }}
                  className="mt-4 w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  Inquire This Package
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. MOBILE STUDIO CONTACT TAB */}
      {(activeTab === 'contact' || activeTab === 'showcase') && (
        <section className="space-y-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
              <EditableText textKey="contact.badge" defaultText="Get in Touch" isAdmin={isAdmin} />
            </span>
            <h2 className="text-xl font-serif text-white tracking-wide">
              <EditableText textKey="contact.title" defaultText="Studio Concierge" isAdmin={isAdmin} />
            </h2>
            <div className="text-xs text-stone-400 mt-1">
              <EditableText
                textKey="contact.subtitle"
                defaultText="Contact us for wedding, portrait, and commercial dates."
                multiline={true}
                isAdmin={isAdmin}
              />
            </div>
          </div>

          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-2.5 text-stone-200">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate flex-1">
                <span className="block text-[10px] text-stone-500 uppercase font-mono">
                  <EditableText textKey="contact.phoneLabel" defaultText="Call Studio" isAdmin={isAdmin} />
                </span>
                <span className="text-xs font-medium truncate block">
                  <EditableText textKey="contact.phone" defaultText="+1 555-839-2041" isAdmin={isAdmin} />
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-2.5 text-stone-200">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate flex-1">
                <span className="block text-[10px] text-stone-500 uppercase font-mono">
                  <EditableText textKey="contact.emailLabel" defaultText="Email Us" isAdmin={isAdmin} />
                </span>
                <span className="text-xs font-medium truncate block">
                  <EditableText textKey="contact.email" defaultText="concierge@friendsphotography.com" isAdmin={isAdmin} />
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Booking Inquiry Form */}
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
            <h3 className="text-sm font-serif text-white font-medium">
              <EditableText textKey="contact.formTitle" defaultText="Send Booking Inquiry" isAdmin={isAdmin} />
            </h3>

            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name *"
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email Address *"
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <select
                  value={contactService}
                  onChange={(e) => setContactService(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                >
                  {packagesList.map((pkg) => (
                    <option key={pkg.id} value={pkg.name}>
                      {pkg.name} ({pkg.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={3}
                  placeholder="Tell us about your event, dates, or vision..."
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {contactSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-200 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Thank you! We will reply to your inquiry shortly.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Package Edit Modal */}
      <EditPackageModal
        pkg={editingPkg}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPkg(null);
        }}
      />

      {/* Add Category to Selected Works Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl space-y-4 my-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (!isAddingCategory) {
                  setIsAddCategoryOpen(false);
                  setNewCategoryFile(null);
                  setNewCategoryPreview(null);
                  setAddCategoryError(null);
                }
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <FolderKey className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-serif text-white font-medium">Create Category Folder</h3>
                <p className="text-[11px] text-stone-400">Selected Works Folio</p>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Select which category this folder belongs to and upload its cover photo.
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              {/* Select Categories Grid Option */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider">
                    Select Category *
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">
                    {newCategoryTag ? `Selected: ${newCategoryTag}` : 'Choose from grid'}
                  </span>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 bg-stone-950/70 rounded-2xl border border-stone-800">
                  {categoriesList.map((cat) => {
                    const isSelected = newCategoryTag.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setNewCategoryTag(cat);
                          setIsAddingNewCatInModal(false);
                          if (!newCategoryTitle) {
                            setNewCategoryTitle(`${cat} Folio`);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40'
                            : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:border-stone-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-amber-400' : 'bg-stone-600'
                            }`}
                          />
                          <span className="text-xs font-serif font-medium truncate">{cat}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Add New Category Option inside the Grid */}
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCatInModal((prev) => !prev)}
                    className={`p-2.5 rounded-xl border border-dashed text-left flex items-center justify-between gap-1.5 transition-all ${
                      isAddingNewCatInModal
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                        : 'border-stone-700 hover:border-amber-500/50 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-xs font-serif">+ New Category</span>
                    <Plus className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  </button>
                </div>

                {/* Inline Add New Category Input */}
                {isAddingNewCatInModal && (
                  <div className="mt-2.5 flex items-center gap-2 p-2 bg-stone-950 rounded-xl border border-amber-500/30 shadow-inner">
                    <input
                      type="text"
                      value={newCatCustomInput}
                      onChange={(e) => setNewCatCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategoryFromGrid();
                        }
                      }}
                      placeholder="Type new category tag..."
                      className="flex-1 px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategoryFromGrid}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Folder Title (Optional) */}
              <div>
                <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1.5">
                  Folder Title (Optional)
                </label>
                <input
                  type="text"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  placeholder={newCategoryTag ? `${newCategoryTag} Collection` : 'e.g. Summer Haute Couture'}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Cover Image Upload (Drag & Drop + File Picker) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider">
                    Category Cover Image *
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">Firebase Storage</span>
                </div>

                {newCategoryPreview ? (
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-amber-500/40 bg-stone-950 group">
                    <img
                      src={newCategoryPreview}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-semibold cursor-pointer shadow-lg hover:bg-amber-400 transition-colors">
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCategoryFileSelect(file);
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCategoryFile(null);
                          setNewCategoryPreview(null);
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/90 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsCategoryDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsCategoryDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsCategoryDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleCategoryFileSelect(file);
                    }}
                    className={`relative p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                      isCategoryDragOver
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-stone-700 hover:border-amber-500/50 bg-stone-950/60'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCategoryFileSelect(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400 mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-stone-200 block">
                      Drag & drop cover photo here
                    </span>
                    <span className="text-[10px] text-stone-400 mt-0.5">
                      or click to browse (no description needed)
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {addCategoryError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
                  {addCategoryError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isAddingCategory}
                  onClick={() => {
                    setIsAddCategoryOpen(false);
                    setNewCategoryFile(null);
                    setNewCategoryPreview(null);
                    setAddCategoryError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingCategory || !newCategoryTag.trim() || !newCategoryFile}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all"
                >
                  {isAddingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Create Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {isDeleteCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl space-y-4 my-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsDeleteCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-serif text-white font-medium">Delete Categories</h3>
                <p className="text-[11px] text-stone-400">Selected Works Categories</p>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Select a category to delete. Deleting a category tag will also permanently delete all folders and photos in that category.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {categoriesList.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4">No categories found.</p>
              ) : (
                categoriesList.map((cat) => {
                  const count = portfolioList.filter(
                    (p) => p.category.toLowerCase() === cat.toLowerCase()
                  ).length;
                  const isDeletingThis = isDeletingCategoryName === cat;

                  return (
                    <div
                      key={cat}
                      className="p-3 rounded-2xl bg-stone-950 border border-stone-800/80 flex items-center justify-between gap-3 hover:border-stone-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-serif font-medium text-white truncate block">
                          {cat}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          {count} {count === 1 ? 'folder' : 'folders'}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isDeletingThis}
                        onClick={() => handleDeleteEntireCategory(cat)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-600 text-rose-400 hover:text-white border border-stone-800 hover:border-rose-500 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
                      >
                        {isDeletingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteCategoryModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
