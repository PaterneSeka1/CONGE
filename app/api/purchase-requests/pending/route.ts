export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/leave-requests";

export async function GET(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;

  const where =
    role === "CEO"
      ? {
          status: "PENDING" as any,
          OR: [{ currentAssigneeId: actorId }, { reachedCeoAt: { not: null } }],
        }
      : role === "ACCOUNTANT"
        ? { currentAssigneeId: actorId, status: "PENDING" as any }
        : null;

  if (!where) return NextResponse.json({ requests: [] });

  const requests = await prisma.purchaseRequest.findMany({
    where,
    select: {
      id: true,
      name: true,
      amount: true,
      date: true,
      status: true,
      createdAt: true,
      items: { select: { id: true, name: true, amount: true } },
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          department: { select: { type: true, name: true } },
        },
      },
      currentAssigneeId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
