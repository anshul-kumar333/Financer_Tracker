import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertReminderSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express) {
  // Setup authentication
  setupAuth(app);
  // Transaction routes
  app.get("/api/transactions", async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      console.log("GET /api/transactions:", transactions);
      res.json(transactions);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      console.log("POST /api/transactions body:", req.body);
      // Convert amount to number if it's a string
      const parsedBody = {
        ...req.body,
        amount: typeof req.body.amount === 'string' ? parseFloat(req.body.amount) : req.body.amount
      };
      console.log("Parsed body:", parsedBody);
      const result = insertTransactionSchema.safeParse(parsedBody);
      if (!result.success) {
        console.error("Validation error:", result.error);
        return res.status(400).json({ error: result.error });
      }
      const transaction = await storage.createTransaction(result.data);
      console.log("Created transaction:", transaction);
      res.json(transaction);
    } catch (error) {
      console.error("Detailed error in route:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create transaction";
      res.status(500).json({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      await storage.deleteTransaction(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Reminder routes
  app.get("/api/reminders", async (_req, res) => {
    try {
      const reminders = await storage.getReminders();
      console.log("GET /api/reminders:", reminders);
      res.json(reminders);
    } catch (error) {
      console.error("Error getting reminders:", error);
      res.status(500).json({ error: "Failed to get reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      console.log("POST /api/reminders body:", req.body);
      
      let dueDateVal;
      try {
        // Handle different date formats from client
        if (req.body.dueDate) {
          dueDateVal = new Date(req.body.dueDate);
          if (isNaN(dueDateVal.getTime())) {
            throw new Error("Invalid date format");
          }
        } else {
          throw new Error("Missing dueDate field");
        }
      } catch (dateError) {
        console.error("Error parsing dueDate:", dateError, req.body.dueDate);
        return res.status(400).json({ error: "Invalid or missing dueDate field" });
      }
      
      // Convert amount to number if it's a string and ensure dueDate is a Date object
      const parsedBody = {
        ...req.body,
        amount: typeof req.body.amount === 'string' ? parseFloat(req.body.amount) : req.body.amount,
        dueDate: dueDateVal
      };
      
      console.log("Parsed reminder body:", parsedBody);
      console.log("Parsed dueDate (toISOString):", parsedBody.dueDate.toISOString());
      
      const result = insertReminderSchema.safeParse(parsedBody);
      if (!result.success) {
        console.error("Validation error:", result.error);
        return res.status(400).json({ error: result.error });
      }
      
      const reminder = await storage.createReminder(result.data);
      console.log("Created reminder:", reminder);
      res.json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create reminder";
      res.status(500).json({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      });
    }
  });

  app.patch("/api/reminders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const { status, rescheduledDate } = req.body;
      if (!["completed", "rescheduled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateReminderStatus(id, status, rescheduledDate ? new Date(rescheduledDate) : undefined);
      res.status(204).end();
    } catch (error) {
      console.error("Error updating reminder:", error);
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  return createServer(app);
}