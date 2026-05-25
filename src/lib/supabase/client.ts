"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Cliente Supabase no browser autenticado via Clerk (Native Third-Party Auth).
 * O `accessToken` é resolvido on-demand pela Supabase SDK em cada request e
 * em cada handshake do Realtime — as RLS policies enxergam o Clerk userId
 * em `auth.jwt() ->> 'sub'`.
 *
 * Memoizado para manter uma única instância (e um único websocket de Realtime)
 * durante o ciclo de vida do componente. `getToken` lê a sessão atual a cada
 * invocação, então o closure continua correto após renders.
 */
export function useSupabaseClient(): SupabaseClient {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          accessToken: async () => (await getToken()) ?? null,
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
