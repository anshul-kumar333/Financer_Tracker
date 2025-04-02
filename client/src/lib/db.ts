import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Transaction } from '@shared/schema';

interface FinanceDB extends DBSchema {
  transactions: {
    key: number;
    value: Transaction;
    indexes: { 'by-date': Date };
  };
}

let db: IDBPDatabase<FinanceDB>;

export async function initDB() {
  db = await openDB<FinanceDB>('finance-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('transactions', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('by-date', 'date');
    },
  });
}

export async function getAllTransactions(): Promise<Transaction[]> {
  if (!db) await initDB();
  return db.getAllFromIndex('transactions', 'by-date');
}

export async function addTransaction(transaction: Transaction) {
  if (!db) await initDB();
  return db.add('transactions', transaction);
}

export async function deleteTransaction(id: number) {
  if (!db) await initDB();
  return db.delete('transactions', id);
}
