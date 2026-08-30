/**
 * TrackMate - IndexedDB Local-First Database Layer
 */

class TrackMateDB {
  constructor() {
    this.dbName = 'TrackMateDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Profiles Store
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }

        // Trackers Store
        if (!db.objectStoreNames.contains('trackers')) {
          const trackerStore = db.createObjectStore('trackers', { keyPath: 'id' });
          trackerStore.createIndex('user_id', 'user_id', { unique: false });
          trackerStore.createIndex('type', 'type', { unique: false });
          trackerStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Tasks Store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('tracker_id', 'tracker_id', { unique: false });
          taskStore.createIndex('user_id', 'user_id', { unique: false });
          taskStore.createIndex('due_date', 'due_date', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('priority', 'priority', { unique: false });
          taskStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Habits Store
        if (!db.objectStoreNames.contains('habits')) {
          const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
          habitStore.createIndex('tracker_id', 'tracker_id', { unique: false });
          habitStore.createIndex('user_id', 'user_id', { unique: false });
          habitStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Habit Logs (Daily check-ins)
        if (!db.objectStoreNames.contains('habit_logs')) {
          const habitLogStore = db.createObjectStore('habit_logs', { keyPath: 'id' });
          habitLogStore.createIndex('habit_id', 'habit_id', { unique: false });
          habitLogStore.createIndex('date', 'date', { unique: false });
          habitLogStore.createIndex('habit_date', ['habit_id', 'date'], { unique: true });
        }

        // Goals Store
        if (!db.objectStoreNames.contains('goals')) {
          const goalStore = db.createObjectStore('goals', { keyPath: 'id' });
          goalStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Projects Store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Notes Store
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('parent_id', 'parent_id', { unique: false });
          noteStore.createIndex('date', 'date', { unique: false });
        }

        // Reminders Store
        if (!db.objectStoreNames.contains('reminders')) {
          const reminderStore = db.createObjectStore('reminders', { keyPath: 'id' });
          reminderStore.createIndex('trigger_time', 'trigger_time', { unique: false });
          reminderStore.createIndex('is_sent', 'is_sent', { unique: false });
        }

        // Sync Queue Store (mutations to flush to MongoDB)
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Activity Logs Store (for analytics and history)
        if (!db.objectStoreNames.contains('activity_logs')) {
          const actStore = db.createObjectStore('activity_logs', { keyPath: 'id' });
          actStore.createIndex('timestamp', 'timestamp', { unique: false });
          actStore.createIndex('date', 'date', { unique: false });
        }

        // Daily Reports Store
        if (!db.objectStoreNames.contains('daily_reports')) {
          const reportStore = db.createObjectStore('daily_reports', { keyPath: 'date' });
          reportStore.createIndex('date', 'date', { unique: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[TrackMateDB] Error opening IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Generate UUID v4
  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Generic Get Single Item
  async get(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Get All Items
  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Put Item (Insert or Update)
  async put(storeName, value) {
    await this.init();
    if (!value.updated_at) {
      value.updated_at = new Date().toISOString();
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve(value);
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk Put Items
  async bulkPut(storeName, items) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach((item) => {
        if (!item.updated_at) item.updated_at = new Date().toISOString();
        store.put(item);
      });

      transaction.oncomplete = () => resolve(items);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Generic Delete Item
  async delete(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Query by Index
  async queryByIndex(storeName, indexName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear a store
  async clear(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Export full JSON database for backup
  async exportFullDatabase() {
    const stores = ['profiles', 'trackers', 'tasks', 'habits', 'habit_logs', 'goals', 'projects', 'notes', 'reminders', 'activity_logs'];
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      stores: {}
    };

    for (const store of stores) {
      exportData.stores[store] = await this.getAll(store);
    }
    return exportData;
  }

  // Import full JSON database from backup
  async importFullDatabase(data) {
    if (!data || !data.stores) throw new Error('Invalid backup file format');

    for (const [storeName, items] of Object.entries(data.stores)) {
      if (Array.isArray(items)) {
        await this.clear(storeName);
        await this.bulkPut(storeName, items);
      }
    }
    return true;
  }
}

// Instantiate global database layer
window.db = new TrackMateDB();

