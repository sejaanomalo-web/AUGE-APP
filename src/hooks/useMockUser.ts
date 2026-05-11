"use client";

import { useSearchParams } from "next/navigation";
import { aluno, personal } from "@/lib/mock-data";

/**
 * Returns the currently "logged" user. Toggle via `?role=personal` query param.
 * Default is the Aluno (Bruno).
 */
export function useMockUser() {
  const search = useSearchParams();
  const role = search?.get("role");
  if (role === "personal") return personal;
  return aluno;
}
