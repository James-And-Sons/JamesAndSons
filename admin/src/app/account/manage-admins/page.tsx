import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ManageAdminsClient from "./ManageAdminsClient";

import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ManageAdminsPage() {
  await requireAdmin("manage_admins");

  let admins: any[] = [];
  try {
    admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "B2B_APPROVER"] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err: any) {
    if (err.code === "P2022" || err.message?.includes("permissions")) {
      admins = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "B2B_APPROVER"] },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      admins = admins.map((a) => ({ ...a, permissions: [] }));
    } else {
      throw err;
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <Link
            href="/account"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-accent mb-4 inline-block transition-colors"
          >
            ← Back to Account Settings
          </Link>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
            Administrator Management
          </h1>
          <p className="font-mono text-[11px] text-muted mt-2 tracking-widest uppercase">
            {admins.length} Staff Members
          </p>
        </div>
      </div>

      {/* Renders the add form and the list of admins */}
      <ManageAdminsClient admins={admins} />
    </div>
  );
}
