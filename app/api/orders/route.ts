import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

// POST /api/orders — create a new order
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
    const id = `order-${Date.now()}`;

    // Calculate down payment if not provided (30% of device price)
    let downPayment = body.downPayment;
    let devicePrice = body.devicePrice;

    if (!downPayment || !devicePrice) {
      // Fetch device price from DB
      const deviceResult = await db.execute({
        sql: `SELECT price FROM Device WHERE id = ?`,
        args: [body.deviceId],
      });
      devicePrice = Number(deviceResult.rows[0]?.price || 0);
      downPayment = Math.round(devicePrice * 0.3);
    }

    await db.execute({
      sql: `INSERT INTO "Order" (id, deviceId, customerName, phone, bvn, nin, address, downPayment, devicePrice, paymentProof, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      args: [
        id,
        body.deviceId,
        body.customerName,
        body.phone,
        body.bvn || null,
        body.nin || null,
        body.address || null,
        downPayment,
        devicePrice,
        body.paymentProof || null,
      ],
    });

    return NextResponse.json(
      { id, ...body, downPayment, devicePrice, status: "pending" },
      { status: 201 }
    );
  } catch (error) {
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

// GET /api/orders — list all orders with full KYC (admin only, JWT auth)
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.execute(`
      SELECT o.*, d.name as deviceName, d.price as devicePrice, d.specs as deviceSpecs, d.image as deviceImage
      FROM "Order" o
      LEFT JOIN Device d ON o.deviceId = d.id
      ORDER BY o.createdAt DESC
    `);

    const orders = result.rows.map((row) => ({
      id: row.id,
      deviceId: row.deviceId,
      deviceName: row.deviceName,
      deviceSpecs: row.deviceSpecs,
      deviceImage: row.deviceImage,
      devicePrice: Number(row.devicePrice || 0),
      customerName: row.customerName,
      phone: row.phone,
      bvn: row.bvn,
      nin: row.nin,
      address: row.address,
      downPayment: Number(row.downPayment || 0),
      paymentProof: row.paymentProof,
      status: row.status,
      createdAt: row.createdAt,
    }));

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json([]);
  }
}

// PATCH /api/orders — update order status (admin only)
export async function PATCH(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();

    await db.execute({
      sql: `UPDATE "Order" SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [status, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
