"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

/**
 * Na landing estática (`/`), assim que o Clerk hidrata e detecta uma sessão
 * ativa, manda o usuário direto para o app (`/post-login` resolve role → home).
 * A landing continua estática e servida do cache (paint instantâneo no launch);
 * o redirect só dispara após a hidratação. Deslogado: não faz nada (vê a
 * landing normalmente). Renderiza `null` — é só efeito.
 */
export function RedirectIfSignedIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/post-login");
    }
  }, [isLoaded, isSignedIn, router]);

  return null;
}
