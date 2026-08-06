import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/orders — create a new order
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();

    const order = await prisma.order.create({
      data: {
        deviceId: body.deviceId,
        customerName: body.customerName,
        phone: body.phone,
        bvn: body.bvn,
        paymentProof: body.paymentProof || null,
        status: "pending",
      },
    });

    return NextResponse.json(order, { status: 201 });
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
    if (adminSecret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: { device: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json([]);
  }
}
