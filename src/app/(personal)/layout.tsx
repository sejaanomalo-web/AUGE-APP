import { AppLockGate } from "@/components/shared/AppLockGate";
import { PersonalLayoutShell } from "@/components/shared/PersonalLayoutShell";
import { userHasPasskey } from "@/lib/actions/passkeys";

export default async function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasPasskey = await userHasPasskey();
  return (
    <AppLockGate hasPasskey={hasPasskey}>
      <PersonalLayoutShell>{children}</PersonalLayoutShell>
    </AppLockGate>
  );
}
