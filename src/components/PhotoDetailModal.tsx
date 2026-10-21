import React, { useState } from 'react';
import { X, Check, Heart, ChevronLeft, ChevronRight, MessageSquare, Shield, Lock } from 'lucide-react';
import { StudioPhoto, ClientSelection } from '../types/index';

interface PhotoDetailModalProps {
  photo: StudioPhoto;
  photos: StudioPhoto[];
  selection?: ClientSelection;
  clientName?: string;
  watermarkText?: string;
  onClose: () => void;
  onToggleSelect: (photoId: string) => void;
  onSaveNote: (photoId: string, note: string) => void;
  onNavigate: (photo: StudioPhoto) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  photos,
  selection,
  clientName,
  watermarkText,
  onClose,
  onToggleSelect,
  onSaveNote,
  onNavigate,
}) => {
  const [noteText, setNoteText] = useState(selection?.note || '');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const currentIndex = photos.findIndex((p) => p.id === photo.id);
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNote(photo.id, noteText);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const displayWatermark = watermarkText || `PROOF ONLY — ${clientName?.toUpperCase() || 'CLIENT'} — REPRODUCTION RESTRICTED`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95 backdrop-blur-md p-0 select-none"
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo details: ${photo.title}`}
    >
      <div className="relative w-full max-w-md h-full max-h-screen flex flex-col justify-between bg-stone-950 overflow-hidden shadow-2xl">
        {/* Top Mobile Bar */}
        <div className="flex items-center justify-between p-3.5 border-b border-stone-800/80 bg-stone-950/90 z-40">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 text-stone-300 hover:text-white border border-stone-800"
            aria-label="Close photo preview"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
              Proof {currentIndex + 1} of {photos.length}
            </span>
            <p className="text-xs font-serif text-white truncate max-w-[180px]">{photo.title}</p>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-stone-900 border border-stone-800 text-[10px] text-amber-400">
            <Lock className="w-3 h-3" />
            <span>DRM</span>
          </div>
        </div>

        {/* Center Protected Photo Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
          {/* Click Trap Shield */}
          <div
            className="absolute inset-0 z-20 cursor-default"
            onContextMenu={(e) => {
              e.preventDefault();
              return false;
            }}
          />

          <img
            src={photo.url}
            alt={photo.title}
            draggable={false}
            className="max-h-[58vh] w-auto max-w-full object-contain pointer-events-none select-none rounded shadow-lg"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
            } as React.CSSProperties}
          />

          {/* Repeating Watermark Mesh */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden mix-blend-overlay opacity-80">
            <svg className="w-full h-full opacity-70">
              <defs>
                <pattern
                  id={`detail-wm-${photo.id}`}
                  width="240"
                  height="160"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-28)"
                >
                  <text
                    x="15"
                    y="45"
                    className="font-mono text-[10px] tracking-widest fill-white font-bold"
                  >
                    {displayWatermark}
                  </text>
                  <text
                    x="20"
                    y="110"
                    className="font-mono text-[9px] tracking-widest fill-amber-300"
                  >
                    LUMIÈRE ATELIER • ARCHIVAL
                  </text>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#detail-wm-${photo.id})`} />
            </svg>
          </div>

          {/* Floating Prev / Next Navigation Arrows */}
          {prevPhoto && (
            <button
              type="button"
              onClick={() => onNavigate(prevPhoto)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {nextPhoto && (
            <button
              type="button"
              onClick={() => onNavigate(nextPhoto)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Mobile Action & Retouching Sheet */}
        <div className="p-4 bg-stone-900 border-t border-stone-800/90 z-30 space-y-3">
          {/* Big Thumb Touch Selection Button */}
          <button
            type="button"
            onClick={() => onToggleSelect(photo.id)}
            className={`w-full py-3.5 px-4 rounded-2xl text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md ${
              selection?.selected
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
          >
            {selection?.selected ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Selected for Final Collection</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                <span>Tap to Select This Photo</span>
              </>
            )}
          </button>

          {/* Retouching Notes Accordion / Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsNoteExpanded(!isNoteExpanded)}
              className="w-full flex items-center justify-between text-xs text-stone-400 py-1.5"
            >
              <span className="flex items-center gap-1.5 text-stone-300 font-medium text-[11px]">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Retouching Instructions {selection?.note ? '(Note saved)' : ''}</span>
              </span>
              <span className="text-[10px] text-amber-400 underline">
                {isNoteExpanded ? 'Hide' : 'Edit Note'}
              </span>
            </button>

            {isNoteExpanded && (
              <form onSubmit={handleSaveNote} className="space-y-2 mt-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Please soften shadow on background, b&w conversion..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-stone-800 text-[11px] text-stone-200 font-medium"
                  >
                    Save Note
                  </button>
                  {isSavedToast && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved!
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
