"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";

export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUserId: string;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);
const STORAGE_KEY = "demo-role";

const ROLES: Role[] = ["EMPLOYEE", "MANAGER", "ADMIN"];
const DEFAULT_ROLE: Role = "EMPLOYEE";

function isRole(value: string | null): value is Role {
  return ROLES.includes(value as Role);
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(DEFAULT_ROLE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem(STORAGE_KEY);
    if (isRole(savedRole)) {
      setRoleState(savedRole);
    }
    setMounted(true);
  }, []);

  const setRole = useCallback((newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEY, newRole);
  }, []);

  const userIds: Record<Role, string> = {
    EMPLOYEE: "emp1",
    MANAGER: "mgr1",
    ADMIN: "adm1",
  };

  return (
    <RoleContext.Provider
      value={{ role, setRole, currentUserId: userIds[role], isLoading: !mounted }}
    >
      {mounted ? children : <div>Loading...</div>}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}
