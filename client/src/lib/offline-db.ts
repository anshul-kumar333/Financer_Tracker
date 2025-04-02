import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, Reminder, User } from '@shared/schema';

interface OfflineDB extends DBSchema {
  transactions: {
    key: number;
    value: Transaction;
    indexes: { 'by-date': Date };
  };
  reminders: {
    key: number;
    value: Reminder;
    indexes: { 'by-date': Date; 'by-status': string };
  };
  pendingRequests: {
    key: number;
    value: {
      id: number;
      url: string;
      method: string;
      body: any;
      timestamp: Date;
    };
  };
  user: {
    key: 'currentUser'; // Literal key value
    value: {
      userData: User | null;
      isAuthenticated: boolean;
    };
  };
}

let db: IDBPDatabase<OfflineDB>;

export async function initOfflineDB() {
  if (db) return db;
  
  db = await openDB<OfflineDB>('finance-tracker-offline', 1, {
    upgrade(database) {
      // Create transactions store
      if (!database.objectStoreNames.contains('transactions')) {
        const transactionsStore = database.createObjectStore('transactions', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        transactionsStore.createIndex('by-date', 'date');
      }
      
      // Create reminders store
      if (!database.objectStoreNames.contains('reminders')) {
        const remindersStore = database.createObjectStore('reminders', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        remindersStore.createIndex('by-date', 'dueDate');
        remindersStore.createIndex('by-status', 'status');
      }
      
      // Create pending requests store for offline sync
      if (!database.objectStoreNames.contains('pendingRequests')) {
        database.createObjectStore('pendingRequests', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
      
      // Create user store
      if (!database.objectStoreNames.contains('user')) {
        database.createObjectStore('user', { 
          keyPath: 'key'
        });
      }
    }
  });
  
  return db;
}

// Transactions methods
export async function getAllTransactionsOffline(): Promise<Transaction[]> {
  const db = await initOfflineDB();
  return db.getAll('transactions');
}

export async function addTransactionOffline(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const db = await initOfflineDB();
  
  // If there's no ID, IndexedDB will generate one with autoIncrement
  const id = await db.add('transactions', transaction as Transaction);
  const newTransaction = {
    ...transaction,
    id: id as number
  };
  
  // Queue for sync with server when online
  await queueRequestForSync('/api/transactions', 'POST', transaction);
  
  return newTransaction as Transaction;
}

export async function deleteTransactionOffline(id: number): Promise<void> {
  const db = await initOfflineDB();
  await db.delete('transactions', id);
  
  // Queue for sync with server when online
  await queueRequestForSync(`/api/transactions/${id}`, 'DELETE', null);
}

// Reminders methods
export async function getAllRemindersOffline(): Promise<Reminder[]> {
  const db = await initOfflineDB();
  return db.getAll('reminders');
}

export async function addReminderOffline(reminder: Omit<Reminder, 'id'>): Promise<Reminder> {
  const db = await initOfflineDB();
  
  // If there's no ID, IndexedDB will generate one with autoIncrement
  const id = await db.add('reminders', reminder as Reminder);
  const newReminder = {
    ...reminder,
    id: id as number
  };
  
  // Queue for sync with server when online
  await queueRequestForSync('/api/reminders', 'POST', reminder);
  
  return newReminder as Reminder;
}

export async function updateReminderStatusOffline(id: number, status: "completed" | "rescheduled", rescheduledDate?: Date): Promise<void> {
  const db = await initOfflineDB();
  
  // Get the existing reminder
  const reminder = await db.get('reminders', id);
  if (!reminder) throw new Error('Reminder not found');
  
  // Update the reminder
  reminder.status = status;
  if (rescheduledDate) {
    reminder.rescheduledDate = rescheduledDate;
  }
  
  // Save back to IndexedDB
  await db.put('reminders', reminder);
  
  // Queue for sync with server when online
  await queueRequestForSync(`/api/reminders/${id}`, 'PATCH', { status, rescheduledDate });
}

// User auth methods
export async function saveUserOffline(userData: User | null): Promise<void> {
  const db = await initOfflineDB();
  
  // Store user data with currentUser as the key
  await db.put('user', {
    userData,
    isAuthenticated: !!userData
  }, 'currentUser');
}

export async function getUserOffline(): Promise<User | null> {
  const db = await initOfflineDB();
  
  try {
    const userRecord = await db.get('user', 'currentUser');
    return userRecord?.userData || null;
  } catch (error) {
    console.error('Error getting user from offline storage:', error);
    return null;
  }
}

// Pending requests for offline/online sync
export async function queueRequestForSync(url: string, method: string, body: any): Promise<void> {
  // Only queue if we're offline
  if (navigator.onLine) return;
  
  const db = await initOfflineDB();
  
  await db.add('pendingRequests', {
    id: Date.now(),
    url,
    method,
    body,
    timestamp: new Date()
  });
  
  // Try to register a sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      // TypeScript doesn't recognize the sync API by default
      // Handle sync registration with proper type assertion
      // @ts-expect-error: Background Sync API not recognized by TypeScript
      await registration.sync.register('sync-transactions');
    } catch (error) {
      console.error('Background sync could not be registered:', error);
    }
  }
}

export async function processPendingRequests(): Promise<void> {
  const db = await initOfflineDB();
  const pendingRequests = await db.getAll('pendingRequests');
  
  for (const request of pendingRequests) {
    try {
      // Attempt to send the request
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: request.body ? JSON.stringify(request.body) : undefined
      });
      
      if (response.ok) {
        // If successful, remove from pending requests
        await db.delete('pendingRequests', request.id);
        console.log(`Synced request ${request.id} successfully`);
      } else {
        console.error(`Failed to sync request ${request.id}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error syncing request ${request.id}:`, error);
      // Keep the request in queue for next sync attempt
    }
  }
}

// Listen for online status to trigger sync
export function setupOfflineSync(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
      console.log('App is back online, syncing data...');
      await processPendingRequests();
    });
  }
}