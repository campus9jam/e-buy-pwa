import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// POST /api/auth/google/verify — verifies Firebase ID token and creates admin session
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "No ID token provided" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google Auth not configured" }, { status: 500 });
    }

    // Verify the Firebase ID token using Firebase REST API
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const verifyData = await verifyResponse.json();

    if (!verifyData.users || verifyData.users.length === 0) {
      return NextResponse.json({ error: "No user found for token" }, { status: 401 });
    }

    const googleUser = verifyData.users[0];
    const email = googleUser.email;
    const emailVerified = googleUser.emailVerified;

    if (!email || !emailVerified) {
      return NextResponse.json({ error: "Email not verified by Google" }, { status: 401 });
    }

    // Check if this email is an authorized admin
    const adminResult = await db.execute({
      sql: `SELECT * FROM Admin WHERE LOWER(email) = LOWER(?)`,
      args: [email],
    });

    let adminId: string;
    let adminRole: string;
    let adminEmail: string;

    if (adminResult.rows.length > 0) {
      // Admin exists in database
      const admin = adminResult.rows[0];
      adminId = admin.id as string;
      adminRole = admin.role as string;
      adminEmail = admin.email as string;
    } else {
      // Check if this is the authorized super admin email
      if (email.toLowerCase() === "easybuy20000@gmail.com") {
        // Auto-create the admin account
        adminId = "super-admin";
        adminRole = "super-admin";
        adminEmail = email;

        try {
          const hash = await bcrypt.hash("google-oauth-managed", 10);
          await db.execute({
            sql: `INSERT OR REPLACE INTO Admin (id, email, passwordHash, role) VALUES (?, ?, ?, ?)`,
            args: [adminId, adminEmail, hash, adminRole],
          });
        } catch {
          await db.execute({
            sql: `UPDATE Admin SET email = ?, role = ? WHERE id = ?`,
            args: [adminEmail, adminRole, adminId],
          });
        }
      } else {
        return NextResponse.json(
          { error: `Google account "${email}" is not authorized as an admin. Use Easybuy20000@gmail.com.` },
          { status: 403 }
        );
      }
    }

    // Create JWT token (same as password login)
    const token = await createToken({
      id: adminId,
      email: adminEmail,
      role: adminRole,
    });

    const response = NextResponse.json({
      id: adminId,
      email: adminEmail,
      role: adminRole,
    });

    response.cookies.set("ebuy_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google verify error:", error);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 500 });
  }
}
