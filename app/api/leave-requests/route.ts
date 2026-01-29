export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { parseDate, requireAuth, findActiveEmployeeByRole } from "@/lib/leave-requests";
import { norm } from "@/lib/validators";

export async function POST(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;

  if (role === "CEO") {
    return jsonError("Le CEO ne peut pas crÃ©er de demande", 403);
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
    return jsonError("startDate doit Ãªtre avant endDate", 400);
  }

  let assignee = null;
  if (role === "EMPLOYEE" || role === "DEPT_HEAD") {
    assignee = await findActiveEmployeeByRole("ACCOUNTANT");
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
      reachedCeoAt: assignee.role === "CEO" ? new Date() : null,
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

  return NextResponse.json({ leave: created }, { status: 201 });
}
