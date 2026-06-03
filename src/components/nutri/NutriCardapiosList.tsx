"use client";

import * as React from "react";
import Link from "next/link";
import { MoreVertical, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { deleteMealPlan } from "@/lib/actions/nutri-meal-plans";

export interface CardapioRow {
  id: string;
  name: string;
  studentName: string;
  studentAvatarUrl: string | null;
  startDate: string;
  endDate: string | null;
  mealCount: number;
  isActive: boolean;
  isPaused: boolean;
  targetCalories: number | null;
}

export function NutriCardapiosList({ rows }: { rows: CardapioRow[] }) {
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteMealPlan(id);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {rows.map((r) => (
        <Card key={r.id} variant="default" className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Avatar
              src={r.studentAvatarUrl ?? undefined}
              name={r.studentName}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/nutri/cardapios/${r.id}`}
                className="text-body-lg font-semibold text-text-primary hover:text-accent truncate block"
              >
                {r.name}
              </Link>
              <p className="text-caption text-text-muted truncate">
                {r.studentName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(r.id, r.name)}
              aria-label="Excluir cardápio"
              className="text-text-secondary hover:text-error p-1"
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
            {r.isPaused ? (
              <Badge variant="warning">pausado</Badge>
            ) : r.isActive ? (
              <Badge variant="concluido">ativo</Badge>
            ) : (
              <Badge variant="pulado">inativo</Badge>
            )}
            <span>·</span>
            <span>{r.mealCount} refeições</span>
            {r.targetCalories && (
              <>
                <span>·</span>
                <span className="tnum">{r.targetCalories} kcal/dia</span>
              </>
            )}
          </div>

          <p className="text-caption text-text-muted">
            Início: {r.startDate}
            {r.endDate && ` · Fim: ${r.endDate}`}
          </p>
        </Card>
      ))}
    </div>
  );
}
