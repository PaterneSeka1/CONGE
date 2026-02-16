export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { requireAuth } from "@/lib/leave-requests";
import { norm } from "@/lib/validators";
import { syncEmployeeLeaveBalance } from "@/lib/leave-balance";

type Ctx = { params: Promise<{ id: string }> };

function parseDateInput(value: unknown) {
  const raw = norm(value);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export async function DELETE(req: Request, ctx: Ctx) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;
  if (role !== "CEO") return jsonError("Accès refusé", 403);

  const { id } = await ctx.params;
  if (!id) return jsonError("ID requis", 400);
  if (id === actorId) return jsonError("Suppression interdite sur son propre compte", 403);

  await prisma.employee.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, ctx: Ctx) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { role } = authRes.auth;
  if (role !== "CEO") return jsonError("Accès refusé", 403);

  const { id } = await ctx.params;
  if (!id) return jsonError("ID requis", 400);

  const existing = await prisma.employee.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!existing) return jsonError("Employé introuvable", 404);

  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(body, "firstName")) {
    const v = norm(body?.firstName);
    if (!v) return jsonError("firstName invalide", 400);
    data.firstName = v;
  }
  if (Object.prototype.hasOwnProperty.call(body, "lastName")) {
    const v = norm(body?.lastName);
    if (!v) return jsonError("lastName invalide", 400);
    data.lastName = v;
  }
  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const v = norm(body?.email).toLowerCase();
    if (!v) return jsonError("email invalide", 400);
    data.email = v;
  }
  if (Object.prototype.hasOwnProperty.call(body, "matricule")) {
    data.matricule = norm(body?.matricule) || null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "jobTitle")) {
    data.jobTitle = norm(body?.jobTitle) || null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    const v = String(body?.role ?? "");
    if (!["CEO", "ACCOUNTANT", "DEPT_HEAD", "SERVICE_HEAD", "EMPLOYEE"].includes(v)) {
      return jsonError("role invalide", 400);
    }
    if (v === "CEO" && existing.role !== "CEO") {
      return jsonError("Promotion en CEO interdite", 403);
    }
    data.role = v;
  }
  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    const v = String(body?.status ?? "");
    if (!["ACTIVE", "PENDING", "REJECTED"].includes(v)) {
      return jsonError("status invalide", 400);
    }
    data.status = v;
  }
  if (Object.prototype.hasOwnProperty.call(body, "departmentId")) {
    const v = body?.departmentId ? String(body.departmentId) : null;
    data.departmentId = v || null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "serviceId")) {
    const v = body?.serviceId ? String(body.serviceId) : null;
    data.serviceId = v || null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "hireDate")) {
    const parsed = parseDateInput(body?.hireDate);
    if (parsed === undefined) return jsonError("hireDate invalide (YYYY-MM-DD)", 400);
    data.hireDate = parsed;
    data.companyEntryDate = parsed;
  }

  if (Object.keys(data).length === 0) {
    return jsonError("Aucun champ à modifier", 400);
  }

  await prisma.employee.update({
    where: { id },
    data,
  });
  await syncEmployeeLeaveBalance(prisma, id);
  const updated = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      matricule: true,
      jobTitle: true,
      role: true,
      status: true,
      departmentId: true,
      serviceId: true,
      leaveBalance: true,
      hireDate: true,
    },
  });

  if (!updated) return jsonError("Employé introuvable", 404);

  return NextResponse.json({ employee: updated });
}
