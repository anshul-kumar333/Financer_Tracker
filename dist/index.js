// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  transactions;
  reminders;
  currentTransactionId;
  currentReminderId;
  constructor() {
    this.transactions = [];
    this.reminders = [];
    this.currentTransactionId = 1;
    this.currentReminderId = 1;
  }
  async getTransactions() {
    console.log("Getting all transactions:", this.transactions);
    return this.transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  async getTransaction(id) {
    return this.transactions.find((t) => t.id === id);
  }
  async createTransaction(insertTransaction) {
    try {
      const transaction = {
        id: this.currentTransactionId++,
        type: insertTransaction.type,
        amount: insertTransaction.amount.toString(),
        category: insertTransaction.category,
        description: insertTransaction.description,
        date: /* @__PURE__ */ new Date(),
        paymentMethod: insertTransaction.paymentMethod,
        to: insertTransaction.to,
        notes: insertTransaction.notes || null,
        sync: 0,
        reminderId: null
      };
      console.log("Creating new transaction:", transaction);
      this.transactions.push(transaction);
      return transaction;
    } catch (error) {
      console.error("Detailed transaction error:", error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }
  async deleteTransaction(id) {
    this.transactions = this.transactions.filter((t) => t.id !== id);
  }
  async getReminders() {
    console.log("Getting all reminders:", this.reminders);
    return this.reminders.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }
  async getReminder(id) {
    return this.reminders.find((r) => r.id === id);
  }
  async createReminder(insertReminder) {
    const reminder = {
      id: this.currentReminderId++,
      amount: insertReminder.amount.toString(),
      fromPerson: insertReminder.fromPerson,
      dueDate: insertReminder.dueDate,
      status: "pending",
      notes: insertReminder.notes || null,
      rescheduledDate: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    console.log("Creating new reminder:", reminder);
    this.reminders.push(reminder);
    return reminder;
  }
  async updateReminderStatus(id, status, rescheduledDate) {
    const reminder = await this.getReminder(id);
    if (reminder) {
      reminder.status = status;
      if (rescheduledDate) {
        reminder.rescheduledDate = rescheduledDate;
      }
      this.reminders = this.reminders.map((r) => r.id === id ? reminder : r);
    }
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var transactionCategories = [
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
];
var transactionTypes = ["give", "receive"];
var paymentMethods = ["cash", "online", "card", "upi"];
var reminderStatus = ["pending", "completed", "rescheduled"];
var reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  amount: numeric("amount").notNull(),
  fromPerson: text("from_person").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status", { enum: reminderStatus }).notNull().default("pending"),
  notes: text("notes"),
  rescheduledDate: timestamp("rescheduled_date"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var transactions = pgTable("transactions", {
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
  reminderId: integer("reminder_id").references(() => reminders.id)
});
var insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, sync: true, reminderId: true }).extend({
  amount: z.number().positive(),
  description: z.string().min(1),
  to: z.string().min(1).max(100),
  notes: z.string().optional()
});
var insertReminderSchema = createInsertSchema(reminders).omit({ id: true, status: true, rescheduledDate: true, createdAt: true }).extend({
  amount: z.number().positive(),
  fromPerson: z.string().min(1),
  dueDate: z.date(),
  notes: z.string().optional()
});

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/transactions", async (_req, res) => {
    try {
      const transactions2 = await storage.getTransactions();
      console.log("GET /api/transactions:", transactions2);
      res.json(transactions2);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });
  app2.post("/api/transactions", async (req, res) => {
    try {
      console.log("POST /api/transactions body:", req.body);
      const result = insertTransactionSchema.safeParse(req.body);
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
        details: error instanceof Error ? error.stack : "No stack trace available"
      });
    }
  });
  app2.delete("/api/transactions/:id", async (req, res) => {
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
  app2.get("/api/reminders", async (_req, res) => {
    try {
      const reminders2 = await storage.getReminders();
      console.log("GET /api/reminders:", reminders2);
      res.json(reminders2);
    } catch (error) {
      console.error("Error getting reminders:", error);
      res.status(500).json({ error: "Failed to get reminders" });
    }
  });
  app2.post("/api/reminders", async (req, res) => {
    try {
      console.log("POST /api/reminders body:", req.body);
      const result = insertReminderSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Validation error:", result.error);
        return res.status(400).json({ error: result.error });
      }
      const reminder = await storage.createReminder(result.data);
      console.log("Created reminder:", reminder);
      res.json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });
  app2.patch("/api/reminders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const { status, rescheduledDate } = req.body;
      if (!["completed", "rescheduled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await storage.updateReminderStatus(id, status, rescheduledDate ? new Date(rescheduledDate) : void 0);
      res.status(204).end();
    } catch (error) {
      console.error("Error updating reminder:", error);
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const tryPort = (port) => {
    return new Promise((resolve, reject) => {
      server.listen(port, "0.0.0.0").on("listening", () => {
        resolve(port);
      }).on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          tryPort(port + 1).then(resolve, reject);
        } else {
          reject(err);
        }
      });
    });
  };
  tryPort(5e3).then((port) => {
    log(`serving on port ${port}`);
  }).catch((err) => {
    log(`Failed to start server: ${err}`);
    process.exit(1);
  });
})();
