import type { SidebarSection } from "./sidebar-types";

export const dsiMenu: SidebarSection[] = [
  {
    title: null,
    links: [{ label: "Tableau de bord", icon: "home", to: "/dashboard/dsi" }],
  },
  {
    title: "Mes congés",
    links: [
      { label: "Demander un congé", icon: "clipboard", to: "/dashboard/dsi/leave/new" },
      { label: "Historique", icon: "clock", to: "/dashboard/dsi/leave/history" },
    ],
  },
  {
    title: "Achats",
    links: [
      { label: "Nouvelle demande", icon: "clipboard", to: "/dashboard/dsi/purchases/new" },
      { label: "Mes demandes", icon: "clock", to: "/dashboard/dsi/purchases" },
    ],
  },
{
    title: "Département Informatique",
    links: [
      { label: "Employés (actuels)", icon: "users", to: "/dashboard/dsi/department/employees" },
      { label: "Historique des employés", icon: "users", to: "/dashboard/dsi/department/employees-history" },
      { label: "Demandes transmises", icon: "clipboard", to: "/dashboard/dsi/inbox" },
    ],
  },
  {
    title: "Administration",
    links: [{ label: "Validation des comptes", icon: "shield", to: "/dashboard/dsi/accounts/pending" }],
  },
  {
    title: "Compte",
    links: [{ label: "Profil", icon: "user", to: "/dashboard/dsi/profile" }],
  },
];
