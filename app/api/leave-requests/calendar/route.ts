export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { requireAuth } from "@/lib/leave-requests";

export async function GET(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { role, departmentId } = authRes.auth;

  const blackoutWhere = departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {};
  const blackouts = await prisma.leaveBlackout.findMany({
    where: blackoutWhere,
    select: { id: true, startDate: true, endDate: true, departmentId: true },
    orderBy: { startDate: "asc" },
  });

  if (role !== "CEO") {
    return NextResponse.json({ leaves: [], blackouts });
  }

  const leaves = await prisma.leaveRequest.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      employee: {
        select: {
          firstName: true,
          lastName: true,
          matricule: true,
          department: { select: { type: true, name: true } },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ leaves, blackouts });
}
