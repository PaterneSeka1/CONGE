export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { findActiveEmployeeByRole, parseDate, requireAuth } from "@/lib/leave-requests";
import { norm } from "@/lib/validators";

export async function POST(req: Request) {
  const authRes = requireAuth(req);
  if (!authRes.ok) return authRes.error;

  const { id: actorId, role } = authRes.auth;

  if (role !== "DEPT_HEAD" && role !== "SERVICE_HEAD") {
    return jsonError("Accès refusé", 403);
  }

  const body = await req.json().catch(() => ({}));
  const name = norm(body?.name);
  const items = Array.isArray(body?.items) ? body.items : [];
  const date = parseDate(body?.date ?? null);

  const normalizedItems = items
    .map((item: any) => ({
      name: norm(item?.name),
      amount: Number(item?.amount),
    }))
    .filter((item: any) => item.name && Number.isFinite(item.amount) && item.amount > 0);

  const amount = normalizedItems.reduce((sum: number, item: any) => sum + item.amount, 0);

  if (!name || !date || normalizedItems.length === 0 || amount <= 0) {
    return jsonError("Champs requis: name, items[], date", 400);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return jsonError("La date d'achat doit etre aujourd'hui ou future", 400);
  }

  const assignee = await findActiveEmployeeByRole("ACCOUNTANT");
  if (!assignee) return jsonError("Aucun assignataire actif disponible", 409);

  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.purchaseRequest.create({
      data: {
        name,
        amount,
        date,
        status: "PENDING",
        employeeId: actorId,
        currentAssigneeId: assignee.id,
        items: {
          create: normalizedItems.map((item: any) => ({
            name: item.name,
            amount: item.amount,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        date: true,
        status: true,
        currentAssigneeId: true,
        createdAt: true,
      },
    });

    await tx.purchaseDecision.create({
      data: {
        purchaseRequestId: request.id,
        actorId,
        type: "SUBMIT",
      },
    });

    return request;
  });

  return NextResponse.json({ request: created }, { status: 201 });
}
