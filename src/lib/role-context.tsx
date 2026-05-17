"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUserId: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("EMPLOYEE");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("demo-role") as Role | null;
    if (savedRole && ["EMPLOYEE", "MANAGER", "ADMIN"].includes(savedRole)) {
      setRoleState(savedRole);
    }
    setMounted(true);
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("demo-role", newRole);
  };

  // Demo user IDs
  const userIds: Record<Role, string> = {
    EMPLOYEE: "emp1",
    MANAGER: "mgr1",
    ADMIN: "adm1",
  };

  return (
    <RoleContext.Provider value={{ role, setRole, currentUserId: userIds[role] }}>
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
