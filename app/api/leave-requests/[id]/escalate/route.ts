export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { requireAuth, isFinalStatus, findActiveEmployeeByRole } from "@/lib/leave-requests";

type Ctx = { params: { id: string } };

export async function POST(req: Request, ctx: Ctx) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;
  const { id } = await ctx.params;

  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    select: {
      id: true,
      employeeId: true,
      status: true,
      currentAssigneeId: true,
      employee: { select: { departmentId: true } },
    },
  });

  if (!leave) return jsonError("Demande introuvable", 404);
  if (isFinalStatus(leave.status)) return jsonError("Demande dÃ©jÃ  traitÃ©e", 409);
  if (leave.currentAssigneeId !== actorId) return jsonError("AccÃ¨s refusÃ©", 403);
  if (leave.employeeId === actorId) return jsonError("Action interdite sur sa propre demande", 403);

  const body = await req.json().catch(() => ({}));
  const comment = body?.comment ?? null;
  const toRole = body?.toRole as string | undefined;

  let target = null;

  if (role === "ACCOUNTANT") {
    if (toRole !== "DEPT_HEAD" && toRole !== "CEO") {
      return jsonError("toRole requis (DEPT_HEAD|CEO)", 400);
    }
    if (toRole === "DEPT_HEAD") {
      target = await findActiveEmployeeByRole("DEPT_HEAD", leave.employee?.departmentId ?? null);
    } else {
      target = await findActiveEmployeeByRole("CEO");
    }
  } else if (role === "DEPT_HEAD") {
    if (toRole && toRole !== "CEO") {
      return jsonError("toRole invalide (CEO uniquement)", 400);
    }
    target = await findActiveEmployeeByRole("CEO");
  } else {
    return jsonError("AccÃ¨s refusÃ©", 403);
  }

  if (!target) {
    return jsonError("Aucun assignataire actif disponible", 409);
  }
  if (target.id === actorId) {
    return jsonError("Action interdite sur sa propre demande", 403);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedLeave = await tx.leaveRequest.update({
      where: { id },
      data: {
        status: "PENDING",
        currentAssigneeId: target.id,
        deptHeadAssignedAt: target.role === "DEPT_HEAD" ? new Date() : null,
        reachedCeoAt: target.role === "CEO" ? new Date() : null,
      },
      select: { id: true, status: true, currentAssigneeId: true },
    });

    await tx.leaveDecision.create({
      data: {
        leaveRequestId: id,
        actorId,
        type: "ESCALATE",
        comment,
        toEmployeeId: target.id,
      },
    });

    return updatedLeave;
  });

  return NextResponse.json({ leave: updated });
}
