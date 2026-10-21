import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Lock,
  Upload,
  Copy,
  Check,
  Trash2,
  Eye,
  Users,
  Shield,
  Key,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Plus,
  AlertCircle,
  FileText,
  UserPlus,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Layers,
  Star,
  ExternalLink,
  Pencil,
  DollarSign,
  Loader2,
  X,
} from 'lucide-react';
import { AdminUser, ClientFolder, StudioPhoto, PortfolioShowcase, PricingPackage } from '../types/index';
import { studioStore } from '../services/studioStore';
import { uploadPhotoToStorage, uploadEventPhotoToStorage } from '../services/firebaseService';
import { generateSafeClientPasscode, copyTextToClipboard } from '../utils/security';
import { EditPackageModal } from './EditPackageModal';

interface AdminPortalProps {
  currentAdmin: AdminUser | null;
  onAdminLogin: (user: AdminUser) => void;
  onOpenFolderPreview: (folder: ClientFolder) => void;
  onBackToMain: () => void;
  onOpenEventPage?: (event: PortfolioShowcase) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentAdmin,
  onAdminLogin,
  onOpenFolderPreview,
  onBackToMain,
  onOpenEventPage,
}) => {
  // Login form state
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('1234');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Admin Tabs
  const [activeTab, setActiveTab] = useState<'folders' | 'works' | 'pricing' | 'admins' | 'security'>('folders');

  // Pricing & Site Texts State
  const [packages, setPackages] = useState<PricingPackage[]>(() => studioStore.getPackages());
  const [editingAdminPackage, setEditingAdminPackage] = useState<PricingPackage | null>(null);
  const [isAdminPackageModalOpen, setIsAdminPackageModalOpen] = useState(false);
  const [siteTexts, setSiteTexts] = useState<Record<string, string>>(() => studioStore.getSiteTexts());
  const [textSaveSuccess, setTextSaveSuccess] = useState<string | null>(null);

  // Sync with store
  useEffect(() => {
    const unsub = studioStore.subscribe(() => {
      setPortfolio(studioStore.getPortfolio());
      setPackages(studioStore.getPackages());
      setSiteTexts(studioStore.getSiteTexts());
    });
    return unsub;
  }, []);

  // New Folder Modal
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState(generateSafeClientPasscode());
  const [category, setCategory] = useState('Weddings');
  const [targetSelections, setTargetSelections] = useState(15);
  const [folderNotes, setFolderNotes] = useState('Please select your preferred photographs for your finished heirloom album.');
  const [watermarkText, setWatermarkText] = useState('');

  // Upload Modal State
  const [uploadFolder, setUploadFolder] = useState<ClientFolder | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Event photo upload
  const [eventPhotoFile, setEventPhotoFile] = useState<File | null>(null);
  const [isUploadingEventPhoto, setIsUploadingEventPhoto] = useState(false);

  // New Admin Modal State
  const [isNewAdminOpen, setIsNewAdminOpen] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');
  const [adminCreateError, setAdminCreateError] = useState<string | null>(null);
  const [adminCreateSuccess, setAdminCreateSuccess] = useState<string | null>(null);

  // View Selections Modal State
  const [selectedFolderForReview, setSelectedFolderForReview] = useState<ClientFolder | null>(null);

  // Copied link tracker
  const [copiedFolderId, setCopiedFolderId] = useState<string | null>(null);
  const [visibleAdminPasswords, setVisibleAdminPasswords] = useState<Record<string, boolean>>({});

  // Selected Works Portfolio State
  const [portfolio, setPortfolio] = useState<PortfolioShowcase[]>(() => studioStore.getPortfolio());
  const [selectedEventIdForDetail, setSelectedEventIdForDetail] = useState<string | null>(null);

  // Add Photo to Selected Work Modal
  const [targetEventForAddPhoto, setTargetEventForAddPhoto] = useState<PortfolioShowcase | null>(null);
  const [targetEventSetAsCover, setTargetEventSetAsCover] = useState(false);
  const [isDraggingEventPhoto, setIsDraggingEventPhoto] = useState(false);

  // New Category / Event Modal
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<string>('Weddings');
  const [newEventCoverFile, setNewEventCoverFile] = useState<File | null>(null);
  const [newEventCoverPreview, setNewEventCoverPreview] = useState<string | null>(null);
  const [isUploadingNewEventCover, setIsUploadingNewEventCover] = useState(false);
  const [isNewEventCoverDragOver, setIsNewEventCoverDragOver] = useState(false);

  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [isDeletingCatName, setIsDeletingCatName] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<string[]>(() => studioStore.getCategories());

  // Subscribe to studioStore updates
  React.useEffect(() => {
    const unsub = studioStore.subscribe(() => {
      setPortfolio(studioStore.getPortfolio());
      setCategoriesList(studioStore.getCategories());
    });
    return unsub;
  }, []);

  const handleDeleteCategoryInAdmin = async (catName: string) => {
    try {
      setIsDeletingCatName(catName);
      await studioStore.deleteCategory(catName);
      setCategoriesList(studioStore.getCategories());
      setPortfolio(studioStore.getPortfolio());
    } catch (err) {
      console.error('Failed to delete category in admin:', err);
    } finally {
      setIsDeletingCatName(null);
    }
  };

  const folders = studioStore.getFolders();
  const admins = studioStore.getAdmins();

  const handleAdminUploadEventPhotos = async (files: FileList | File[]) => {
    if (!targetEventForAddPhoto) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploadingEventPhoto(true);
    setUploadProgress(0);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadStatus(`Uploading photo ${i + 1} of ${fileArray.length} to Firebase Storage…`);
      try {
        const downloadUrl = await uploadEventPhotoToStorage(
          file,
          targetEventForAddPhoto.id,
          (progress) => setUploadProgress(progress)
        );

        await studioStore.addImageToEvent(targetEventForAddPhoto.id, {
          url: downloadUrl,
          caption: '',
          orientation: 'landscape',
        });

        if (targetEventSetAsCover || !targetEventForAddPhoto.imageUrl || (i === 0 && targetEventSetAsCover)) {
          await studioStore.updateEventCover(targetEventForAddPhoto.id, downloadUrl);
        }
      } catch (err) {
        console.error('Failed to upload', err);
      }
    }

    setPortfolio(studioStore.getPortfolio());
    setIsUploadingEventPhoto(false);
    setUploadProgress(0);
    setUploadStatus(null);
    setTargetEventSetAsCover(false);
    setTargetEventForAddPhoto(null);
  };

  const handleAdminRemovePhotoFromEvent = async (eventId: string, photoId: string) => {
    if (window.confirm('Remove this photo from the event?')) {
      await studioStore.removeImageFromEvent(eventId, photoId);
      setPortfolio(studioStore.getPortfolio());
    }
  };

  const handleAdminSetCoverPhoto = async (eventId: string, imageUrl: string) => {
    await studioStore.updateEventCover(eventId, imageUrl);
    setPortfolio(studioStore.getPortfolio());
  };

  const handleAdminDeleteEvent = async (eventId: string, title: string) => {
    if (window.confirm(`Delete event "${title}" from Selected Works?`)) {
      await studioStore.deleteEvent(eventId);
      setPortfolio(studioStore.getPortfolio());
      if (selectedEventIdForDetail === eventId) {
        setSelectedEventIdForDetail(null);
      }
    }
  };

  const handleAdminCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingNewEventCover) return;
    if (!newEventCategory.trim()) {
      alert('Please enter or select a category tag.');
      return;
    }
    if (!newEventCoverFile) {
      alert('Please upload or drag & drop a cover image.');
      return;
    }

    try {
      setIsUploadingNewEventCover(true);
      const tempId = `cat-${Date.now()}`;
      const coverUrl = await uploadEventPhotoToStorage(newEventCoverFile, tempId);

      const tag = newEventCategory.trim();
      const title = newEventTitle.trim() || tag;

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
            id: `img-${Date.now()}-1`,
            url: coverUrl,
            caption: '',
            orientation: 'landscape',
          },
        ],
      });

      setPortfolio(studioStore.getPortfolio());
      setIsNewEventModalOpen(false);
      setNewEventTitle('');
      setNewEventCategory('Weddings');
      setNewEventCoverFile(null);
      setNewEventCoverPreview(null);
    } catch (err: any) {
      console.error('Failed to create category:', err);
      alert('Failed to upload cover image to Firebase or save category.');
    } finally {
      setIsUploadingNewEventCover(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const user = studioStore.authenticateAdmin(usernameInput, passwordInput);
    if (user) {
      onAdminLogin(user);
    } else {
      setLoginError('Invalid credentials. (Default is admin / 1234)');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingFolder) return;
    if (!folderName.trim() || !clientName.trim()) return;

    try {
      setIsCreatingFolder(true);
      await studioStore.createFolder({
        name: folderName,
        clientName: clientName,
        clientEmail: clientEmail,
        clientPassword: clientPassword,
        category,
        targetSelectionCount: Number(targetSelections) || 10,
        notes: folderNotes,
        watermarkText: watermarkText || `PROOF ONLY — ${clientName.toUpperCase()} — DO NOT REPRODUCE`,
      });

      setIsNewFolderOpen(false);
      setFolderName('');
      setClientName('');
      setClientEmail('');
      setClientPassword(generateSafeClientPasscode());
      setWatermarkText('');
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreateError(null);
    setAdminCreateSuccess(null);

    const res = await studioStore.createAdmin({
      username: newAdminUsername,
      password: newAdminPassword,
      name: newAdminName,
      role: newAdminRole,
    });

    if (res.success && res.admin) {
      setAdminCreateSuccess(`Admin "${res.admin.username}" created successfully.`);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminName('');
      setTimeout(() => {
        setIsNewAdminOpen(false);
        setAdminCreateSuccess(null);
      }, 1500);
    } else {
      setAdminCreateError(res.error || 'Failed to create admin.');
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (username === 'admin') {
      alert('The primary master admin cannot be deleted.');
      return;
    }
    if (window.confirm(`Delete admin "${username}"?`)) {
      await studioStore.deleteAdmin(id);
    }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (window.confirm(`Delete folder "${name}"?`)) {
      await studioStore.deleteFolder(id);
    }
  };

  const copyFolderLink = async (folder: ClientFolder) => {
    const url = `${window.location.origin}${window.location.pathname}?folder=${folder.id}`;
    await copyTextToClipboard(url);
    setCopiedFolderId(folder.id);
    setTimeout(() => setCopiedFolderId(null), 2000);
  };

  // Upload handlers — images go directly to Firebase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !uploadFolder) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus(`Uploading 0 / ${files.length} photos to Firebase…`);

    const newPhotos: StudioPhoto[] = [];
    const fileArray = Array.from(files);

    for (let index = 0; index < fileArray.length; index++) {
      const file = fileArray[index];
      try {
        const downloadURL = await uploadPhotoToStorage(
          file,
          uploadFolder.id,
          (progress) => {
            setUploadProgress(progress);
            setUploadStatus(`Uploading photo ${index + 1} / ${fileArray.length} (${Math.round(progress)}%)…`);
          }
        );
        newPhotos.push({
          id: `photo-${Date.now()}-${index}`,
          folderId: uploadFolder.id,
          title: file.name.replace(/\.[^/.]+$/, ''),
          url: downloadURL,
          orientation: 'landscape',
          uploadDate: new Date().toISOString().split('T')[0],
        });
      } catch (err) {
        console.error('Failed to upload', file.name, err);
      }
    }

    if (newPhotos.length > 0) {
      await studioStore.addPhotosToFolder(uploadFolder.id, newPhotos);
      setUploadStatus(`✓ ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} uploaded to Firebase!`);
    } else {
      setUploadStatus('Upload failed. Please try again.');
    }

    setIsUploading(false);
    setUploadProgress(0);
    setTimeout(() => {
      setUploadStatus(null);
      setUploadFolder(null);
    }, 1800);
  };

  const handleAddSampleStudioPhoto = async (sampleUrl: string, sampleTitle: string) => {
    if (!uploadFolder) return;
    const newPhoto: StudioPhoto = {
      id: `photo-${Date.now()}`,
      folderId: uploadFolder.id,
      title: sampleTitle,
      url: sampleUrl,
      orientation: 'portrait',
      uploadDate: new Date().toISOString().split('T')[0],
    };
    await studioStore.addPhotosToFolder(uploadFolder.id, [newPhoto]);
    setUploadStatus(`Added "${sampleTitle}"`);
    setTimeout(() => setUploadStatus(null), 1000);
  };

  // ==========================================
  // VIEW 1: MOBILE ADMIN LOGIN GATEWAY
  // ==========================================
  if (!currentAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 max-w-md mx-auto">
        <div className="w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl relative">
          <button
            type="button"
            onClick={onBackToMain}
            className="text-xs text-stone-400 hover:text-stone-200 mb-5 flex items-center gap-1.5 transition-colors"
          >
            ← Return to Studio Showcase
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            Internal Operations
          </span>
          <h1 className="text-xl font-serif text-white tracking-wide mt-0.5">Admin Sign In</h1>
          <p className="text-xs text-stone-400 mt-1 mb-5 leading-relaxed">
            Manage protected folders, upload proof collections, and create new admin credentials.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-stone-300 uppercase tracking-wider mb-1">
                Admin Username / ID
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. admin"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-300 uppercase tracking-wider mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="e.g. 1234"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {loginError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wider uppercase transition-colors shadow-md"
            >
              Sign In to Admin Console
            </button>
          </form>

          {/* Quick credentials hint */}
          <div className="mt-6 pt-4 border-t border-stone-800 text-xs text-stone-400 space-y-0.5 bg-stone-950 p-3 rounded-xl border border-stone-800">
            <p className="font-semibold text-stone-300 text-[11px]">Master Admin ID:</p>
            <p className="text-[11px]">
              User: <code className="text-amber-300 font-mono font-bold">admin</code> • Pass: <code className="text-amber-300 font-mono font-bold">1234</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LOGGED-IN MOBILE ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-28 max-w-md mx-auto px-4 pt-4 space-y-4">
      {/* Mobile Top Admin Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            {currentAdmin.role === 'superadmin' ? 'Master Studio Admin' : 'Staff Admin'}
          </span>
          <h1 className="text-xl font-serif text-white tracking-wide">Admin Workspace</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsNewFolderOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Folder</span>
        </button>
      </div>

      {/* 2x2 Compact Mobile Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-mono">Folders</span>
          <span className="text-2xl font-serif text-white font-medium">{folders.length}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-mono">Proofs</span>
          <span className="text-2xl font-serif text-amber-400 font-medium">
            {folders.reduce((acc, f) => acc + f.photos.length, 0)}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-mono">Submitted</span>
          <span className="text-2xl font-serif text-emerald-400 font-medium">
            {folders.filter((f) => f.selectionSubmitted).length}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-mono">Team</span>
          <span className="text-2xl font-serif text-stone-200 font-medium">{admins.length}</span>
        </div>
      </div>

      {/* Mobile Segmented Pill Navigation */}
      <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-2xl border border-stone-800 text-xs overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('folders')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-[11px] font-semibold tracking-wider uppercase transition-colors text-center ${
            activeTab === 'folders'
              ? 'bg-amber-500 text-stone-950'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Folders ({folders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('works')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-[11px] font-semibold tracking-wider uppercase transition-colors text-center ${
            activeTab === 'works'
              ? 'bg-amber-500 text-stone-950'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Works ({portfolio.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-[11px] font-semibold tracking-wider uppercase transition-colors text-center ${
            activeTab === 'pricing'
              ? 'bg-amber-500 text-stone-950'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Pricing ({packages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-[11px] font-semibold tracking-wider uppercase transition-colors text-center ${
            activeTab === 'admins'
              ? 'bg-amber-500 text-stone-950'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Team ({admins.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-[11px] font-semibold tracking-wider uppercase transition-colors text-center ${
            activeTab === 'security'
              ? 'bg-amber-500 text-stone-950'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Security
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: CLIENT FOLDERS (MOBILE FEED) */}
      {/* ============================================================== */}
      {activeTab === 'folders' && (
        <div className="space-y-3">
          {folders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-stone-800 rounded-2xl p-6">
              <FolderPlus className="w-8 h-8 text-stone-600 mx-auto mb-2" />
              <h3 className="text-sm font-serif text-stone-300">No client folders created</h3>
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-semibold"
              >
                Create First Folder
              </button>
            </div>
          ) : (
            folders.map((folder) => {
              const selectedCount = Object.values(folder.selections).filter((s) => s?.selected).length;
              const isSubmitted = Boolean(folder.selectionSubmitted);

              return (
                <div
                  key={folder.id}
                  className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-800 text-stone-300 border border-stone-700">
                      {folder.category}
                    </span>
                    {isSubmitted ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                        Selections Finalized
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400">
                        {selectedCount}/{folder.targetSelectionCount || 10} Selected
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-serif text-white font-medium leading-snug">
                      {folder.name}
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Client: <strong>{folder.clientName}</strong>
                    </p>
                  </div>

                  {/* Dual Passcode Box */}
                  <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-[11px] space-y-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Client Pass:</span>
                      <code className="text-amber-300 font-bold bg-stone-900 px-1.5 py-0.5 rounded">
                        {folder.clientPassword}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Admin Pass:</span>
                      <code className="text-stone-400">1234</code>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{folder.photos.length} Photographs</span>
                  </div>

                  {/* Mobile Actions Grid */}
                  <div className="pt-2 border-t border-stone-800 grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenFolderPreview(folder)}
                      className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadFolder(folder)}
                      className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Add Photos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyFolderLink(folder)}
                      className="py-2 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 text-xs border border-stone-800 flex items-center justify-center gap-1.5"
                    >
                      {copiedFolderId === folder.id ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Link
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFolderForReview(folder)}
                      className="py-2 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 text-xs border border-stone-800 flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Picks ({selectedCount})</span>
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(folder.id, folder.name)}
                      className="text-[11px] text-stone-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Folder
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: SELECTED WORKS & EVENT GALLERIES */}
      {/* ============================================================== */}
      {activeTab === 'works' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-serif text-stone-300">Selected Works & Events</span>
              <p className="text-[10px] text-stone-500 font-mono">Dedicated function pages & photos</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center gap-1 shadow-md"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Event</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteCategoryModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-500/20 text-rose-400 border border-stone-800 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Select and delete categories"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Category</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {portfolio.map((ev) => {
              const isExpanded = selectedEventIdForDetail === ev.id;

              return (
                <div
                  key={ev.id}
                  className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden shadow-lg transition-all"
                >
                  {/* Event Summary Card */}
                  <div className="p-3.5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-950 shrink-0 border border-stone-800 relative">
                        <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-stone-950/80 text-[8px] font-mono text-center text-amber-300 py-0.5">
                          COVER
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-stone-800 text-[9px] font-mono text-amber-400 uppercase">
                            {ev.category}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {ev.images.length} photos
                          </span>
                        </div>
                        <h3 className="text-sm font-serif text-white font-medium truncate mt-0.5">
                          {ev.title}
                        </h3>
                        <p className="text-[11px] text-stone-400 truncate">
                          {ev.client} • {ev.year} {ev.location ? `• ${ev.location}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-stone-800/80">
                      {onOpenEventPage && (
                        <button
                          type="button"
                          onClick={() => onOpenEventPage(ev)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-stone-700/80"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                          <span>Open Live Page</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setTargetEventForAddPhoto(ev)}
                        className="py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedEventIdForDetail(isExpanded ? null : ev.id)}
                        className={`py-1.5 px-2.5 rounded-xl text-[11px] font-medium border transition-colors ${
                          isExpanded
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-stone-800 text-stone-300 border-stone-700'
                        }`}
                      >
                        {isExpanded ? 'Hide Photos' : `Manage (${ev.images.length})`}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdminDeleteEvent(ev.id, ev.title || ev.category)}
                        className="py-1.5 px-2.5 rounded-xl bg-stone-800 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 border border-stone-700 hover:border-rose-500/30 text-[11px] font-medium flex items-center justify-center transition-colors"
                        title="Delete this event folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Expanded Photo Gallery Inside Admin */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-stone-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-stone-400">
                            Photos in {ev.title}:
                          </span>
                          <button
                            type="button"
                            onClick={() => setTargetEventForAddPhoto(ev)}
                            className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" /> Add new photo
                          </button>
                        </div>

                        {ev.images.length === 0 ? (
                          <p className="text-xs text-stone-500 py-3 text-center">
                            No photos in this event yet. Click "Add Photo" to upload.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {ev.images.map((img, idx) => {
                              const isCover = img.url === ev.imageUrl;

                              return (
                                <div
                                  key={img.id}
                                  className="p-2 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-2.5"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={img.url}
                                      alt={img.caption || `Photo ${idx + 1}`}
                                      className="w-12 h-10 object-cover rounded-lg shrink-0 border border-stone-800"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs text-stone-200 truncate font-sans">
                                        {img.caption || `Plate #${idx + 1}`}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-500">
                                        <span>#{idx + 1}</span>
                                        {isCover && (
                                          <span className="text-amber-400 font-semibold">
                                            • Primary Cover
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {!isCover && (
                                      <button
                                        type="button"
                                        onClick={() => handleAdminSetCoverPhoto(ev.id, img.url)}
                                        className="px-2 py-1 rounded-lg bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-[10px] text-stone-300 transition-colors"
                                        title="Make this photo the event cover"
                                      >
                                        Set Cover
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleAdminRemovePhotoFromEvent(ev.id, img.id)}
                                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white border border-red-800 transition-colors"
                                      title="Remove photo from event"
                                      aria-label="Remove photo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-stone-800/80">
                          <button
                            type="button"
                            onClick={() => handleAdminDeleteEvent(ev.id, ev.title)}
                            className="text-[11px] text-stone-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Event Folio</span>
                          </button>

                          {onOpenEventPage && (
                            <button
                              type="button"
                              onClick={() => onOpenEventPage(ev)}
                              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <span>View live page →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: PRICING & SITE CONTENT CMS */}
      {/* ============================================================== */}
      {activeTab === 'pricing' && (
        <div className="space-y-5">
          {/* Section 1: Packages & Pricing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                  Revenue & Offerings
                </span>
                <h3 className="text-sm font-serif text-white font-medium">Studio Packages & Pricing</h3>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const newPkg = await studioStore.addPackage({
                    name: 'New Custom Package',
                    price: '$1,800',
                    duration: '4 Hours Coverage',
                    tagline: 'Tailored photography experience for discerning clients.',
                    deliverables: ['DRM-Protected Proofing Gallery', '20 Master Retouched Files'],
                    features: ['Consultation session'],
                    popular: false,
                  });
                  setEditingAdminPackage(newPkg);
                  setIsAdminPackageModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center gap-1 shadow-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Package</span>
              </button>
            </div>

            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2.5 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-serif text-white font-semibold">{pkg.name}</h4>
                        {pkg.popular && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono uppercase">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">{pkg.duration}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-serif text-amber-300 font-bold block">{pkg.price}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAdminPackage(pkg);
                          setIsAdminPackageModalOpen(true);
                        }}
                        className="mt-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 text-[11px] font-medium flex items-center gap-1 transition-colors ml-auto"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">{pkg.tagline}</p>

                  <div className="pt-2 border-t border-stone-800/80 space-y-1">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">
                      Deliverables ({pkg.deliverables.length})
                    </span>
                    <div className="space-y-1 text-xs text-stone-300">
                      {pkg.deliverables.slice(0, 3).map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <Check className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{d}</span>
                        </div>
                      ))}
                      {pkg.deliverables.length > 3 && (
                        <span className="text-[10px] text-stone-500 italic block">
                          +{pkg.deliverables.length - 3} more items
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Website Text CMS */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                  Text & Copy CMS
                </span>
                <h3 className="text-sm font-serif text-white font-medium">Website Live Copy</h3>
              </div>
              <button
                type="button"
                onClick={onBackToMain}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                title="Go to website and click pencil icons directly"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit on Live Site →</span>
              </button>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Every text on the site can also be edited directly by tapping the ✏️ pencil icons on the main page. You can also edit master values below:
            </p>

            {textSaveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{textSaveSuccess}</span>
              </div>
            )}

            {/* Quick Master Edit Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                  Hero Atelier Badge
                </label>
                <input
                  type="text"
                  value={siteTexts['hero.badge'] || ''}
                  onChange={(e) => setSiteTexts({ ...siteTexts, 'hero.badge': e.target.value })}
                  onBlur={async () => {
                    await studioStore.updateSiteText('hero.badge', siteTexts['hero.badge']);
                    setTextSaveSuccess('Saved Hero Badge!');
                    setTimeout(() => setTextSaveSuccess(null), 2000);
                  }}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                  Hero Main Heading
                </label>
                <textarea
                  value={siteTexts['hero.title'] || ''}
                  rows={2}
                  onChange={(e) => setSiteTexts({ ...siteTexts, 'hero.title': e.target.value })}
                  onBlur={async () => {
                    await studioStore.updateSiteText('hero.title', siteTexts['hero.title']);
                    setTextSaveSuccess('Saved Hero Title!');
                    setTimeout(() => setTextSaveSuccess(null), 2000);
                  }}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400 font-serif"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                  Hero Subtitle
                </label>
                <textarea
                  value={siteTexts['hero.subtitle'] || ''}
                  rows={2}
                  onChange={(e) => setSiteTexts({ ...siteTexts, 'hero.subtitle': e.target.value })}
                  onBlur={async () => {
                    await studioStore.updateSiteText('hero.subtitle', siteTexts['hero.subtitle']);
                    setTextSaveSuccess('Saved Hero Subtitle!');
                    setTimeout(() => setTextSaveSuccess(null), 2000);
                  }}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                    Studio Phone
                  </label>
                  <input
                    type="text"
                    value={siteTexts['contact.phone'] || ''}
                    onChange={(e) => setSiteTexts({ ...siteTexts, 'contact.phone': e.target.value })}
                    onBlur={async () => {
                      await studioStore.updateSiteText('contact.phone', siteTexts['contact.phone']);
                      setTextSaveSuccess('Saved Studio Phone!');
                      setTimeout(() => setTextSaveSuccess(null), 2000);
                    }}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                    Studio Email
                  </label>
                  <input
                    type="text"
                    value={siteTexts['contact.email'] || ''}
                    onChange={(e) => setSiteTexts({ ...siteTexts, 'contact.email': e.target.value })}
                    onBlur={async () => {
                      await studioStore.updateSiteText('contact.email', siteTexts['contact.email']);
                      setTextSaveSuccess('Saved Studio Email!');
                      setTimeout(() => setTextSaveSuccess(null), 2000);
                    }}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ADMIN TEAM (MOBILE CARDS) */}
      {/* ============================================================== */}
      {activeTab === 'admins' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif text-stone-300">Registered Staff Admins</span>
            <button
              type="button"
              onClick={() => setIsNewAdminOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Admin</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {admins.map((adm) => {
              const isMaster = adm.username === 'admin';
              const isPwdVisible = Boolean(visibleAdminPasswords[adm.id]);

              return (
                <div
                  key={adm.id}
                  className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-300">{adm.username}</span>
                      {isMaster && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300">
                          Primary Master
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 capitalize px-2 py-0.5 rounded bg-stone-950">
                      {adm.role}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300">{adm.name}</p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800/80">
                    <div className="font-mono text-[11px] text-stone-400">
                      Pass: {isPwdVisible ? <strong className="text-white">{adm.password}</strong> : '••••••••'}
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleAdminPasswords((prev) => ({
                            ...prev,
                            [adm.id]: !prev[adm.id],
                          }))
                        }
                        className="ml-2 text-[10px] text-amber-400 underline"
                      >
                        {isPwdVisible ? 'Hide' : 'Reveal'}
                      </button>
                    </div>

                    {!isMaster && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                        className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DRM GUARD & ANTI-CAPTURE SIMULATOR */}
      {/* ============================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase font-mono">
              <ShieldAlert className="w-4 h-4" />
              <span>100% Solid Black Screen DRM</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              When screenshot hotkeys, Snipping Tool, or screen recorders are activated, the viewport instantly turns 100% pitch black.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PrintScreen', bubbles: true }))}
              className="mt-2 w-full py-2.5 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs tracking-wider uppercase"
            >
              Test Blackout Shield Simulator
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5 text-xs text-stone-400">
            <h4 className="text-white font-medium text-xs">Proprietary Protection Specs:</h4>
            <p>• <strong>Right-Click & Drag:</strong> Intercepted with blank shields</p>
            <p>• <strong>Repeating Watermark:</strong> High density client copyright mesh</p>
            <p>• <strong>Print Blackout:</strong> CSS print rules zero-render all frames</p>
            <p>• <strong>Clipboard:</strong> Cleared to empty string on capture</p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CREATE NEW CLIENT FOLDER (BOTTOM SHEET) */}
      {/* ============================================================== */}
      {isNewFolderOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-serif text-white font-medium">Create Client Folder</h3>

            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-stone-300 uppercase mb-1">
                  Folder / Event Title *
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. Elena & David — Grand Villa"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-300 uppercase mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Elena Rossi"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Password Setting */}
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-amber-300 uppercase">
                    Client Passcode *
                  </label>
                  <button
                    type="button"
                    onClick={() => setClientPassword(generateSafeClientPasscode())}
                    className="text-[10px] text-stone-400 underline"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  value={clientPassword}
                  onChange={(e) => setClientPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                  required
                />
                <p className="text-[10px] text-stone-500">Universal Admin Pass (1234) also unlocks this folder.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-stone-300 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-300 uppercase mb-1">Target Count</label>
                  <input
                    type="number"
                    min={1}
                    value={targetSelections}
                    onChange={(e) => setTargetSelections(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-3 py-2 text-xs text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs tracking-wider uppercase disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreatingFolder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating…</span>
                    </>
                  ) : (
                    <span>Create Folder</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: UPLOAD PHOTOS */}
      {/* ============================================================== */}
      {uploadFolder && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-serif text-white font-medium">
              Upload Photos to "{uploadFolder.name}"
            </h3>

            <div className="border-2 border-dashed border-stone-700 rounded-2xl p-4 text-center bg-stone-950/50">
              <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-stone-200">Upload photos to Firebase Storage</p>
              <label className={`mt-3 inline-block px-4 py-2 rounded-xl bg-stone-800 text-amber-300 font-semibold text-xs ${isUploading ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                Choose Files
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick add studio proof samples */}
            <div className="space-y-1.5 pt-2 border-t border-stone-800 text-xs">
              <span className="text-[11px] text-stone-400 block font-medium">Quick-Add Curated Samples:</span>
              <button
                type="button"
                disabled={isUploading}
                onClick={() =>
                  handleAddSampleStudioPhoto(
                    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
                    'Bridal Sunset Warmth'
                  )
                }
                className="w-full text-left p-2 rounded-xl bg-stone-950 text-stone-300 text-xs active:bg-stone-800 disabled:opacity-40"
              >
                + Sunset Bridal Portrait
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() =>
                  handleAddSampleStudioPhoto(
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
                    'Editorial Monochrome Fashion'
                  )
                }
                className="w-full text-left p-2 rounded-xl bg-stone-950 text-stone-300 text-xs active:bg-stone-800 disabled:opacity-40"
              >
                + Monochrome Editorial Study
              </button>
            </div>

            {/* Firebase Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-amber-400 font-mono text-center">{uploadStatus}</p>
              </div>
            )}

            {uploadStatus && !isUploading && (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-xs text-amber-300">
                {uploadStatus}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => !isUploading && setUploadFolder(null)}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-stone-800 text-xs text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading…' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: CREATE NEW ADMIN */}
      {/* ============================================================== */}
      {isNewAdminOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-3">
            <h3 className="text-base font-serif text-white font-medium">Create New Studio Admin</h3>
            <p className="text-xs text-stone-400">Only authorized admins can register new admin accounts.</p>

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-stone-300 uppercase mb-1">
                  Admin ID / Username *
                </label>
                <input
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="e.g. sarah_admin"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-300 uppercase mb-1">
                  Admin Password *
                </label>
                <input
                  type="text"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-300 uppercase mb-1">
                  Full Name / Title
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100"
                />
              </div>

              {adminCreateError && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200">
                  {adminCreateError}
                </div>
              )}

              {adminCreateSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300">
                  {adminCreateSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsNewAdminOpen(false)}
                  className="px-3 py-2 text-xs text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs uppercase"
                >
                  Register Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: VIEW CLIENT PICKS */}
      {/* ============================================================== */}
      {selectedFolderForReview && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="text-sm font-serif text-white font-medium truncate">
                Picks: {selectedFolderForReview.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedFolderForReview(null)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {selectedFolderForReview.photos
                .filter((p) => selectedFolderForReview.selections[p.id]?.selected)
                .map((photo) => {
                  const sel = selectedFolderForReview.selections[photo.id];
                  return (
                    <div key={photo.id} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-2.5">
                      <img src={photo.url} alt={photo.title} className="w-14 h-11 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-medium text-stone-200 truncate">{photo.title}</p>
                        {sel?.note ? (
                          <p className="text-[11px] text-amber-300 mt-1 italic">"{sel.note}"</p>
                        ) : (
                          <p className="text-[10px] text-stone-500 mt-0.5">No note</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedFolderForReview(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-xs text-stone-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN ADD PHOTO TO SELECTED WORK */}
      {targetEventForAddPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setTargetEventForAddPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white"
            >
              ✕
            </button>

            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-serif text-white font-medium mb-1">
              Add Photo to Selected Work
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Adding image into <span className="text-amber-300 font-medium">{targetEventForAddPhoto.title}</span> ({targetEventForAddPhoto.category}).
            </p>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingEventPhoto(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingEventPhoto(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingEventPhoto(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length) {
                  handleAdminUploadEventPhotos(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDraggingEventPhoto
                  ? 'border-amber-400 bg-amber-500/20 scale-[1.02]'
                  : 'border-stone-700 bg-stone-950/60 hover:border-amber-500/50'
              }`}
            >
              <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-stone-200">
                Drag and drop image files here
              </p>
              <p className="text-[10px] text-stone-400 mt-1">
                Uploads directly to Firebase Storage (no description required)
              </p>

              <label
                className={`mt-4 inline-block px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all ${
                  isUploadingEventPhoto ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                Choose Image Files
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isUploadingEventPhoto}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length) {
                      handleAdminUploadEventPhotos(e.target.files);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Set as Category Cover Option */}
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-stone-950 border border-stone-800">
              <input
                type="checkbox"
                id="adminSetCoverCheck"
                checked={targetEventSetAsCover}
                onChange={(e) => setTargetEventSetAsCover(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-stone-900 border-stone-700"
              />
              <label htmlFor="adminSetCoverCheck" className="text-xs text-stone-300 cursor-pointer">
                Set first uploaded image as Category Cover
              </label>
            </div>

            {/* Upload Progress */}
            {isUploadingEventPhoto && (
              <div className="mt-4 p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-300 font-mono">
                  <span>{uploadStatus || 'Uploading to Firebase Storage…'}</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW EVENT FOLIO */}
      {isNewEventModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsNewEventModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white"
            >
              ✕
            </button>

            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-serif text-white font-medium mb-1">
              Add Category to Selected Works
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Add a new category to Selected Works. Only a category tag and cover image are required.
            </p>

            <form onSubmit={handleAdminCreateEvent} className="space-y-4">
              {/* Select Category Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider">
                    Select Category *
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">
                    {newEventCategory ? `Selected: ${newEventCategory}` : 'Pick one'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1.5 bg-stone-950/70 rounded-2xl border border-stone-800">
                  {studioStore.getCategories().map((cat) => {
                    const isSelected = newEventCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setNewEventCategory(cat);
                          if (!newEventTitle) setNewEventTitle(`${cat} Folio`);
                        }}
                        className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 text-white border-amber-400 font-semibold ring-1 ring-amber-400/30'
                            : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:text-white hover:border-stone-700'
                        }`}
                      >
                        <span className="text-xs font-serif truncate">{cat}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Folio Title (Optional) */}
              <div>
                <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-1.5">
                  Folio Title (Optional)
                </label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Defaults to Category Tag if empty"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Cover Image Drag & Drop + Browse */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider">
                    Category Cover Image *
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">Firebase Storage</span>
                </div>

                {newEventCoverPreview ? (
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-amber-500/40 bg-stone-950 group">
                    <img
                      src={newEventCoverPreview}
                      alt="Category Cover"
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
                            if (file) {
                              setNewEventCoverFile(file);
                              setNewEventCoverPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setNewEventCoverFile(null);
                          setNewEventCoverPreview(null);
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/90 text-white hover:bg-rose-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsNewEventCoverDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsNewEventCoverDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsNewEventCoverDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        setNewEventCoverFile(file);
                        setNewEventCoverPreview(URL.createObjectURL(file));
                      }
                    }}
                    className={`relative p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                      isNewEventCoverDragOver
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-stone-700 hover:border-amber-500/50 bg-stone-950/60'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewEventCoverFile(file);
                          setNewEventCoverPreview(URL.createObjectURL(file));
                        }
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
                      or click to browse (no image description needed)
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isUploadingNewEventCover || !newEventCategory.trim() || !newEventCoverFile}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 mt-4"
              >
                {isUploadingNewEventCover ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Uploading Cover to Firebase…</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Category</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Package Edit Modal in Admin */}
      <EditPackageModal
        pkg={editingAdminPackage}
        isOpen={isAdminPackageModalOpen}
        onClose={() => {
          setIsAdminPackageModalOpen(false);
          setEditingAdminPackage(null);
        }}
      />

      {/* Delete Category Modal in Admin */}
      {isDeleteCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl space-y-4 my-8">
            <button
              type="button"
              onClick={() => setIsDeleteCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

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
              Click delete next to any category to remove it. All folders and photos under that category will also be permanently deleted.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {categoriesList.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4">No categories found.</p>
              ) : (
                categoriesList.map((cat) => {
                  const count = portfolio.filter(
                    (p) => p.category.toLowerCase() === cat.toLowerCase()
                  ).length;
                  const isDeletingThis = isDeletingCatName === cat;

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
                        onClick={() => handleDeleteCategoryInAdmin(cat)}
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
