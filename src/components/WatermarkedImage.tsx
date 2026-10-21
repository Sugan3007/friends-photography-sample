import React, { useState } from 'react';
import { Heart, Check, ZoomIn, MessageSquare, Shield, ShieldCheck } from 'lucide-react';
import { StudioPhoto } from '../types/index';

interface WatermarkedImageProps {
  photo: StudioPhoto;
  clientName?: string;
  watermarkText?: string;
  isSelected?: boolean;
  hasNote?: boolean;
  onToggleSelect?: () => void;
  onOpenDetail?: () => void;
  showSelectButton?: boolean;
  priority?: boolean;
}

export const WatermarkedImage: React.FC<WatermarkedImageProps> = ({
  photo,
  clientName,
  watermarkText,
  isSelected = false,
  hasNote = false,
  onToggleSelect,
  onOpenDetail,
  showSelectButton = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const displayWatermark = watermarkText || `PROOF ONLY — ${clientName?.toUpperCase() || 'STUDIO CLIENT'} — DO NOT REPRODUCE`;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-stone-900 border transition-all duration-300 select-none ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
          : 'border-stone-800 hover:border-stone-600'
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* Aspect Ratio Box / Image Container */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-stone-950">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900 animate-pulse">
            <span className="text-xs text-stone-500 tracking-widest font-mono">ENCRYPTING PROOF...</span>
          </div>
        )}

        {/* 1. Underlying raw photo (pointer-events-none & drag-disabled) */}
        <img
          src={photo.url}
          alt={photo.title}
          loading="lazy"
          draggable={false}
          onLoad={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none select-none ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
          } as React.CSSProperties}
        />

        {/* 2. Security Anti-Print & Watermark Mesh Layer */}
        <div
          className="absolute inset-0 pointer-events-none z-10 overflow-hidden mix-blend-overlay opacity-80"
          aria-hidden="true"
        >
          {/* Repeating diagonal watermark text SVG */}
          <svg className="w-full h-full opacity-60">
            <defs>
              <pattern
                id={`wm-${photo.id}`}
                width="240"
                height="160"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-25)"
              >
                <text
                  x="15"
                  y="45"
                  className="font-mono text-[10px] tracking-widest fill-white/80 font-bold"
                >
                  {displayWatermark}
                </text>
                <text
                  x="20"
                  y="110"
                  className="font-mono text-[9px] tracking-widest fill-amber-200/70"
                >
                  FRIENDS PHOTOGRAPHY • PROTECTED
                </text>
                {/* Security fine grid lines */}
                <line x1="0" y1="0" x2="240" y2="0" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <line x1="0" y1="80" x2="240" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#wm-${photo.id})`} />
          </svg>

          {/* Centered studio crest watermark stamp */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center transform -rotate-12 px-4 py-2 border border-white/20 bg-stone-950/30 backdrop-blur-[1px] rounded-lg">
              <span className="block font-serif tracking-[0.25em] text-white/50 text-xs sm:text-sm font-semibold uppercase">
                FRIENDS PHOTOGRAPHY
              </span>
              <span className="block font-mono text-[9px] text-amber-300/60 tracking-widest mt-0.5">
                UNAUTHORIZED COPY PROHIBITED
              </span>
            </div>
          </div>
        </div>

        {/* 3. Transparent Click-Trap Shield: Any browser right-click or drag hits this blank div */}
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={onOpenDetail}
          title="Click to view full preview & notes"
          aria-label={`View photo ${photo.title}`}
        />

        {/* 4. Interactive Selection Controls (Z-30 above click trap) */}
        {showSelectButton && onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className={`absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-lg backdrop-blur-md ${
              isSelected
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-amber-500/30'
                : 'bg-stone-900/80 text-stone-200 hover:bg-stone-800 border border-white/10 hover:border-amber-400/50'
            }`}
            aria-label={isSelected ? 'Remove photo from selection' : 'Select photo for finished album'}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Selected</span>
              </>
            ) : (
              <>
                <Heart className="w-3.5 h-3.5" />
                <span>Select Photo</span>
              </>
            )}
          </button>
        )}

        {/* Note indicator badge */}
        {hasNote && (
          <div
            className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2 py-1 rounded-md bg-stone-900/90 text-amber-300 border border-amber-500/30 text-[11px] shadow-md backdrop-blur-sm"
            title="Special retouching note attached"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Note</span>
          </div>
        )}

        {/* Bottom Bar: Title & Zoom trigger */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-3 bg-gradient-to-t from-stone-950/95 via-stone-950/60 to-transparent flex items-end justify-between pointer-events-none">
          <div className="truncate pr-2">
            <p className="text-xs font-medium text-stone-200 truncate">{photo.title}</p>
            <p className="text-[10px] text-stone-400 font-mono tracking-wider">
              PROOF #{photo.id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenDetail) onOpenDetail();
            }}
            className="pointer-events-auto p-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-white/10 text-xs transition-colors"
            title="Inspect photo detail"
            aria-label="Enlarge photo"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
