"use client";

import { useEffect } from "react";

/**
 * Faz o fade-out do splash de inicialização (#auge-splash, renderizado no HTML
 * estático do root layout) logo após a hidratação do app. Um tempo mínimo de
 * exibição deixa a transição suave/intencional em vez de um piscar. Há ainda
 * uma animação de segurança no CSS que esconde o splash caso o JS nunca rode.
 */
export function SplashDismiss() {
  useEffect(() => {
    const el = document.getElementById("auge-splash");
    if (!el) return;
    const t = setTimeout(() => {
      el.setAttribute("data-hidden", "true");
    }, 420);
    return () => clearTimeout(t);
  }, []);

  return null;
}
