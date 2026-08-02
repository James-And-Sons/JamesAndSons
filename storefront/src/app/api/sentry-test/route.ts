import { NextResponse } from "next/server";

export function GET() {
  throw new Error("Sentry Integration Verification Test Error");
  return NextResponse.json({ status: "Error triggered" });
}
