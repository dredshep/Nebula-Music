
const DB_NAME = 'nebula_music_db';
const DB_VERSION = 1;
const STORE_SETTINGS = 'settings';
const STORE_CACHE = 'api_cache';

export class LocalDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE);
        }
      };
    });
    return this.initPromise;
  }

  async get(storeName: string, key: string): Promise<any> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName: string): Promise<void> {
      await this.init();
      return new Promise((resolve, reject) => {
          const tx = this.db!.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }
  
  // Helper Methods
  async saveCredentials(creds: any) { return this.set(STORE_SETTINGS, 'credentials', creds); }
  async getCredentials() { return this.get(STORE_SETTINGS, 'credentials'); }
  
  async cacheResponse(key: string, data: any) { 
      return this.set(STORE_CACHE, key, { timestamp: Date.now(), data }); 
  }
  
  async getCachedResponse(key: string, ttlMinutes: number = 60) { 
      const res = await this.get(STORE_CACHE, key);
      if (!res) return null;
      const age = (Date.now() - res.timestamp) / 1000 / 60;
      if (age > ttlMinutes) return null;
      return res.data;
  }
}

export const db = new LocalDB();
