import { NextRequest, NextResponse } from "next/server";
import { getShiprocketToken } from "@/lib/shiprocket";

/**
 * GET /api/orders/track?awb=<awbNumber>
 * Fetches real-time tracking data from Shiprocket for a given AWB.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const awb = searchParams.get("awb");

  if (!awb) {
    return NextResponse.json(
      { success: false, error: "AWB number required" },
      { status: 400 },
    );
  }

  try {
    const token = await getShiprocketToken();
    if (!token) throw new Error("Shiprocket authentication failed");

    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awb)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, error: `Shiprocket returned ${res.status}: ${text}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    const trackingData = data?.tracking_data;

    if (!trackingData) {
      return NextResponse.json({
        success: false,
        error: "No tracking data returned",
      });
    }

    return NextResponse.json({ success: true, data: trackingData });
  } catch (err: any) {
    console.error("[Track API]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
