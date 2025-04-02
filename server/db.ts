import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 20
});

// Test the connection
pool.connect()
  .then(client => {
    console.log('Database connected successfully');
    client.query('SELECT NOW()').then(() => {
      console.log('Database query successful');
      client.release();
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1); // Exit if database connection fails
  });

export const db = drizzle({ client: pool, schema });
