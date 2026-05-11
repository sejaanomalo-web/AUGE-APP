"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export default function CadastroPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => router.push("/onboarding"), 400);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" />
          <p className="mt-2 text-caption text-text-muted">
            Crie sua conta em segundos.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 bg-bg-surface rounded-md p-6 shadow-lg"
        >
          <h1 className="text-h2 text-text-primary">Criar conta</h1>
          <Field label="Nome completo" htmlFor="name">
            <Input
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="Seu nome"
            />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
            />
          </Field>
          <Field label="Senha" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Mínimo 8 caracteres"
            />
          </Field>
          <Field label="Confirmar senha" htmlFor="password2">
            <Input
              id="password2"
              name="password2"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repita a senha"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="cta"
            fullWidth
            disabled={submitting}
          >
            {submitting ? "Criando..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-body text-text-secondary">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-accent font-semibold hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
