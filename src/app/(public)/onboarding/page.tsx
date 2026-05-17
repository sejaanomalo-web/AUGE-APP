"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, Check, ChevronLeft, Loader2, Users } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { setUserRole } from "@/lib/actions/users";
import { validateInviteCode } from "@/lib/actions/invites";
import { cn } from "@/lib/utils";

type Role = "PERSONAL" | "ALUNO";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"role" | "details">("role");
  const [role, setRole] = React.useState<Role | null>(null);
  const [cref, setCref] = React.useState("");
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validation, setValidation] = React.useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "valid"; trainerName: string }
    | { state: "invalid"; reason: string }
  >({ state: "idle" });

  // Debounced invite code validation
  React.useEffect(() => {
    if (role !== "ALUNO" || code.length === 0) {
      setValidation({ state: "idle" });
      return;
    }
    if (code.length < 6) {
      setValidation({ state: "idle" });
      return;
    }

    let cancelled = false;
    setValidation({ state: "checking" });
    const t = setTimeout(async () => {
      try {
        const r = await validateInviteCode(code);
        if (cancelled) return;
        if (r.valid) {
          setValidation({ state: "valid", trainerName: r.trainerName });
        } else {
          setValidation({ state: "invalid", reason: r.reason });
        }
      } catch {
        if (!cancelled) setValidation({ state: "invalid", reason: "Erro ao validar" });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [code, role]);

  function pickRole(r: Role) {
    setRole(r);
    setStep("details");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    // Aluno: code is optional. If provided, must be valid.
    if (role === "ALUNO" && code.length > 0 && validation.state !== "valid") {
      setError("O código informado não é válido. Apague-o para continuar sem personal, ou corrija.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setUserRole(role, {
        cref: role === "PERSONAL" ? cref.trim() || undefined : undefined,
        // Only consume invite if code was provided and validated.
        inviteCode:
          role === "ALUNO" && code.length === 6 && validation.state === "valid"
            ? code.toUpperCase()
            : undefined,
      });
      router.push(role === "PERSONAL" ? "/dashboard" : "/hoje");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não conseguimos concluir agora.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col items-center text-center mb-10">
          <Logo size="md" />
        </div>

        {step === "role" && (
          <>
            <h1 className="text-h1 text-text-primary text-center">
              Como você vai usar o ꓥuge?
            </h1>
            <p className="mt-2 text-body-lg text-text-secondary text-center">
              Escolha seu perfil para personalizar a experiência.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => pickRole("ALUNO")}
                className="group bg-bg-surface border border-border-subtle rounded-xl p-6 sm:p-8 text-left transition-all duration-200 hover:bg-bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent pulse-line"
              >
                <Activity
                  size={40}
                  className="text-accent group-hover:scale-110 transition-transform"
                  aria-hidden
                />
                <h2 className="mt-5 text-h2 text-text-primary">Sou Aluno</h2>
                <p className="mt-2 text-body text-text-secondary">
                  Quero acompanhar meus treinos prescritos pelo personal e
                  evolução.
                </p>
              </button>

              <button
                type="button"
                onClick={() => pickRole("PERSONAL")}
                className="group bg-bg-surface border border-border-subtle rounded-xl p-6 sm:p-8 text-left transition-all duration-200 hover:bg-bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent pulse-line"
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
          </>
        )}

        {step === "details" && role && (
          <form onSubmit={submit} className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => setStep("role")}
              className="self-start inline-flex items-center gap-1 text-caption text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft size={16} aria-hidden /> Voltar
            </button>

            {role === "ALUNO" ? (
              <>
                <div>
                  <h1 className="text-h1 text-text-primary">
                    Você tem um personal?
                  </h1>
                  <p className="mt-2 text-body-lg text-text-secondary">
                    Se sim, cole o código de 6 caracteres. Se não, pode pular -
                    você cria seus próprios treinos e adiciona um personal
                    depois.
                  </p>
                </div>

                <Field label="Código de convite" htmlFor="invite-code">
                  <div className="relative">
                    <Input
                      id="invite-code"
                      placeholder="EX: A1B2C3"
                      maxLength={6}
                      value={code}
                      onChange={(e) =>
                        setCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .slice(0, 6),
                        )
                      }
                      className="font-bold tracking-normal text-center text-[24px] tnum"
                      autoFocus
                      autoComplete="off"
                    />
                    {validation.state === "checking" && (
                      <Loader2
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary animate-spin"
                      />
                    )}
                    {validation.state === "valid" && (
                      <Check
                        size={20}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-success"
                      />
                    )}
                  </div>
                </Field>

                <div
                  className={cn(
                    "rounded-md p-4 text-body",
                    validation.state === "valid" && "bg-success/10 text-success",
                    validation.state === "invalid" && "bg-error/10 text-error",
                    validation.state === "idle" && "bg-bg-elevated text-text-muted",
                    validation.state === "checking" &&
                      "bg-bg-elevated text-text-secondary",
                  )}
                >
                  {validation.state === "valid" && (
                    <>
                      <strong>{validation.trainerName}</strong> é seu personal.
                      Clica em continuar para confirmar a vinculação.
                    </>
                  )}
                  {validation.state === "invalid" && validation.reason}
                  {validation.state === "checking" && "Validando código..."}
                  {validation.state === "idle" &&
                    "Sem código? Sem problema - pula essa parte e vincule um personal depois pelo seu perfil."}
                </div>
              </>
            ) : (
              <>
                <div>
                  <h1 className="text-h1 text-text-primary">
                    Bem-vindo, personal trainer
                  </h1>
                  <p className="mt-2 text-body-lg text-text-secondary">
                    Você pode preencher seu CREF agora ou depois no perfil.
                  </p>
                </div>

                <Field label="CREF (opcional)" htmlFor="cref">
                  <Input
                    id="cref"
                    placeholder="ex: 012345-G/SP"
                    value={cref}
                    onChange={(e) => setCref(e.target.value)}
                    autoComplete="off"
                  />
                </Field>
              </>
            )}

            {error && (
              <p className="text-body text-error" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="cta"
              fullWidth
              disabled={
                submitting ||
                (role === "ALUNO" &&
                  code.length > 0 &&
                  validation.state !== "valid")
              }
            >
              {submitting
                ? "Finalizando..."
                : role === "ALUNO" && code.length === 0
                  ? "Continuar sem personal"
                  : "Continuar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
