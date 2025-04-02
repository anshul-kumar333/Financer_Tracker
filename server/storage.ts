import { transactions, reminders, users, type Transaction, type InsertTransaction, type Reminder, type InsertReminder, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Reminder methods
  getReminders(): Promise<Reminder[]>;
  getReminder(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminderStatus(id: number, status: "completed" | "rescheduled", rescheduledDate?: Date): Promise<void>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private transactions: Transaction[];
  private reminders: Reminder[];
  private users: User[];
  private currentTransactionId: number;
  private currentReminderId: number;
  private currentUserId: number;
  sessionStore: session.Store;

  constructor() {
    this.transactions = [];
    this.reminders = [];
    this.users = [];
    this.currentTransactionId = 1;
    this.currentReminderId = 1;
    this.currentUserId = 1;
    
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getTransactions(): Promise<Transaction[]> {
    console.log("Getting all transactions:", this.transactions);
    return this.transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.find(t => t.id === id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // Create the transaction without a try-catch to reduce type complexity
    const transaction: Transaction = {
      id: this.currentTransactionId++,
      type: insertTransaction.type,
      amount: insertTransaction.amount.toString(), // Convert number to string
      category: insertTransaction.category,
      description: insertTransaction.description,
      date: new Date(),
      paymentMethod: insertTransaction.paymentMethod,
      to: insertTransaction.to,
      notes: insertTransaction.notes || null,
      sync: 0,
      reminderId: null,
      userId: null,
    };

    console.log("Creating new transaction:", transaction);
    this.transactions.push(transaction);
    return transaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    this.transactions = this.transactions.filter(t => t.id !== id);
  }

  async getReminders(): Promise<Reminder[]> {
    console.log("Getting all reminders:", this.reminders);
    return this.reminders.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  async getReminder(id: number): Promise<Reminder | undefined> {
    return this.reminders.find(r => r.id === id);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const reminder: Reminder = {
      id: this.currentReminderId++,
      amount: insertReminder.amount.toString(), // Make sure it's converted to string
      fromPerson: insertReminder.fromPerson,
      dueDate: insertReminder.dueDate,
      status: "pending",
      notes: insertReminder.notes || null,
      rescheduledDate: null,
      createdAt: new Date(),
    };

    console.log("Creating new reminder:", reminder);
    this.reminders.push(reminder);
    return reminder;
  }

  async updateReminderStatus(id: number, status: "completed" | "rescheduled", rescheduledDate?: Date): Promise<void> {
    const reminder = await this.getReminder(id);
    if (reminder) {
      reminder.status = status;
      if (rescheduledDate) {
        reminder.rescheduledDate = rescheduledDate;
      }
      this.reminders = this.reminders.map(r => r.id === id ? reminder : r);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const existingUser = await this.getUserByUsername(insertUser.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }
    
    const user: User = {
      id: this.currentUserId++,
      username: insertUser.username,
      password: insertUser.password, // In a real app, this should be hashed
      fullName: insertUser.fullName || null,
      role: "user",
      createdAt: new Date(),
    };
    
    console.log("Creating new user:", user);
    this.users.push(user);
    return user;
  }
}

export const storage = new MemStorage();