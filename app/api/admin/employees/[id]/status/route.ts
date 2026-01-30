export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, jsonError } from "@/lib/auth";
import { isDsiAdmin } from "@/lib/dsiAdmin";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, ctx: Ctx) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  const params = await ctx.params;
  const id = params.id;

  const adminId = String(v.payload?.sub ?? "");
  if (!adminId) return jsonError("Token invalide", 401);

  const ok = await isDsiAdmin(adminId);
  if (!ok) return jsonError("Accès refusé (admin DSI requis)", 403);

  const body = await req.json().catch(() => ({}));
  const status = body?.status;

  if (!["ACTIVE", "REJECTED"].includes(status)) {
    return jsonError("status invalide (ACTIVE|REJECTED)", 400);
  }

  // Empêcher de re-valider un compte déjà traité
  const current = await prisma.employee.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!current) return jsonError("Employé introuvable", 404);

  if (current.status !== "PENDING") {
    return jsonError("Ce compte a déjà été traité", 409, { currentStatus: current.status });
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      status,
      approvedById: adminId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      matricule: true,
      role: true,
      status: true,
      approvedById: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ employee: updated });
}