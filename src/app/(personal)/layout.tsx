import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Library,
  User,
} from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileDrawer } from "@/components/shared/MobileDrawer";
import { AppHeader } from "@/components/shared/AppHeader";
import { PageTransition } from "@/components/shared/PageTransition";
import { AppLockGate } from "@/components/shared/AppLockGate";
import { userHasPasskey } from "@/lib/actions/passkeys";

const items = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/treinos", label: "Treinos", icon: ClipboardList },
  { href: "/exercicios", label: "Exercícios", icon: Library },
  { href: "/conta", label: "Perfil", icon: User },
];

export default async function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasPasskey = await userHasPasskey();
  return (
    <AppLockGate hasPasskey={hasPasskey}>
      <div className="min-h-screen bg-bg-base">
        <Sidebar items={items} homeHref="/dashboard" />
        <div className="lg:pl-60 flex flex-col min-h-screen">
          <AppHeader
            perfilHref="/conta"
            homeHref="/dashboard"
            mobileLeftSlot={<MobileDrawer items={items} homeHref="/dashboard" />}
          />
          <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </AppLockGate>
  );
}
