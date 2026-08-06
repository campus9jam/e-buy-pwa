import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_SETTINGS = {
  id: "singleton",
  bankName: "Wema Bank",
  accountNumber: "9876543210",
  accountName: "E-Buy Global Collections / Monnify",
  agentWhatsApp: "+2348012345678",
};

// GET /api/settings — fetch active payment settings
export async function GET() {
  try {
    const result = await db.execute(`SELECT * FROM PaymentSettings WHERE id = 'singleton'`);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return NextResponse.json({
        id: row.id,
        bankName: row.bankName,
        accountNumber: row.accountNumber,
        accountName: row.accountName,
        agentWhatsApp: row.agentWhatsApp,
      });
    }
    return NextResponse.json(DEFAULT_SETTINGS);
  } catch (error) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

// PUT /api/settings — update payment settings (admin only)
export async function PUT(request: Request) {
  try {
    const adminSecret = request.headers.get("x-admin-secret");
    if (process.env.ADMIN_SECRET && adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Upsert: try insert first, if conflict update
    await db.execute({
      sql: `INSERT INTO PaymentSettings (id, bankName, accountNumber, accountName, agentWhatsApp)
            VALUES ('singleton', ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              bankName = excluded.bankName,
              accountNumber = excluded.accountNumber,
              accountName = excluded.accountName,
              agentWhatsApp = excluded.agentWhatsApp,
              updatedAt = CURRENT_TIMESTAMP`,
      args: [body.bankName, body.accountNumber, body.accountName, body.agentWhatsApp],
    });

    return NextResponse.json({
      id: "singleton",
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      agentWhatsApp: body.agentWhatsApp,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
