export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyJwt, jsonError } from "@/lib/auth";
import { norm } from "@/lib/validators";

type Ctx = { params: { id: string } };

export async function GET(req: Request, ctx: Ctx) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  const params = await ctx.params;
  const id = params.id;
  const requesterRole = String(v.payload?.role ?? "");

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      matricule: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      role: true,
      status: true,
      departmentId: true,
      serviceId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!employee) return jsonError("Employé introuvable", 404);
  return NextResponse.json({ employee });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  const params = await ctx.params;
  const id = params.id;

  try {
    const body = await req.json().catch(() => ({}));

    const data: any = {};
    if (body?.firstName !== undefined) data.firstName = norm(body.firstName);
    if (body?.lastName !== undefined) data.lastName = norm(body.lastName);
    if (body?.email !== undefined) data.email = norm(body.email).toLowerCase();
    if (body?.matricule !== undefined) data.matricule = norm(body.matricule) || null;
    if (body?.jobTitle !== undefined) data.jobTitle = body.jobTitle ?? null;
    if (body?.role !== undefined) {
      if (requesterRole !== "CEO") {
        return jsonError("Seul le CEO peut modifier le rôle d'un employé", 403);
      }
      if (body.role === "CEO") {
        return jsonError("Impossible d'attribuer le rôle CEO", 403);
      }
      data.role = body.role;
    }
    if (body?.departmentId !== undefined) data.departmentId = body.departmentId ?? null;
    if (body?.serviceId !== undefined) data.serviceId = body.serviceId ?? null;

    if (body?.password) {
      data.password = await bcrypt.hash(norm(body.password), 10);
    }

    const updated = await prisma.employee.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        matricule: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      role: true,
      status: true,
      departmentId: true,
      serviceId: true,
      updatedAt: true,
      },
    });

    return NextResponse.json({ employee: updated });
  } catch (e: any) {
    return jsonError("Erreur serveur", 500, { code: e?.code, details: e?.message });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  const params = await ctx.params;
  const id = params.id;

  try {
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError("Erreur serveur", 500, { code: e?.code, details: e?.message });
  }
}
