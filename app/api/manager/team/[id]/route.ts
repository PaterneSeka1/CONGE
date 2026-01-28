export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, jsonError } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function DELETE(req: Request, ctx: Ctx) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  const params = await ctx.params;
  const id = params.id;

  const managerId = String(v.payload?.sub ?? "");
  if (!managerId) return jsonError("Token invalide", 401);

  const manager = await prisma.employee.findUnique({
    where: { id: managerId },
    select: { id: true, role: true, departmentId: true, serviceId: true },
  });

  if (!manager || manager.role !== "DEPT_HEAD") {
    return jsonError("Accès refusé", 403);
  }

  const target = await prisma.employee.findUnique({
    where: { id },
    select: { id: true, departmentId: true, serviceId: true },
  });

  if (!target) return jsonError("Employé introuvable", 404);

  if (manager.serviceId) {
    if (target.serviceId !== manager.serviceId) return jsonError("Accès refusé", 403);
    await prisma.employee.update({
      where: { id: target.id },
      data: { serviceId: null },
    });
  } else if (manager.departmentId) {
    if (target.departmentId !== manager.departmentId) return jsonError("Accès refusé", 403);
    await prisma.employee.update({
      where: { id: target.id },
      data: { serviceId: null, departmentId: null },
    });
  } else {
    return jsonError("Manager sans département/service", 400);
  }

  return NextResponse.json({ ok: true });
}
