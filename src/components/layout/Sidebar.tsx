"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { canAccessPath } from "@/lib/roles";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Map,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  category?: string;
}

const navItems: NavItem[] = [
  { label: "Training Maps", href: "/maps", icon: Map, category: "OVERVIEW" },
  { label: "Shared Exercises", href: "/training", icon: Users, category: "OVERVIEW" },
  { label: "Dashboard",        href: "/dashboard",  icon: LayoutDashboard, category: "OVERVIEW"  },
  { label: "Instructor",       href: "/instructor", icon: GraduationCap,   category: "ROLES"     },
  { label: "Scenarios",        href: "/instructor/scenarios", icon: BookOpen, category: "ROLES"  },
  { label: "Commander",        href: "/commander",  icon: Map,             category: "ROLES"     },
  { label: "Team",             href: "/team",       icon: Users,           category: "ROLES"     },
  { label: "After Action",     href: "/training#server-exercises", icon: ClipboardList, category: "REPORTS" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { role, isFirebaseConfigured, isLocalPracticeAvailable } = useAuth();
  const visibleItems = navItems.filter(item => isFirebaseConfigured
    ? canAccessPath(role, item.href)
    : isLocalPracticeAvailable && item.category !== "ROLES");

  const isActive = (href: string) =>
    href !== "#" && (pathname === href || pathname.startsWith(href + "/"));

  /* Group items by category */
  const categories = Array.from(new Set(visibleItems.map((n) => n.category)));

  return (
    <aside
      className={`
        flex flex-col bg-[#344438] border-r border-[#2A3830] h-full
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#2A3830] ${collapsed ? "justify-center" : ""}`}>
        <div className="flex-shrink-0">
          <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
            <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke="#D8C7A5" strokeWidth="1.5" />
            <polygon points="16,7 23,11 23,21 16,25 9,21 9,11" fill="none" stroke="#B69B63" strokeWidth="1" />
            <circle cx="16" cy="16" r="3" fill="none" stroke="#D8C7A5" strokeWidth="1.5" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-white font-black text-sm tracking-wider leading-tight truncate">TACTICAL-SIM</div>
            <div className="text-[#B69B63] text-[9px] font-bold tracking-[0.15em] leading-tight truncate">DEFENCE TRAINING SYSTEM</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {categories.map((cat) => {
          const items = visibleItems.filter((n) => n.category === cat);
          return (
            <div key={cat} className="mb-4">
              {!collapsed && (
                <div className="px-4 mb-2 text-[9px] font-black tracking-[0.2em] text-[#71805A]">
                  {cat}
                </div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={`
                      flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5 transition-all
                      ${collapsed ? "justify-center" : ""}
                      ${
                        active
                          ? "bg-[#556B3F] text-white border border-[#6B7C50]/40"
                          : "text-[#D8C7A5] hover:bg-[#2A3830] hover:text-white"
                      }
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`flex-shrink-0 ${active ? "text-white" : "text-[#9AAA88]"}`} size={16} />
                    {!collapsed && (
                      <span className="text-sm font-bold tracking-wide truncate">{item.label}</span>
                    )}
                    {!collapsed && active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B69B63] flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* System status */}
      <div className={`border-t border-[#2A3830] px-4 py-4 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4A7A3A] animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-[#9AAA88]">{isFirebaseConfigured ? "TRAINING WORKSPACE" : "LOCAL PRACTICE"}</span>
            </div>
            <div className="text-[9px] font-bold tracking-[0.2em] text-[#71805A]">{isFirebaseConfigured ? "ENVIRONMENT: TRAINING" : "NO ACCOUNT SIGN-IN"}</div>
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-[#4A7A3A] animate-pulse" />
        )}
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-t border-[#2A3830] text-[#71805A] hover:text-white hover:bg-[#2A3830] transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
