import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Send,
  ArrowLeft,
  Sparkles,
  Info,
  Calendar,
  User,
  Copy,
  Check,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { ClientFolder, StudioPhoto } from '../types/index';
import { studioStore } from '../services/studioStore';
import { verifyFolderAccess, calculateSelectionStats, copyTextToClipboard } from '../utils/security';
import { WatermarkedImage } from './WatermarkedImage';
import { PhotoDetailModal } from './PhotoDetailModal';

interface ClientGalleryViewProps {
  folder: ClientFolder;
  onBackToMain: () => void;
  initialUnlocked?: boolean;
  initialRole?: 'client' | 'admin';
}

export const ClientGalleryView: React.FC<ClientGalleryViewProps> = ({
  folder,
  onBackToMain,
  initialUnlocked = false,
  initialRole,
}) => {
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [passcode, setPasscode] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'client' | 'admin' | null>(
    initialUnlocked ? (initialRole ?? 'client') : null
  );

  // Filter state
  const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'unselected'>('all');
  const [activeDetailPhoto, setActiveDetailPhoto] = useState<StudioPhoto | null>(null);

  // Submit modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [clientFinalNote, setClientFinalNote] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(Boolean(folder.selectionSubmitted));
  const [copiedLink, setCopiedLink] = useState(false);

  // Refresh folder state from store
  const [currentFolder, setCurrentFolder] = useState<ClientFolder>(folder);

  useEffect(() => {
    const unsub = studioStore.subscribe(() => {
      const updated = studioStore.getFolderById(folder.id);
      if (updated) {
        setCurrentFolder(updated);
        if (updated.selectionSubmitted) {
          setSubmittedSuccess(true);
        }
      }
    });
    return unsub;
  }, [folder.id]);

  const stats = calculateSelectionStats(currentFolder.photos.length, currentFolder.selections);
  const targetCount = currentFolder.targetSelectionCount || 10;

  // Filter photos
  const filteredPhotos = currentFolder.photos.filter((p) => {
    const isSelected = Boolean(currentFolder.selections[p.id]?.selected);
    if (filterMode === 'selected') return isSelected;
    if (filterMode === 'unselected') return !isSelected;
    return true;
  });

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const adminPasswords = studioStore.getAdminPasswords();
    const result = verifyFolderAccess(passcode, currentFolder.clientPassword, adminPasswords);

    if (result.granted) {
      setUnlocked(true);
      setActiveRole(result.role);
    } else {
      setPasswordError(result.message || 'Incorrect passcode. Please check your card or message studio.');
    }
  };

  const handleToggleSelect = async (photoId: string) => {
    await studioStore.toggleClientSelection(currentFolder.id, photoId);
  };

  const handleSaveNote = async (photoId: string, note: string) => {
    await studioStore.updatePhotoNote(currentFolder.id, photoId, note);
  };

  const handleSubmitSelections = async (e: React.FormEvent) => {
    e.preventDefault();
    await studioStore.submitFolderSelection(currentFolder.id, clientFinalNote);
    setIsSubmitModalOpen(false);
    setSubmittedSuccess(true);
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?folder=${currentFolder.id}`;
    await copyTextToClipboard(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // --- 1. MOBILE PASSWORD GATEWAY (LOCKED STATE) ---
  if (!unlocked) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 max-w-md mx-auto">
        <div className="w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <button
            type="button"
            onClick={onBackToMain}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 mb-5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Studio Home
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <div className="mb-5">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
              Private Client Vault
            </span>
            <h1 className="text-xl font-serif text-white tracking-wide mt-0.5 leading-snug">
              {currentFolder.name}
            </h1>
            <p className="text-xs text-stone-400 mt-1 flex items-center gap-1.5">
              <User className="w-3 h-3 text-stone-500" />
              <span>Dedicated for <strong>{currentFolder.clientName}</strong></span>
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="client-passcode" className="block text-[11px] font-medium text-stone-300 uppercase tracking-wider mb-1.5">
                Enter Folder Passcode
              </label>
              <div className="relative">
                <input
                  id="client-passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-400 font-mono"
                  autoFocus
                />
                <KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-stone-500 pointer-events-none" />
              </div>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wider uppercase transition-colors shadow-md"
            >
              Unlock Gallery Proofs
            </button>
          </form>

          {/* Demonstration helper card */}
          <div className="mt-6 pt-4 border-t border-stone-800 text-[11px] text-stone-400 space-y-1 bg-stone-950/70 p-3 rounded-xl border border-stone-800">
            <span className="text-amber-300 font-medium block">Dual Passcode System:</span>
            <p>• Client Pass: <code className="text-amber-200 bg-stone-900 px-1 py-0.5 rounded font-mono">{currentFolder.clientPassword}</code></p>
            <p>• Admin Pass: <code className="text-amber-200 bg-stone-900 px-1 py-0.5 rounded font-mono">1234</code></p>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. MOBILE PROOFING VAULT (UNLOCKED) ---
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-28 max-w-md mx-auto">
      {/* Mobile Sticky Gallery Header */}
      <div className="sticky top-16 z-30 bg-stone-950/95 border-b border-stone-800/90 backdrop-blur-xl px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToMain}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>100% Black-Screen DRM Active</span>
          </div>
        </div>

        <div>
          <h1 className="text-base font-serif text-white font-medium leading-tight truncate">
            {currentFolder.name}
          </h1>
          <p className="text-[11px] text-stone-400">Client: {currentFolder.clientName}</p>
        </div>

        {/* Mobile Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-300">
              Selected: <strong>{stats.selected}</strong> of {targetCount} target
            </span>
            <span className="text-amber-400 font-mono text-[10px]">{stats.percent}% done</span>
          </div>
          <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
              style={{ width: `${Math.min(100, (stats.selected / targetCount) * 100)}%` }}
            />
          </div>
        </div>

        {/* Horizontal Swipeable Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg text-xs transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-stone-800 text-amber-300 font-medium'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            All ({currentFolder.photos.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('selected')}
            className={`px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 whitespace-nowrap ${
              filterMode === 'selected'
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Heart className="w-3 h-3 fill-current" />
            <span>Selected ({stats.selected})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('unselected')}
            className={`px-3 py-1 rounded-lg text-xs transition-colors whitespace-nowrap ${
              filterMode === 'unselected'
                ? 'bg-stone-800 text-stone-200'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Unselected ({currentFolder.photos.length - stats.selected})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 pt-4 space-y-4">
        {/* Anti-Theft Black-Screen Simulation Banner */}
        <div className="p-3 rounded-2xl bg-stone-900/60 border border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-[11px] text-stone-300">Screenshot = Solid Black Screen</span>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PrintScreen', bubbles: true }))}
            className="px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-amber-300 border border-amber-500/30 text-[10px] font-mono shrink-0 transition-colors"
          >
            Test Black Screen
          </button>
        </div>

        {/* Photographer Note */}
        {currentFolder.notes && (
          <div className="p-3 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-xs text-stone-300 leading-relaxed">
            <p className="text-[10px] text-amber-400 uppercase tracking-widest font-mono mb-1">
              Instructions
            </p>
            {currentFolder.notes}
          </div>
        )}

        {/* Mobile Photo Feed (Single Column for high-res touch inspection) */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-stone-800 rounded-2xl p-6">
            <Heart className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <h4 className="text-sm font-serif text-stone-300">No photos match filter</h4>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-stone-800 text-xs text-stone-200"
            >
              Show All Proofs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPhotos.map((photo) => {
              const selection = currentFolder.selections[photo.id];
              const isSelected = Boolean(selection?.selected);
              const hasNote = Boolean(selection?.note && selection.note.trim().length > 0);

              return (
                <WatermarkedImage
                  key={photo.id}
                  photo={photo}
                  clientName={currentFolder.clientName}
                  watermarkText={currentFolder.watermarkText}
                  isSelected={isSelected}
                  hasNote={hasNote}
                  onToggleSelect={() => handleToggleSelect(photo.id)}
                  onOpenDetail={() => setActiveDetailPhoto(photo)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Mobile Action Toolbar */}
      <div className="fixed bottom-0 inset-x-0 z-30 max-w-md mx-auto p-3 bg-stone-950/95 border-t border-stone-800/90 backdrop-blur-xl flex items-center gap-2">
        <button
          type="button"
          onClick={copyShareLink}
          className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 active:bg-stone-800 transition-colors"
          title="Copy Link"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => setIsSubmitModalOpen(true)}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg ${
            submittedSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
          }`}
        >
          {submittedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Selections Finalized ({stats.selected})</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit Selections ({stats.selected})</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile Photo Detail Modal */}
      {activeDetailPhoto && (
        <PhotoDetailModal
          photo={activeDetailPhoto}
          photos={currentFolder.photos}
          selection={currentFolder.selections[activeDetailPhoto.id]}
          clientName={currentFolder.clientName}
          watermarkText={currentFolder.watermarkText}
          onClose={() => setActiveDetailPhoto(null)}
          onToggleSelect={handleToggleSelect}
          onSaveNote={handleSaveNote}
          onNavigate={(next) => setActiveDetailPhoto(next)}
        />
      )}

      {/* Mobile Submission Bottom Sheet */}
      {isSubmitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-serif text-white font-medium mb-1">
              Submit Selections to Studio
            </h3>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Confirm your <strong>{stats.selected} chosen photographs</strong>. Our retouchers will receive your list and notes immediately.
            </p>

            <form onSubmit={handleSubmitSelections} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-300 uppercase tracking-wider mb-1.5">
                  Final Retouching Notes (Optional)
                </label>
                <textarea
                  value={clientFinalNote}
                  onChange={(e) => setClientFinalNote(e.target.value)}
                  placeholder="e.g. Please proceed with warm tones and portrait crops..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs tracking-wider uppercase shadow-md"
                >
                  Confirm & Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
