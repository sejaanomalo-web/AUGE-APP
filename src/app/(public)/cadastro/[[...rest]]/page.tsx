import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/shared/Logo";

export default function CadastroPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base p-4 gap-6">
      <Logo size="md" />
      <SignUp />
    </div>
  );
}
