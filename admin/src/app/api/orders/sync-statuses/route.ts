import { NextResponse } from "next/server";
import { syncShiprocketStatusesAction } from "@/app/orders/actions";

export async function GET() {
  try {
    const res = await syncShiprocketStatusesAction();
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to sync statuses" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const res = await syncShiprocketStatusesAction();
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to sync statuses" },
      { status: 500 },
    );
  }
}
