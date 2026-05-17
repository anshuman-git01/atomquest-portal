"use client";

import { useRole } from "~/lib/role-context";
import { User } from "lucide-react";

const ROLE_BADGE_CONFIG = {
  EMPLOYEE: { bg: "bg-green-100", text: "text-green-700", label: "Employee" },
  MANAGER: { bg: "bg-blue-100", text: "text-blue-700", label: "Manager" },
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700", label: "Admin" },
};

const USER_INFO = {
  EMPLOYEE: { name: "Sarah Employee", email: "employee@demo.com" },
  MANAGER: { name: "Mike Manager", email: "manager@demo.com" },
  ADMIN: { name: "HR Admin", email: "admin@demo.com" },
};

export function Navbar() {
  const { role, setRole } = useRole();
  const roleConfig = ROLE_BADGE_CONFIG[role];
  const userInfo = USER_INFO[role];

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-40">
      {/* Left side - empty for symmetry */}
      <div className="flex-1" />

      {/* Right side - User info and role switcher */}
      <div className="flex items-center gap-6">
        {/* Role Switcher Dropdown - DEMO MODE */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Demo Mode:
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "MANAGER" | "ADMIN")}
            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 cursor-pointer transition-colors ${roleConfig.bg} ${roleConfig.text} border-current`}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${roleConfig.bg} ${roleConfig.text}`}
        >
          {roleConfig.label}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-slate-900">
              {userInfo.name}
            </p>
            <p className="text-xs text-slate-500">
              {userInfo.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
