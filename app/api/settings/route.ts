import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const settings = await prisma.paymentSettings.findUnique({
      where: { id: "singleton" },
    });
    return NextResponse.json(settings || DEFAULT_SETTINGS);
  } catch (error) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

// PUT /api/settings — update payment settings (admin only)
export async function PUT(request: Request) {
  try {
    const adminSecret = request.headers.get("x-admin-secret");
    if (adminSecret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const settings = await prisma.paymentSettings.upsert({
      where: { id: "singleton" },
      update: {
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountName: body.accountName,
        agentWhatsApp: body.agentWhatsApp,
      },
      create: {
        id: "singleton",
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountName: body.accountName,
        agentWhatsApp: body.agentWhatsApp,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
