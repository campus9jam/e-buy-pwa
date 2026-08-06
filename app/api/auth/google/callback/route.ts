import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken, verifyPassword } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/auth/google/callback — handles Google OAuth callback
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=google_no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/auth?error=google_not_configured`);
  }

  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(`${origin}/auth?error=google_token_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(`${origin}/auth?error=google_userinfo_failed`);
    }

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    if (!email) {
      return NextResponse.redirect(`${origin}/auth?error=google_no_email`);
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
      const SUPER_ADMIN_EMAIL = "easybuy20000@gmail.com";
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL) {
        // Auto-create the admin account if it doesn't exist yet
        adminId = "super-admin";
        adminRole = "super-admin";
        adminEmail = email;

        // Try to insert (if already exists, update)
        try {
          const hash = await bcrypt.hash("google-oauth-managed", 10);
          await db.execute({
            sql: `INSERT OR REPLACE INTO Admin (id, email, passwordHash, role) VALUES (?, ?, ?, ?)`,
            args: [adminId, adminEmail, hash, adminRole],
          });
        } catch {
          // If insert fails, try update
          await db.execute({
            sql: `UPDATE Admin SET email = ?, role = ? WHERE id = ?`,
            args: [adminEmail, adminRole, adminId],
          });
        }
      } else {
        // Not an authorized admin
        return NextResponse.redirect(
          `${origin}/auth?error=google_unauthorized&email=${encodeURIComponent(email)}`
        );
      }
    }

    // Create JWT token (same as password login)
    const token = await createToken({
      id: adminId,
      email: adminEmail,
      role: adminRole,
    });

    // Set cookie and redirect to admin
    const response = NextResponse.redirect(`${origin}/admin`);
    response.cookies.set("ebuy_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/auth?error=google_callback_error`);
  }
}
