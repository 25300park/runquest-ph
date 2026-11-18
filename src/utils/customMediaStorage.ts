const DB_NAME = 'runquest_custom_media_db';
const STORE_NAME = 'character_media';
const VIDEO_KEY = 'custom_character_video';
const LANDING_VIDEO_KEY = 'custom_landing_video';
export const CUSTOM_VIDEO_FLAG_KEY = 'runquest-has-custom-video';
export const CUSTOM_LANDING_VIDEO_FLAG_KEY = 'runquest-has-custom-landing-video';
export const CUSTOM_VIDEO_MODE_KEY = 'runquest-display-mode'; // 'video' | 'image'

let cachedVideoObjectUrl: string | null = null;
let cachedLandingVideoObjectUrl: string | null = null;

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function getBlobFromStore(key: string): Promise<Blob | null> {
  const db = await openMediaDb();
  try {
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => reject(req.error);
    });
    return blob;
  } finally {
    db.close();
  }
}

export async function saveCustomCharacterVideo(file: File | Blob): Promise<string> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file, VIDEO_KEY);
    store.put(file, LANDING_VIDEO_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save custom video'));
  });
  db.close();

  if (cachedVideoObjectUrl) {
    try {
      URL.revokeObjectURL(cachedVideoObjectUrl);
    } catch {
      // ignore
    }
  }
  cachedVideoObjectUrl = URL.createObjectURL(file);
  cachedLandingVideoObjectUrl = cachedVideoObjectUrl;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CUSTOM_VIDEO_FLAG_KEY, 'true');
    window.localStorage.setItem(CUSTOM_LANDING_VIDEO_FLAG_KEY, 'true');
    window.localStorage.setItem(CUSTOM_VIDEO_MODE_KEY, 'video');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('runquest-avatar-updated'));
  }

  return cachedVideoObjectUrl;
}

export async function loadCustomCharacterVideoUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const hasCharFlag = window.localStorage.getItem(CUSTOM_VIDEO_FLAG_KEY) === 'true';
  const hasLandingFlag = window.localStorage.getItem(CUSTOM_LANDING_VIDEO_FLAG_KEY) === 'true';
  if (!hasCharFlag && !hasLandingFlag) return null;

  if (cachedVideoObjectUrl) {
    return cachedVideoObjectUrl;
  }

  try {
    let blob = await getBlobFromStore(VIDEO_KEY);
    if (!blob) {
      blob = await getBlobFromStore(LANDING_VIDEO_KEY);
    }

    if (!blob) {
      window.localStorage.removeItem(CUSTOM_VIDEO_FLAG_KEY);
      return null;
    }

    cachedVideoObjectUrl = URL.createObjectURL(blob);
    return cachedVideoObjectUrl;
  } catch {
    return null;
  }
}

export async function clearCustomCharacterVideo(): Promise<void> {
  if (cachedVideoObjectUrl) {
    try {
      URL.revokeObjectURL(cachedVideoObjectUrl);
    } catch {
      // ignore
    }
    cachedVideoObjectUrl = null;
  }

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CUSTOM_VIDEO_FLAG_KEY);
    window.localStorage.setItem(CUSTOM_VIDEO_MODE_KEY, 'image');
  }

  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(VIDEO_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('runquest-avatar-updated'));
  }
}

export function getPreferredCharacterDisplayMode(): 'video' | 'image' {
  if (typeof window === 'undefined') return 'image';
  const hasVideo =
    window.localStorage.getItem(CUSTOM_VIDEO_FLAG_KEY) === 'true' ||
    window.localStorage.getItem(CUSTOM_LANDING_VIDEO_FLAG_KEY) === 'true';
  if (!hasVideo) return 'image';
  const mode = window.localStorage.getItem(CUSTOM_VIDEO_MODE_KEY);
  return mode === 'image' ? 'image' : 'video';
}

export function setPreferredCharacterDisplayMode(mode: 'video' | 'image'): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOM_VIDEO_MODE_KEY, mode);
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('runquest-avatar-updated'));
}

export async function saveCustomLandingVideo(file: File | Blob): Promise<string> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file, LANDING_VIDEO_KEY);
    store.put(file, VIDEO_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save landing video'));
  });
  db.close();

  if (cachedLandingVideoObjectUrl) {
    try {
      URL.revokeObjectURL(cachedLandingVideoObjectUrl);
    } catch {
      // ignore
    }
  }
  cachedLandingVideoObjectUrl = URL.createObjectURL(file);
  cachedVideoObjectUrl = cachedLandingVideoObjectUrl;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CUSTOM_LANDING_VIDEO_FLAG_KEY, 'true');
    window.localStorage.setItem(CUSTOM_VIDEO_FLAG_KEY, 'true');
    window.localStorage.setItem(CUSTOM_VIDEO_MODE_KEY, 'video');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('runquest-avatar-updated'));
  }

  return cachedLandingVideoObjectUrl;
}

export async function loadCustomLandingVideoUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const hasLandingFlag = window.localStorage.getItem(CUSTOM_LANDING_VIDEO_FLAG_KEY) === 'true';
  const hasCharFlag = window.localStorage.getItem(CUSTOM_VIDEO_FLAG_KEY) === 'true';
  if (!hasLandingFlag && !hasCharFlag) return null;

  if (cachedLandingVideoObjectUrl) {
    return cachedLandingVideoObjectUrl;
  }

  try {
    let blob = await getBlobFromStore(LANDING_VIDEO_KEY);
    if (!blob) {
      blob = await getBlobFromStore(VIDEO_KEY);
    }

    if (!blob) {
      window.localStorage.removeItem(CUSTOM_LANDING_VIDEO_FLAG_KEY);
      return null;
    }

    cachedLandingVideoObjectUrl = URL.createObjectURL(blob);
    return cachedLandingVideoObjectUrl;
  } catch {
    return null;
  }
}

export async function clearCustomLandingVideo(): Promise<void> {
  if (cachedLandingVideoObjectUrl) {
    try {
      URL.revokeObjectURL(cachedLandingVideoObjectUrl);
    } catch {
      // ignore
    }
    cachedLandingVideoObjectUrl = null;
  }

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CUSTOM_LANDING_VIDEO_FLAG_KEY);
  }

  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(LANDING_VIDEO_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}
