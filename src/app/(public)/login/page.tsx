"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Mock: redirect to hoje after small delay.
    setTimeout(() => router.push("/hoje"), 400);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" />
          <p className="mt-2 text-caption text-text-muted">Atinja seu auge.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 bg-bg-surface rounded-xl p-6"
        >
          <h1 className="text-h2 text-text-primary">Entrar</h1>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
              defaultValue="bruno@auge.app"
            />
          </Field>
          <Field label="Senha" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              defaultValue="senha-mock"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="cta"
            fullWidth
            disabled={submitting}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-caption text-accent hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>

          <div className="flex items-center gap-3 my-1">
            <span className="h-px bg-border-subtle flex-1" />
            <span className="text-caption text-text-muted">ou</span>
            <span className="h-px bg-border-subtle flex-1" />
          </div>

          <Button variant="secondary" size="md" fullWidth type="button">
            Entrar com Google
          </Button>
        </form>

        <p className="mt-6 text-center text-body text-text-secondary">
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="text-accent font-semibold hover:underline"
          >
            Criar agora
          </Link>
        </p>
      </div>
    </div>
  );
}
