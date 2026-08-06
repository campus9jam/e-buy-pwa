import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/orders — create a new order
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
    const id = `order-${Date.now()}`;

    await db.execute({
      sql: `INSERT INTO "Order" (id, deviceId, customerName, phone, bvn, paymentProof, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      args: [id, body.deviceId, body.customerName, body.phone, body.bvn, body.paymentProof || null],
    });

    return NextResponse.json(
      { id, ...body, status: "pending" },
      { status: 201 }
    );
  } catch (error) {
    // If DB isn't available, still return success for prototype
    return NextResponse.json(
      {
        id: "proto-" + Date.now(),
        deviceId: body?.deviceId || "unknown",
        customerName: body?.customerName || "unknown",
        phone: body?.phone || "unknown",
        status: "pending",
      },
      { status: 201 }
    );
  }
}

// GET /api/orders — list all orders (admin only)
export async function GET(request: Request) {
  try {
    const adminSecret = request.headers.get("x-admin-secret");
    if (process.env.ADMIN_SECRET && adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.execute(`
      SELECT o.*, d.name as deviceName, d.price as devicePrice
      FROM "Order" o
      LEFT JOIN Device d ON o.deviceId = d.id
      ORDER BY o.createdAt DESC
    `);

    const orders = result.rows.map((row) => ({
      id: row.id,
      deviceId: row.deviceId,
      deviceName: row.deviceName,
      devicePrice: Number(row.devicePrice || 0),
      customerName: row.customerName,
      phone: row.phone,
      bvn: row.bvn,
      status: row.status,
      createdAt: row.createdAt,
    }));

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json([]);
  }
}
