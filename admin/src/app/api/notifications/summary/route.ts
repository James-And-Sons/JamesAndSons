import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        tickets: 0,
        inquiries: 0,
        orders: 0,
        rfqs: 0,
        total: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get("since");
    const sinceDate = sinceParam
      ? new Date(sinceParam)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // default last 24h

    // Get count of open/in progress support tickets
    const tickets = await prisma.ticket.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        createdAt: { gte: sinceDate },
      },
    });

    // Get count of new contact inquiries
    const inquiries = await prisma.inquiry.count({
      where: {
        status: "NEW",
        createdAt: { gte: sinceDate },
      },
    });

    // Get count of pending orders
    const orders = await prisma.order.count({
      where: {
        status: "PENDING",
        createdAt: { gte: sinceDate },
      },
    });

    // Get count of pending RFQs
    const rfqs = await prisma.rFQ.count({
      where: {
        status: "SUBMITTED",
        createdAt: { gte: sinceDate },
      },
    });

    return NextResponse.json({
      tickets,
      inquiries,
      orders,
      rfqs,
      total: tickets + inquiries + orders + rfqs,
    });
  } catch (error: any) {
    console.error("Error fetching notification summary:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
