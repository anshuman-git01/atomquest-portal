"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Target,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";
import { useRole } from "~/lib/role-context";

const ROLE_MENUS = {
  EMPLOYEE: [
    { name: "Home", href: "/", icon: Home },
    { name: "Goal Setting", href: "/", icon: Target },  // Same page for now
    { name: "Check-ins", href: "/checkins", icon: CheckSquare },
    { name: "Directory", href: "/directory", icon: Users },
  ],
  MANAGER: [
    { name: "Home", href: "/", icon: Home },
    { name: "Goal Setting", href: "/", icon: Target },
    { name: "Check-ins", href: "/checkins", icon: CheckSquare },
    { name: "Team Approvals", href: "/manager", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Directory", href: "/directory", icon: Users },
  ],
  ADMIN: [
    { name: "Home", href: "/", icon: Home },
    { name: "Goal Setting", href: "/", icon: Target },
    { name: "Check-ins", href: "/checkins", icon: CheckSquare },
    { name: "Team", href: "/manager", icon: Users },
    { name: "Admin Panel", href: "/admin", icon: Settings },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Directory", href: "/directory", icon: Users },
  ],
};
export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const userRole = role || "EMPLOYEE";
  const menuItems = ROLE_MENUS[userRole as keyof typeof ROLE_MENUS] || ROLE_MENUS.EMPLOYEE;

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-shadow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            AtomQuest
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={`${item.name}-${index}`}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-700 border-l-2 border-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-slate-500 px-4 py-2">
          <p className="font-semibold text-slate-600 mb-1">Role:</p>
          <p className="capitalize font-medium text-slate-700">
            {userRole.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
}