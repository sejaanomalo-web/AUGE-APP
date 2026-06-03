import type { UserRole } from "@prisma/client";

export const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  PERSONAL: "/dashboard",
  ALUNO: "/hoje",
};
