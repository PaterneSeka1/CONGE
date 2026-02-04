export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { requireAuth } from "@/lib/leave-requests";

type Ctx = { params: Promise<{ id: string }> };

function isFinalStatus(status: string) {
  return status === "APPROVED" || status === "REJECTED";
}

export async function POST(req: Request, ctx: Ctx) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;
  const { id } = await ctx.params;

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    select: { id: true, employeeId: true, status: true, currentAssigneeId: true, reachedCeoAt: true },
  });

  if (!request) return jsonError("Demande introuvable", 404);
  if (isFinalStatus(request.status)) return jsonError("Demande déjà traitée", 409);
  if (request.currentAssigneeId !== actorId) {
    const ceoCanAct = role === "CEO" && !!request.reachedCeoAt;
    if (!ceoCanAct) return jsonError("Accès refusé", 403);
  }
  if (request.employeeId === actorId) return jsonError("Action interdite sur sa propre demande", 403);

  const body = await req.json().catch(() => ({}));
  const comment = body?.comment ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.purchaseRequest.update({
      where: { id },
      data: { status: "APPROVED", currentAssigneeId: null },
      select: { id: true, status: true, currentAssigneeId: true },
    });

    await tx.purchaseDecision.create({
      data: {
        purchaseRequestId: id,
        actorId,
        type: "APPROVE",
        comment,
      },
    });

    return updatedRequest;
  });

  return NextResponse.json({ request: updated });
}
