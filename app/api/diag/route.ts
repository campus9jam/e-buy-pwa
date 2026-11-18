import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY DIAGNOSTIC — admin only.
 * Reports the live table shape and dry-runs the order insert (row is removed
 * again) so we can see the real database error behind a failed checkout.
 */
export async function GET(request: Request) {
  const user = await getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureSchema();

  const out: Record<string, unknown> = {};

  try {
    const orderCols = await db.execute(`PRAGMA table_info("Order")`);
    out.orderColumns = orderCols.rows.map((r) => ({
      name: r.name, type: r.type, notnull: r.notnull, dflt: r.dflt_value, pk: r.pk,
    }));
    const ddl = await db.execute(
      `SELECT type, name, sql FROM sqlite_master WHERE tbl_name = 'Order'`
    );
    out.orderDdl = ddl.rows;
  } catch (e) {
    out.schemaError = String(e);
  }

  const insert = async (id: string, proof: string | null) => {
    await db.execute({
      sql: `INSERT INTO "Order" (id, deviceId, customerName, phone, nin, address, downPayment, vat, amountPaid, devicePrice, deviceName, deviceSpecs, deviceImage, guarantors, paymentProof, status, paymentAccountId, paymentBankName, paymentAccountNumber, paymentAccountName)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      args: [
        id, "diag-device", "DIAG TEST", "08000000000", null, null,
        240000, 10000, 300000, 780000, "DIAG", "", null,
        JSON.stringify([{ name: "a", phone: "b", address: "c" }]),
        proof, null, null, null, null,
      ],
    });
  };

  // 1) small payload
  try {
    await insert("diag-small", "data:image/png;base64,AAAA");
    out.smallInsert = "ok";
  } catch (e) {
    out.smallInsert = String(e);
  } finally {
    await db.execute({ sql: `DELETE FROM "Order" WHERE id = ?`, args: ["diag-small"] }).catch(() => {});
  }

  // 2) payload the size of a phone photo (~2 MB base64)
  try {
    await insert("diag-large", "data:image/jpeg;base64," + "A".repeat(2 * 1024 * 1024));
    out.largeInsert = "ok";
  } catch (e) {
    out.largeInsert = String(e);
  } finally {
    await db.execute({ sql: `DELETE FROM "Order" WHERE id = ?`, args: ["diag-large"] }).catch(() => {});
  }

  // 3) clean up an end-to-end test order created through the real checkout
  const url = new URL(request.url);
  const cleanupId = url.searchParams.get("cleanup");
  if (cleanupId) {
    const del = await db.execute({
      sql: `DELETE FROM "Order" WHERE id = ? AND customerName = 'DIAG TEST'`,
      args: [cleanupId],
    });
    out.deleted = del.rowsAffected;
  }

  return NextResponse.json(out);
}
