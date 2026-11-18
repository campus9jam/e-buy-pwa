import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const db = createClient(
  url.startsWith("libsql://") ? { url, authToken } : { url }
);

async function main() {
  // Create tables
  await db.execute(`CREATE TABLE IF NOT EXISTS "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "specs" TEXT NOT NULL,
    "image" TEXT,
    "category" TEXT NOT NULL DEFAULT 'phone',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nin" TEXT,
    "address" TEXT,
    "guarantors" TEXT,
    "downPayment" INTEGER DEFAULT 0,
    "vat" INTEGER DEFAULT 0,
    "amountPaid" INTEGER DEFAULT 0,
    "devicePrice" INTEGER DEFAULT 0,
    "deviceName" TEXT,
    "deviceSpecs" TEXT,
    "deviceImage" TEXT,
    "paymentProof" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentAccountId" TEXT,
    "paymentBankName" TEXT,
    "paymentAccountNumber" TEXT,
    "paymentAccountName" TEXT,
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

  await db.execute(`CREATE TABLE IF NOT EXISTS "PaymentAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS "PaymentRotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastAccountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS "DeviceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceName" TEXT NOT NULL,
    "notes" TEXT,
    "customerWhatsApp" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log("✅ Tables created/verified");

  // Seed devices
  const devices = [
    { id: "jincheng-jc150", name: "Jincheng JC150-6", price: 780000, specs: "150cc | Manual | Petrol", category: "bike" },
    { id: "qlink-xf200", name: "Qlink XF200", price: 950000, specs: "200cc | Manual | Petrol", category: "bike" },
    { id: "haojue-hj125", name: "Haojue HJ125-8", price: 690000, specs: "125cc | Manual | Petrol", category: "bike" },
  ];

  for (const d of devices) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO "Device" (id, name, price, specs, image, category) VALUES (?, ?, ?, ?, NULL, ?)`,
      args: [d.id, d.name, d.price, d.specs, d.category ?? "phone"],
    });
  }
  console.log("✅ 3 devices seeded");

  // Seed payment settings
  await db.execute({
    sql: `INSERT OR IGNORE INTO "PaymentSettings" (id, bankName, accountNumber, accountName, agentWhatsApp) VALUES (?, ?, ?, ?, ?)`,
    args: ["singleton", "Wema Bank", "9876543210", "E-Buy Global Collections / Monnify", "+2348012345678"],
  });
  console.log("✅ Payment settings seeded");

  // Seed super admin
  const adminEmail = "Easybuy20000@gmail.com";
  const adminPassword = "@Faruq1234";
  const hash = await bcrypt.hash(adminPassword, 10);
  await db.execute({
    sql: `INSERT OR REPLACE INTO "Admin" (id, email, passwordHash, role) VALUES (?, ?, ?, 'super-admin')`,
    args: ["super-admin", adminEmail, hash],
  });
  console.log("✅ Super admin seeded");

  console.log("\n🎉 Seed complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
