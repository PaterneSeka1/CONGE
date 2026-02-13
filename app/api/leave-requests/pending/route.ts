export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, autoApproveOverdueForDeptHead } from "@/lib/leave-requests";

function getDeptHeadDelayDays() {
  const raw = process.env.DEPT_HEAD_VALIDATION_DAYS;
  const parsed = raw ? Number(raw) : 5;
  return Number.isFinite(parsed) ? parsed : 5;
}

export async function GET(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;

  if (role === "DEPT_HEAD" || role === "SERVICE_HEAD") {
    await autoApproveOverdueForDeptHead(actorId, getDeptHeadDelayDays());
  }

  const where =
    role === "CEO"
      ? {
          status: { in: ["SUBMITTED", "PENDING"] as any },
          OR: [{ currentAssigneeId: actorId }, { reachedCeoAt: { not: null } }],
        }
      : {
          currentAssigneeId: actorId,
          status: { in: ["SUBMITTED", "PENDING"] as any },
        };

  const leaves = await prisma.leaveRequest.findMany({
    where,
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      reason: true,
      status: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          role: true,
          departmentId: true,
          department: { select: { type: true, name: true } },
        },
      },
      currentAssigneeId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leaves });
}
