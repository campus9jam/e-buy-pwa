import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/device-requests — customer requests a device not in inventory (public)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.deviceName || !body.customerWhatsApp) {
      return NextResponse.json({ error: "Device name and WhatsApp number are required" }, { status: 400 });
    }

    const id = `req-${Date.now()}`;
    await db.execute({
      sql: `INSERT INTO DeviceRequest (id, deviceName, notes, customerWhatsApp, status) VALUES (?, ?, ?, ?, 'pending')`,
      args: [id, body.deviceName, body.notes || null, body.customerWhatsApp],
    });

    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (error) {
    console.error("Device request creation error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}

// GET /api/device-requests — list all requests (admin only)
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.execute(`SELECT * FROM DeviceRequest ORDER BY createdAt DESC`);
    const requests = result.rows.map((row) => ({
      id: row.id,
      deviceName: row.deviceName,
      notes: row.notes,
      customerWhatsApp: row.customerWhatsApp,
      status: row.status,
      createdAt: row.createdAt,
    }));
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Device requests fetch error:", error);
    return NextResponse.json([]);
  }
}

// PATCH /api/device-requests — update request status (admin only)
export async function PATCH(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();
    await db.execute({
      sql: `UPDATE DeviceRequest SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [status, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Device request update error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
