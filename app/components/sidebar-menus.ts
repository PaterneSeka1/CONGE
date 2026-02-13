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
      { label: "Boîte de réception (à traiter)", icon: "clipboard", to: "/dashboard/accountant/inbox" },
    ],
  },
  {
    title: "Département DAF",
    links: [
      { label: "Employés (actuels)", icon: "users", to: "/dashboard/accountant/department/employees" },
      {
        label: "Historique des employés",
        icon: "users",
        to: "/dashboard/accountant/department/employees-history",
      },
    ],
  },
  {
    title: "Achats",
    links: [
      { label: "Inbox", icon: "clipboard", to: "/dashboard/accountant/purchases/inbox" },
      { label: "Historique", icon: "clock", to: "/dashboard/accountant/purchases/history" },
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
    title: "Département",
    links: [
      { label: "Demandes transmises", icon: "clipboard", to: "/dashboard/manager/inbox" },
      { label: "Équipe", icon: "users", to: "/dashboard/manager/team" },
    ],
  },
  {
    title: "Achats",
    links: [
      { label: "Nouvelle demande", icon: "clipboard", to: "/dashboard/manager/purchases/new" },
      { label: "Mes demandes", icon: "clock", to: "/dashboard/manager/purchases" },
    ],
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
    links: [{ label: "Tous les employés", icon: "users", to: "/dashboard/ceo/employees" }],
  },
  {
    title: "Département OTHERS",
    links: [
      { label: "Employés (actuels)", icon: "users", to: "/dashboard/ceo/department/others/employees" },
      {
        label: "Historique des employés",
        icon: "users",
        to: "/dashboard/ceo/department/others/employees-history",
      },
    ],
  },
  {
    title: "Achats",
    links: [
      { label: "Inbox", icon: "clipboard", to: "/dashboard/ceo/purchases/inbox" },
      { label: "Historique", icon: "clock", to: "/dashboard/ceo/purchases/history" },
    ],
  },
  {
    title: "Compte",
    links: [{ label: "Profil", icon: "user", to: "/dashboard/ceo/profile" }],
  },
];
