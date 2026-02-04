export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jsonError, verifyJwt } from "@/lib/auth";
import { norm } from "@/lib/validators";

export async function GET(req: Request) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  const id = String(v.payload?.sub ?? "");
  if (!id) return NextResponse.json({ error: "Token invalide" }, { status: 401 });

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      matricule: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      departmentId: true,
      serviceId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  return NextResponse.json({ employee });
}


export async function PUT(req: Request) {
  const v = verifyJwt(req);
  if (!v.ok) return v.error;

  const id = String(v.payload?.sub ?? "");
  if (!id) return jsonError("Token invalide", 401);

  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(body, "firstName")) {
    const value = norm(body?.firstName);
    if (!value) return jsonError("firstName invalide", 400);
    data.firstName = value;
  }
  if (Object.prototype.hasOwnProperty.call(body, "lastName")) {
    const value = norm(body?.lastName);
    if (!value) return jsonError("lastName invalide", 400);
    data.lastName = value;
  }
  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    return jsonError("email non modifiable", 400);
  }
  if (Object.prototype.hasOwnProperty.call(body, "jobTitle")) {
    data.jobTitle = norm(body?.jobTitle) || null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "password")) {
    const value = norm(body?.password);
    if (!value || value.length < 6) {
      return jsonError("Mot de passe invalide", 400);
    }
    data.password = await bcrypt.hash(value, 10);
  }

  if (Object.keys(data).length == 0) {
    return jsonError("Aucun champ a modifier", 400);
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
      leaveBalance: true,
      departmentId: true,
      serviceId: true,
    },
  });

  return NextResponse.json({ employee: updated });
}
