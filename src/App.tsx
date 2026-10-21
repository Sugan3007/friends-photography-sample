import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { MainSite } from './components/MainSite';
import { AdminPortal } from './components/AdminPortal';
import { ClientGalleryView } from './components/ClientGalleryView';
import { EventGalleryView } from './components/EventGalleryView';
import { AntiTheftShield } from './components/AntiTheftShield';
import { AdminUser, ClientFolder, PortfolioShowcase } from './types/index';
import { studioStore, initializeStore } from './services/studioStore';
import { KeyRound, X, ArrowRight } from 'lucide-react';

export default function App() {
  const [storeReady, setStoreReady] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'gallery' | 'event'>('home');
  const [activeTab, setActiveTab] = useState<'showcase' | 'works' | 'pricing' | 'contact'>('showcase');
  const [activeFolder, setActiveFolder] = useState<ClientFolder | null>(null);
  const [activeEvent, setActiveEvent] = useState<PortfolioShowcase | null>(null);
  const [folderInitialUnlocked, setFolderInitialUnlocked] = useState(false);
  const [folderInitialRole, setFolderInitialRole] = useState<'client' | 'admin'>('client');
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isEditModeActive, setIsEditModeActive] = useState(false);

  // Quick Client Passcode Modal
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [modalPasscode, setModalPasscode] = useState('');
  const [modalPasscodeError, setModalPasscodeError] = useState<string | null>(null);

  // Initialize Firebase store, then restore session & handle URL params
  useEffect(() => {
    let resolved = false;

    const onReady = () => {
      if (resolved) return;
      resolved = true;
      setStoreReady(true);

      try {
        const savedAdmin = sessionStorage.getItem('lumiere_active_admin');
        if (savedAdmin) {
          setCurrentAdmin(JSON.parse(savedAdmin));
        }
      } catch {
        // ignore
      }

      const params = new URLSearchParams(window.location.search);
      const folderParam = params.get('folder');
      const eventParam = params.get('event');
      const viewParam = params.get('view');

      if (folderParam) {
        const found = studioStore.getFolderById(folderParam);
        if (found) {
          setActiveFolder(found);
          setCurrentView('gallery');
          return;
        }
      }

      if (eventParam) {
        const foundEvent = studioStore.getPortfolioEventById(eventParam);
        if (foundEvent) {
          setActiveEvent(foundEvent);
          setCurrentView('event');
          return;
        }
      }

      if (viewParam === 'admin') {
        setCurrentView('admin');
      }
    };

    // Safety fallback: Never keep the user waiting on the splash screen
    const safetyTimer = setTimeout(onReady, 1500);

    initializeStore()
      .then(onReady)
      .catch((err) => {
        console.warn('Store init error, proceeding with defaults:', err);
        onReady();
      });

    return () => clearTimeout(safetyTimer);
  }, []);

  const handleAdminLogin = (user: AdminUser) => {
    setCurrentAdmin(user);
    try {
      sessionStorage.setItem('lumiere_active_admin', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    setIsEditModeActive(false);
    try {
      sessionStorage.removeItem('lumiere_active_admin');
    } catch {
      // ignore
    }
    setCurrentView('home');
    setActiveTab('showcase');
  };

  const handleToggleEditMode = () => {
    setIsEditModeActive((prev) => {
      const next = !prev;
      if (next && currentView === 'admin') {
        setCurrentView('home');
      }
      return next;
    });
  };

  const handleOpenFolderFromMain = (folder: ClientFolder) => {
    setActiveFolder(folder);
    setFolderInitialUnlocked(false);
    setFolderInitialRole('client');
    setCurrentView('gallery');
    window.history.pushState({}, '', `?folder=${folder.id}`);
  };

  const handleOpenFolderFromPasscode = (folder: ClientFolder) => {
    setActiveFolder(folder);
    setFolderInitialUnlocked(true);
    setFolderInitialRole('client');
    setCurrentView('gallery');
    window.history.pushState({}, '', `?folder=${folder.id}`);
  };

  const handleOpenFolderFromAdmin = (folder: ClientFolder) => {
    setActiveFolder(folder);
    setFolderInitialUnlocked(true);
    setFolderInitialRole('admin');
    setCurrentView('gallery');
    window.history.pushState({}, '', `?folder=${folder.id}`);
  };

  const handleBackToMain = () => {
    setActiveFolder(null);
    setActiveEvent(null);
    setFolderInitialUnlocked(false);
    setFolderInitialRole('client');
    setCurrentView('home');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleSelectEvent = (event: PortfolioShowcase) => {
    setActiveEvent(event);
    setCurrentView('event');
    window.history.pushState({}, '', `?event=${event.id}`);
  };

  const handleBackFromEvent = () => {
    setActiveEvent(null);
    setCurrentView('home');
    setActiveTab('works');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleModalPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalPasscodeError(null);
    const code = modalPasscode.trim().toLowerCase();

    if (!code) {
      setModalPasscodeError('Please enter your client passcode.');
      return;
    }

    const folders = studioStore.getFolders();
    const matched = folders.find(
      (f) =>
        f.clientPassword.toLowerCase() === code ||
        f.slug.toLowerCase() === code ||
        f.id.toLowerCase() === code
    );

    if (matched) {
      setIsPasscodeModalOpen(false);
      setModalPasscode('');
      handleOpenFolderFromPasscode(matched);
    } else {
      setModalPasscodeError('No gallery found matching this passcode.');
    }
  };

  // Show a premium loading screen while Firebase initializes
  if (!storeReady) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs font-mono tracking-widest text-stone-500 uppercase">Connecting to Vault…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex justify-center font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* 100% Solid Black Screen Anti-Capture & DRM Shield */}
      <AntiTheftShield active={true} clientName={activeFolder?.clientName} folderName={activeFolder?.name} />

      {/* Dedicated Mobile Viewport Container */}
      <div className="w-full max-w-md min-h-screen bg-stone-950 flex flex-col relative shadow-2xl border-x border-stone-800/80">
        {/* Mobile App Header & Bottom Navigation */}
        <Navigation
          currentView={currentView}
          activeTab={activeTab}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setCurrentView('home');
          }}
          onNavigateView={(view) => {
            if (view === 'admin') {
              setCurrentView('admin');
              window.history.pushState({}, '', '?view=admin');
            } else {
              handleBackToMain();
            }
          }}
          currentAdmin={currentAdmin}
          onAdminLogout={handleAdminLogout}
          onOpenClientPortalModal={() => setIsPasscodeModalOpen(true)}
          isEditModeActive={isEditModeActive}
          onToggleEditMode={handleToggleEditMode}
        />

        {/* Mobile View Router */}
        <main className="flex-1">
          {currentView === 'home' && (
            <MainSite
              activeTab={activeTab}
              onNavigateTab={setActiveTab}
              onOpenFolder={handleOpenFolderFromMain}
              onNavigateToAdmin={() => {
                setCurrentView('admin');
                window.history.pushState({}, '', '?view=admin');
              }}
              onSelectEvent={handleSelectEvent}
              isAdmin={Boolean(currentAdmin) && isEditModeActive}
              onToggleEditMode={handleToggleEditMode}
            />
          )}

          {currentView === 'admin' && (
            <AdminPortal
              currentAdmin={currentAdmin}
              onAdminLogin={handleAdminLogin}
              onOpenFolderPreview={handleOpenFolderFromAdmin}
              onBackToMain={handleBackToMain}
              onOpenEventPage={handleSelectEvent}
            />
          )}

          {currentView === 'gallery' && activeFolder && (
            <ClientGalleryView
              folder={activeFolder}
              onBackToMain={handleBackToMain}
              initialUnlocked={folderInitialUnlocked}
              initialRole={folderInitialRole}
            />
          )}

          {currentView === 'event' && activeEvent && (
            <EventGalleryView
              event={activeEvent}
              onBack={handleBackFromEvent}
              isAdmin={Boolean(currentAdmin)}
              onNavigateContact={() => {
                setActiveEvent(null);
                setCurrentView('home');
                setActiveTab('contact');
              }}
            />
          )}
        </main>

        {/* Mobile Passcode Modal (Bottom Sheet) */}
        {isPasscodeModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/90 backdrop-blur-md p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setIsPasscodeModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <KeyRound className="w-5 h-5" />
              </div>

              <h3 className="text-base font-serif text-white font-medium mb-1">
                Private Client Vault
              </h3>
              <p className="text-xs text-stone-400 mb-4">
                Enter your private folder passcode to unlock and open your proofs directly.
              </p>

              <form onSubmit={handleModalPasscodeSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={modalPasscode}
                    onChange={(e) => setModalPasscode(e.target.value)}
                    placeholder="e.g. client-sophia26"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-400 font-mono"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono mt-1.5 px-0.5">
                    <span>Sample keys:</span>
                    <button
                      type="button"
                      onClick={() => setModalPasscode('client-sophia26')}
                      className="text-amber-400/90 hover:underline hover:text-amber-300"
                    >
                      client-sophia26
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setModalPasscode('client-elena14')}
                      className="text-amber-400/90 hover:underline hover:text-amber-300"
                    >
                      client-elena14
                    </button>
                  </div>
                </div>

                {modalPasscodeError && (
                  <p className="text-[11px] text-red-300">{modalPasscodeError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span>Open Gallery Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
