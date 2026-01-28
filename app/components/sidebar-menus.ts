import { SidebarSection, SidebarIcons } from "./Sidebar";

export const employeeMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: SidebarIcons.HomeIcon, to: "/dashboard/employee" }] },
  {
    title: "Congés",
    links: [
      { label: "Nouvelle demande", icon: SidebarIcons.ClipboardDocumentCheckIcon, to: "/dashboard/employee/new" },
      { label: "Mes demandes", icon: SidebarIcons.ClockIcon, to: "/dashboard/employee/requests" },
    ],
  },
  { title: "Compte", links: [{ label: "Profil", icon: SidebarIcons.UserIcon, to: "/dashboard/employee/profile" }] },
];

export const accountantMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: SidebarIcons.HomeIcon, to: "/dashboard/accountant" }] },
  {
    title: "Demandes",
    links: [
      { label: "Inbox (à traiter)", icon: SidebarIcons.ClipboardDocumentCheckIcon, to: "/dashboard/accountant/inbox" },
      { label: "Historique", icon: SidebarIcons.ClockIcon, to: "/dashboard/accountant/history" },
    ],
  },
];

export const managerMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: SidebarIcons.HomeIcon, to: "/dashboard/manager" }] },
  {
    title: "Département",
    links: [
      { label: "Demandes transmises", icon: SidebarIcons.ClipboardDocumentCheckIcon, to: "/dashboard/manager/inbox" },
      { label: "Équipe", icon: SidebarIcons.UsersIcon, to: "/dashboard/manager/team" },
    ],
  },
];

export const ceoMenu: SidebarSection[] = [
  { title: null, links: [{ label: "Tableau de bord", icon: SidebarIcons.HomeIcon, to: "/dashboard/ceo" }] },
  {
    title: "Validation",
    links: [
      { label: "Demandes escaladées", icon: SidebarIcons.ClipboardDocumentCheckIcon, to: "/dashboard/ceo/inbox" },
      { label: "Vue globale", icon: SidebarIcons.ClockIcon, to: "/dashboard/ceo/overview" },
    ],
  },
];
