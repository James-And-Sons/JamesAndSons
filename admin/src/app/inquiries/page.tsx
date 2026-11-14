import { prisma } from "@/lib/prisma";
import InquiriesTableClient from "./InquiriesTableClient";

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <InquiriesTableClient inquiries={inquiries} />;
}
