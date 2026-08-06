import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getTokenFromRequest(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}
