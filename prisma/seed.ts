  /* prisma/seed.ts */
  import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";

type EmployeeGender = "FEMALE" | "MALE" | "OTHER";

  const prisma = new PrismaClient();

  function envOr(key: string, fallback: string) {
    return (process.env[key] ?? fallback).trim();
  }

  async function ensureDepartment(type: any, name: string, description?: string) {
    const existing = await prisma.department.findFirst({ where: { type } });
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
    gender?: EmployeeGender | null;
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
          gender: data.gender ?? existing.gender ?? null,
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
        gender: data.gender ?? null,
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

  async function generateEmployees(params: {
    total: number;
    passwordPlain: string;
    departments: {
      daf: { id: string };
      dsi: { id: string };
      ops: { id: string };
      oth: { id: string };
    };
    services: {
      information: { id: string };
      reputation: { id: string };
      qualite: { id: string };
    };
  }) {
    const firstNames = [
      "Alice", "Jean", "Mariam", "Paul", "Sarah", "Idriss", "Fatou", "Yao", "Karim",
      "Nadia", "Luc", "Clarisse", "Moussa", "Patrick", "Aïcha", "Bruno", "Inès",
      "Emmanuel", "David", "Sophie",
    ];

    const lastNames = [
      "Kouassi", "Traoré", "Diallo", "N’Guessan", "Koné", "Ouattara", "Bamba",
      "Koffi", "Mensah", "Ben Ali", "Tano", "Yapi", "Keita", "Somé", "Soro",
      "Adjé", "Zadi", "Boni", "Touré", "Fofana",
    ];

    function pick<T>(arr: T[]) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    const genders: EmployeeGender[] = ["FEMALE", "MALE", "OTHER"];

    for (let i = 1; i <= params.total; i++) {
      const firstName = pick(firstNames);
      const lastName = pick(lastNames);

      let departmentId: string;
      let serviceId: string | null = null;
      let matriculePrefix = "";
      let emailPrefix = "";

      if (i <= 40) {
        // OPERATIONS - INFORMATION
        departmentId = params.departments.ops.id;
        serviceId = params.services.information.id;
        matriculePrefix = "OPS-INF";
        emailPrefix = "info";
      } else if (i <= 70) {
        // OPERATIONS - REPUTATION
        departmentId = params.departments.ops.id;
        serviceId = params.services.reputation.id;
        matriculePrefix = "OPS-REP";
        emailPrefix = "rep";
      } else if (i <= 80) {
        // OPERATIONS - QUALITE
        departmentId = params.departments.ops.id;
        serviceId = params.services.qualite.id;
        matriculePrefix = "OPS-QLT";
        emailPrefix = "qualite";
      } else if (i <= 85) {
        // DSI
        departmentId = params.departments.dsi.id;
        matriculePrefix = "DSI";
        emailPrefix = "dsi";
      } else if (i <= 95) {
        // DAF
        departmentId = params.departments.daf.id;
        matriculePrefix = "DAF";
        emailPrefix = "daf";
      } else {
        // OTHERS
        departmentId = params.departments.oth.id;
        matriculePrefix = "OTH";
        emailPrefix = "other";
      }

      await ensureEmployee({
        email: `${emailPrefix}.user${String(i).padStart(3, "0")}@local.test`,
        matricule: `${matriculePrefix}-${String(i).padStart(3, "0")}`,
        firstName,
        lastName,
        passwordPlain: params.passwordPlain,
        role: "EMPLOYEE",
        status: "ACTIVE",
        departmentId,
        serviceId,
        gender: pick(genders),
      });
    }
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
    const quaSvc = await ensureService(ops.id, "QUALITE", "Service Qualité");

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

    // Directeur des opérations (DEPT_HEAD) + ACTIVE
    const opsDirectorEmail = envOr("SEED_OPS_DIRECTOR_EMAIL", "directeur.ops@local.test");
    const opsDirectorMat = envOr("SEED_OPS_DIRECTOR_MATRICULE", "OPS-DIR-001");
    const opsDirectorPass = envOr("SEED_OPS_DIRECTOR_PASSWORD", "Passw0rd!");
    // Directeurs adjoints (SERVICE_HEAD) + ACTIVE
    const infoHeadEmail = envOr("SEED_INFO_HEAD_EMAIL", "responsable.info@local.test");
    const infoHeadMat = envOr("SEED_INFO_HEAD_MATRICULE", "OPS-INF-RESP-001");
    const infoHeadPass = envOr("SEED_INFO_HEAD_PASSWORD", "Passw0rd!");

    const repHeadEmail = envOr("SEED_REP_HEAD_EMAIL", "responsable.rep@local.test");
    const repHeadMat = envOr("SEED_REP_HEAD_MATRICULE", "OPS-REP-RESP-001");
    const repHeadPass = envOr("SEED_REP_HEAD_PASSWORD", "Passw0rd!");

    const quaHeadEmail = envOr("SEED_QUA_HEAD_EMAIL", "responsable.qualite@local.test");
    const quaHeadMat = envOr("SEED_QUA_HEAD_MATRICULE", "OPS-QLT-RESP-001");
    const quaHeadPass = envOr("SEED_QUA_HEAD_PASSWORD", "Passw0rd!");


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
      gender: "FEMALE",
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
      gender: "FEMALE",
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
      gender: "MALE",
    });

    // Directeur des opérations (DEPT_HEAD) + ACTIVE
    const opsDirector = await ensureEmployee({
      email: opsDirectorEmail,
      matricule: opsDirectorMat,
      firstName: "Directeur",
      lastName: "Opérations",
      passwordPlain: opsDirectorPass,
      role: "DEPT_HEAD",
      status: "ACTIVE",
      departmentId: ops.id,
      jobTitle: "Directeur des opérations",
      gender: "MALE",
    });

    // Directeurs adjoints (SERVICE_HEAD) + ACTIVE
    const infoHead = await ensureEmployee({
      email: infoHeadEmail,
      matricule: infoHeadMat,
      firstName: "Directeur",
      lastName: "Information",
      passwordPlain: infoHeadPass,
      role: "SERVICE_HEAD",
      status: "ACTIVE",
      departmentId: ops.id,
      serviceId: infoSvc.id,
      jobTitle: "Directeur Adjoint Information",
      gender: "FEMALE",
    });

    const repHead = await ensureEmployee({
      email: repHeadEmail,
      matricule: repHeadMat,
      firstName: "Directeur",
      lastName: "Réputation",
      passwordPlain: repHeadPass,
      role: "SERVICE_HEAD",
      status: "ACTIVE",
      departmentId: ops.id,
      serviceId: repSvc.id,
      jobTitle: "Directeur Adjoint Réputation",
      gender: "MALE",
    });

    await ensureEmployee({
      email: quaHeadEmail,
      matricule: quaHeadMat,
      firstName: "Directeur",
      lastName: "Qualité",
      passwordPlain: quaHeadPass,
      role: "SERVICE_HEAD",
      status: "ACTIVE",
      departmentId: ops.id,
      serviceId: quaSvc.id,
      jobTitle: "Directeur Adjoint Qualité",
      gender: "FEMALE",
    });

    // 4) Responsabilité active DSI pour l’admin
    await ensureActiveDsiResponsibility(dsi.id, admin.id);

    // 5) Génération d’employés génériques (limité à 50)
    await generateEmployees({
      total: 50,
      passwordPlain: "Passw0rd!",
      departments: { daf, dsi, ops, oth },
      services: { information: infoSvc, reputation: repSvc, qualite: quaSvc },
    });

  

    console.log("Seed OK ✅");
    console.log("Departments:", { daf: daf.id, dsi: dsi.id, ops: ops.id, oth: oth.id });
    console.log("Services(OPS):", { information: infoSvc.id, reputation: repSvc.id, qualite: quaSvc.id });
    console.log("Users:");
    console.log(" - Admin DSI:", { email: adminEmail, matricule: adminMat, role: "DEPT_HEAD" });
    console.log(" - Comptable:", { email: accountantEmail, matricule: accountantMat, role: "ACCOUNTANT" });
    console.log(" - PDG:", { email: ceoEmail, matricule: ceoMat, role: "CEO" });
    console.log(" - Directeur des opérations:", { email: opsDirectorEmail, matricule: opsDirectorMat, role: "DEPT_HEAD" });
    console.log(" - Directeur Adjoint Information:", { email: infoHeadEmail, matricule: infoHeadMat, role: "SERVICE_HEAD" });
    console.log(" - Directeur Adjoint Réputation:", { email: repHeadEmail, matricule: repHeadMat, role: "SERVICE_HEAD" });
    console.log(" - Directeur Adjoint Qualité:", { email: quaHeadEmail, matricule: quaHeadMat, role: "SERVICE_HEAD" });
    // console.log(" - Employés génériques: 100 x", { emailPattern: "<email_prefix>.user<id>@local.test" });
  }

  main()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
