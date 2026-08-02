import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";

export const GET = withErrorHandler(async () => {
  const count = await prisma.rFQ.count({
    where: {
      status: { in: ["SUBMITTED", "REVIEWING"] },
    },
  });
  return NextResponse.json({ count });
});
