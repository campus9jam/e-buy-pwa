import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/payment-accounts — list all accounts (admin only)
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.execute(`SELECT * FROM PaymentAccount ORDER BY createdAt ASC`);
    const accounts = result.rows.map((row) => ({
      id: row.id,
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      accountName: row.accountName,
      isActive: Number(row.isActive) === 1,
      createdAt: row.createdAt,
    }));
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Payment accounts fetch error:", error);
    return NextResponse.json([]);
  }
}

// POST /api/payment-accounts — add a new account (admin only)
export async function POST(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.bankName || !body.accountNumber || !body.accountName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = `acct-${Date.now()}`;
    await db.execute({
      sql: `INSERT INTO PaymentAccount (id, bankName, accountNumber, accountName, isActive) VALUES (?, ?, ?, ?, 1)`,
      args: [id, body.bankName, body.accountNumber, body.accountName],
    });

    const result = await db.execute({ sql: `SELECT * FROM PaymentAccount WHERE id = ?`, args: [id] });
    const account = result.rows[0];

    return NextResponse.json(
      {
        id: account.id,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        isActive: Number(account.isActive) === 1,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment account creation error:", error);
    return NextResponse.json({ error: "Failed to add account" }, { status: 500 });
  }
}
