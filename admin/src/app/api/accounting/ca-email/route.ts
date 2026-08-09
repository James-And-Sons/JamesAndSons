import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "ca_email" },
    });
    const caEmail = (config?.value as any)?.email || "";
    return NextResponse.json({ caEmail });
  } catch (error: any) {
    return NextResponse.json({ caEmail: "" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { caEmail } = await req.json();
    if (!caEmail || !caEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    await prisma.systemConfig.upsert({
      where: { key: "ca_email" },
      update: { value: { email: caEmail.trim().toLowerCase() } },
      create: {
        key: "ca_email",
        value: { email: caEmail.trim().toLowerCase() },
      },
    });

    return NextResponse.json({
      success: true,
      caEmail: caEmail.trim().toLowerCase(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
