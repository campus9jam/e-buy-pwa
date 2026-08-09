import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/checkout-account — picks the next active payment account via round-robin
// rotation to spread transactions across accounts and avoid payment confusion.
// Public endpoint — called when a customer lands on checkout.
export async function GET() {
  try {
    const activeResult = await db.execute(
      `SELECT * FROM PaymentAccount WHERE isActive = 1 ORDER BY createdAt ASC`
    );
    const activeAccounts = activeResult.rows;

    if (activeAccounts.length === 0) {
      return NextResponse.json({ error: "No active payment account configured" }, { status: 404 });
    }

    // Get rotation pointer
    const rotationResult = await db.execute(
      `SELECT * FROM PaymentRotation WHERE id = 'singleton'`
    );
    const lastAccountId = rotationResult.rows[0]?.lastAccountId as string | undefined;

    // Find index of last used account among current active accounts, pick the next one
    let nextIndex = 0;
    if (lastAccountId) {
      const lastIdx = activeAccounts.findIndex((a) => a.id === lastAccountId);
      nextIndex = lastIdx >= 0 ? (lastIdx + 1) % activeAccounts.length : 0;
    }

    const chosen = activeAccounts[nextIndex];

    // Persist rotation pointer
    await db.execute({
      sql: `INSERT INTO PaymentRotation (id, lastAccountId) VALUES ('singleton', ?)
            ON CONFLICT(id) DO UPDATE SET lastAccountId = excluded.lastAccountId, updatedAt = CURRENT_TIMESTAMP`,
      args: [chosen.id],
    });

    return NextResponse.json({
      id: chosen.id,
      bankName: chosen.bankName,
      accountNumber: chosen.accountNumber,
      accountName: chosen.accountName,
    });
  } catch (error) {
    console.error("Checkout account rotation error:", error);
    return NextResponse.json({ error: "Failed to fetch payment account" }, { status: 500 });
  }
}
