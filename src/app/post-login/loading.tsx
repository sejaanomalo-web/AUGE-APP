import { Logo } from "@/components/shared/Logo";

// Splash mostrado enquanto /post-login resolve a sessão (auth + role) e
// redireciona para a home do papel. Dá continuidade ao launch: splash nativo
// → shell → este splash → skeleton da home, sem tela em branco no meio.
export default function PostLoginLoading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg-base">
      <Logo size="lg" className="text-[72px] animate-pulse" />
    </div>
  );
}
