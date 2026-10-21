import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
  ExternalLink,
  Layers,
  Heart,
  Share2,
  Upload,
  Loader2,
} from 'lucide-react';
import { PortfolioShowcase, PortfolioEventImage } from '../types/index';
import { studioStore } from '../services/studioStore';
import { uploadEventPhotoToStorage } from '../services/firebaseService';

interface EventGalleryViewProps {
  event: PortfolioShowcase;
  onBack: () => void;
  isAdmin: boolean;
  onNavigateContact?: () => void;
}

export const EventGalleryView: React.FC<EventGalleryViewProps> = ({
  event: initialEvent,
  onBack,
  isAdmin,
  onNavigateContact,
}) => {
  const [currentEvent, setCurrentEvent] = useState<PortfolioShowcase>(initialEvent);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Admin Upload State
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [setAsCoverChecked, setSetAsCoverChecked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Upload image files directly to Firebase Storage with Drag & Drop or File Picker.
   * No link or description needed!
   */
  const handleUploadFiles = async (files: FileList | File[], forceAsCover = false) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadStatus(`Uploading photo ${i + 1} of ${fileArray.length} to Firebase…`);

      try {
        const downloadUrl = await uploadEventPhotoToStorage(
          file,
          currentEvent.id,
          (progress) => setUploadProgress(progress)
        );

        // Add to Firestore event without requiring image description
        const updated = await studioStore.addImageToEvent(currentEvent.id, {
          url: downloadUrl,
          caption: '',
          orientation: 'landscape',
        });

        if (updated) {
          setCurrentEvent({ ...updated });

          // If requested or if the event has no cover image yet, set as category cover
          if (forceAsCover || setAsCoverChecked || !currentEvent.imageUrl || i === 0 && setAsCoverChecked) {
            const withCover = await studioStore.updateEventCover(currentEvent.id, downloadUrl);
            if (withCover) setCurrentEvent({ ...withCover });
          }
        }
      } catch (err) {
        console.error('Failed to upload image to Firebase:', err);
        showToast('Upload error. Please try again.');
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus(null);
    setSetAsCoverChecked(false);
    showToast(`✓ ${fileArray.length} photo${fileArray.length > 1 ? 's' : ''} uploaded to Firebase!`);
    setIsAddPhotoOpen(false);
  };

  const handleRemovePhoto = async (photoId: string, caption?: string) => {
    if (currentEvent.images.length <= 1) {
      if (!window.confirm('This is the last photo in this event gallery. Are you sure you want to remove it?')) {
        return;
      }
    } else {
      if (!window.confirm(`Remove this image from ${currentEvent.title}?`)) {
        return;
      }
    }

    const updated = await studioStore.removeImageFromEvent(currentEvent.id, photoId);
    if (updated) {
      setCurrentEvent({ ...updated });
      showToast('Image removed from event.');
      if (lightboxIndex !== null) {
        setLightboxIndex(null);
      }
    }
  };

  const handleSetCover = async (imageUrl: string) => {
    const updated = await studioStore.updateEventCover(currentEvent.id, imageUrl);
    if (updated) {
      setCurrentEvent({ ...updated });
      showToast('★ Category cover photo updated!');
    }
  };

  const activeLightboxPhoto =
    lightboxIndex !== null && currentEvent.images[lightboxIndex]
      ? currentEvent.images[lightboxIndex]
      : null;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-medium text-xs shadow-2xl flex items-center gap-2 animate-fade-in border border-amber-400">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="sticky top-16 z-30 flex items-center justify-between px-4 py-3 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Back to Selected Works</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-mono text-amber-400 uppercase">
            {currentEvent.category}
          </span>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Admin Mode</span>
            </span>
          )}
        </div>
      </div>

      {/* Hero Cover Banner for this Event */}
      <section className="relative overflow-hidden bg-stone-900 border-b border-stone-800">
        <div className="aspect-[16/10] w-full overflow-hidden relative">
          <img
            src={currentEvent.imageUrl}
            alt={currentEvent.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          {/* Admin Change Cover & Delete Category Buttons on Hero */}
          {isAdmin && (
            <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-stone-950/80 hover:bg-amber-500 hover:text-stone-950 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all">
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>Change Cover</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length) {
                      handleUploadFiles(e.target.files, true);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={async () => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete the folder "${currentEvent.title || currentEvent.category}"? This will permanently delete this folder and its photos, but the category "${currentEvent.category}" will remain intact.`
                    )
                  ) {
                    await studioStore.deleteEvent(currentEvent.id);
                    onBack();
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-stone-950/80 hover:bg-rose-600 text-rose-400 hover:text-white border border-stone-800 hover:border-rose-500 text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all"
                title="Delete this folder (the category will not be deleted)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Folder</span>
              </button>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 text-[10px] font-mono font-semibold uppercase tracking-wider mb-2">
              {currentEvent.category} Folio
            </span>
            <h1 className="text-2xl font-serif text-white tracking-wide leading-tight">
              {currentEvent.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-300 mt-1.5">
              <span>{currentEvent.client}</span>
              {currentEvent.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-stone-400">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {currentEvent.location}
                  </span>
                </>
              )}
              {currentEvent.year && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-stone-400">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    {currentEvent.year}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Admin Mode Drag & Drop Upload Bar */}
      {isAdmin && (
        <section className="mx-4 mt-4 space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length) {
                handleUploadFiles(e.dataTransfer.files);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/15 scale-[1.01]'
                : 'border-amber-500/30 hover:border-amber-500/60 bg-stone-900/90'
            }`}
          >
            <Upload className="w-7 h-7 text-amber-400 mx-auto mb-2 animate-bounce" />
            <h4 className="text-xs font-serif font-semibold text-white">
              Drag & Drop Images for this Work
            </h4>
            <p className="text-[10px] text-stone-400 mt-1">
              Uploads directly to Firebase Storage — no description or URL links required
            </p>

            <div className="mt-3 flex items-center justify-center gap-2">
              <label
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-md transition-all ${
                  isUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Choose Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length) {
                      handleUploadFiles(e.target.files);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
              >
                Upload Modal
              </button>
            </div>

            {/* Upload progress indicator */}
            {isUploading && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-amber-300">
                  <span>{uploadStatus || 'Uploading to Firebase Storage…'}</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Event Narrative & Curated Stats */}
      <section className="px-4 py-5 space-y-3">
        <p className="text-xs text-stone-300 leading-relaxed font-sans">
          {currentEvent.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-stone-900 text-[11px] text-stone-400">
          <span className="flex items-center gap-1 font-mono">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            {currentEvent.images.length} Curated Plates
          </span>
          <span className="text-[10px] font-mono text-stone-500 uppercase">
            Curated by Lumière Atelier
          </span>
        </div>
      </section>

      {/* Event Photo Gallery Grid */}
      <section className="px-4 space-y-4">
        {currentEvent.images.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-stone-900/50 border border-dashed border-stone-800 text-stone-400">
            <ImageIcon className="w-8 h-8 mx-auto text-stone-600 mb-2" />
            <p className="text-xs">No images in this event gallery yet.</p>
            {isAdmin && (
              <label className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-medium inline-flex items-center gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>Upload first photo</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length) {
                      handleUploadFiles(e.target.files, true);
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentEvent.images.map((img, idx) => {
              const isCover = img.url === currentEvent.imageUrl;

              return (
                <div
                  key={img.id}
                  className={`group relative rounded-2xl overflow-hidden bg-stone-900 border transition-all ${
                    isCover ? 'border-amber-400/80 shadow-lg shadow-amber-500/10' : 'border-stone-800'
                  }`}
                >
                  {/* Photo Container */}
                  <div
                    onClick={() => setLightboxIndex(idx)}
                    className="cursor-pointer relative overflow-hidden bg-stone-950"
                  >
                    <img
                      src={img.url}
                      alt={`${currentEvent.title} plate ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    />

                    {/* Cover Badge on Photo */}
                    {isCover && (
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-mono font-bold uppercase shadow-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Category Cover
                      </span>
                    )}

                    {/* Watermark Protection Hint */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white/50 text-[9px] font-mono tracking-widest uppercase pointer-events-none">
                      LUMIÈRE ATELIER
                    </span>
                  </div>

                  {/* Photo Admin Controls Bar */}
                  <div className="p-3 bg-stone-900/95 border-t border-stone-800 flex items-center justify-between gap-2">
                    <p className="text-xs text-stone-300 font-sans truncate">
                      Plate #{idx + 1}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAdmin ? (
                        <>
                          {/* Set Cover Button */}
                          <button
                            type="button"
                            onClick={() => handleSetCover(img.url)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all ${
                              isCover
                                ? 'bg-amber-500 text-stone-950 shadow-sm pointer-events-none'
                                : 'bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300'
                            }`}
                            title={isCover ? 'Current Category Cover' : 'Set as Category Cover Photo'}
                          >
                            <Star className={`w-3 h-3 ${isCover ? 'fill-current' : ''}`} />
                            <span>{isCover ? 'Cover' : 'Set as Cover'}</span>
                          </button>

                          {/* Delete Photo Button */}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(img.id, img.caption)}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 hover:text-white transition-colors"
                            title="Remove photo from event"
                            aria-label="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="px-2 py-1 rounded-lg bg-stone-800 text-[10px] text-stone-400 hover:text-white"
                        >
                          View Full
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Inquiry & Next Actions */}
      <section className="px-4 pt-6 space-y-3">
        {onNavigateContact && (
          <button
            type="button"
            onClick={onNavigateContact}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>Inquire About Similar Event Folio</span>
          </button>
        )}

        <button
          type="button"
          onClick={onBack}
          className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs text-stone-300 flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Return to All Selected Works</span>
        </button>
      </section>

      {/* Lightbox Fullscreen View */}
      {lightboxIndex !== null && activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-stone-950/98 backdrop-blur-xl p-4 select-none"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* Lightbox Header */}
          <div
            className="flex items-center justify-between pb-3 border-b border-stone-800/80 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase">
                {currentEvent.title} • {lightboxIndex + 1} of {currentEvent.images.length}
              </span>
              <p className="text-xs text-stone-300 font-medium truncate max-w-[240px]">
                Plate #{lightboxIndex + 1}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-full bg-stone-800 text-stone-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lightbox Center Image */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden my-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeLightboxPhoto.url}
              alt="Enlarged photo"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />

            {/* Previous Photo Button */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
                className="absolute left-2 p-2.5 rounded-full bg-stone-900/80 border border-stone-700 text-white hover:bg-amber-500 hover:text-stone-950 transition-colors shadow-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Next Photo Button */}
            {lightboxIndex < currentEvent.images.length - 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                className="absolute right-2 p-2.5 rounded-full bg-stone-900/80 border border-stone-700 text-white hover:bg-amber-500 hover:text-stone-950 transition-colors shadow-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Lightbox Footer */}
          <div
            className="flex items-center justify-between pt-3 border-t border-stone-800/80 text-[10px] text-stone-400 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-stone-500">PROTECTED ARCHIVAL PROOF</span>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetCover(activeLightboxPhoto.url)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-semibold text-xs flex items-center gap-1 shadow-md"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Set as Category Cover</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(activeLightboxPhoto.id, activeLightboxPhoto.caption)}
                  className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Plate</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Drag & Drop Upload Modal */}
      {isAddPhotoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
          onClick={() => setIsAddPhotoOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsAddPhotoOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Upload className="w-5 h-5 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-serif text-white font-medium mb-1">
              Upload Images to {currentEvent.title}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Category: <span className="text-amber-300 font-semibold">{currentEvent.category}</span>. Photos are uploaded directly to Firebase Storage.
            </p>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length) {
                  handleUploadFiles(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/20 scale-[1.02]'
                  : 'border-stone-700 bg-stone-950/60 hover:border-amber-500/50'
              }`}
            >
              <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-stone-200">
                Drag and drop image files here
              </p>
              <p className="text-[10px] text-stone-400 mt-1">
                Supports JPG, PNG, WebP (multiple files allowed)
              </p>

              <label
                className={`mt-4 inline-block px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all ${
                  isUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                Choose Image Files
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length) {
                      handleUploadFiles(e.target.files);
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
                id="setCoverCheck"
                checked={setAsCoverChecked}
                onChange={(e) => setSetAsCoverChecked(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-stone-900 border-stone-700"
              />
              <label htmlFor="setCoverCheck" className="text-xs text-stone-300 cursor-pointer">
                Set first uploaded image as Category Cover
              </label>
            </div>

            {/* Upload Progress */}
            {isUploading && (
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
    </div>
  );
};
