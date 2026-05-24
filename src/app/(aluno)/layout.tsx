import { AppLockGate } from "@/components/shared/AppLockGate";
import { AlunoLayoutShell } from "@/components/shared/AlunoLayoutShell";
import { userHasPasskey } from "@/lib/actions/passkeys";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasPasskey = await userHasPasskey();
  return (
    <AppLockGate hasPasskey={hasPasskey}>
      <AlunoLayoutShell>{children}</AlunoLayoutShell>
    </AppLockGate>
  );
}
