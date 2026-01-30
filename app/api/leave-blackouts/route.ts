export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { requireAuth, parseDate } from "@/lib/leave-requests";
import { norm } from "@/lib/validators";

export async function GET(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { role } = authRes.auth;
  if (role !== "CEO") return jsonError("Accès refusé", 403);

  const items = await prisma.leaveBlackout.findMany({
    select: {
      id: true,
      title: true,
      reason: true,
      startDate: true,
      endDate: true,
      departmentId: true,
      department: { select: { id: true, type: true, name: true } },
      createdAt: true,
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ blackouts: items });
}

export async function POST(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;
  if (role !== "CEO") return jsonError("Accès refusé", 403);

  const body = await req.json().catch(() => ({}));
  const title = norm(body?.title) || null;
  const reason = norm(body?.reason) || null;
  const startDate = parseDate(body?.startDate);
  const endDate = parseDate(body?.endDate);
  const departmentId = body?.departmentId ? String(body.departmentId) : null;

  if (!startDate || !endDate) {
    return jsonError("Champs requis: startDate, endDate", 400);
  }
  if (startDate > endDate) {
    return jsonError("startDate doit être avant endDate", 400);
  }

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true } });
    if (!dept) return jsonError("Département invalide", 400);
  }

  const created = await prisma.leaveBlackout.create({
    data: {
      title,
      reason,
      startDate,
      endDate,
      departmentId,
      createdById: actorId,
    },
    select: { id: true, startDate: true, endDate: true },
  });

  return NextResponse.json({ blackout: created }, { status: 201 });
}
