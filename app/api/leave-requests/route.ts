export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { parseDate, requireAuth, findActiveEmployeeByRole } from "@/lib/leave-requests";
import { norm } from "@/lib/validators";

export async function POST(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role, departmentId } = authRes.auth;

  if (role === "CEO") {
    return jsonError("Le CEO ne peut pas créer de demande", 403);
  }

  const body = await req.json().catch(() => ({}));
  const type = norm(body?.type);
  const reason = norm(body?.reason) || null;
  const startDate = parseDate(body?.startDate);
  const endDate = parseDate(body?.endDate);

  if (!type || !startDate || !endDate) {
    return jsonError("Champs requis: type, startDate, endDate", 400);
  }

  if (startDate > endDate) {
    return jsonError("startDate doit être avant endDate", 400);
  }

  const blackouts = await prisma.leaveBlackout.findMany({
    where: {
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      OR: [{ departmentId: null }, departmentId ? { departmentId } : { departmentId: null }],
    },
    select: { id: true },
  });
  if (blackouts.length > 0) {
    return jsonError("Période bloquée par la direction", 409);
  }

  let assignee = null;
  let autoCeo = null;
  let reachedCeoAt: Date | null = null;
  if (role === "EMPLOYEE") {
    assignee = await findActiveEmployeeByRole("ACCOUNTANT");
  } else if (role === "DEPT_HEAD") {
    assignee = await findActiveEmployeeByRole("ACCOUNTANT");
    autoCeo = await findActiveEmployeeByRole("CEO");
    if (autoCeo) reachedCeoAt = new Date();
  } else if (role === "ACCOUNTANT") {
    assignee = await findActiveEmployeeByRole("CEO");
  }

  if (!assignee) {
    return jsonError("Aucun assignataire actif disponible", 409);
  }

  const created = await prisma.leaveRequest.create({
    data: {
      employeeId: actorId,
      type,
      startDate,
      endDate,
      reason,
      status: "PENDING",
      currentAssigneeId: assignee.id,
      deptHeadAssignedAt: assignee.role === "DEPT_HEAD" ? new Date() : null,
      reachedCeoAt: assignee.role === "CEO" ? new Date() : reachedCeoAt,
    },
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      status: true,
      currentAssigneeId: true,
      createdAt: true,
    },
  });

  await prisma.leaveDecision.create({
    data: {
      leaveRequestId: created.id,
      actorId,
      type: "SUBMIT",
    },
  });

  if (autoCeo) {
    await prisma.leaveDecision.create({
      data: {
        leaveRequestId: created.id,
        actorId,
        type: "ESCALATE",
        toEmployeeId: autoCeo.id,
        comment: "Auto-escalation CEO (DEPT_HEAD).",
      },
    });
  }

  return NextResponse.json({ leave: created }, { status: 201 });
}
