import type { SidebarSection } from "./sidebar-types";

export const operationsMenu: SidebarSection[] = [
  {
    title: null,
    links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/manager" }],
  },
  {
    title: "Mes congés",
    links: [
      { label: "Demander un congé", icon: "clipboard", to: "/dashboard/manager/leave/new" },
      { label: "Historique", icon: "clock", to: "/dashboard/manager/leave/history" },
    ],
  },
  {
    title: "Achats futurs",
    links: [
      { label: "Nouvelle demande", icon: "clipboard", to: "/dashboard/manager/purchases/new" },
      { label: "Mes demandes", icon: "clock", to: "/dashboard/manager/purchases" },
    ],
  },
  {
    title: "Direction des operations",
    links: [
      { label: "Employés (actuels)", icon: "users", to: "/dashboard/manager/department/employees" },
      { label: "Historique employés", icon: "users", to: "/dashboard/manager/department/employees-history" },
      { label: "Demandes transmises", icon: "clipboard", to: "/dashboard/manager/inbox" },
    ],
  },
  {
    title: "Compte",
    links: [{ label: "Profil", icon: "user", to: "/dashboard/manager/profile" }],
  },
];
