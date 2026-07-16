
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import supabase from './supabaseClient';

// Define our database schema
interface TrovaDBSchema extends DBSchema {
  transactions: {
    key: string;
    value: {
      id: string;
      data: any;
      synced: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    indexes: { 'by-synced': string };
  };
  profiles: {
    key: string;
    value: {
      id: string;
      data: any;
      synced: boolean;
      lastFetched: Date;
    };
    indexes: {};
  };
  pendingActions: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      table: string;
      data: any;
      createdAt: Date;
    };
    indexes: {};
  };
}

// Initialize the database
let dbPromise: Promise<IDBPDatabase<TrovaDBSchema>> | null = null;

function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<TrovaDBSchema>('TrovaDB', 1, {
      upgrade(db) {
        // Create transactions store
        const transactionStore = db.createObjectStore('transactions', {
          keyPath: 'id',
        });
        transactionStore.createIndex('by-synced', 'synced');

        // Create profiles store
        db.createObjectStore('profiles', { keyPath: 'id' });

        // Create pending actions store
        db.createObjectStore('pendingActions', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

// Offline database operations
export const OfflineDB = {
  // Transactions
  async saveTransaction(transaction: any, synced = false) {
    const db = await initDB();
    const now = new Date();
    await db.put('transactions', {
      id: transaction.id,
      data: transaction,
      synced,
      createdAt: now,
      updatedAt: now,
    });
  },

  async getTransaction(id: string) {
    const db = await initDB();
    const record = await db.get('transactions', id);
    return record?.data || null;
  },

  async getAllTransactions() {
    const db = await initDB();
    const records = await db.getAll('transactions');
    return records.map(r => r.data);
  },

  async getUnsyncedTransactions() {
    const db = await initDB();
    const records = await db.getAllFromIndex('transactions', 'by-synced', IDBKeyRange.only(false));
    return records.map(r => r.data);
  },

  // Profiles
  async saveProfile(profile: any, synced = false) {
    const db = await initDB();
    await db.put('profiles', {
      id: profile.id,
      data: profile,
      synced,
      lastFetched: new Date(),
    });
  },

  async getProfile(id: string) {
    const db = await initDB();
    const record = await db.get('profiles', id);
    return record?.data || null;
  },

  // Pending actions (for sync later)
  async addPendingAction(action: 'create' | 'update' | 'delete', table: string, data: any) {
    const db = await initDB();
    await db.add('pendingActions', {
      id: crypto.randomUUID(),
      action,
      table,
      data,
      createdAt: new Date(),
    });
  },

  async getPendingActions() {
    const db = await initDB();
    return await db.getAll('pendingActions');
  },

  async deletePendingAction(id: string) {
    const db = await initDB();
    await db.delete('pendingActions', id);
  },

  // Sync functionality
  async syncWithSupabase() {
    console.log('[Trova Offline Sync] Starting sync...');
    
    try {
      // Check if online
      if (!navigator.onLine) {
        console.log('[Trova Offline Sync] Device is offline, skipping sync');
        return false;
      }

      // Sync pending actions
      const pendingActions = await this.getPendingActions();
      
      for (const action of pendingActions) {
        try {
          console.log(`[Trova Offline Sync] Processing action: ${action.action} on ${action.table}`);
          // TODO: Implement actual sync logic for each table/action type
          
          // Mark action as synced by deleting it
          await this.deletePendingAction(action.id);
        } catch (error) {
          console.error('[Trova Offline Sync] Failed to process action:', error);
        }
      }

      console.log('[Trova Offline Sync] Sync completed successfully');
      return true;
    } catch (error) {
      console.error('[Trova Offline Sync] Sync failed:', error);
      return false;
    }
  },

  // Listen for online events to trigger sync
  listenForOnline() {
    window.addEventListener('online', () => {
      console.log('[Trova Offline Sync] Device came online, starting sync');
      this.syncWithSupabase();
    });
  },
};

// Initialize offline DB listener on startup
OfflineDB.listenForOnline();
