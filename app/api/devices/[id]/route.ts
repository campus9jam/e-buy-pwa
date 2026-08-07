import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

// PATCH /api/devices/[id] — update a device (admin only, JWT auth)
// Supports removing image by setting image: null
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const args: any[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      args.push(body.name);
    }
    if (body.price !== undefined) {
      updates.push("price = ?");
      args.push(parseInt(body.price));
    }
    if (body.specs !== undefined) {
      updates.push("specs = ?");
      args.push(body.specs);
    }
    if (body.image !== undefined) {
      updates.push("image = ?");
      args.push(body.image);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    args.push(params.id);

    await db.execute({
      sql: `UPDATE Device SET ${updates.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args,
    });

    const result = await db.execute({
      sql: `SELECT * FROM Device WHERE id = ?`,
      args: [params.id],
    });

    const device = result.rows[0];
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: device.id,
      name: device.name,
      price: Number(device.price),
      specs: device.specs,
      image: device.image,
    });
  } catch (error) {
    console.error("Device update error:", error);
    return NextResponse.json({ error: "Failed to update device" }, { status: 500 });
  }
}

// DELETE /api/devices/[id] — remove a device (admin only, JWT auth)
// Device can be deleted even if orders exist (deviceId set to NULL in orders)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if device exists first
    const checkResult = await db.execute({
      sql: `SELECT id FROM Device WHERE id = ?`,
      args: [params.id],
    });

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    await db.execute({ sql: `DELETE FROM Device WHERE id = ?`, args: [params.id] });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Device delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete device. It may have existing references." },
      { status: 500 }
    );
  }
}
