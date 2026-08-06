import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/devices — list all devices
export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(devices);
  } catch (error) {
    // Fallback to seed data if DB isn't available yet
    return NextResponse.json([
      { id: "tecno-spark-20-pro", name: "Tecno Spark 20 Pro", price: 185000, specs: "8GB RAM | 256GB ROM", image: null },
      { id: "infinix-hot-40i", name: "Infinix Hot 40i", price: 145000, specs: "4GB RAM | 128GB ROM", image: null },
      { id: "samsung-galaxy-a15", name: "Samsung Galaxy A15", price: 210000, specs: "6GB RAM | 128GB ROM", image: null },
    ]);
  }
}

// POST /api/devices — add a new device (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Simple admin check
    const adminSecret = request.headers.get("x-admin-secret");
    if (adminSecret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = await prisma.device.create({
      data: {
        name: body.name,
        price: parseInt(body.price),
        specs: body.specs || "",
        image: body.image || null,
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create device" }, { status: 500 });
  }
}
