export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jsonError } from "@/lib/auth";
import { norm } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const identifier = norm(body?.identifier); // email OU matricule
    const password = norm(body?.password);

    if (!identifier || !password) {
      return jsonError("Champs requis: identifier, password", 400);
    }

    const employee = await prisma.employee.findFirst({
      where: { OR: [{ email: identifier }, { matricule: identifier }] },
      select: {
        id: true,
        email: true,
        matricule: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        status: true,
        departmentId: true,
        serviceId: true,
      },
    });

    if (!employee) return jsonError("Identifiants invalides", 401);

    const valid = await bcrypt.compare(password, employee.password);
    if (!valid) return jsonError("Identifiants invalides", 401);

    // Blocage tant que pas validé par l'admin (DSI)
    if (employee.status !== "ACTIVE") {
      return jsonError("Compte en attente de validation par l’admin", 403, {
        status: employee.status,
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return jsonError("JWT_SECRET manquant côté serveur", 500);

    const dsiResponsibility = await prisma.departmentResponsibility.findFirst({
      where: {
        employeeId: employee.id,
        endAt: null,
        department: { type: "DSI" },
        role: { in: ["RESPONSABLE", "CO_RESPONSABLE"] },
      },
      select: { id: true },
    });

    const isDsiAdmin = Boolean(dsiResponsibility);

    const token = jwt.sign(
      {
        sub: employee.id,
        email: employee.email,
        matricule: employee.matricule ?? null,
        role: employee.role,
        status: employee.status,
        departmentId: employee.departmentId ?? null,
        serviceId: employee.serviceId ?? null,
        isDsiAdmin,
      },
      secret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      employee: {
        id: employee.id,
        email: employee.email,
        matricule: employee.matricule,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        status: employee.status,
        departmentId: employee.departmentId,
        serviceId: employee.serviceId,
        isDsiAdmin,
      },
    });
  } catch (e: any) {
    return jsonError("Erreur serveur", 500, { code: e?.code, details: e?.message });
  }
}
