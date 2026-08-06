import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// DELETE /api/devices/[id] — remove a device (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminSecret = request.headers.get("x-admin-secret");
    if (process.env.ADMIN_SECRET && adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.execute({ sql: `DELETE FROM Device WHERE id = ?`, args: [params.id] });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete device" }, { status: 500 });
  }
}
