import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/devices — list all devices
export async function GET() {
  try {
    const result = await db.execute(`SELECT * FROM Device ORDER BY createdAt ASC`);
    const devices = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      specs: row.specs,
      image: row.image,
    }));
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
    const adminSecret = request.headers.get("x-admin-secret");
    if (process.env.ADMIN_SECRET && adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = `dev-${Date.now()}`;

    await db.execute({
      sql: `INSERT INTO Device (id, name, price, specs, image) VALUES (?, ?, ?, ?, ?)`,
      args: [id, body.name, parseInt(body.price), body.specs || "", body.image || null],
    });

    const result = await db.execute({ sql: `SELECT * FROM Device WHERE id = ?`, args: [id] });
    const device = result.rows[0];

    return NextResponse.json(
      { id: device.id, name: device.name, price: Number(device.price), specs: device.specs, image: device.image },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to create device" }, { status: 500 });
  }
}
