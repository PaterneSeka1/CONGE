export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/leave-requests";

export async function GET(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId } = authRes.auth;

  const leaves = await prisma.leaveRequest.findMany({
    where: { employeeId: actorId },
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      reason: true,
      status: true,
      currentAssigneeId: true,
      currentAssignee: { select: { firstName: true, lastName: true } },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leaves });
}
