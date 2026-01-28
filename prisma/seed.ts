/* prisma/seed.ts */
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

function envOr(key: string, fallback: string) {
  return (process.env[key] ?? fallback).trim();
}

async function ensureDepartment(type: any, name: string, description?: string) {
  const existing = await prisma.department.findUnique({ where: { type } });
  if (existing) return existing;

  return prisma.department.create({
    data: { type, name, description: description ?? null },
  });
}

async function ensureService(departmentId: string, type: any, name: string, description?: string) {
  // @@unique([departmentId, type]) => on fait un findFirst
  const existing = await prisma.service.findFirst({
    where: { departmentId, type },
  });
  if (existing) return existing;

  return prisma.service.create({
    data: {
      departmentId,
      type,
      name,
      description: description ?? null,
    },
  });
}

async function ensureEmployee(data: {
  email: string;
  matricule?: string | null;
  firstName: string;
  lastName: string;
  passwordPlain: string;
  role: any;
  status: any;
  departmentId?: string | null;
  serviceId?: string | null;
  jobTitle?: string | null;
}) {
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.employee.findUnique({ where: { email } });
  const hashed = await bcrypt.hash(data.passwordPlain, 10);

  if (existing) {
    // On "répare" si l’employé existe déjà
    return prisma.employee.update({
      where: { id: existing.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        matricule: data.matricule ?? existing.matricule ?? null,
        password: existing.password ? existing.password : hashed,
        role: data.role,
        status: data.status,
        departmentId: data.departmentId ?? null,
        serviceId: data.serviceId ?? null,
        jobTitle: data.jobTitle ?? null,
      },
    });
  }

  return prisma.employee.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      matricule: data.matricule ?? null,
      password: hashed,
      role: data.role,
      status: data.status,
      departmentId: data.departmentId ?? null,
      serviceId: data.serviceId ?? null,
      jobTitle: data.jobTitle ?? null,
    },
  });
}

async function ensureActiveDsiResponsibility(dsiDepartmentId: string, employeeId: string) {
  const existing = await prisma.departmentResponsibility.findFirst({
    where: {
      departmentId: dsiDepartmentId,
      employeeId,
      endAt: null,
      role: { in: ["RESPONSABLE", "CO_RESPONSABLE"] },
    },
  });
  if (existing) return existing;

  return prisma.departmentResponsibility.create({
    data: {
      departmentId: dsiDepartmentId,
      employeeId,
      role: "RESPONSABLE",
      startAt: new Date(),
      endAt: null,
    },
  });
}

async function main() {
  // 1) Départements
  const daf = await ensureDepartment("DAF", "Direction Administrative et Financière");
  const dsi = await ensureDepartment("DSI", "Direction des Systèmes d'Information");
  const ops = await ensureDepartment("OPERATIONS", "Direction des opérations");
  const oth = await ensureDepartment("OTHERS", "Others Services", "Géré directement par le PDG");

  // 2) Services OPERATIONS
  const infoSvc = await ensureService(ops.id, "INFORMATION", "Service Information");
  const repSvc = await ensureService(ops.id, "REPUTATION", "Service Réputation");

  // 3) Comptes bootstrap (ACTIVE)
  const adminEmail = envOr("SEED_ADMIN_EMAIL", "admin.dsi@local.test");
  const adminMat = envOr("SEED_ADMIN_MATRICULE", "DSI-ADMIN");
  const adminPass = envOr("SEED_ADMIN_PASSWORD", "Passw0rd!");

  const accountantEmail = envOr("SEED_ACCOUNTANT_EMAIL", "comptable@local.test");
  const accountantMat = envOr("SEED_ACCOUNTANT_MATRICULE", "ACC-001");
  const accountantPass = envOr("SEED_ACCOUNTANT_PASSWORD", "Passw0rd!");

  const ceoEmail = envOr("SEED_CEO_EMAIL", "pdg@local.test");
  const ceoMat = envOr("SEED_CEO_MATRICULE", "CEO-001");
  const ceoPass = envOr("SEED_CEO_PASSWORD", "Passw0rd!");

  // Admin DSI (role=DEPT_HEAD) + ACTIVE
  const admin = await ensureEmployee({
    email: adminEmail,
    matricule: adminMat,
    firstName: "Admin",
    lastName: "DSI",
    passwordPlain: adminPass,
    role: "DEPT_HEAD",
    status: "ACTIVE",
    departmentId: dsi.id,
  });

  // Comptable (ACCOUNTANT) + ACTIVE
  const accountant = await ensureEmployee({
    email: accountantEmail,
    matricule: accountantMat,
    firstName: "Comptable",
    lastName: "DAF",
    passwordPlain: accountantPass,
    role: "ACCOUNTANT",
    status: "ACTIVE",
    departmentId: daf.id,
    jobTitle: "Comptable",
  });

  // PDG (CEO) + ACTIVE
  const ceo = await ensureEmployee({
    email: ceoEmail,
    matricule: ceoMat,
    firstName: "PDG",
    lastName: "CEO",
    passwordPlain: ceoPass,
    role: "CEO",
    status: "ACTIVE",
    jobTitle: "PDG",
  });

  // 4) Responsabilité active DSI pour l’admin
  await ensureActiveDsiResponsibility(dsi.id, admin.id);

  console.log("Seed OK ✅");
  console.log("Departments:", { daf: daf.id, dsi: dsi.id, ops: ops.id, oth: oth.id });
  console.log("Services(OPS):", { information: infoSvc.id, reputation: repSvc.id });
  console.log("Users:");
  console.log(" - Admin DSI:", { email: adminEmail, matricule: adminMat, role: "DEPT_HEAD" });
  console.log(" - Comptable:", { email: accountantEmail, matricule: accountantMat, role: "ACCOUNTANT" });
  console.log(" - PDG:", { email: ceoEmail, matricule: ceoMat, role: "CEO" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
