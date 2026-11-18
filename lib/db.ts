import { createClient, type Client } from "@libsql/client";

const globalForDb = globalThis as unknown as {
  db: Client | undefined;
  schemaReady: Promise<void> | undefined;
};

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

/**
 * Columns added to the "Order" table after the first release.
 * Older databases (including the production Turso database) predate them, so we
 * add them lazily on first use. Each statement is idempotent: an existing
 * column simply throws "duplicate column name", which we swallow.
 */
const ORDER_COLUMN_MIGRATIONS = [
  `ALTER TABLE "Order" ADD COLUMN "deviceName" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "deviceSpecs" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "deviceImage" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "paymentAccountId" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "paymentBankName" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "paymentAccountNumber" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "paymentAccountName" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "vat" INTEGER DEFAULT 0`,
  `ALTER TABLE "Order" ADD COLUMN "amountPaid" INTEGER DEFAULT 0`,
  `ALTER TABLE "Order" ADD COLUMN "guarantors" TEXT`,
];

/**
 * Columns added to the "Device" table after the first release.
 * Existing rows default to "phone", which is what the catalogue held before
 * bikes were added.
 */
const DEVICE_COLUMN_MIGRATIONS = [
  `ALTER TABLE "Device" ADD COLUMN "category" TEXT DEFAULT 'phone'`,
];

async function migrateDeviceTable(): Promise<void> {
  for (const sql of DEVICE_COLUMN_MIGRATIONS) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists — nothing to do.
    }
  }
}

async function migrateOrderTable(): Promise<void> {
  for (const sql of ORDER_COLUMN_MIGRATIONS) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists — nothing to do.
    }
  }
}

/**
 * Ensures the Device and Order tables have every column the current code writes
 * to. Safe to call on every request; the migration runs at most once per process.
 */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.schemaReady) {
    globalForDb.schemaReady = migrateDeviceTable()
      .then(migrateOrderTable)
      .catch((error) => {
        console.error("Schema migration skipped:", error);
      });
  }
  return globalForDb.schemaReady;
}
