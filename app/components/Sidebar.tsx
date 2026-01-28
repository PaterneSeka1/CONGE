"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  Building2,
  ClipboardCheck,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  Users,
  ShieldCheck,
} from "lucide-react";

import type { SidebarIconKey, SidebarSection } from "./sidebar-types";
import { getEmployee, logout } from "@/lib/auth-client";

const sidebarIconMap: Record<SidebarIconKey, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  home: Home,
  clipboard: ClipboardCheck,
  clock: Clock,
  users: Users,
  user: User,
  shield: ShieldCheck,
};

export function Sidebar({
  brandTitle = "CONGÉS",
  brandSubtitle = "Gestion des demandes",
  sections,
  showOrgSwitcher = false,
}: {
  brandTitle?: string;
  brandSubtitle?: string;
  sections: SidebarSection[];
  showOrgSwitcher?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const employee = useMemo(() => getEmployee(), []);

  // Optionnel (si tu veux un switch d’org plus tard)
  const organizations = [
    { id: "1", name: "Organisation A" },
    { id: "2", name: "Organisation B" },
  ];
  const hasMultipleOrgs = organizations.length > 1;

  const [menuHeight, setMenuHeight] = useState(0);
  useEffect(() => {
    if (menuRef.current) {
      const vh = window.innerHeight;
      const navbarH = 72;
      setMenuHeight(vh - navbarH);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };
    if (orgDropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [orgDropdownOpen]);

  const isDashboardRoot = (to: string) =>
    to === "/dashboard/dsi" ||
    to === "/dashboard/manager" ||
    to === "/dashboard/employee" ||
    to === "/dashboard/accountant" ||
    to === "/dashboard/ceo";

  const isActiveLink = (path: string, to: string) => {
    if (isDashboardRoot(to)) return path === to;
    return path === to || path.startsWith(`${to}/`);
  };

  const OrgButton = () => {
    if (!showOrgSwitcher) return null;

    return (
      <div className="relative" ref={dropdownRef}>
        {hasMultipleOrgs ? (
          <>
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-vdm-gold-800 text-white hover:bg-vdm-gold-700 font-semibold transition border border-vdm-gold-900"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white" />
                <span className="text-xs">Organisations</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${orgDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {orgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border overflow-hidden z-50">
                {organizations.map((org, i) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      console.log("Organisation sélectionnée :", org.id);
                      setOrgDropdownOpen(false);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-vdm-gold-50 transition text-sm font-medium text-vdm-gold-900 ${
                      i !== organizations.length - 1 ? "border-b" : ""
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    console.log("Ajouter organisation");
                    setOrgDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 bg-vdm-gold-50 hover:bg-vdm-gold-100 transition text-sm font-semibold text-vdm-gold-900 border-t"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter une organisation
                  </div>
                </button>
              </div>
            )}
          </>
        ) : (
          <button className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-vdm-gold-800 text-white hover:bg-vdm-gold-700 font-semibold transition border border-vdm-gold-900">
            <Plus className="w-4 h-4 text-white" />
            <span className="text-xs">Ajouter organisation</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* MOBILE TOPBAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-vdm-gold-900 shadow px-4 py-3 flex items-center justify-between border-b border-vdm-gold-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-vdm-gold-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-vdm-gold-100 tracking-tight">{brandTitle}</div>
            <div className="text-xs text-vdm-gold-200 font-medium">{brandSubtitle}</div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-vdm-gold-800 text-white hover:bg-vdm-gold-700 transition border border-vdm-gold-900"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* MOBILE MENU */}
      <div
        ref={menuRef}
        style={{ maxHeight: isOpen ? `${menuHeight}px` : "0px" }}
        className="lg:hidden fixed top-[72px] left-0 right-0 bottom-0 z-40 bg-vdm-gold-900 overflow-y-auto transition-all duration-300 ease-out shadow-lg"
      >
        <div className="p-4 space-y-4">
          <div className="px-2">
            <div className="text-sm font-semibold text-vdm-gold-100">
              {employee ? `${employee.firstName} ${employee.lastName}` : "Utilisateur"}
            </div>
            <div className="text-xs text-vdm-gold-200">{employee?.role ?? ""}</div>
          </div>

          <OrgButton />

          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <div className="px-2 mb-1">
                  <div className="text-xs font-bold text-vdm-gold-200 uppercase tracking-widest">
                    {section.title}
                  </div>
                </div>
              )}

              {section.links.map((link) => {
                const isActive = isActiveLink(pathname, link.to);
                const Icon = sidebarIconMap[link.icon];
                return (
                  <Link
                    key={link.to}
                    href={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition ${
                      isActive
                        ? "bg-vdm-gold-700 text-white"
                        : "text-vdm-gold-100 hover:bg-vdm-gold-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-300 hover:bg-red-700/20 transition w-full font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 bg-vdm-gold-900 shadow-lg z-30">
        <div className="p-5 border-b border-vdm-gold-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-vdm-gold-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-vdm-gold-100 tracking-tight">{brandTitle}</div>
              <div className="text-[11px] text-vdm-gold-200 font-semibold">{brandSubtitle}</div>
            </div>
          </div>

          <div className="px-1 mb-3">
            <div className="text-sm font-semibold text-vdm-gold-100">
              {employee ? `${employee.firstName} ${employee.lastName}` : "Utilisateur"}
            </div>
            <div className="text-xs text-vdm-gold-200">{employee?.role ?? ""}</div>
          </div>

          <OrgButton />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-3">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <div className="px-2 mb-1">
                  <div className="text-[10px] font-bold text-vdm-gold-200 uppercase tracking-widest">
                    {section.title}
                  </div>
                </div>
              )}

              {section.links.map((link) => {
                const isActive = isActiveLink(pathname, link.to);
                const Icon = sidebarIconMap[link.icon];
                return (
                  <Link
                    key={link.to}
                    href={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition ${
                      isActive
                        ? "bg-vdm-gold-700 text-white"
                        : "text-vdm-gold-100 hover:bg-vdm-gold-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-vdm-gold-800">
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-vdm-gold-100 hover:bg-vdm-gold-800 transition w-full font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}

