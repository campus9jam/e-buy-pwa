import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/devices/[id] — remove a device (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminSecret = request.headers.get("x-admin-secret");
    if (adminSecret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.device.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete device" }, { status: 500 });
  }
}
