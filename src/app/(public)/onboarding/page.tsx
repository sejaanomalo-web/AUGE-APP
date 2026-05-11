"use client";

import { useRouter } from "next/navigation";
import { Dumbbell, Users } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export default function OnboardingPage() {
  const router = useRouter();

  function pick(role: "aluno" | "personal") {
    if (role === "personal") {
      router.push("/dashboard?role=personal");
    } else {
      router.push("/hoje");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl text-center">
        <Logo size="md" />
        <h1 className="mt-8 text-h1 text-text-primary">
          Como você vai usar o ꓥuge?
        </h1>
        <p className="mt-2 text-body-lg text-text-secondary">
          Escolha seu perfil para personalizar a experiência.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => pick("aluno")}
            className="group bg-bg-surface rounded-md p-6 sm:p-8 text-left transition-all duration-200 hover:bg-bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Dumbbell
              size={40}
              className="text-accent group-hover:scale-110 transition-transform"
              aria-hidden
            />
            <h2 className="mt-5 text-h2 text-text-primary">Sou Aluno</h2>
            <p className="mt-2 text-body text-text-secondary">
              Quero acompanhar meus treinos e evolução prescritos pelo meu
              personal.
            </p>
          </button>

          <button
            type="button"
            onClick={() => pick("personal")}
            className="group bg-bg-surface rounded-md p-6 sm:p-8 text-left transition-all duration-200 hover:bg-bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Users
              size={40}
              className="text-accent group-hover:scale-110 transition-transform"
              aria-hidden
            />
            <h2 className="mt-5 text-h2 text-text-primary">Sou Personal</h2>
            <p className="mt-2 text-body text-text-secondary">
              Quero criar treinos e acompanhar a evolução dos meus alunos.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
