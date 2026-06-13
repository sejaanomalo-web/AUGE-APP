"use client";

import { LazyMotion } from "framer-motion";

// Padrão LazyMotion: o bundle inicial carrega apenas o runtime leve do
// componente `m` (~5 kB). O featureset completo (domMax - obrigatório porque
// GlassBottomSheet usa `drag` e NotificationSheet usa `drag` + `layout`) é
// baixado de forma assíncrona, num chunk separado, sem entrar no first-load
// JS de todas as rotas. Sem `strict` de propósito: se sobrar um `motion.*`
// esquecido em algum lugar, ele apenas perde a otimização em vez de quebrar.
const loadFeatures = () => import("framer-motion").then((mod) => mod.domMax);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
