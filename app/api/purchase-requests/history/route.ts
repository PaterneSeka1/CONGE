export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/leave-requests";

export async function GET(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;

  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";
  const scope = url.searchParams.get("scope");

  if (mine) {
    const requests = await prisma.purchaseRequest.findMany({
      where: { employeeId: actorId },
      select: {
        id: true,
        name: true,
        amount: true,
        date: true,
        status: true,
        createdAt: true,
        items: { select: { id: true, name: true, amount: true } },
        decisions: {
          where: { type: { in: ["APPROVE", "REJECT"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, type: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  }

  if (scope === "actor") {
    const decisions = await prisma.purchaseDecision.findMany({
      where: { actorId, type: { in: ["APPROVE", "REJECT", "ESCALATE"] } },
      select: {
        id: true,
        type: true,
        createdAt: true,
        toEmployeeId: true,
        toEmployee: { select: { id: true, firstName: true, lastName: true, role: true } },
        purchaseRequest: {
          select: {
            id: true,
            name: true,
            amount: true,
            date: true,
            items: { select: { id: true, name: true, amount: true } },
            employee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ decisions });
  }

  if (scope === "all") {
    if (role !== "CEO") return NextResponse.json({ decisions: [] });

    const decisions = await prisma.purchaseDecision.findMany({
      where: { type: { in: ["APPROVE", "REJECT", "ESCALATE"] } },
      select: {
        id: true,
        type: true,
        createdAt: true,
        toEmployeeId: true,
        toEmployee: { select: { id: true, firstName: true, lastName: true, role: true } },
        actor: { select: { id: true, firstName: true, lastName: true, role: true } },
        purchaseRequest: {
          select: {
            id: true,
            name: true,
            amount: true,
            date: true,
            items: { select: { id: true, name: true, amount: true } },
            employee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ decisions });
  }

  return NextResponse.json({ requests: [] });
}
