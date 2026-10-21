/**
 * firebaseService.ts
 * -------------------
 * All Firebase Storage upload helpers and Firestore CRUD functions.
 * This is the single source of truth for every Firebase interaction.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { AdminUser, ClientFolder, PortfolioShowcase, StudioPhoto, PricingPackage } from '../types/index';

// ─── Firestore Collection Paths ───────────────────────────────────────────────
const ADMINS_COL = 'admins';
const FOLDERS_COL = 'folders';
const PORTFOLIO_COL = 'portfolio';
const SITE_CONTENT_DOC = 'site_content';
const SITE_PACKAGES_DOC = 'pricing_packages';
const SITE_CATEGORIES_DOC = 'site_categories';

// ─── Storage Upload ────────────────────────────────────────────────────────────

export type UploadProgressCallback = (progress: number, fileName: string) => void;

/**
 * Fallback helper: reads a File and produces an optimized WebP/JPEG data URL
 * if Firebase Storage upload is blocked by security rules, CORS, or quota.
 */
export async function fileToOptimizedDataUrl(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return resolve('');
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', quality));
            return;
          }
        } catch {
          // fallback to raw data url
        }
        resolve(src);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a single File to Firebase Storage and returns the public download URL.
 * Path: studio-photos/{folderId}/{timestamp}_{filename}
 * If Firebase Storage blocks (permissions/CORS), gracefully falls back to optimized inline data URL.
 */
export async function uploadPhotoToStorage(
  file: File,
  folderId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const storageRef = ref(storage, `studio-photos/${folderId}/${Date.now()}_${safeFileName}`);

  try {
    return await new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress, file.name);
        },
        (error) => {
          console.warn('Firebase Storage upload failed (falling back to optimized data URL):', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (err) {
    console.warn('Using local optimized data URL fallback for photo:', file.name, err);
    onProgress?.(100, file.name);
    return await fileToOptimizedDataUrl(file);
  }
}

/**
 * Uploads a single File to Firebase Storage for portfolio/event images.
 * Path: portfolio-photos/{eventId}/{timestamp}_{filename}
 * If Firebase Storage blocks (permissions/CORS), gracefully falls back to optimized inline data URL.
 */
export async function uploadEventPhotoToStorage(
  file: File,
  eventId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const storageRef = ref(storage, `portfolio-photos/${eventId}/${Date.now()}_${safeFileName}`);

  try {
    return await new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress, file.name);
        },
        (error) => {
          console.warn('Firebase Storage event upload failed (falling back to optimized data URL):', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (err) {
    console.warn('Using local optimized data URL fallback for event photo:', file.name, err);
    onProgress?.(100, file.name);
    return await fileToOptimizedDataUrl(file);
  }
}

/**
 * Deletes a file from Firebase Storage by its full download URL.
 * Silently ignores errors (e.g. file already deleted or data URL).
 */
export async function deletePhotoFromStorage(url: string): Promise<void> {
  try {
    // Only delete URLs that belong to Firebase Storage
    if (!url.includes('firebasestorage.googleapis.com') && !url.includes('firebasestorage.app')) return;
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // ignore – file may not exist
  }
}

// ─── Admins (Firestore) ────────────────────────────────────────────────────────

export async function fetchAdmins(): Promise<AdminUser[]> {
  try {
    const snap = await getDocs(collection(db, ADMINS_COL));
    return snap.docs.map((d) => d.data() as AdminUser);
  } catch (err) {
    console.warn('Could not fetch admins from Firestore:', err);
    return [];
  }
}

export async function saveAdmin(admin: AdminUser): Promise<void> {
  try {
    await setDoc(doc(db, ADMINS_COL, admin.id), admin);
  } catch (err) {
    console.warn('saveAdmin Firestore error (saved locally):', err);
  }
}

export async function removeAdmin(adminId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ADMINS_COL, adminId));
  } catch (err) {
    console.warn('removeAdmin Firestore error:', err);
  }
}

export function subscribeAdmins(callback: (admins: AdminUser[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, ADMINS_COL),
    (snap) => {
      callback(snap.docs.map((d) => d.data() as AdminUser));
    },
    (err) => console.warn('subscribeAdmins non-fatal error:', err)
  );
}

// ─── Folders (Firestore) ───────────────────────────────────────────────────────

export async function fetchFolders(): Promise<ClientFolder[]> {
  try {
    const q = query(collection(db, FOLDERS_COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ClientFolder);
  } catch (err) {
    console.warn('Could not fetch folders from Firestore:', err);
    return [];
  }
}

export async function fetchFolderById(id: string): Promise<ClientFolder | null> {
  try {
    const snap = await getDoc(doc(db, FOLDERS_COL, id));
    return snap.exists() ? (snap.data() as ClientFolder) : null;
  } catch (err) {
    console.warn('Could not fetch folder by id from Firestore:', err);
    return null;
  }
}

export async function saveFolder(folder: ClientFolder): Promise<void> {
  try {
    await setDoc(doc(db, FOLDERS_COL, folder.id), folder);
  } catch (err) {
    console.warn('saveFolder Firestore error (saved locally):', err);
  }
}

export async function updateFolderDoc(id: string, updates: Partial<ClientFolder>): Promise<void> {
  try {
    await updateDoc(doc(db, FOLDERS_COL, id), updates as Record<string, unknown>);
  } catch (err) {
    console.warn('updateFolderDoc Firestore error (saved locally):', err);
  }
}

export async function removeFolder(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FOLDERS_COL, id));
  } catch (err) {
    console.warn('removeFolder Firestore error:', err);
  }
}

export function subscribeFolders(callback: (folders: ClientFolder[]) => void): Unsubscribe {
  const q = query(collection(db, FOLDERS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as ClientFolder));
    },
    (err) => console.warn('subscribeFolders non-fatal error:', err)
  );
}

// ─── Portfolio (Firestore) ─────────────────────────────────────────────────────

export async function fetchPortfolio(): Promise<PortfolioShowcase[]> {
  try {
    const snap = await getDocs(collection(db, PORTFOLIO_COL));
    return snap.docs.map((d) => d.data() as PortfolioShowcase);
  } catch (err) {
    console.warn('Could not fetch portfolio from Firestore:', err);
    return [];
  }
}

export async function savePortfolioEvent(event: PortfolioShowcase): Promise<void> {
  try {
    await setDoc(doc(db, PORTFOLIO_COL, event.id), event);
  } catch (err) {
    console.warn('savePortfolioEvent Firestore error (saved locally):', err);
  }
}

export async function updatePortfolioEvent(id: string, updates: Partial<PortfolioShowcase>): Promise<void> {
  try {
    await updateDoc(doc(db, PORTFOLIO_COL, id), updates as Record<string, unknown>);
  } catch (err) {
    console.warn('updatePortfolioEvent Firestore error (saved locally):', err);
  }
}

export async function removePortfolioEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PORTFOLIO_COL, id));
  } catch (err) {
    console.warn('removePortfolioEvent Firestore error:', err);
  }
}

export function subscribePortfolio(callback: (portfolio: PortfolioShowcase[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, PORTFOLIO_COL),
    (snap) => {
      callback(snap.docs.map((d) => d.data() as PortfolioShowcase));
    },
    (err) => console.warn('subscribePortfolio non-fatal error:', err)
  );
}

// ─── Site Content Texts (Firestore) ──────────────────────────────────────────

export async function fetchSiteTexts(): Promise<Record<string, string> | null> {
  try {
    const snap = await getDoc(doc(db, ADMINS_COL, SITE_CONTENT_DOC));
    return snap.exists() ? (snap.data().texts as Record<string, string>) : null;
  } catch (err) {
    console.warn('Could not fetch site texts:', err);
    return null;
  }
}

export async function saveSiteTexts(texts: Record<string, string>): Promise<void> {
  try {
    await setDoc(doc(db, ADMINS_COL, SITE_CONTENT_DOC), { texts, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('saveSiteTexts Firestore error (saved locally):', err);
  }
}

export function subscribeSiteTexts(callback: (texts: Record<string, string>) => void): Unsubscribe {
  return onSnapshot(
    doc(db, ADMINS_COL, SITE_CONTENT_DOC),
    (snap) => {
      if (snap.exists() && snap.data().texts) {
        callback(snap.data().texts as Record<string, string>);
      }
    },
    (err) => console.warn('subscribeSiteTexts non-fatal error:', err)
  );
}

// ─── Pricing Packages (Firestore) ───────────────────────────────────────────

export async function fetchPricingPackages(): Promise<PricingPackage[] | null> {
  try {
    const snap = await getDoc(doc(db, ADMINS_COL, SITE_PACKAGES_DOC));
    return snap.exists() ? (snap.data().packages as PricingPackage[]) : null;
  } catch (err) {
    console.warn('Could not fetch pricing packages:', err);
    return null;
  }
}

export async function savePricingPackages(packages: PricingPackage[]): Promise<void> {
  try {
    await setDoc(doc(db, ADMINS_COL, SITE_PACKAGES_DOC), { packages, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('savePricingPackages Firestore error (saved locally):', err);
  }
}

export function subscribePricingPackages(callback: (packages: PricingPackage[]) => void): Unsubscribe {
  return onSnapshot(
    doc(db, ADMINS_COL, SITE_PACKAGES_DOC),
    (snap) => {
      if (snap.exists() && snap.data().packages) {
        callback(snap.data().packages as PricingPackage[]);
      }
    },
    (err) => console.warn('subscribePricingPackages non-fatal error:', err)
  );
}

// ─── Categories (Firestore) ─────────────────────────────────────────────────

export async function fetchCategories(): Promise<string[] | null> {
  try {
    const snap = await getDoc(doc(db, ADMINS_COL, SITE_CATEGORIES_DOC));
    return snap.exists() ? (snap.data().categories as string[]) : null;
  } catch (err) {
    console.warn('Could not fetch categories from Firestore:', err);
    return null;
  }
}

export async function saveCategories(categories: string[]): Promise<void> {
  try {
    await setDoc(doc(db, ADMINS_COL, SITE_CATEGORIES_DOC), { categories, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('saveCategories Firestore error (saved locally):', err);
  }
}

export function subscribeCategories(callback: (categories: string[]) => void): Unsubscribe {
  return onSnapshot(
    doc(db, ADMINS_COL, SITE_CATEGORIES_DOC),
    (snap) => {
      if (snap.exists() && snap.data().categories) {
        callback(snap.data().categories as string[]);
      }
    },
    (err) => console.warn('subscribeCategories non-fatal error:', err)
  );
}

// ─── Seed Helper ──────────────────────────────────────────────────────────────

/**
 * Seeds Firestore with default data only if the collection is empty.
 * Call once on app init.
 */
export async function seedIfEmpty<T extends { id: string }>(
  collectionName: string,
  defaultData: T[]
): Promise<void> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    if (snap.empty) {
      await Promise.all(
        defaultData.map((item) => setDoc(doc(db, collectionName, item.id), item))
      );
    }
  } catch (err) {
    console.warn(`Could not seed ${collectionName} in Firestore (non-fatal):`, err);
  }
}
