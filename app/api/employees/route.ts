export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyJwt, jsonError } from "@/lib/auth";
import { norm } from "@/lib/validators";

export async function GET(req: Request) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  const url = new URL(req.url);
  const q = norm(url.searchParams.get("q"));

  const employees = await prisma.employee.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { matricule: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      email: true,
      matricule: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      isCeo: true,
      departmentId: true,
      serviceId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ employees });
}

export async function POST(req: Request) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  try {
    const body = await req.json().catch(() => ({}));

    const firstName = norm(body?.firstName);
    const lastName = norm(body?.lastName);
    const email = norm(body?.email).toLowerCase();
    const matricule = norm(body?.matricule) || null;
    const password = norm(body?.password);

    if (!firstName || !lastName || !email || !password) {
      return jsonError("Champs requis: firstName, lastName, email, password", 400);
    }

    const hashed = await bcrypt.hash(password, 10);

    const created = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        matricule,
        password: hashed,
        jobTitle: body?.jobTitle ?? null,
        isCeo: Boolean(body?.isCeo ?? false),
        departmentId: body?.departmentId ?? null,
        serviceId: body?.serviceId ?? null,
      },
      select: {
        id: true,
        email: true,
        matricule: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        isCeo: true,
        departmentId: true,
        serviceId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ employee: created }, { status: 201 });
  } catch (e: any) {
    return jsonError("Erreur serveur", 500, { code: e?.code, details: e?.message });
  }
}
