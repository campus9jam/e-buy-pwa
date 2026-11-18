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
 * The first release required a BVN on every order. BVN is no longer collected
 * (guarantors replaced it), so on databases created back then every insert
 * fails with "NOT NULL constraint failed: Order.bvn".
 *
 * SQLite cannot drop NOT NULL in place, so rebuild the table with the same
 * columns and data, only with "bvn" nullable. Runs inside one atomic batch:
 * either the rebuilt table is in place or nothing changed.
 */
async function relaxOrderBvnColumn(): Promise<void> {
  const info = await db.execute(`PRAGMA table_info("Order")`);
  const columns = info.rows as unknown as Array<{
    name: string;
    type: string;
    notnull: number;
    dflt_value: unknown;
    pk: number;
  }>;

  if (columns.length === 0) return;

  const bvn = columns.find((c) => String(c.name).toLowerCase() === "bvn");
  if (!bvn || Number(bvn.notnull) !== 1) return;

  const definitions = columns.map((c) => {
    const name = String(c.name);
    const type = c.type ? String(c.type) : "TEXT";
    const isPrimaryKey = Number(c.pk) === 1;
    const notNull =
      name.toLowerCase() === "bvn" ? false : Number(c.notnull) === 1;
    const dflt =
      c.dflt_value === null || c.dflt_value === undefined
        ? ""
        : ` DEFAULT ${String(c.dflt_value)}`;

    return `"${name}" ${type}${notNull ? " NOT NULL" : ""}${
      isPrimaryKey ? " PRIMARY KEY" : ""
    }${dflt}`;
  });

  const names = columns.map((c) => `"${String(c.name)}"`).join(", ");

  await db.batch(
    [
      `DROP TABLE IF EXISTS "Order__new"`,
      `CREATE TABLE "Order__new" (${definitions.join(", ")})`,
      `INSERT INTO "Order__new" (${names}) SELECT ${names} FROM "Order"`,
      `DROP TABLE "Order"`,
      `ALTER TABLE "Order__new" RENAME TO "Order"`,
    ],
    "write"
  );

  console.log("Schema migration: Order.bvn is now nullable");
}

/**
 * Ensures the Device and Order tables match what the current code writes.
 * Safe to call on every request; the migration runs at most once per process.
 */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.schemaReady) {
    globalForDb.schemaReady = migrateDeviceTable()
      .then(migrateOrderTable)
      .then(relaxOrderBvnColumn)
      .catch((error) => {
        console.error("Schema migration skipped:", error);
      });
  }
  return globalForDb.schemaReady;
}
