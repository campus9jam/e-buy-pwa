import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/devices — list all devices (public, no auth needed for shop display)
export async function GET() {
  try {
    await ensureSchema();
    const result = await db.execute(`SELECT * FROM Device ORDER BY createdAt ASC`);
    const devices = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      specs: row.specs,
      image: row.image,
      category: row.category === "bike" ? "bike" : "phone",
    }));
    return NextResponse.json(devices);
  } catch (error) {
    console.error("Devices fetch error:", error);
    // Return empty array instead of dummy data — real errors shouldn't be masked
    return NextResponse.json([]);
  }
}

// POST /api/devices — add a new device (admin only, JWT auth)
export async function POST(request: Request) {
  try {
    await ensureSchema();
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = `dev-${Date.now()}`;

    const category = body.category === "bike" ? "bike" : "phone";

    await db.execute({
      sql: `INSERT INTO Device (id, name, price, specs, image, category) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, body.name, parseInt(body.price), body.specs || "", body.image || null, category],
    });

    const result = await db.execute({ sql: `SELECT * FROM Device WHERE id = ?`, args: [id] });
    const device = result.rows[0];

    return NextResponse.json(
      { id: device.id, name: device.name, price: Number(device.price), specs: device.specs, image: device.image, category },
      { status: 201 }
    );
  } catch (error) {
    console.error("Device creation error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
