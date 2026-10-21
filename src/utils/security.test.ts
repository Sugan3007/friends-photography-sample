import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyFolderAccess,
  isProtectedShortcut,
  isScreenshotAttempt,
  calculateSelectionStats,
  generateFolderSlug,
} from './security.ts';

test('verifyFolderAccess grants access with matching client password', () => {
  const result = verifyFolderAccess('sophia2026', 'sophia2026', ['1234']);
  assert.equal(result.granted, true);
  assert.equal(result.role, 'client');
});

test('verifyFolderAccess grants master admin access with universal admin password', () => {
  const result = verifyFolderAccess('1234', 'sophia2026', ['1234']);
  assert.equal(result.granted, true);
  assert.equal(result.role, 'admin');
});

test('verifyFolderAccess supports secondary admin passwords', () => {
  const result = verifyFolderAccess('adminpass99', 'sophia2026', ['1234', 'adminpass99']);
  assert.equal(result.granted, true);
  assert.equal(result.role, 'admin');
});

test('verifyFolderAccess rejects incorrect password', () => {
  const result = verifyFolderAccess('wrongpwd', 'sophia2026', ['1234']);
  assert.equal(result.granted, false);
  assert.equal(result.role, null);
});

test('verifyFolderAccess handles whitespace and empty input', () => {
  const emptyRes = verifyFolderAccess('', 'sophia2026', ['1234']);
  assert.equal(emptyRes.granted, false);

  const trimmedRes = verifyFolderAccess('  sophia2026  ', 'sophia2026', ['1234']);
  assert.equal(trimmedRes.granted, true);
});

test('isProtectedShortcut detects unauthorized keyboard commands', () => {
  // Save page (Ctrl+S / Cmd+S)
  assert.equal(isProtectedShortcut({ ctrlKey: true, key: 's' }), true);
  assert.equal(isProtectedShortcut({ metaKey: true, key: 's' }), true);

  // Print (Ctrl+P / Cmd+P)
  assert.equal(isProtectedShortcut({ ctrlKey: true, key: 'p' }), true);

  // DevTools / Inspect (Ctrl+Shift+I / F12)
  assert.equal(isProtectedShortcut({ key: 'F12' }), true);
  assert.equal(isProtectedShortcut({ ctrlKey: true, shiftKey: true, key: 'i' }), true);

  // PrintScreen
  assert.equal(isProtectedShortcut({ key: 'PrintScreen' }), true);

  // Windows Snipping Tool (Win/Ctrl + Shift + S)
  assert.equal(isProtectedShortcut({ metaKey: true, shiftKey: true, key: 's' }), true);
  assert.equal(isProtectedShortcut({ ctrlKey: true, shiftKey: true, key: 's' }), true);

  // Mac Screenshot (Cmd + Shift + 4)
  assert.equal(isProtectedShortcut({ metaKey: true, shiftKey: true, key: '4' }), true);

  // Allowed ordinary typing
  assert.equal(isProtectedShortcut({ key: 'a' }), false);
  assert.equal(isProtectedShortcut({ key: 'Enter' }), false);
  assert.equal(isProtectedShortcut({ ctrlKey: true, key: 'f' }), false);
});

test('calculateSelectionStats calculates accurate percentages and counts', () => {
  const selections = {
    p1: { selected: true },
    p2: { selected: true },
    p3: { selected: false },
  };

  const stats = calculateSelectionStats(10, selections);
  assert.equal(stats.total, 10);
  assert.equal(stats.selected, 2);
  assert.equal(stats.percent, 20);

  const emptyStats = calculateSelectionStats(0, {});
  assert.equal(emptyStats.total, 0);
  assert.equal(emptyStats.selected, 0);
  assert.equal(emptyStats.percent, 0);
});

test('generateFolderSlug cleans titles safely', () => {
  const slug = generateFolderSlug('Sophia & Liam Wedding 2026');
  assert.match(slug, /^sophia-liam-wedding-2026-[a-z0-9]{4}$/);
});

test('isScreenshotAttempt detects OS and browser capture hotkeys', () => {
  assert.equal(isScreenshotAttempt({ key: 'PrintScreen' }), true);
  assert.equal(isScreenshotAttempt({ key: 'Snapshot' }), true);
  assert.equal(isScreenshotAttempt({ metaKey: true, shiftKey: true, key: 's' }), true);
  assert.equal(isScreenshotAttempt({ ctrlKey: true, shiftKey: true, key: 's' }), true);
  assert.equal(isScreenshotAttempt({ metaKey: true, shiftKey: true, key: '3' }), true);
  assert.equal(isScreenshotAttempt({ metaKey: true, shiftKey: true, key: '4' }), true);
  assert.equal(isScreenshotAttempt({ key: 'Enter' }), false);
});
