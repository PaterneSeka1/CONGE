export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { parseDate, requireAuth, findActiveEmployeeByRole } from "@/lib/leave-requests";
import { norm } from "@/lib/validators";
import {
  calculateEntitledLeaveDaysForYear,
  consumedLeaveDaysForYear,
  requestedLeaveDays,
  syncEmployeeLeaveBalance,
} from "@/lib/leave-balance";

function supportsLeaveBlackoutEmployeeIds() {
  const client = prisma as unknown as {
    _runtimeDataModel?: {
      models?: Record<string, { fields?: Array<{ name?: string }> }>;
    };
  };
  const fields = client._runtimeDataModel?.models?.LeaveBlackout?.fields;
  if (!Array.isArray(fields)) return false;
  return fields.some((f: { name?: string }) => f?.name === "employeeIds");
}

function appliesToEmployee(
  blackout: { departmentId?: string | null; employeeIds?: string[] | null },
  employee: { id: string; departmentId?: string | null }
) {
  const targetIds = Array.isArray(blackout.employeeIds) ? blackout.employeeIds : [];
  if (targetIds.includes(employee.id)) return true;
  if (blackout.departmentId && employee.departmentId && blackout.departmentId === employee.departmentId) return true;
  return !blackout.departmentId && targetIds.length === 0;
}

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
  const allowedTypes = new Set(["ANNUAL", "SICK", "UNPAID", "OTHER"] as const);
  const leaveType =
    type && allowedTypes.has(type as "ANNUAL" | "SICK" | "UNPAID" | "OTHER")
      ? (type as "ANNUAL" | "SICK" | "UNPAID" | "OTHER")
      : null;

  if (!leaveType || !startDate || !endDate) {
    return jsonError("Champs requis: type, startDate, endDate", 400);
  }

  if (startDate > endDate) {
    return jsonError("startDate doit être avant endDate", 400);
  }

  await syncEmployeeLeaveBalance(prisma, actorId);
  const employee = await prisma.employee.findUnique({
    where: { id: actorId },
    select: {
      id: true,
      leaveBalance: true,
      leaveBalanceAdjustment: true,
      hireDate: true,
      companyEntryDate: true,
      createdAt: true,
    },
  });
  if (!employee) return jsonError("Employé introuvable", 404);

  const currentYear = new Date().getUTCFullYear();
  const consumed = await consumedLeaveDaysForYear(prisma, actorId, currentYear);
  const nextYearEntitlement = calculateEntitledLeaveDaysForYear(
    {
      id: employee.id,
      leaveBalance: Number(employee.leaveBalance ?? 0),
      leaveBalanceAdjustment: Number(employee.leaveBalanceAdjustment ?? 0),
      hireDate: employee.hireDate ?? null,
      companyEntryDate: employee.companyEntryDate ?? null,
      createdAt: employee.createdAt,
    },
    currentYear + 1
  ).entitlement;
  const availableCurrentYear = Math.max(0, Number(employee.leaveBalance ?? 0) - consumed);
  const available = Math.max(0, availableCurrentYear + nextYearEntitlement);
  const requested = requestedLeaveDays(startDate, endDate);
  if (requested > available) {
    return jsonError("La demande dépasse votre solde de congés disponible", 409, {
      available,
      availableCurrentYear,
      nextYearAdvance: nextYearEntitlement,
      requested,
      consumed,
      entitlement: employee.leaveBalance,
    });
  }

  const supportsEmployeeIds = supportsLeaveBlackoutEmployeeIds();
  const overlappingBlackouts = await prisma.leaveBlackout.findMany({
    where: {
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: {
      id: true,
      departmentId: true,
      ...(supportsEmployeeIds ? { employeeIds: true } : {}),
    },
  });
  const hasBlockedRange = overlappingBlackouts.some((b) =>
    appliesToEmployee(b, { id: actorId, departmentId })
  );
  if (hasBlockedRange) {
    return jsonError("Période bloquée par la direction", 409);
  }

  let assignee = null;
  let autoCeo = null;
  let reachedCeoAt: Date | null = null;
  if (role === "EMPLOYEE") {
    assignee = await findActiveEmployeeByRole("ACCOUNTANT");
  } else if (role === "DEPT_HEAD" || role === "SERVICE_HEAD") {
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
      type: leaveType,
      startDate,
      endDate,
      reason,
      status: "PENDING",
      currentAssigneeId: assignee.id,
      deptHeadAssignedAt: assignee.role === "DEPT_HEAD" || assignee.role === "SERVICE_HEAD" ? new Date() : null,
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
        comment: "Auto-escalation CEO (DEPT_HEAD/SERVICE_HEAD).",
      },
    });
  }

  return NextResponse.json({ leave: created }, { status: 201 });
}
