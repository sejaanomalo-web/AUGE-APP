import { Sidebar } from "@/components/shared/Sidebar";
import { AppHeader } from "@/components/shared/AppHeader";
import { PageTransition } from "@/components/shared/PageTransition";
import { BottomNav, alunoSidebarItems } from "@/components/aluno/BottomNav";
import { InstallPWAPrompt } from "@/components/notifications/InstallPWAPrompt";
import { AppLockGate } from "@/components/shared/AppLockGate";
import { userHasPasskey } from "@/lib/actions/passkeys";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasPasskey = await userHasPasskey();
  return (
    <AppLockGate hasPasskey={hasPasskey}>
      <div className="min-h-screen bg-bg-base">
        <Sidebar items={alunoSidebarItems} homeHref="/hoje" />
        <div className="lg:pl-60 flex flex-col min-h-screen">
          <AppHeader perfilHref="/perfil" homeHref="/hoje" />
          <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+96px)] lg:pb-12 px-4 lg:px-8 py-6 lg:py-8">
            <PageTransition>{children}</PageTransition>
          </main>
          <BottomNav />
          <InstallPWAPrompt />
        </div>
      </div>
    </AppLockGate>
  );
}
