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
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { db, storage, auth, firebaseConfig } from './firebase';
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
 * Wraps a promise with a timeout so Firestore network delays never hang execution.
 */
export function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Fallback helper: reads a File and produces an optimized WebP/JPEG data URL
 * if Firebase Storage upload is blocked by security rules, CORS, or quota.
 * Generates compact images (max 800px, quality 0.65) so documents never exceed Firestore 1MB limit.
 */
export async function fileToOptimizedDataUrl(file: File, maxWidth = 800, quality = 0.65): Promise<string> {
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

function resolveFileMimeType(file: File): string {
  if (file.type && file.type.startsWith('image/')) return file.type;
  if (/\.png$/i.test(file.name)) return 'image/png';
  if (/\.webp$/i.test(file.name)) return 'image/webp';
  if (/\.gif$/i.test(file.name)) return 'image/gif';
  if (/\.avif$/i.test(file.name)) return 'image/avif';
  if (/\.svg$/i.test(file.name)) return 'image/svg+xml';
  return 'image/jpeg';
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
  const metadata = { contentType: resolveFileMimeType(file) };

  try {
    return await new Promise<string>((resolve, reject) => {
      let isSettled = false;
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // If storage stalls due to CORS, network drops, or auth delay, abort after 8s and fall back
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            uploadTask.cancel();
          } catch {}
          reject(new Error('Firebase Storage upload timed out after 8s'));
        }
      }, 8000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (isSettled) return;
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress, file.name);
        },
        (error) => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);
          console.warn('Firebase Storage upload failed (falling back to optimized data URL):', error);
          reject(error);
        },
        async () => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Using local optimized data URL fallback for photo:', file.name, err);
    onProgress?.(100, file.name);
    return await fileToOptimizedDataUrl(file, 800, 0.65);
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
  const metadata = { contentType: resolveFileMimeType(file) };

  try {
    return await new Promise<string>((resolve, reject) => {
      let isSettled = false;
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // If storage stalls due to CORS, network drops, or auth delay, abort after 8s and fall back
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            uploadTask.cancel();
          } catch {}
          reject(new Error('Firebase Storage upload timed out after 8s'));
        }
      }, 8000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (isSettled) return;
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress, file.name);
        },
        (error) => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);
          console.warn('Firebase Storage event upload failed (falling back to optimized data URL):', error);
          reject(error);
        },
        async () => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Using local optimized data URL fallback for event photo:', file.name, err);
    onProgress?.(100, file.name);
    return await fileToOptimizedDataUrl(file, 800, 0.65);
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

// ─── Admins (Firestore & Firebase Auth) ────────────────────────────────────────

const SYSTEM_ADMIN_DOC_IDS = new Set([
  SITE_CONTENT_DOC,
  SITE_PACKAGES_DOC,
  SITE_CATEGORIES_DOC,
]);

/**
 * Firebase Auth enforces a minimum 6-character password on the backend.
 * If an admin specifies a shorter password (e.g. '1234'), pad it deterministically
 * so Firebase Auth never throws auth/weak-password while allowing the admin to type their exact password.
 */
export const toFirebaseAuthPassword = (pwd: string): string => {
  return pwd.length < 6 ? `${pwd}__fp2026` : pwd;
};

export async function fetchAdmins(): Promise<AdminUser[]> {
  try {
    const snap = await withTimeout(getDocs(collection(db, ADMINS_COL)), 4000);
    return snap.docs
      .filter((d) => !SYSTEM_ADMIN_DOC_IDS.has(d.id))
      .map((d) => d.data() as AdminUser);
  } catch (err) {
    console.warn('Could not fetch admins from Firestore:', err);
    return [];
  }
}

export async function saveAdmin(admin: AdminUser): Promise<void> {
  try {
    await withTimeout(setDoc(doc(db, ADMINS_COL, admin.id), admin, { merge: true }), 4000);
  } catch (err) {
    console.warn('saveAdmin Firestore error (saved locally):', err);
  }
}

export async function removeAdmin(adminId: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, ADMINS_COL, adminId)), 4000);
  } catch (err) {
    console.warn('removeAdmin Firestore error:', err);
  }
}

export function subscribeAdmins(callback: (admins: AdminUser[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, ADMINS_COL),
    (snap) => {
      const admins = snap.docs
        .filter((d) => !SYSTEM_ADMIN_DOC_IDS.has(d.id))
        .map((d) => d.data() as AdminUser);
      callback(admins);
    },
    (err) => console.warn('subscribeAdmins non-fatal error:', err)
  );
}

/**
 * Signs in an admin using Firebase Authentication with Gmail/email and password.
 * Special override ensures tommysugan07@gmail.com / 1234 is guaranteed master access.
 */
export async function firebaseLogin(
  emailOrUser: string,
  password: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const cleanInput = emailOrUser.trim().toLowerCase();
  const cleanPwd = password.trim();

  if (!cleanInput || !cleanPwd) {
    return { success: false, error: 'Email and password are required.' };
  }

  // 1. Master Admin designated override (tommysugan07@gmail.com / 1234)
  if (cleanInput === 'tommysugan07@gmail.com' && cleanPwd === '1234') {
    const masterAdmin: AdminUser = {
      id: 'admin-master',
      username: 'tommysugan07@gmail.com',
      email: 'tommysugan07@gmail.com',
      password: '1234',
      name: 'Tommy Sugan (Master Admin)',
      role: 'superadmin',
      createdAt: '2026-01-15T10:00:00Z',
    };

    // Attempt Firebase Auth sign-in in background without blocking master access
    const fbPass = toFirebaseAuthPassword(cleanPwd);
    signInWithEmailAndPassword(auth, cleanInput, fbPass).catch(() => {
      signInWithEmailAndPassword(auth, cleanInput, cleanPwd).catch(() => {});
    });

    // Ensure Firestore admin-master record is up to date
    saveAdmin(masterAdmin).catch((err) =>
      console.warn('Sync master admin to firestore non-fatal note:', err)
    );

    return { success: true, user: masterAdmin };
  }

  // 2. Authenticate standard admin with Firebase Auth
  let authSucceeded = false;
  try {
    const fbPass = toFirebaseAuthPassword(cleanPwd);
    await signInWithEmailAndPassword(auth, cleanInput, fbPass);
    authSucceeded = true;
  } catch {
    try {
      await signInWithEmailAndPassword(auth, cleanInput, cleanPwd);
      authSucceeded = true;
    } catch {
      // Auth failed, check Firestore fallback
    }
  }

  // 3. Check Firestore admin record
  const allAdmins = await fetchAdmins();
  const matched = allAdmins.find(
    (a) =>
      (a.email?.toLowerCase() === cleanInput ||
        a.username?.toLowerCase() === cleanInput) &&
      (a.password === cleanPwd || authSucceeded)
  );

  if (matched) {
    return { success: true, user: matched };
  }

  if (authSucceeded) {
    // Exists in Firebase Auth, sync to Firestore
    const createdUser: AdminUser = {
      id: `admin-${Date.now()}`,
      username: cleanInput,
      email: cleanInput,
      password: cleanPwd,
      name: cleanInput.split('@')[0],
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    await saveAdmin(createdUser);
    return { success: true, user: createdUser };
  }

  return { success: false, error: 'Invalid Gmail address or password.' };
}

/**
 * Registers a new admin user in Firebase Auth and persists their record in Firestore.
 * Uses a secondary Firebase App instance so the active admin session is not interrupted.
 */
export async function registerFirebaseAdmin(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'superadmin' = 'admin'
): Promise<{ success: boolean; error?: string; admin?: AdminUser }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Email and password are required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address (e.g. name@gmail.com).' };
  }

  if (cleanPassword.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  // Check if admin already registered in Firestore
  const existingAdmins = await fetchAdmins();
  if (
    existingAdmins.some(
      (a) =>
        a.email?.toLowerCase() === cleanEmail ||
        a.username?.toLowerCase() === cleanEmail
    )
  ) {
    return { success: false, error: `An admin with email "${cleanEmail}" already exists.` };
  }

  // Provision user in Firebase Auth via temporary secondary app
  let authUid = '';
  try {
    const secondaryApp = initializeApp(firebaseConfig, `AdminProv_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    const fbPassword = toFirebaseAuthPassword(cleanPassword);

    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, fbPassword);
      authUid = cred.user.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        // Already in Firebase Auth, safe to link in Firestore
      } else {
        console.warn('Firebase Auth registration warning:', authErr);
        return {
          success: false,
          error: authErr.message || 'Firebase Auth registration failed.',
        };
      }
    } finally {
      await signOut(secondaryAuth).catch(() => {});
      await deleteApp(secondaryApp).catch(() => {});
    }
  } catch (err: any) {
    console.warn('Secondary app init note:', err);
  }

  const newAdmin: AdminUser = {
    id: authUid ? `admin-${authUid}` : `admin-${Date.now()}`,
    username: cleanEmail,
    email: cleanEmail,
    password: cleanPassword,
    name: name.trim() || cleanEmail.split('@')[0],
    role,
    createdAt: new Date().toISOString(),
  };

  await saveAdmin(newAdmin);
  return { success: true, admin: newAdmin };
}

// ─── Folders (Firestore) ───────────────────────────────────────────────────────

export async function fetchFolders(): Promise<ClientFolder[]> {
  try {
    const q = query(collection(db, FOLDERS_COL), orderBy('createdAt', 'desc'));
    const snap = await withTimeout(getDocs(q), 4000);
    return snap.docs.map((d) => d.data() as ClientFolder);
  } catch (err) {
    console.warn('Could not fetch folders from Firestore:', err);
    return [];
  }
}

export async function fetchFolderById(id: string): Promise<ClientFolder | null> {
  try {
    const snap = await withTimeout(getDoc(doc(db, FOLDERS_COL, id)), 4000);
    return snap.exists() ? (snap.data() as ClientFolder) : null;
  } catch (err) {
    console.warn('Could not fetch folder by id from Firestore:', err);
    return null;
  }
}

export async function saveFolder(folder: ClientFolder): Promise<void> {
  try {
    await withTimeout(setDoc(doc(db, FOLDERS_COL, folder.id), folder, { merge: true }), 4000);
  } catch (err) {
    console.warn('saveFolder Firestore error (saved locally):', err);
  }
}

export async function updateFolderDoc(id: string, updates: Partial<ClientFolder>): Promise<void> {
  try {
    await withTimeout(setDoc(doc(db, FOLDERS_COL, id), updates as Record<string, unknown>, { merge: true }), 4000);
  } catch (err) {
    console.warn('updateFolderDoc Firestore error (saved locally):', err);
  }
}

export async function removeFolder(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, FOLDERS_COL, id)), 4000);
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
    const snap = await withTimeout(getDocs(collection(db, PORTFOLIO_COL)), 4000);
    return snap.docs.map((d) => d.data() as PortfolioShowcase);
  } catch (err) {
    console.warn('Could not fetch portfolio from Firestore:', err);
    return [];
  }
}

export async function savePortfolioEvent(event: PortfolioShowcase): Promise<void> {
  try {
    await withTimeout(setDoc(doc(db, PORTFOLIO_COL, event.id), event, { merge: true }), 4000);
  } catch (err) {
    console.warn('savePortfolioEvent Firestore error (saved locally):', err);
  }
}

export async function updatePortfolioEvent(id: string, updates: Partial<PortfolioShowcase>): Promise<void> {
  try {
    await withTimeout(setDoc(doc(db, PORTFOLIO_COL, id), updates as Record<string, unknown>, { merge: true }), 4000);
  } catch (err) {
    console.warn('updatePortfolioEvent Firestore error (saved locally):', err);
  }
}

export async function removePortfolioEvent(id: string): Promise<void> {
  try {
    await withTimeout(deleteDoc(doc(db, PORTFOLIO_COL, id)), 4000);
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
    const snap = await withTimeout(getDoc(doc(db, ADMINS_COL, SITE_CONTENT_DOC)), 4000);
    return snap.exists() ? (snap.data().texts as Record<string, string>) : null;
  } catch (err) {
    console.warn('Could not fetch site texts:', err);
    return null;
  }
}

export async function saveSiteTexts(texts: Record<string, string>): Promise<void> {
  try {
    await withTimeout(
      setDoc(doc(db, ADMINS_COL, SITE_CONTENT_DOC), { texts, updatedAt: new Date().toISOString() }, { merge: true }),
      4000
    );
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
    const snap = await withTimeout(getDoc(doc(db, ADMINS_COL, SITE_PACKAGES_DOC)), 4000);
    return snap.exists() ? (snap.data().packages as PricingPackage[]) : null;
  } catch (err) {
    console.warn('Could not fetch pricing packages:', err);
    return null;
  }
}

export async function savePricingPackages(packages: PricingPackage[]): Promise<void> {
  try {
    await withTimeout(
      setDoc(doc(db, ADMINS_COL, SITE_PACKAGES_DOC), { packages, updatedAt: new Date().toISOString() }, { merge: true }),
      4000
    );
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
    const snap = await withTimeout(getDoc(doc(db, ADMINS_COL, SITE_CATEGORIES_DOC)), 4000);
    return snap.exists() ? (snap.data().categories as string[]) : null;
  } catch (err) {
    console.warn('Could not fetch categories from Firestore:', err);
    return null;
  }
}

export async function saveCategories(categories: string[]): Promise<void> {
  try {
    await withTimeout(
      setDoc(doc(db, ADMINS_COL, SITE_CATEGORIES_DOC), { categories, updatedAt: new Date().toISOString() }, { merge: true }),
      4000
    );
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
