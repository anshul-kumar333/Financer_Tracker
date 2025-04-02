import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactionCategories = [
  "salary",           
  "business",         
  "gift",            
  "food",            
  "transport",        
  "shopping",         
  "bills",           
  "entertainment",    
  "health",          
  "education",        
  "investment",       
  "other"            
] as const;

export const transactionTypes = ["give", "receive"] as const;
export const paymentMethods = ["cash", "online", "card", "upi"] as const;
export const reminderStatus = ["pending", "completed", "rescheduled"] as const;
export const userRoles = ["user", "admin"] as const;

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  amount: numeric("amount").notNull(),
  fromPerson: text("from_person").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status", { enum: reminderStatus }).notNull().default("pending"),
  notes: text("notes"),
  rescheduledDate: timestamp("rescheduled_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role", { enum: userRoles }).notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: numeric("amount").notNull(),
  type: text("type", { enum: transactionTypes }).notNull(),
  category: text("category", { enum: transactionCategories }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  paymentMethod: text("payment_method", { enum: paymentMethods }).notNull(),
  to: text("to").notNull(),              
  notes: text("notes"),                          
  sync: integer("sync").notNull().default(0),    
  reminderId: integer("reminder_id").references(() => reminders.id),
  userId: integer("user_id").references(() => users.id),
});

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true, sync: true, reminderId: true })
  .extend({
    amount: z.number().positive(),
    description: z.string().min(1),
    to: z.string().min(1).max(100),
    notes: z.string().optional(),
  });

export const insertReminderSchema = createInsertSchema(reminders)
  .omit({ id: true, status: true, rescheduledDate: true, createdAt: true })
  .extend({
    amount: z.number().positive(),
    fromPerson: z.string().min(1),
    dueDate: z.date(),
    notes: z.string().optional(),
  });

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, role: true, createdAt: true })
  .extend({
    username: z.string().min(3).max(50),
    password: z.string().min(6),
    fullName: z.string().optional(),
  });

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;