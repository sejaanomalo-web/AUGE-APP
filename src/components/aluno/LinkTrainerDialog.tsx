"use client";

import * as React from "react";
import { Check, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  consumeInviteCode,
  validateInviteCode,
} from "@/lib/actions/invites";

export function LinkTrainerDialog() {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validation, setValidation] = React.useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "valid"; trainerName: string }
    | { state: "invalid"; reason: string }
  >({ state: "idle" });

  React.useEffect(() => {
    if (code.length === 0) {
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
        if (!cancelled)
          setValidation({ state: "invalid", reason: "Erro ao validar" });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [code]);

  async function submit() {
    if (validation.state !== "valid") return;
    setSubmitting(true);
    setError(null);
    try {
      await consumeInviteCode(code);
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        <UserPlus size={16} aria-hidden /> Vincular personal
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setCode("");
            setError(null);
            setValidation({ state: "idle" });
          }
          setOpen(o);
        }}
        title="Vincular um personal"
        description="Cole o código de 6 caracteres que seu personal te passou."
      >
        <div className="flex flex-col gap-4">
          <Field label="Código de convite" htmlFor="link-code">
            <div className="relative">
              <Input
                id="link-code"
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
                className="font-bold tracking-[0.25em] text-center text-[24px] tnum"
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
              "rounded-md p-3 text-body",
              validation.state === "valid" && "bg-success/10 text-success",
              validation.state === "invalid" && "bg-error/10 text-error",
              validation.state === "idle" && "bg-bg-elevated text-text-muted",
              validation.state === "checking" &&
                "bg-bg-elevated text-text-secondary",
            )}
          >
            {validation.state === "valid" &&
              `${validation.trainerName} será seu personal.`}
            {validation.state === "invalid" && validation.reason}
            {validation.state === "checking" && "Validando código..."}
            {validation.state === "idle" &&
              "Digite o código de 6 caracteres para validar."}
          </div>

          {error && (
            <p className="text-body text-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={submit}
              disabled={submitting || validation.state !== "valid"}
            >
              {submitting ? "Vinculando..." : "Vincular"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
