import { NextResponse } from "next/server";
import { prisma } from "@james-andsons/db";

export async function GET() {
  try {
    const attributes = await prisma.attributeDefinition.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(attributes);
  } catch (error) {
    console.error("Error fetching attribute definitions:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, key, type, options, isRequired } = body;

    const attributeKey = (key || slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_");

    if (!name || !attributeKey) {
      return NextResponse.json(
        { error: "Name and key are required" },
        { status: 400 },
      );
    }

    const attribute = await prisma.attributeDefinition.create({
      data: {
        name,
        key: attributeKey,
        type: type || "STRING",
        options: Array.isArray(options) ? options : [],
        isRequired: !!isRequired,
      },
    });

    return NextResponse.json(attribute, { status: 201 });
  } catch (error: any) {
    console.error("Error creating attribute definition:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create attribute definition" },
      { status: 500 },
    );
  }
}
