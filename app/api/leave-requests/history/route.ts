// app/api/leave-requests/history/route.ts  (ou ton chemin exact)
// ✅ FICHIER COMPLET (identique à ce que tu as envoyé)

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
  const isManager = role === "DEPT_HEAD" || role === "SERVICE_HEAD";
  const forceMineOnly = isManager;

  if (mine || forceMineOnly) {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: actorId,
        status: { in: ["APPROVED", "REJECTED", "CANCELLED"] },
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        decisions: {
          where: { type: { in: ["APPROVE", "REJECT", "CANCEL"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, type: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaves });
  }

  if (scope === "actor") {
    const decisions = await prisma.leaveDecision.findMany({
      where: {
        actorId,
        type: { in: ["APPROVE", "REJECT", "ESCALATE", "CANCEL"] },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        toEmployeeId: true,
        toEmployee: { select: { id: true, firstName: true, lastName: true, role: true } },
        leaveRequest: {
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            employee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ decisions });
  }

  if (scope === "all-decisions") {
    if (role !== "CEO") return NextResponse.json({ decisions: [] });

    const decisions = await prisma.leaveDecision.findMany({
      where: {
        type: { in: ["APPROVE", "REJECT", "ESCALATE", "CANCEL"] },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        actor: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ decisions });
  }

  if (scope === "all") {
    if (role !== "CEO") return NextResponse.json({ leaves: [] });

    const leaves = await prisma.leaveRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED", "CANCELLED"] } },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        employee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true, role: true } },
        decisions: {
          where: { type: { in: ["APPROVE", "REJECT", "CANCEL"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            createdAt: true,
            type: true,
            actorId: true,
            actor: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaves });
  }

  return NextResponse.json({ leaves: [] });
}
