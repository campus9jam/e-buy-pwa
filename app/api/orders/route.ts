import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";
import { GUARANTOR_COUNT, computePricing } from "@/lib/pricing";

export const dynamic = "force-dynamic";

interface Guarantor {
  name: string;
  phone: string;
  address: string;
}

function normalizeGuarantors(input: unknown): Guarantor[] | null {
  if (!Array.isArray(input) || input.length !== GUARANTOR_COUNT) return null;

  const cleaned = input.map((raw) => {
    const g = (raw || {}) as Record<string, unknown>;
    return {
      name: String(g.name ?? "").trim(),
      phone: String(g.phone ?? "").trim(),
      address: String(g.address ?? "").trim(),
    };
  });

  const complete = cleaned.every((g) => g.name && g.phone && g.address);
  return complete ? cleaned : null;
}

// POST /api/orders — create a new order
export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();

    const guarantors = normalizeGuarantors(body.guarantors);
    if (!guarantors) {
      return NextResponse.json(
        {
          error: `You must provide ${GUARANTOR_COUNT} guarantors with a full name, phone number and address.`,
        },
        { status: 400 }
      );
    }

    const id = `order-${Date.now()}`;

    const deviceResult = await db.execute({
      sql: `SELECT * FROM Device WHERE id = ?`,
      args: [body.deviceId],
    });
    const device = deviceResult.rows[0];

    // Pricing is always recomputed server-side from the device price and category.
    const devicePrice = Number(device?.price || body.devicePrice || 0);
    const { downPayment, vat, dueNow } = computePricing(devicePrice, device?.category ?? body.category);

    const deviceName = device?.name || body.deviceName || "Unknown Device";
    const deviceSpecs = device?.specs || body.deviceSpecs || "";
    const deviceImage = device?.image || body.deviceImage || null;

    // Payment account snapshot — whichever account was shown to the customer at checkout
    const paymentAccountId = body.paymentAccountId || null;
    const paymentBankName = body.paymentBankName || null;
    const paymentAccountNumber = body.paymentAccountNumber || null;
    const paymentAccountName = body.paymentAccountName || null;

    await db.execute({
      sql: `INSERT INTO "Order" (id, deviceId, customerName, phone, nin, address, downPayment, vat, amountPaid, devicePrice, deviceName, deviceSpecs, deviceImage, guarantors, paymentProof, status, paymentAccountId, paymentBankName, paymentAccountNumber, paymentAccountName)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      args: [
        id,
        body.deviceId,
        body.customerName,
        body.phone,
        body.nin || null,
        body.address || null,
        downPayment,
        vat,
        dueNow,
        devicePrice,
        deviceName,
        deviceSpecs,
        deviceImage,
        JSON.stringify(guarantors),
        body.paymentProof || null,
        paymentAccountId,
        paymentBankName,
        paymentAccountNumber,
        paymentAccountName,
      ],
    });

    return NextResponse.json(
      {
        id,
        ...body,
        guarantors,
        downPayment,
        vat,
        amountPaid: dueNow,
        devicePrice,
        deviceName,
        deviceSpecs,
        deviceImage,
        status: "pending",
      },
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

function parseGuarantors(value: unknown): Guarantor[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// GET /api/orders — list all orders with full KYC (admin only, JWT auth)
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

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
      nin: row.nin,
      address: row.address,
      guarantors: parseGuarantors(row.guarantors),
      downPayment: Number(row.downPayment || 0),
      vat: Number(row.vat || 0),
      amountPaid: Number(row.amountPaid || 0),
      paymentProof: row.paymentProof,
      status: row.status,
      createdAt: row.createdAt,
      paymentBankName: row.paymentBankName,
      paymentAccountNumber: row.paymentAccountNumber,
      paymentAccountName: row.paymentAccountName,
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
