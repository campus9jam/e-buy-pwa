import { createClient, type Client } from "@libsql/client";

const globalForDb = globalThis as unknown as { db: Client | undefined };

function createDb(): Client {
  const url = process.env.DATABASE_URL || "file:./dev.db";

  if (url.startsWith("libsql://")) {
    return createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }

  // Local dev fallback (SQLite file)
  return createClient({ url });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
