import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  id: "singleton",
  agentWhatsApp: "+2348012345678",
};

// GET /api/settings — fetch general settings (agent WhatsApp number).
// Bank accounts now live in /api/payment-accounts (supports multiple, rotating accounts).
export async function GET() {
  try {
    const result = await db.execute(`SELECT * FROM PaymentSettings WHERE id = 'singleton'`);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return NextResponse.json({
        id: row.id,
        agentWhatsApp: row.agentWhatsApp,
      });
    }
    return NextResponse.json(DEFAULT_SETTINGS);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

// PUT /api/settings — update agent WhatsApp number (admin only, JWT auth)
export async function PUT(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.agentWhatsApp) {
      return NextResponse.json({ error: "agentWhatsApp is required" }, { status: 400 });
    }

    // Keep bankName/accountNumber/accountName columns populated for backward compatibility
    // (unused by new checkout flow, which uses PaymentAccount rotation instead).
    await db.execute({
      sql: `INSERT INTO PaymentSettings (id, bankName, accountNumber, accountName, agentWhatsApp)
            VALUES ('singleton', COALESCE((SELECT bankName FROM PaymentSettings WHERE id = 'singleton'), ''),
                    COALESCE((SELECT accountNumber FROM PaymentSettings WHERE id = 'singleton'), ''),
                    COALESCE((SELECT accountName FROM PaymentSettings WHERE id = 'singleton'), ''), ?)
            ON CONFLICT(id) DO UPDATE SET
              agentWhatsApp = excluded.agentWhatsApp,
              updatedAt = CURRENT_TIMESTAMP`,
      args: [body.agentWhatsApp],
    });

    return NextResponse.json({
      id: "singleton",
      agentWhatsApp: body.agentWhatsApp,
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
