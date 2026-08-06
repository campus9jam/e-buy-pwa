import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const db = createClient(
  url.startsWith("libsql://")
    ? { url, authToken }
    : { url }
);

async function main() {
  // Create tables
  await db.execute(`CREATE TABLE IF NOT EXISTS "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "specs" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "bvn" TEXT NOT NULL,
    "paymentProof" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS "PaymentSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "agentWhatsApp" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log("✅ Tables created");

  // Seed devices
  const devices = [
    { id: "tecno-spark-20-pro", name: "Tecno Spark 20 Pro", price: 185000, specs: "8GB RAM | 256GB ROM" },
    { id: "infinix-hot-40i", name: "Infinix Hot 40i", price: 145000, specs: "4GB RAM | 128GB ROM" },
    { id: "samsung-galaxy-a15", name: "Samsung Galaxy A15", price: 210000, specs: "6GB RAM | 128GB ROM" },
  ];

  for (const d of devices) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO "Device" (id, name, price, specs, image) VALUES (?, ?, ?, ?, NULL)`,
      args: [d.id, d.name, d.price, d.specs],
    });
  }
  console.log("✅ 3 devices seeded");

  // Seed payment settings
  await db.execute({
    sql: `INSERT OR IGNORE INTO "PaymentSettings" (id, bankName, accountNumber, accountName, agentWhatsApp) VALUES (?, ?, ?, ?, ?)`,
    args: ["singleton", "Wema Bank", "9876543210", "E-Buy Global Collections / Monnify", "+2348012345678"],
  });
  console.log("✅ Payment settings seeded");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
