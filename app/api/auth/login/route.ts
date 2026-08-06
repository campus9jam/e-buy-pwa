import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Look up admin by email (case-insensitive)
    const result = await db.execute({
      sql: `SELECT * FROM Admin WHERE LOWER(email) = LOWER(?)`,
      args: [email],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const admin = result.rows[0];
    const valid = await verifyPassword(password, admin.passwordHash as string);

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createToken({
      id: admin.id as string,
      email: admin.email as string,
      role: admin.role as string,
    });

    const response = NextResponse.json({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    response.cookies.set("ebuy_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
