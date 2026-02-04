export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/leave-requests";

export async function GET(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId } = authRes.auth;

  const requests = await prisma.purchaseRequest.findMany({
    where: { employeeId: actorId },
    select: {
      id: true,
      name: true,
      amount: true,
      date: true,
      status: true,
      createdAt: true,
      items: { select: { id: true, name: true, amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
