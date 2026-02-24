import type { SidebarSection } from "./sidebar-types";

export const employeeMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/employee" }] },
  {
    title: "Congés",
    links: [
      { label: "Nouvelle demande", icon: "clipboard", to: "/dashboard/employee/new" },
      { label: "Mes demandes", icon: "clock", to: "/dashboard/employee/requests" },
    ],
  },
  {
    title: "Documents",
    links: [{ label: "Mes bulletins", icon: "clipboard", to: "/dashboard/employee/payslips" }],
  },
  { title: "Compte", links: [{ label: "Profil", icon: "user", to: "/dashboard/employee/profile" }] },
];

export const accountantMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/accountant" }] },
  {
    title: "Congés",
    links: [
      { label: "Nouvelle demande", icon: "clipboard", to: "/dashboard/accountant/leave/new" },
      { label: "Mes demandes", icon: "clock", to: "/dashboard/accountant/requests" },
    ],
  },
  {
    title: "Demandes",
    links: [
      { label: "Demandes reçues", icon: "clipboard", to: "/dashboard/accountant/inbox" },
    ],
  },
  {
    title: "Département DAF",
    links: [
      { label: "Employés DAF", icon: "users", to: "/dashboard/accountant/department/employees" },
      {
        label: "Historique des employés",
        icon: "clock",
        to: "/dashboard/accountant/department/employees-history",
      },
    ],
  },
  {
    title: "Documents",
    links: [
      { label: "Mes contrats", icon: "shield", to: "/dashboard/accountant/administration/contracts" },
      { label: "Mes bulletins", icon: "clipboard", to: "/dashboard/accountant/payslips" },
    ],
  },
  {
    title: "Administration",
    links: [
      { label: "Contrats à ajouter", icon: "shield", to: "/dashboard/accountant/administration/contracts/types", },
      { label: "Documents contractuels", icon: "file-text", to: "/dashboard/accountant/administration/contracts/documents", },
      { label: "Bulletins à ajouter", icon: "shield", to: "/dashboard/accountant/payslips/imported" },
      { label: "Bulletins employés", icon: "file-text", to: "/dashboard/accountant/payslips/imported/by-year" },
      { label: "Documents RH employés", icon: "file-text", to: "/dashboard/accountant/documents/employees", },
    ],
  },
  {
    title: "Compte",
    links: [{ label: "Profil", icon: "user", to: "/dashboard/accountant/profile" }],
  },
];

export const managerMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/manager" }] },
  {
    title: "Sous-direction",
    links: [
      { label: "Demandes transmises", icon: "clipboard", to: "/dashboard/manager/inbox" },
      { label: "Historique des employés", icon: "clock", to: "/dashboard/manager/department/employees-history" },
      { label: "Équipe", icon: "users", to: "/dashboard/manager/team" },
    ],
  },
  {
    title: "Documents",
    links: [{ label: "Mes bulletins", icon: "clipboard", to: "/dashboard/manager/payslips" }],
  },
  {
    title: "Compte",
    links: [{ label: "Profil", icon: "user", to: "/dashboard/manager/profile" }],
  },
];

export const ceoMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/ceo" }] },
  {
    title: "Validation",
    links: [
      { label: "Demandes escaladées", icon: "clipboard", to: "/dashboard/ceo/inbox" },
      { label: "Historique congés", icon: "clock", to: "/dashboard/ceo/leaves/history" },
      { label: "Périodes bloquées", icon: "clock", to: "/dashboard/ceo/blackouts" },
    ],
  },
  {
    title: "Employés",
    links: [
      { label: "Tous les employés", icon: "users", to: "/dashboard/ceo/employees" },
      { label: "Documents RH", icon: "users", to: "/dashboard/ceo/documents" },
    ],
  },
  {
    title: "Département Autres",
    links: [
      { label: "Employés (actuels)", icon: "users", to: "/dashboard/ceo/department/others/employees" },
      {
        label: "Historique des employés",
        icon: "users",
        to: "/dashboard/ceo/department/others/employees-history",
      },
    ],
  },
  { title: "Documents", links: [{ label: "Signer les bulletins", icon: "shield", to: "/dashboard/ceo/payslips/sign" }], },
  { title: "Compte", links: [{ label: "Profil", icon: "user", to: "/dashboard/ceo/profile" }], },
];
