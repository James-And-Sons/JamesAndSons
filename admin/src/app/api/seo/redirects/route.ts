import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin("seo");
    const redirects = await prisma.seoRedirect.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ redirects });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("seo");
    const body = await request.json();
    const {
      sourceUrl,
      targetUrl,
      statusCode = 301,
      isCanonical = false,
      productId,
    } = body;

    if (!sourceUrl || !targetUrl) {
      return NextResponse.json(
        { error: "sourceUrl and targetUrl required" },
        { status: 400 },
      );
    }

    const redirectRule = await prisma.seoRedirect.upsert({
      where: { sourceUrl },
      create: {
        sourceUrl,
        targetUrl,
        statusCode,
        isCanonical,
        productId,
      },
      update: {
        targetUrl,
        statusCode,
        isCanonical,
        productId,
      },
    });

    return NextResponse.json({ success: true, redirectRule });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save redirect" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin("seo");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await prisma.seoRedirect.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete redirect" },
      { status: 500 },
    );
  }
}
