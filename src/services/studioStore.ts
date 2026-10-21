/**
 * studioStore.ts (Firebase Edition)
 * -----------------------------------
 * All data now persists in Firestore.
 * All image files upload to Firebase Storage.
 * The local-memory cache keeps the UI snappy between Firestore updates.
 */

import { AdminUser, ClientFolder, PricingPackage, PortfolioShowcase, StudioPhoto } from '../types/index';
import { generateFolderSlug } from '../utils/security';
import {
  fetchAdmins,
  fetchFolders,
  fetchPortfolio,
  saveAdmin,
  saveFolder,
  updateFolderDoc,
  removeFolder,
  savePortfolioEvent,
  updatePortfolioEvent,
  removePortfolioEvent,
  removeAdmin,
  subscribeAdmins,
  subscribeFolders,
  subscribePortfolio,
  seedIfEmpty,
  fetchSiteTexts,
  saveSiteTexts,
  subscribeSiteTexts,
  fetchPricingPackages,
  savePricingPackages,
  subscribePricingPackages,
  fetchCategories,
  saveCategories,
  subscribeCategories,
} from './firebaseService';

// ─── Default/Seed Data ────────────────────────────────────────────────────────

const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'admin-master',
    username: 'admin',
    password: '1234',
    name: 'Master Studio Director',
    role: 'superadmin',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'admin-lead',
    username: 'marcus_editor',
    password: 'studio2026password',
    name: 'Marcus Vance (Senior Retoucher)',
    role: 'admin',
    createdAt: '2026-02-01T14:30:00Z',
  },
];

// Sample photos now use Unsplash URLs (not base64) — will be replaced by Firebase Storage URLs when admin uploads
const INITIAL_SAMPLE_PHOTOS: Record<string, StudioPhoto[]> = {
  'folder-wedding-sophia': [
    {
      id: 'photo-w1',
      folderId: 'folder-wedding-sophia',
      title: 'The Golden Hour Vows',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      orientation: 'landscape',
      uploadDate: '2026-03-10',
    },
    {
      id: 'photo-w2',
      folderId: 'folder-wedding-sophia',
      title: 'Bridal Veil & Natural Light',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      orientation: 'portrait',
      uploadDate: '2026-03-10',
    },
    {
      id: 'photo-w3',
      folderId: 'folder-wedding-sophia',
      title: 'Architectural Terrace Stroll',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
      orientation: 'portrait',
      uploadDate: '2026-03-10',
    },
    {
      id: 'photo-w4',
      folderId: 'folder-wedding-sophia',
      title: 'Emerald Ring Details',
      url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
      orientation: 'square',
      uploadDate: '2026-03-10',
    },
    {
      id: 'photo-w5',
      folderId: 'folder-wedding-sophia',
      title: 'First Dance Evening Glow',
      url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1200&q=80',
      orientation: 'landscape',
      uploadDate: '2026-03-10',
    },
    {
      id: 'photo-w6',
      folderId: 'folder-wedding-sophia',
      title: 'Champagne Toast Intimate Moment',
      url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
      orientation: 'landscape',
      uploadDate: '2026-03-10',
    },
  ],
  'folder-editorial-vogue': [
    {
      id: 'photo-e1',
      folderId: 'folder-editorial-vogue',
      title: 'Monochrome High-Fashion Trench',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      orientation: 'portrait',
      uploadDate: '2026-03-14',
    },
    {
      id: 'photo-e2',
      folderId: 'folder-editorial-vogue',
      title: 'Shadow Geometry & Silk',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
      orientation: 'portrait',
      uploadDate: '2026-03-14',
    },
    {
      id: 'photo-e3',
      folderId: 'folder-editorial-vogue',
      title: 'Avant-Garde Architectural Silhouette',
      url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=80',
      orientation: 'landscape',
      uploadDate: '2026-03-14',
    },
    {
      id: 'photo-e4',
      folderId: 'folder-editorial-vogue',
      title: 'Cinematic Studio Light Close-up',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
      orientation: 'portrait',
      uploadDate: '2026-03-14',
    },
  ],
  'folder-portrait-marcus': [
    {
      id: 'photo-p1',
      folderId: 'folder-portrait-marcus',
      title: 'Executive Natural Light Portrait',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
      orientation: 'portrait',
      uploadDate: '2026-03-18',
    },
    {
      id: 'photo-p2',
      folderId: 'folder-portrait-marcus',
      title: 'Studio Grey Textured Backdrop',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80',
      orientation: 'portrait',
      uploadDate: '2026-03-18',
    },
    {
      id: 'photo-p3',
      folderId: 'folder-portrait-marcus',
      title: 'Candid Artisan Profile',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=80',
      orientation: 'portrait',
      uploadDate: '2026-03-18',
    },
  ],
};

const DEFAULT_FOLDERS: ClientFolder[] = [
  {
    id: 'folder-wedding-sophia',
    slug: 'sophia-liam-wedding',
    name: 'Sophia & Liam — Villa Cimbrone Wedding',
    clientName: 'Sophia Montgomery',
    clientEmail: 'sophia.m@example.com',
    clientPassword: 'client-sophia26',
    category: 'Weddings',
    eventDate: '2026-03-08',
    targetSelectionCount: 4,
    notes: 'Please review your proofing set and select your favorite 4 photographs.',
    watermarkText: 'PROOF ONLY — LUMIÈRE ATELIER — DO NOT COPY',
    photos: INITIAL_SAMPLE_PHOTOS['folder-wedding-sophia'],
    selections: {
      'photo-w1': { selected: true, note: 'Love the sunset warmth!', selectedAt: '2026-03-11T12:00:00Z' },
      'photo-w2': { selected: true, note: 'Please soften highlight on veil.', selectedAt: '2026-03-11T12:05:00Z' },
    },
    selectionSubmitted: false,
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'folder-editorial-vogue',
    slug: 'maison-valmont-lookbook',
    name: 'Maison Valmont — Autumn/Winter Editorial',
    clientName: 'Camille Laurent',
    clientEmail: 'camille@maisonvalmont.fr',
    clientPassword: 'valmont-client',
    category: 'Editorial',
    eventDate: '2026-03-12',
    targetSelectionCount: 3,
    notes: 'Select hero campaign visuals for print lookbook.',
    watermarkText: 'CONFIDENTIAL PROOF — VALMONT × LUMIÈRE',
    photos: INITIAL_SAMPLE_PHOTOS['folder-editorial-vogue'],
    selections: {
      'photo-e1': { selected: true, note: 'Selected for main cover.', selectedAt: '2026-03-15T16:20:00Z' },
    },
    selectionSubmitted: true,
    submittedAt: '2026-03-16T11:45:00Z',
    clientSubmissionNote: 'Please proceed with color grading.',
    createdAt: '2026-03-14T08:00:00Z',
  },
  {
    id: 'folder-portrait-marcus',
    slug: 'marcus-stone-portraits',
    name: 'Marcus Stone — Executive Heritage Portraits',
    clientName: 'Marcus Stone',
    clientEmail: 'm.stone@capitalventures.com',
    clientPassword: 'stone-pass',
    category: 'Portraits',
    eventDate: '2026-03-17',
    targetSelectionCount: 2,
    notes: 'Select 2 headshots for Forbes feature.',
    watermarkText: 'PROOF ONLY — LUMIÈRE STUDIO — DO NOT REPRODUCE',
    photos: INITIAL_SAMPLE_PHOTOS['folder-portrait-marcus'],
    selections: {},
    selectionSubmitted: false,
    createdAt: '2026-03-18T10:00:00Z',
  },
];

export const STUDIO_PACKAGES: PricingPackage[] = [
  {
    id: 'pkg-portrait',
    name: 'Editorial & Portrait Experience',
    price: '$750',
    tagline: 'Ideal for executives, artists, and personal branding seeking bespoke visual mastery.',
    duration: '2 Hours In-Studio & Location',
    deliverables: [
      'Private DRM-Protected Proofing Gallery',
      'Selection of 10 Master-Retouched High Res Deliverables',
      'Full Commercial & Personal Usage Licensing',
      '2 Wardrobe & Atmosphere Transformations',
    ],
    features: ['Pre-shoot creative direction consultation', 'Archival color-calibrated proofs', 'Expedited 5-day delivery'],
  },
  {
    id: 'pkg-wedding',
    name: 'The Grand Wedding Folio',
    price: '$3,800',
    popular: true,
    tagline: 'Comprehensive, cinematic documentation of your love story with timeless heirloom craft.',
    duration: 'Full Day (Up to 10 Hours)',
    deliverables: [
      'Two Principal Master Photographers',
      'Client Protected Selection & Proofing Vault',
      '60 Handcrafted Fine-Art Retouched Editions',
      'Handmade Italian Leather Archival Photo Book',
      'Private Password-Shielded Family Sharing Portal',
    ],
    features: ['Drone aerial perspective coverage', 'Complimentary engagement sunset session', 'Next-day highlight previews'],
  },
  {
    id: 'pkg-commercial',
    name: 'Commercial & Fashion Atelier',
    price: '$2,400',
    tagline: 'Lookbooks, designer campaigns, and culinary & luxury brand storytelling.',
    duration: 'Half-Day / Full-Day Production',
    deliverables: [
      'Studio Production & Lighting Crew',
      'Instant Tethered Proofing with DRM Guard',
      '25 Commercial Retouched Master Plates',
      'Full Global Digital & Print Advertising Rights',
    ],
    features: ['Digital Tech on-set review station', 'Prop styling and moodboarding', 'TIFF & WebP multi-format exports'],
  },
];

export const DEFAULT_SITE_TEXTS: Record<string, string> = {
  // Brand
  'brand.name': 'Lumière',
  'brand.subtitle': 'Photo Atelier',

  // Hero Section
  'hero.badge': 'Fine Art Atelier',
  'hero.title': 'Cinematic Art & Editorial Photography',
  'hero.subtitle': 'Capturing heirloom moments with painterly light and timeless composition.',
  'hero.btnWorks': 'Explore Works',
  'hero.btnContact': 'Inquire Dates',
  'hero.vaultHint': 'Client Vault? Tap the key icon at top right to unlock proofs.',
  'hero.card1Title': 'Portfolio',
  'hero.card1Subtitle': 'Explore weddings & portraits',
  'hero.card2Title': 'Contact Studio',
  'hero.card2Subtitle': 'Inquiries & bespoke bookings',

  // Works Section
  'works.badge': 'Works Showcase',
  'works.title': 'Selected Works',

  // Pricing Section
  'pricing.badge': 'Investment',
  'pricing.title': 'Studio Packages',

  // Contact Section
  'contact.badge': 'Get in Touch',
  'contact.title': 'Studio Concierge',
  'contact.subtitle': 'Contact us for wedding, portrait, and commercial dates.',
  'contact.phoneLabel': 'Call Studio',
  'contact.phone': '+1 555-839-2041',
  'contact.emailLabel': 'Email Us',
  'contact.email': 'concierge@lumierephotoatelier.com',
  'contact.formTitle': 'Send Booking Inquiry',
  'contact.formBtn': 'Submit Inquiry',
};

export const PORTFOLIO_SHOWCASE: PortfolioShowcase[] = [
  {
    id: 'show-wedding-ravello',
    title: 'The Ravello Villa Romance',
    category: 'Weddings',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    client: 'Elena & Lucas',
    year: '2026',
    location: 'Villa Cimbrone, Amalfi Coast',
    eventDate: 'May 18, 2026',
    description: 'A cinematic Mediterranean celebration captured on medium format film.',
    images: [
      { id: 'img-w-1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', caption: 'Golden hour vows on the cliff terrace', orientation: 'landscape' },
      { id: 'img-w-2', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80', caption: 'Heirloom lace veil catches morning breeze', orientation: 'portrait' },
      { id: 'img-w-3', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80', caption: 'The stone colonnade promenade at dusk', orientation: 'portrait' },
      { id: 'img-w-4', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80', caption: 'Bespoke emerald and platinum wedding bands', orientation: 'square' },
      { id: 'img-w-5', url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1200&q=80', caption: 'First dance illuminated by soft festoon lights', orientation: 'landscape' },
      { id: 'img-w-6', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80', caption: 'Intimate champagne toast', orientation: 'landscape' },
    ],
  },
  {
    id: 'show-editorial-valmont',
    title: 'Architectural Haute Couture',
    category: 'Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    client: 'Maison Valmont Paris',
    year: '2026',
    location: 'Studio Marais, Paris',
    eventDate: 'March 14, 2026',
    description: 'Sculptural lighting accentuating structured wool silhouettes for French Vogue Autumn edition.',
    images: [
      { id: 'img-e-1', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', caption: 'Structured wool trench and harsh chiaroscuro shadows', orientation: 'portrait' },
      { id: 'img-e-2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80', caption: 'Monochrome high-fashion gaze', orientation: 'portrait' },
      { id: 'img-e-3', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=80', caption: 'Brutalist concrete architecture backdrop', orientation: 'landscape' },
      { id: 'img-e-4', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80', caption: 'Fine cinematic key light close-up', orientation: 'portrait' },
      { id: 'img-e-5', url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80', caption: 'Dynamic draped organza in mid-motion', orientation: 'portrait' },
    ],
  },
  {
    id: 'show-wedding-sophia',
    title: 'Gilded Twilight Bridal',
    category: 'Weddings',
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    client: 'Sophia & Liam',
    year: '2026',
    location: 'Domaine de Canaille, Cassis',
    eventDate: 'April 22, 2026',
    description: 'Emotional, candid moments framing vows among ancient coastal olive groves.',
    images: [
      { id: 'img-g-1', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80', caption: 'Bridal gown amidst century-old olive groves', orientation: 'portrait' },
      { id: 'img-g-2', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', caption: 'Exchanging handwritten vows', orientation: 'landscape' },
      { id: 'img-g-3', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80', caption: 'Tender candid embrace', orientation: 'portrait' },
      { id: 'img-g-4', url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1200&q=80', caption: 'Sunset stroll beneath cypress trees', orientation: 'landscape' },
    ],
  },
  {
    id: 'show-portrait-seraphine',
    title: 'Minimalist Portraiture Study',
    category: 'Portraits',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    client: 'Seraphine Vance',
    year: '2026',
    location: 'Lumière Daylight Loft, Zurich',
    eventDate: 'February 10, 2026',
    description: 'Stripped back to single-source north-facing window light. Capturing raw emotional stillness.',
    images: [
      { id: 'img-p-1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80', caption: 'Pure northern window light study', orientation: 'portrait' },
      { id: 'img-p-2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80', caption: 'Natural expression on textured linen backdrop', orientation: 'portrait' },
      { id: 'img-p-3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80', caption: 'Classic charcoal tones', orientation: 'portrait' },
      { id: 'img-p-4', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=80', caption: 'Candid profile study', orientation: 'portrait' },
    ],
  },
  {
    id: 'show-commercial-aethel',
    title: 'Artisan Atelier & Craft',
    category: 'Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
    client: 'Aethel Leatherworks',
    year: '2026',
    location: 'Oltrarno Workshop, Florence',
    eventDate: 'January 28, 2026',
    description: 'Honoring four generations of Florentine artisanal leathercraft.',
    images: [
      { id: 'img-c-1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80', caption: 'The master craftsman at his oak workbench', orientation: 'portrait' },
      { id: 'img-c-2', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=80', caption: 'Vintage hand tools and vegetable-tanned hides', orientation: 'landscape' },
      { id: 'img-c-3', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', caption: 'Precision saddle stitch on bespoke briefcase', orientation: 'portrait' },
    ],
  },
  {
    id: 'show-wedding-chloe',
    title: 'Champagne & Starlight',
    category: 'Weddings',
    imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    client: 'Chloe & Julian',
    year: '2026',
    location: 'Castello di Vicarello, Tuscany',
    eventDate: 'June 04, 2026',
    description: 'An open-air evening celebration under hundreds of twinkling fairy lights.',
    images: [
      { id: 'img-s-1', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80', caption: 'The sparkling champagne coupe tower', orientation: 'landscape' },
      { id: 'img-s-2', url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1200&q=80', caption: 'Evening celebration under starry Tuscan canopy', orientation: 'landscape' },
      { id: 'img-s-3', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80', caption: 'Candlelight dinner tablescape', orientation: 'square' },
      { id: 'img-s-4', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', caption: 'Midnight sparkler farewell', orientation: 'landscape' },
    ],
  },
];

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

let _admins: AdminUser[] = [];
let _folders: ClientFolder[] = [];
let _portfolio: PortfolioShowcase[] = [];
let _packages: PricingPackage[] = STUDIO_PACKAGES;
let _siteTexts: Record<string, string> = { ...DEFAULT_SITE_TEXTS };
// ─── LocalStorage Persistence for Categories ──────────────────────────────────
const CATEGORIES_STORAGE_KEY = 'lumiere_categories';
const DELETED_CATEGORIES_STORAGE_KEY = 'lumiere_deleted_categories';

function getStoredDeletedCategories(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_CATEGORIES_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map((c: string) => String(c).toLowerCase().trim()));
      }
    }
  } catch {}
  return new Set<string>();
}

function saveStoredDeletedCategories(deleted: Set<string>): void {
  try {
    localStorage.setItem(DELETED_CATEGORIES_STORAGE_KEY, JSON.stringify(Array.from(deleted)));
  } catch {}
}

function getStoredCategories(): string[] | null {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  return null;
}

function saveStoredCategories(categories: string[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch {}
}

function deduplicatePortfolio(items: PortfolioShowcase[]): PortfolioShowcase[] {
  const seen = new Set<string>();
  const result: PortfolioShowcase[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

const DEFAULT_CATEGORIES: string[] = ['Weddings', 'Editorial', 'Portraits', 'Commercial'];

const _initialDeleted = getStoredDeletedCategories();
const _initialLocalCats = getStoredCategories();

let _categories: string[] =
  _initialLocalCats && _initialLocalCats.length > 0
    ? _initialLocalCats.filter((c) => !_initialDeleted.has(c.toLowerCase().trim()))
    : DEFAULT_CATEGORIES.filter((c) => !_initialDeleted.has(c.toLowerCase().trim()));

let _initialized = false;

// ─── Listeners ────────────────────────────────────────────────────────────────

type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

// ─── Initialization ───────────────────────────────────────────────────────────

let _initPromise: Promise<void> | null = null;

export async function initializeStore(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // 1. Preload local in-memory state with defaults immediately
    const deletedCats = getStoredDeletedCategories();
    const localCats = getStoredCategories();

    _admins = [...DEFAULT_ADMINS];
    _folders = [...DEFAULT_FOLDERS];
    _portfolio = deduplicatePortfolio(
      PORTFOLIO_SHOWCASE.filter((item) => !deletedCats.has(item.category.toLowerCase().trim()))
    );
    if (localCats && localCats.length > 0) {
      _categories = localCats.filter((c) => !deletedCats.has(c.toLowerCase().trim()));
    } else {
      _categories = DEFAULT_CATEGORIES.filter((c) => !deletedCats.has(c.toLowerCase().trim()));
    }

    // 2. Fetch remote Firestore data with timeout protection (max 2.5 seconds)
    try {
      const firestoreJob = (async () => {
        try {
          await Promise.all([
            seedIfEmpty('admins', DEFAULT_ADMINS),
            seedIfEmpty('folders', DEFAULT_FOLDERS),
            seedIfEmpty('portfolio', PORTFOLIO_SHOWCASE),
          ]);

          const [admins, folders, portfolio, remoteTexts, remotePackages, remoteCategories] = await Promise.all([
            fetchAdmins(),
            fetchFolders(),
            fetchPortfolio(),
            fetchSiteTexts(),
            fetchPricingPackages(),
            fetchCategories(),
          ]);

          if (admins && admins.length > 0) _admins = admins;
          if (folders && folders.length > 0) _folders = folders;
          if (portfolio && portfolio.length > 0) {
            _portfolio = deduplicatePortfolio(
              portfolio.filter((item) => !deletedCats.has(item.category.toLowerCase().trim()))
            );
          }

          if (remoteCategories && Array.isArray(remoteCategories) && remoteCategories.length > 0) {
            _categories = remoteCategories.filter((c) => !deletedCats.has(c.toLowerCase().trim()));
            saveStoredCategories(_categories);
          }

          if (remoteTexts && Object.keys(remoteTexts).length > 0) {
            _siteTexts = { ...DEFAULT_SITE_TEXTS, ...remoteTexts };
          }
          if (remotePackages && remotePackages.length > 0) {
            _packages = remotePackages;
          }
        } catch (innerErr) {
          console.warn('Firestore initial fetch non-fatal error:', innerErr);
        }
      })();

      const timeoutGuard = new Promise((resolve) => setTimeout(resolve, 1200));
      await Promise.race([firestoreJob, timeoutGuard]);
    } catch (err) {
      console.warn('initializeStore non-fatal error:', err);
    } finally {
      _initialized = true;
      notifyListeners();

      // Subscribe to real-time updates safely in the background
      try {
        subscribeAdmins((admins) => {
          if (admins && admins.length) {
            _admins = admins;
            notifyListeners();
          }
        });
        subscribeFolders((folders) => {
          if (folders && folders.length) {
            _folders = folders;
            notifyListeners();
          }
        });
        subscribePortfolio((portfolio) => {
          if (portfolio && portfolio.length) {
            const currentDeleted = getStoredDeletedCategories();
            const valid = portfolio.filter((item) => !currentDeleted.has(item.category.toLowerCase().trim()));
            _portfolio = deduplicatePortfolio(valid);
            notifyListeners();
          }
        });
        subscribeCategories((cats) => {
          if (Array.isArray(cats)) {
            const currentDeleted = getStoredDeletedCategories();
            _categories = cats.filter((c) => !currentDeleted.has(c.toLowerCase().trim()));
            saveStoredCategories(_categories);
            notifyListeners();
          }
        });
        subscribeSiteTexts((texts) => {
          if (texts) {
            _siteTexts = { ...DEFAULT_SITE_TEXTS, ...texts };
            notifyListeners();
          }
        });
        subscribePricingPackages((packages) => {
          if (packages && packages.length) {
            _packages = packages;
            notifyListeners();
          }
        });
      } catch (subErr) {
        console.warn('Background subscription non-fatal error:', subErr);
      }
    }
  })();

  return _initPromise;
}

// ─── Store API ────────────────────────────────────────────────────────────────

export const studioStore = {
  subscribe(listener: StoreListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  isInitialized(): boolean {
    return _initialized;
  },

  // ── ADMIN MANAGEMENT ──────────────────────────────────────────────────────

  getAdmins(): AdminUser[] {
    return _admins;
  },

  async saveAdmins(admins: AdminUser[]): Promise<void> {
    await Promise.all(admins.map((a) => saveAdmin(a)));
    _admins = admins;
    notifyListeners();
  },

  async createAdmin(newAdminData: Omit<AdminUser, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string; admin?: AdminUser }> {
    const username = newAdminData.username.trim().toLowerCase();
    const password = newAdminData.password.trim();

    if (!username || !password) {
      return { success: false, error: 'Username and password are required' };
    }

    if (_admins.some((a) => a.username.toLowerCase() === username)) {
      return { success: false, error: `Admin username "${username}" already exists` };
    }

    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      username,
      password,
      name: newAdminData.name.trim() || username,
      role: newAdminData.role || 'admin',
      createdAt: new Date().toISOString(),
    };

    await saveAdmin(newAdmin);
    _admins = [..._admins, newAdmin];
    notifyListeners();
    return { success: true, admin: newAdmin };
  },

  async deleteAdmin(adminId: string): Promise<boolean> {
    const target = _admins.find((a) => a.id === adminId);
    if (!target || target.username === 'admin') return false;

    await removeAdmin(adminId);
    _admins = _admins.filter((a) => a.id !== adminId);
    notifyListeners();
    return true;
  },

  authenticateAdmin(username: string, password: string): AdminUser | null {
    const cleanUser = username.trim().toLowerCase();
    const cleanPwd = password.trim();
    return _admins.find((a) => a.username.toLowerCase() === cleanUser && a.password === cleanPwd) || null;
  },

  getAdminPasswords(): string[] {
    return Array.from(new Set(_admins.map((a) => a.password)));
  },

  // ── FOLDERS & GALLERIES ───────────────────────────────────────────────────

  getFolders(): ClientFolder[] {
    return _folders;
  },

  async saveFolders(folders: ClientFolder[]): Promise<void> {
    await Promise.all(folders.map((f) => saveFolder(f)));
    _folders = folders;
    notifyListeners();
  },

  getFolderById(id: string): ClientFolder | undefined {
    return _folders.find((f) => f.id === id || f.slug === id);
  },

  async createFolder(folderData: {
    name: string;
    clientName: string;
    clientEmail?: string;
    clientPassword: string;
    category?: string;
    eventDate?: string;
    targetSelectionCount?: number;
    notes?: string;
    watermarkText?: string;
    initialPhotos?: StudioPhoto[];
  }): Promise<ClientFolder> {
    const id = `folder-${Date.now()}`;
    const slug = generateFolderSlug(folderData.name);

    const newFolder: ClientFolder = {
      id,
      slug,
      name: folderData.name.trim(),
      clientName: folderData.clientName.trim(),
      clientEmail: folderData.clientEmail?.trim(),
      clientPassword: folderData.clientPassword.trim() || 'proof2026',
      category: folderData.category || 'Portfolio',
      eventDate: folderData.eventDate || new Date().toISOString().split('T')[0],
      targetSelectionCount: folderData.targetSelectionCount || 10,
      notes: folderData.notes?.trim() || 'Select your favorite images.',
      watermarkText: folderData.watermarkText?.trim() || `PROOF ONLY — ${folderData.clientName.toUpperCase()} — DO NOT COPY`,
      photos: folderData.initialPhotos || [],
      selections: {},
      selectionSubmitted: false,
      createdAt: new Date().toISOString(),
    };

    await saveFolder(newFolder);
    _folders = [newFolder, ..._folders];
    notifyListeners();
    return newFolder;
  },

  async updateFolder(id: string, updates: Partial<ClientFolder>): Promise<ClientFolder | null> {
    const index = _folders.findIndex((f) => f.id === id);
    if (index === -1) return null;

    const updated = { ..._folders[index], ...updates };
    await updateFolderDoc(id, updates);
    _folders[index] = updated;
    notifyListeners();
    return updated;
  },

  async deleteFolder(id: string): Promise<boolean> {
    const exists = _folders.some((f) => f.id === id);
    if (!exists) return false;

    await removeFolder(id);
    _folders = _folders.filter((f) => f.id !== id);
    notifyListeners();
    return true;
  },

  async addPhotosToFolder(folderId: string, newPhotos: StudioPhoto[]): Promise<ClientFolder | null> {
    const folder = _folders.find((f) => f.id === folderId);
    if (!folder) return null;

    const updated: ClientFolder = { ...folder, photos: [...folder.photos, ...newPhotos] };
    await updateFolderDoc(folderId, { photos: updated.photos });
    const index = _folders.findIndex((f) => f.id === folderId);
    _folders[index] = updated;
    notifyListeners();
    return updated;
  },

  async removePhotoFromFolder(folderId: string, photoId: string): Promise<ClientFolder | null> {
    const folder = _folders.find((f) => f.id === folderId);
    if (!folder) return null;

    const updatedPhotos = folder.photos.filter((p) => p.id !== photoId);
    const updatedSelections = { ...folder.selections };
    if (updatedSelections[photoId]) delete updatedSelections[photoId];

    const updated: ClientFolder = { ...folder, photos: updatedPhotos, selections: updatedSelections };
    await updateFolderDoc(folderId, { photos: updatedPhotos, selections: updatedSelections });
    const index = _folders.findIndex((f) => f.id === folderId);
    _folders[index] = updated;
    notifyListeners();
    return updated;
  },

  async toggleClientSelection(folderId: string, photoId: string, note?: string): Promise<ClientFolder | null> {
    const folder = _folders.find((f) => f.id === folderId);
    if (!folder) return null;

    const existing = folder.selections[photoId];
    const newSelections = { ...folder.selections };

    if (existing && existing.selected) {
      newSelections[photoId] = { selected: false, note: existing.note, selectedAt: new Date().toISOString() };
    } else {
      newSelections[photoId] = { selected: true, note: note || existing?.note || '', selectedAt: new Date().toISOString() };
    }

    const updated: ClientFolder = { ...folder, selections: newSelections };
    await updateFolderDoc(folderId, { selections: newSelections });
    const index = _folders.findIndex((f) => f.id === folderId);
    _folders[index] = updated;
    notifyListeners();
    return updated;
  },

  async updatePhotoNote(folderId: string, photoId: string, note: string): Promise<ClientFolder | null> {
    const folder = _folders.find((f) => f.id === folderId);
    if (!folder) return null;

    const current = folder.selections[photoId] || { selected: false, selectedAt: new Date().toISOString() };
    const newSelections = { ...folder.selections, [photoId]: { ...current, note } };

    const updated: ClientFolder = { ...folder, selections: newSelections };
    await updateFolderDoc(folderId, { selections: newSelections });
    const index = _folders.findIndex((f) => f.id === folderId);
    _folders[index] = updated;
    notifyListeners();
    return updated;
  },

  async submitFolderSelection(folderId: string, clientSubmissionNote?: string): Promise<ClientFolder | null> {
    const folder = _folders.find((f) => f.id === folderId);
    if (!folder) return null;

    const updates: Partial<ClientFolder> = {
      selectionSubmitted: true,
      submittedAt: new Date().toISOString(),
      ...(clientSubmissionNote ? { clientSubmissionNote } : {}),
    };

    const updated: ClientFolder = { ...folder, ...updates };
    await updateFolderDoc(folderId, updates);
    const index = _folders.findIndex((f) => f.id === folderId);
    _folders[index] = updated;
    notifyListeners();
    return updated;
  },

  // ── SELECTED WORKS / EVENT PORTFOLIO ──────────────────────────────────────

  getPortfolio(): PortfolioShowcase[] {
    return deduplicatePortfolio(_portfolio);
  },

  async savePortfolio(portfolio: PortfolioShowcase[]): Promise<void> {
    await Promise.all(portfolio.map((e) => savePortfolioEvent(e)));
    _portfolio = portfolio;
    notifyListeners();
  },

  getPortfolioEventById(id: string): PortfolioShowcase | undefined {
    return _portfolio.find((item) => item.id === id);
  },

  async addImageToEvent(
    eventId: string,
    imageData: { url: string; caption?: string; orientation?: 'portrait' | 'landscape' | 'square' }
  ): Promise<PortfolioShowcase | null> {
    const event = _portfolio.find((item) => item.id === eventId);
    if (!event) return null;

    const newImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: imageData.url.trim(),
      caption: imageData.caption?.trim() || '',
      orientation: imageData.orientation || 'landscape',
    };

    const updatedImages = [...(event.images || []), newImage];
    const updatedEvent = { ...event, images: updatedImages, imageUrl: event.imageUrl || newImage.url };
    await updatePortfolioEvent(eventId, { images: updatedImages, imageUrl: updatedEvent.imageUrl });

    const index = _portfolio.findIndex((item) => item.id === eventId);
    _portfolio[index] = updatedEvent;
    notifyListeners();
    return updatedEvent;
  },

  async removeImageFromEvent(eventId: string, imageId: string): Promise<PortfolioShowcase | null> {
    const event = _portfolio.find((item) => item.id === eventId);
    if (!event) return null;

    const targetImage = event.images.find((img) => img.id === imageId);
    const updatedImages = event.images.filter((img) => img.id !== imageId);
    let updatedImageUrl = event.imageUrl;

    if (targetImage && targetImage.url === event.imageUrl && updatedImages.length > 0) {
      updatedImageUrl = updatedImages[0].url;
    }

    const updatedEvent = { ...event, images: updatedImages, imageUrl: updatedImageUrl };
    await updatePortfolioEvent(eventId, { images: updatedImages, imageUrl: updatedImageUrl });

    const index = _portfolio.findIndex((item) => item.id === eventId);
    _portfolio[index] = updatedEvent;
    notifyListeners();
    return updatedEvent;
  },

  async updateEventCover(eventId: string, imageUrl: string): Promise<PortfolioShowcase | null> {
    const event = _portfolio.find((item) => item.id === eventId);
    if (!event) return null;

    const updatedEvent = { ...event, imageUrl };
    await updatePortfolioEvent(eventId, { imageUrl });
    const index = _portfolio.findIndex((item) => item.id === eventId);
    _portfolio[index] = updatedEvent;
    notifyListeners();
    return updatedEvent;
  },

  async updateEventDetails(eventId: string, updates: Partial<PortfolioShowcase>): Promise<PortfolioShowcase | null> {
    const index = _portfolio.findIndex((item) => item.id === eventId);
    if (index === -1) return null;

    const updatedEvent = { ..._portfolio[index], ...updates };
    await updatePortfolioEvent(eventId, updates);
    _portfolio[index] = updatedEvent;
    notifyListeners();
    return updatedEvent;
  },

  async addEvent(eventData: Omit<PortfolioShowcase, 'id'>): Promise<PortfolioShowcase> {
    const newEvent: PortfolioShowcase = {
      ...eventData,
      id: `show-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      images: eventData.images || [],
    };

    // Deduplicate: avoid duplicate insertions
    if (!_portfolio.some((item) => item.id === newEvent.id)) {
      _portfolio = [newEvent, ..._portfolio];
    }
    _portfolio = deduplicatePortfolio(_portfolio);
    notifyListeners();

    try {
      await savePortfolioEvent(newEvent);
    } catch (err) {
      console.warn('Failed to save portfolio event to Firestore:', err);
    }

    return newEvent;
  },

  // ── CATEGORIES ────────────────────────────────────────────────────────────

  getCategories(): string[] {
    return [..._categories];
  },

  async addCategory(categoryName: string): Promise<void> {
    const clean = categoryName.trim();
    if (!clean) return;

    // Unmark from deleted categories if re-added
    const deletedCats = getStoredDeletedCategories();
    if (deletedCats.delete(clean.toLowerCase())) {
      saveStoredDeletedCategories(deletedCats);
    }

    if (!_categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      _categories = [..._categories, clean];
      saveStoredCategories(_categories);
      notifyListeners();
      await saveCategories(_categories).catch(console.warn);
    }
  },

  async deleteCategory(categoryName: string): Promise<void> {
    const clean = categoryName.trim().toLowerCase();
    if (!clean) return;

    // 1. Permanently record in deleted categories tracker so it NEVER resurrects
    const deletedCats = getStoredDeletedCategories();
    deletedCats.add(clean);
    saveStoredDeletedCategories(deletedCats);

    // 2. Remove category from in-memory and local storage immediately
    _categories = _categories.filter((c) => c.toLowerCase().trim() !== clean);
    saveStoredCategories(_categories);

    // 3. When user deletes category tag, delete ALL folders (and photos) under that category!
    const eventsToDelete = _portfolio.filter(
      (ev) => ev.category.toLowerCase().trim() === clean
    );
    _portfolio = _portfolio.filter(
      (ev) => ev.category.toLowerCase().trim() !== clean
    );

    for (const ev of eventsToDelete) {
      removePortfolioEvent(ev.id).catch((err) =>
        console.warn('Failed to remove portfolio event from Firestore:', err)
      );
    }

    // 4. Also delete any client folders under that category
    const clientFoldersToDelete = _folders.filter(
      (f) => f.category.toLowerCase().trim() === clean
    );
    _folders = _folders.filter(
      (f) => f.category.toLowerCase().trim() !== clean
    );

    for (const f of clientFoldersToDelete) {
      removeFolder(f.id).catch((err) =>
        console.warn('Failed to remove client folder from Firestore:', err)
      );
    }

    // 5. Notify listeners immediately so UI updates synchronously
    notifyListeners();

    // 6. Persist remaining categories to Firestore
    try {
      await saveCategories(_categories);
    } catch (err) {
      console.warn('Failed to save categories to Firestore:', err);
    }
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    const exists = _portfolio.some((item) => item.id === eventId);
    if (!exists) return false;

    await removePortfolioEvent(eventId);
    _portfolio = _portfolio.filter((item) => item.id !== eventId);
    // Note: Deleting a folder does NOT delete the category!
    notifyListeners();
    return true;
  },

  // ── SITE TEXTS (CONTENT CMS) ──────────────────────────────────────────────

  getSiteTexts(): Record<string, string> {
    return _siteTexts;
  },

  getSiteText(key: string, defaultValue?: string): string {
    return _siteTexts[key] ?? defaultValue ?? DEFAULT_SITE_TEXTS[key] ?? '';
  },

  async updateSiteText(key: string, value: string): Promise<void> {
    _siteTexts = { ..._siteTexts, [key]: value };
    notifyListeners();
    await saveSiteTexts(_siteTexts);
  },

  async updateSiteTexts(updates: Record<string, string>): Promise<void> {
    _siteTexts = { ..._siteTexts, ...updates };
    notifyListeners();
    await saveSiteTexts(_siteTexts);
  },

  // ── PRICING PACKAGES ──────────────────────────────────────────────────────

  getPackages(): PricingPackage[] {
    return _packages;
  },

  getPackageById(id: string): PricingPackage | undefined {
    return _packages.find((p) => p.id === id);
  },

  async updatePackage(id: string, updates: Partial<PricingPackage>): Promise<PricingPackage | null> {
    const idx = _packages.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated: PricingPackage = { ..._packages[idx], ...updates };
    const newPackages = [..._packages];
    newPackages[idx] = updated;
    _packages = newPackages;
    notifyListeners();
    await savePricingPackages(_packages);
    return updated;
  },

  async addPackage(pkgData: Omit<PricingPackage, 'id'>): Promise<PricingPackage> {
    const newPkg: PricingPackage = {
      ...pkgData,
      id: `pkg-${Date.now()}`,
    };
    _packages = [..._packages, newPkg];
    notifyListeners();
    await savePricingPackages(_packages);
    return newPkg;
  },

  async deletePackage(id: string): Promise<boolean> {
    const exists = _packages.some((p) => p.id === id);
    if (!exists) return false;
    _packages = _packages.filter((p) => p.id !== id);
    notifyListeners();
    await savePricingPackages(_packages);
    return true;
  },

  resetDefaults() {
    // No-op in Firebase mode — data lives in Firestore
    console.warn('resetDefaults() is disabled in Firebase mode.');
  },
};
