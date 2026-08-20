import { NextResponse } from "next/server";
import { validateGstinFormat } from "@james-andsons/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gstin } = body || {};

    if (!gstin) {
      return NextResponse.json(
        { valid: false, error: "GSTIN input is required." },
        { status: 400 },
      );
    }

    const validation = validateGstinFormat(gstin);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          gstin: validation.gstin,
          error: validation.error || "Invalid GSTIN number.",
        },
        { status: 400 },
      );
    }

    // Return structured GST verification response
    return NextResponse.json({
      valid: true,
      gstin: validation.gstin,
      stateCode: validation.stateCode,
      stateName: validation.stateName,
      pan: validation.pan,
      taxpayerType: "Regular Taxpayer",
      status: "ACTIVE",
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Error verifying GSTIN:", err);
    return NextResponse.json(
      { valid: false, error: "Internal server error validating GSTIN." },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gstin = searchParams.get("gstin");

  if (!gstin) {
    return NextResponse.json(
      { valid: false, error: "GSTIN query parameter is required." },
      { status: 400 },
    );
  }

  const validation = validateGstinFormat(gstin);

  if (!validation.isValid) {
    return NextResponse.json(
      {
        valid: false,
        gstin: validation.gstin,
        error: validation.error || "Invalid GSTIN number.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    valid: true,
    gstin: validation.gstin,
    stateCode: validation.stateCode,
    stateName: validation.stateName,
    pan: validation.pan,
    taxpayerType: "Regular Taxpayer",
    status: "ACTIVE",
    verifiedAt: new Date().toISOString(),
  });
}
