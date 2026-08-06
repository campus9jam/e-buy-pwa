import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed devices
  const devices = [
    { name: "Tecno Spark 20 Pro", price: 185000, specs: "8GB RAM | 256GB ROM" },
    { name: "Infinix Hot 40i", price: 145000, specs: "4GB RAM | 128GB ROM" },
    { name: "Samsung Galaxy A15", price: 210000, specs: "6GB RAM | 128GB ROM" },
  ];

  for (const d of devices) {
    await prisma.device.upsert({
      where: { id: d.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: d.name.toLowerCase().replace(/\s+/g, "-"),
        ...d,
      },
    });
  }

  // Seed payment settings (singleton)
  await prisma.paymentSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      bankName: "Wema Bank",
      accountNumber: "9876543210",
      accountName: "E-Buy Global Collections / Monnify",
      agentWhatsApp: "+2348012345678",
    },
  });

  console.log("✅ Seed complete — 3 devices + payment settings created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
