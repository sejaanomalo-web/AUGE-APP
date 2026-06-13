"use client";

import { m } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Transição entre páginas: apenas ENTRADA, curta. O antigo
 * `AnimatePresence mode="wait"` serializava a animação de SAÍDA da página
 * anterior (~200ms) antes de montar a nova, somando espera a cada navegação.
 * Agora a página nova entra na hora com um fade rápido — sem bloquear.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <m.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
