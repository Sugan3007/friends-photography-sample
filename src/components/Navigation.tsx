import React from 'react';
import {
  Camera,
  Lock,
  UserCheck,
  FolderKey,
  Compass,
  Images,
  BadgeDollarSign,
  PhoneCall,
  ShieldCheck,
  KeyRound,
  Pencil,
} from 'lucide-react';
import { AdminUser } from '../types/index';
import { EditableText } from './EditableText';

interface NavigationProps {
  currentView: 'home' | 'admin' | 'gallery' | 'event';
  activeTab?: 'showcase' | 'works' | 'pricing' | 'contact';
  onNavigateTab: (tab: 'showcase' | 'works' | 'pricing' | 'contact') => void;
  onNavigateView: (view: 'home' | 'admin' | 'gallery' | 'event') => void;
  currentAdmin: AdminUser | null;
  onAdminLogout: () => void;
  onOpenClientPortalModal?: () => void;
  isEditModeActive?: boolean;
  onToggleEditMode?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  activeTab = 'showcase',
  onNavigateTab,
  onNavigateView,
  currentAdmin,
  onAdminLogout,
  onOpenClientPortalModal,
  isEditModeActive = false,
  onToggleEditMode,
}) => {
  return (
    <>
      {/* 1. TOP MOBILE APP HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-800/90 bg-stone-950/95 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          {/* Studio Brand */}
          <div className="flex items-center gap-2.5 text-left">
            <button
              type="button"
              onClick={() => {
                onNavigateView('home');
                onNavigateTab('showcase');
              }}
              className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400 focus:outline-none hover:border-amber-500/40 transition-colors"
              aria-label="Lumière Photo Atelier Home"
            >
              <Camera className="w-4 h-4" />
            </button>
            <div>
              <span className="block font-serif text-sm font-semibold tracking-[0.18em] text-stone-100 uppercase leading-none">
                <EditableText textKey="brand.name" defaultText="Lumière" isAdmin={Boolean(currentAdmin) && isEditModeActive} />
              </span>
              <span className="block text-[9px] font-mono tracking-widest text-amber-400/80 uppercase mt-0.5">
                <EditableText textKey="brand.subtitle" defaultText="Photo Atelier" isAdmin={Boolean(currentAdmin) && isEditModeActive} />
              </span>
            </div>
          </div>

          {/* Top Right Mobile Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Client Passcode Entry */}
            <button
              type="button"
              onClick={onOpenClientPortalModal}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 transition-colors"
              title="Enter client passcode"
              aria-label="Client Passcode"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
            </button>

            {/* Admin Live Edit Mode Toggle - Only shown in Admin Mode near Key Icon */}
            {currentAdmin && onToggleEditMode && (
              <button
                type="button"
                onClick={onToggleEditMode}
                className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                  isEditModeActive
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                    : 'bg-stone-900 hover:bg-stone-800 border-amber-500/40 text-amber-400 hover:text-amber-300'
                }`}
                title={isEditModeActive ? 'Turn Off Edit Mode' : 'Activate Live Edit Mode (Click to edit text & pricing)'}
                aria-label="Toggle Live Edit Mode"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            {/* Admin Login Button / Status */}
            {currentAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateView('admin')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    currentView === 'admin'
                      ? 'bg-amber-500 text-stone-950 font-semibold'
                      : 'bg-stone-900 text-amber-300 border border-amber-500/30'
                  }`}
                  aria-label="Admin Portal"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="max-w-[70px] truncate">{currentAdmin.username}</span>
                </button>
                <button
                  type="button"
                  onClick={onAdminLogout}
                  className="px-2 py-1 rounded-lg text-[10px] text-stone-400 hover:text-white"
                  title="Logout"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-sm ${
                  currentView === 'admin'
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 hover:border-amber-400/50'
                }`}
                aria-label="Login to Admin"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span className="text-[11px]">Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. FIXED BOTTOM MOBILE APP TAB NAVIGATION */}
      {currentView !== 'gallery' && (
        <nav
          className="fixed bottom-0 inset-x-0 z-40 bg-stone-950/95 border-t border-stone-800/90 backdrop-blur-xl"
          aria-label="Mobile Bottom Navigation"
        >
          <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
            <button
              type="button"
              onClick={() => {
                onNavigateView('home');
                onNavigateTab('showcase');
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                currentView === 'home' && activeTab === 'showcase'
                  ? 'text-amber-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">Showcase</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateView('home');
                onNavigateTab('works');
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                currentView === 'home' && activeTab === 'works'
                  ? 'text-amber-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Images className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">Works</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateView('home');
                onNavigateTab('pricing');
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                currentView === 'home' && activeTab === 'pricing'
                  ? 'text-amber-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BadgeDollarSign className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">Pricing</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateView('home');
                onNavigateTab('contact');
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                currentView === 'home' && activeTab === 'contact'
                  ? 'text-amber-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">Contact</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateView('admin')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                currentView === 'admin'
                  ? 'text-amber-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">Admin</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
