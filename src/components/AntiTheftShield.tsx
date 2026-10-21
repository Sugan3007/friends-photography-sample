import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Lock, AlertTriangle, EyeOff, ShieldCheck, Play } from 'lucide-react';
import { isProtectedShortcut, isScreenshotAttempt } from '../utils/security';

interface AntiTheftShieldProps {
  active?: boolean;
  folderName?: string;
  clientName?: string;
}

export const AntiTheftShield: React.FC<AntiTheftShieldProps> = ({
  active = true,
  folderName,
  clientName,
}) => {
  // Is the pure pitch black screen currently covering the viewport?
  const [isBlackoutActive, setIsBlackoutActive] = useState(false);
  const [blackoutReason, setBlackoutReason] = useState<string>('Screenshot or screen-capture attempt detected');
  const [warningToast, setWarningToast] = useState<string | null>(null);

  const blackoutTimeoutRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);

  const triggerBlackout = (reason: string, minDurationMs = 2500) => {
    setIsBlackoutActive(true);
    setBlackoutReason(reason);

    if (blackoutTimeoutRef.current) {
      clearTimeout(blackoutTimeoutRef.current);
    }

    // Keep black screen up for at least minDurationMs
    blackoutTimeoutRef.current = setTimeout(() => {
      // Only lift if document is currently visible and focused
      if (document.hasFocus() && document.visibilityState === 'visible') {
        setIsBlackoutActive(false);
        showToast('Capture blocked: Studio proofs are shielded by proprietary black-screen DRM.');
      }
    }, minDurationMs);
  };

  const showToast = (msg: string) => {
    setWarningToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setWarningToast(null);
    }, 4000);
  };

  useEffect(() => {
    if (!active) return;

    // 1. Intercept context menu right-clicks
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showToast('Right-click is disabled to protect proprietary photographs.');
      return false;
    };

    // 2. Intercept image dragging
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showToast('Image dragging and saving are prohibited.');
      return false;
    };

    // 3. Intercept keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is attempting a screenshot / screen capture
      if (isScreenshotAttempt(e)) {
        e.preventDefault();
        e.stopPropagation();
        triggerBlackout('Screenshot capture hotkey detected! Website display shielded with pure black screen.', 3500);
        return false;
      }

      if (isProtectedShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();

        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
          triggerBlackout('Print command blocked. Studio proofs cannot be printed.', 3000);
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
          triggerBlackout('Saving webpage or image assets is restricted.', 3000);
        } else {
          showToast('Inspection and asset extraction shortcuts are disabled.');
        }
        return false;
      }
    };

    // 4. KeyUp for PrintScreen (clears clipboard and forces blackout)
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if (key === 'printscreen' || key === 'snapshot') {
        e.preventDefault();
        triggerBlackout('Screenshot key released. Proofs remain blacked out.', 3000);
      }
    };

    // 5. Window Blur (Triggers instantly when Snipping Tool, Mac screenshot tool, or screen recorder steals focus)
    const handleWindowBlur = () => {
      triggerBlackout('Window focus lost (Snipping Tool or Screen Recorder detected). Blackout active.', 2500);
    };

    // 6. Window Focus: Resume when user focuses back
    const handleWindowFocus = () => {
      // Small safety delay before unveiling
      setTimeout(() => {
        if (document.hasFocus() && document.visibilityState === 'visible') {
          setIsBlackoutActive(false);
        }
      }, 500);
    };

    // 7. Visibility Change: Tab switched or minimized
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsBlackoutActive(true);
        setBlackoutReason('Browser tab hidden or background capture active.');
      } else {
        setTimeout(() => {
          if (document.hasFocus()) {
            setIsBlackoutActive(false);
          }
        }, 500);
      }
    };

    // 8. Prevent Copy / Cut shortcuts
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      try {
        e.clipboardData?.setData('text/plain', '');
      } catch {
        // ignore
      }
      showToast('Copying content is disabled.');
    };

    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCopy, true);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCopy, true);
      if (blackoutTimeoutRef.current) clearTimeout(blackoutTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      {/* ============================================================== */}
      {/* 1. PURE SOLID BLACK SCREEN ON SCREENSHOT / RECORDING / BLUR */}
      {/* Strictly solid pitch black (#000000) with zero website transparency */}
      {/* ============================================================== */}
      {isBlackoutActive && (
        <div
          id="anti-capture-blackout-curtain"
          className="fixed inset-0 z-[99999999] w-screen h-screen bg-black flex flex-col items-center justify-center p-6 text-center select-none cursor-default"
          style={{
            backgroundColor: '#000000',
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 99999999,
          }}
          role="alert"
          aria-live="assertive"
          onClick={() => {
            if (document.hasFocus()) {
              setIsBlackoutActive(false);
            }
          }}
        >
          {/* Pitch black background with subtle minimal security text only */}
          <div className="max-w-md p-6 rounded-2xl bg-black border border-stone-900 text-stone-500 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center text-amber-500/60 mx-auto mb-3">
              <EyeOff className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-mono tracking-widest text-stone-400 uppercase mb-1">
              Screen Capture Restricted
            </h2>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed font-mono">
              Screenshot or screen recording attempted. Original website is shielded with solid black screen.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsBlackoutActive(false);
              }}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-mono transition-colors"
            >
              Click Here to Resume Proofing
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FLOATING SECURITY NOTIFICATION TOAST */}
      {/* ============================================================== */}
      {warningToast && !isBlackoutActive && (
        <div
          className="fixed bottom-6 right-6 z-[999999] max-w-md bg-stone-950 border border-amber-500/40 text-stone-100 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          role="status"
        >
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 font-medium text-amber-300 text-xs tracking-wider uppercase font-mono">
              <span>DRM Guard</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-stone-400">Anti-Capture</span>
            </div>
            <p className="text-xs text-stone-200 mt-1 leading-snug">{warningToast}</p>
            <p className="text-[11px] text-stone-500 mt-1">
              Proprietary proofing mode: Captures result only in a black screen.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
