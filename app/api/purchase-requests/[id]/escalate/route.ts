export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { findActiveEmployeeByRole, requireAuth } from "@/lib/leave-requests";

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
    select: { id: true, employeeId: true, status: true, currentAssigneeId: true },
  });

  if (!request) return jsonError("Demande introuvable", 404);
  if (isFinalStatus(request.status)) return jsonError("Demande déjà traitée", 409);
  if (request.currentAssigneeId !== actorId) return jsonError("Accès refusé", 403);
  if (request.employeeId === actorId) return jsonError("Action interdite sur sa propre demande", 403);

  if (role !== "ACCOUNTANT") {
    return jsonError("Accès refusé", 403);
  }

  const body = await req.json().catch(() => ({}));
  const toRole = body?.toRole as string | undefined;
  if (toRole && toRole !== "CEO") return jsonError("toRole invalide (CEO uniquement)", 400);

  const target = await findActiveEmployeeByRole("CEO");
  if (!target) return jsonError("Aucun assignataire actif disponible", 409);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.purchaseRequest.update({
      where: { id },
      data: {
        status: "PENDING",
        currentAssigneeId: target.id,
        reachedCeoAt: new Date(),
      },
      select: { id: true, status: true, currentAssigneeId: true },
    });

    await tx.purchaseDecision.create({
      data: {
        purchaseRequestId: id,
        actorId,
        type: "ESCALATE",
        toEmployeeId: target.id,
      },
    });

    return updatedRequest;
  });

  return NextResponse.json({ request: updated });
}
