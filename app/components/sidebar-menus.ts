import type { SidebarSection } from "./sidebar-types";

export const employeeMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/employee" }] },
  {
    title: "CongÃ©s",
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
    title: "Demandes",
    links: [
      { label: "Inbox (Ã  traiter)", icon: "clipboard", to: "/dashboard/accountant/inbox" },
      { label: "Historique", icon: "clock", to: "/dashboard/accountant/history" },
    ],
  },
];

export const managerMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/manager" }] },
  {
    title: "DÃ©partement",
    links: [
      { label: "Demandes transmises", icon: "clipboard", to: "/dashboard/manager/inbox" },
      { label: "Ã‰quipe", icon: "users", to: "/dashboard/manager/team" },
    ],
  },
];

export const ceoMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/ceo" }] },
  {
    title: "Validation",
    links: [
      { label: "Demandes escaladÃ©es", icon: "clipboard", to: "/dashboard/ceo/inbox" },
      { label: "Vue globale", icon: "clock", to: "/dashboard/ceo/overview" },
    ],
  },
];
