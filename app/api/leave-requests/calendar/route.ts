export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { requireAuth } from "@/lib/leave-requests";

export async function GET(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { role } = authRes.auth;
  if (role !== "CEO") return jsonError("Acces refuse", 403);

  const [leaves, blackouts] = await Promise.all([
    prisma.leaveRequest.findMany({
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
    }),
    prisma.leaveBlackout.findMany({
      select: { id: true, startDate: true, endDate: true, departmentId: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return NextResponse.json({ leaves, blackouts });
}
