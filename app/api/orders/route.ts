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

    // Fetch device info from DB to store snapshot in order (survives device deletion)
    const deviceResult = await db.execute({
      sql: `SELECT * FROM Device WHERE id = ?`,
      args: [body.deviceId],
    });
    const device = deviceResult.rows[0];

    if (!downPayment || !devicePrice) {
      devicePrice = Number(device?.price || body.devicePrice || 0);
      downPayment = Math.round(devicePrice * 0.3);
    }

    // Store device info directly in order so it survives device deletion
    const deviceName = device?.name || body.deviceName || "Unknown Device";
    const deviceSpecs = device?.specs || body.deviceSpecs || "";
    const deviceImage = device?.image || body.deviceImage || null;

    await db.execute({
      sql: `INSERT INTO "Order" (id, deviceId, customerName, phone, bvn, nin, address, downPayment, devicePrice, deviceName, deviceSpecs, deviceImage, paymentProof, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
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
        deviceName,
        deviceSpecs,
        deviceImage,
        body.paymentProof || null,
      ],
    });

    return NextResponse.json(
      { id, ...body, downPayment, devicePrice, deviceName, deviceSpecs, deviceImage, status: "pending" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
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

    // Use stored device info from order (survives device deletion)
    // Fall back to JOIN for old orders that might not have device info stored
    const result = await db.execute(`
      SELECT o.*,
             COALESCE(o.deviceName, d.name) as finalDeviceName,
             COALESCE(o.deviceSpecs, d.specs) as finalDeviceSpecs,
             COALESCE(o.deviceImage, d.image) as finalDeviceImage
      FROM "Order" o
      LEFT JOIN Device d ON o.deviceId = d.id
      ORDER BY o.createdAt DESC
    `);

    const orders = result.rows.map((row) => ({
      id: row.id,
      deviceId: row.deviceId,
      deviceName: row.finalDeviceName || row.deviceName || "Deleted Device",
      deviceSpecs: row.finalDeviceSpecs || row.deviceSpecs || "",
      deviceImage: row.finalDeviceImage || row.deviceImage || null,
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
    console.error("Orders fetch error:", error);
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
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
