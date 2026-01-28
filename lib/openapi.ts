export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "API Congé",
    version: "1.0.0",
    description: "Documentation des routes (Auth, Employees, Departments, Services, Responsables).",
  },
  servers: [{ url: "http://localhost:3000" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Connexion (email ou matricule)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                  identifier: { type: "string", example: "CEO001" },
                  password: { type: "string", example: "Passw0rd!" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "401": { description: "Identifiants invalides" },
        },
      },
    },

    "/api/auth/register": {
      post: {
        summary: "Créer un employé",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName", "email", "password"],
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                  matricule: { type: "string", nullable: true },
                  password: { type: "string" },
                  isCeo: { type: "boolean" },
                  departmentId: { type: "string", nullable: true },
                  serviceId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Créé" } },
      },
    },

    "/api/auth/me": {
      get: {
        summary: "Profil connecté",
        responses: { "200": { description: "OK" }, "401": { description: "Non authentifié" } },
      },
    },

    "/api/departments": {
      get: { summary: "Lister les départements", responses: { "200": { description: "OK" } } },
      post: {
        summary: "Créer un département",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "name"],
                properties: {
                  type: { type: "string", enum: ["DAF", "DSI", "OPERATIONS", "OTHERS"] },
                  name: { type: "string" },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Créé" }, "409": { description: "Déjà existant" } },
      },
    },

    "/api/services": {
      get: { summary: "Lister les services", responses: { "200": { description: "OK" } } },
      post: {
        summary: "Créer un service",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["departmentId", "type", "name"],
                properties: {
                  departmentId: { type: "string" },
                  type: { type: "string", enum: ["INFORMATION", "REPUTATION"] },
                  name: { type: "string" },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Créé" } },
      },
    },

    "/api/employees": {
      get: {
        summary: "Lister les employés",
        parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
      post: {
        summary: "Créer un employé",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: { "201": { description: "Créé" } },
      },
    },

    "/api/departments/{id}/responsables": {
      get: {
        summary: "Lister responsables actifs d'un département",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
      post: {
        summary: "Affecter un responsable",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId"],
                properties: {
                  employeeId: { type: "string" },
                  role: { type: "string", enum: ["RESPONSABLE", "CO_RESPONSABLE", "ADJOINT"] },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Créé" }, "409": { description: "Limite atteinte" } },
      },
    },
  },
} as const;
