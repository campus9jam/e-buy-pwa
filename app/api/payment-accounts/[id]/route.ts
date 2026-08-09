import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/payment-accounts/[id] — update or toggle active state (admin only)
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
    const updates: string[] = [];
    const args: any[] = [];

    if (body.bankName !== undefined) { updates.push("bankName = ?"); args.push(body.bankName); }
    if (body.accountNumber !== undefined) { updates.push("accountNumber = ?"); args.push(body.accountNumber); }
    if (body.accountName !== undefined) { updates.push("accountName = ?"); args.push(body.accountName); }
    if (body.isActive !== undefined) { updates.push("isActive = ?"); args.push(body.isActive ? 1 : 0); }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    args.push(params.id);
    await db.execute({
      sql: `UPDATE PaymentAccount SET ${updates.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args,
    });

    const result = await db.execute({ sql: `SELECT * FROM PaymentAccount WHERE id = ?`, args: [params.id] });
    const account = result.rows[0];
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: account.id,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      isActive: Number(account.isActive) === 1,
    });
  } catch (error) {
    console.error("Payment account update error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

// DELETE /api/payment-accounts/[id] — remove an account (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear rotation pointer if it references this account, so rotation doesn't break
    await db.execute({
      sql: `UPDATE PaymentRotation SET lastAccountId = NULL WHERE lastAccountId = ?`,
      args: [params.id],
    });

    await db.execute({ sql: `DELETE FROM PaymentAccount WHERE id = ?`, args: [params.id] });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment account delete error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
