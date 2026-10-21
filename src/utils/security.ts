/**
 * Security and authentication utility functions for Lumière Photo Atelier.
 * Provides password verification, anti-theft shortcut detection, and selection math.
 */

export interface FolderAccessResult {
  granted: boolean;
  role: 'client' | 'admin' | null;
  message?: string;
}

/**
 * Validates a folder passcode against both the folder-specific client password
 * and universal admin passwords.
 */
export function verifyFolderAccess(
  inputPassword: string,
  folderClientPassword: string,
  adminPasswords: string[] = ['1234']
): FolderAccessResult {
  const cleanInput = (inputPassword || '').trim();
  const cleanClient = (folderClientPassword || '').trim();

  if (!cleanInput) {
    return { granted: false, role: null, message: 'Please enter a password' };
  }

  // 1. Check if matches any admin password (universal folder access)
  const isAdminMatch = adminPasswords.some((pwd) => pwd.trim() === cleanInput);
  if (isAdminMatch) {
    return { granted: true, role: 'admin', message: 'Admin master access granted' };
  }

  // 2. Check if matches folder client password
  if (cleanInput === cleanClient) {
    return { granted: true, role: 'client', message: 'Client access granted' };
  }

  return { granted: false, role: null, message: 'Invalid password. Please check your passcode.' };
}

/**
 * Detects whether a keyboard event is an unauthorized shortcut:
 * - PrintScreen / Snapshot (Windows/Linux)
 * - Meta/Cmd + Shift + 3, 4, 5 (Mac Screenshot)
 * - Meta/Win + Shift + S (Windows Snipping Tool)
 * - Ctrl/Cmd + Shift + S (Browser screenshot / Save)
 * - Ctrl/Cmd + S (Save Page / Save Image)
 * - Ctrl/Cmd + P (Print / PDF save)
 * - Ctrl/Cmd + U (View Source)
 * - Ctrl/Cmd + Shift + I / C / J or F12 (DevTools / Asset extraction)
 */
export function isProtectedShortcut(event: {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  key?: string;
}): boolean {
  const key = (event.key || '').toLowerCase();
  const hasModifier = Boolean(event.ctrlKey || event.metaKey);

  // PrintScreen / Snapshot key (any combination)
  if (key === 'printscreen' || key === 'snapshot') {
    return true;
  }

  // F12 DevTools
  if (key === 'f12') {
    return true;
  }

  // Mac Screenshot combos: Cmd + Shift + 3 / 4 / 5
  if (event.metaKey && event.shiftKey && (key === '3' || key === '4' || key === '5')) {
    return true;
  }

  // Windows Snipping Tool / Browser Snip: Win/Ctrl/Cmd + Shift + S
  if (hasModifier && event.shiftKey && key === 's') {
    return true;
  }

  if (hasModifier) {
    // Save Page / Asset
    if (key === 's') return true;
    // Print / PDF Save
    if (key === 'p') return true;
    // View Source
    if (key === 'u') return true;
    // Devtools: Ctrl/Cmd + Shift + I, C, J
    if (event.shiftKey && (key === 'i' || key === 'c' || key === 'j')) return true;
  }

  return false;
}

/**
 * Specifically identifies screenshot capture hotkeys to trigger instant blackout
 */
export function isScreenshotAttempt(event: {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  key?: string;
}): boolean {
  const key = (event.key || '').toLowerCase();
  if (key === 'printscreen' || key === 'snapshot') return true;
  if (event.metaKey && event.shiftKey && (key === '3' || key === '4' || key === '5')) return true;
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 's') return true;
  return false;
}

/**
 * Calculates client photo selection statistics
 */
export function calculateSelectionStats(
  photosCount: number,
  selections: Record<string, { selected: boolean }> = {}
): { total: number; selected: number; percent: number } {
  const total = Math.max(0, photosCount);
  const selectedCount = Object.values(selections).filter((s) => s && s.selected).length;
  const percent = total > 0 ? Math.round((selectedCount / total) * 100) : 0;

  return {
    total,
    selected: selectedCount,
    percent,
  };
}

/**
 * Converts a string title into a safe URL slug
 */
export function generateFolderSlug(title: string): string {
  const base = (title || 'gallery')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const rand = Math.random().toString(36).substring(2, 6);
  return `${base || 'album'}-${rand}`;
}

/**
 * Generates an easy-to-type client access code
 */
export function generateSafeClientPasscode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  code += '-';
  for (let i = 0; i < 3; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

/**
 * Safely copies text to the user's clipboard with fallback to textarea execCommand.
 * Avoids unhandled promise rejections if write permission is denied or document is unfocused.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Try modern navigator.clipboard if available
  if (navigator?.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or unfocused; fallback below
    }
  }

  // 2. Safe DOM execCommand fallback
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
