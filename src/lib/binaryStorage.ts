/**
 * Persistent binary storage for Android APK files using IndexedDB.
 * Preserves the exact binary content, size in bytes, and cryptographic hash across sessions.
 */

const DB_NAME = 'AppDropBinaryDB';
const DB_VERSION = 1;
const STORE_NAME = 'apk_binaries';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores the exact APK binary blob keyed by versionId.
 */
export async function saveApkBinary(versionId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, versionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to store APK binary in IndexedDB:', err);
  }
}

/**
 * Retrieves the exact stored APK binary blob for a version.
 */
export async function getApkBinary(versionId: string): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(versionId);

      request.onsuccess = () => {
        resolve(request.result ? (request.result as Blob) : null);
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to retrieve APK binary from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes the stored APK binary blob when a version or app is removed.
 */
export async function deleteApkBinary(versionId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(versionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to delete APK binary from IndexedDB:', err);
  }
}
