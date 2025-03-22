import { DB } from 'types';

const DB_NAME = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const STORE_NAME = 'dbState';
const DB_KEY = 'currentState';

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Save DB state to IndexedDB
export async function saveToIndexedDB(data: DB): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(data, DB_KEY);

      request.onsuccess = () => {
        resolve();
        db.close();
      };

      request.onerror = (event) => {
        console.error('Error saving to IndexedDB:', event);
        reject('Failed to save to IndexedDB');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to save data to IndexedDB:', error);
    throw error;
  }
}

// Get DB state from IndexedDB
export async function getFromIndexedDB(): Promise<DB | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(DB_KEY);

      request.onsuccess = () => {
        resolve(request.result || null);
        db.close();
      };

      request.onerror = (event) => {
        console.error('Error retrieving from IndexedDB:', event);
        reject('Failed to retrieve from IndexedDB');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get data from IndexedDB:', error);
    return null;
  }
}

// Clear IndexedDB cache
export async function clearIndexedDBCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
        db.close();
      };

      request.onerror = (event) => {
        console.error('Error clearing IndexedDB:', event);
        reject('Failed to clear IndexedDB');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to clear IndexedDB cache:', error);
    throw error;
  }
}
