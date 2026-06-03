"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { searchFoods, type FoodOption } from "@/lib/actions/nutri-foods";

export function FoodSelector({
  open,
  foods,
  onClose,
  onPick,
}: {
  open: boolean;
  foods: FoodOption[];
  onClose: () => void;
  onPick: (food: FoodOption) => void;
}) {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<FoodOption[]>(foods);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setRows(foods);
    }
  }, [open, foods]);

  React.useEffect(() => {
    const term = q.trim();
    if (term.length === 0) {
      setRows(foods);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchFoods(term);
        if (!cancelled) setRows(r);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, foods]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Adicionar alimento"
      description="Busque pelo nome (ex: arroz, frango, banana)."
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="pl-9"
            autoFocus
            aria-label="Buscar alimentos"
          />
          {q.length > 0 && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Limpar"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>

        {searching && (
          <p className="text-caption text-text-muted">Buscando...</p>
        )}

        <ul
          className="max-h-[50vh] overflow-y-auto flex flex-col gap-1"
          role="listbox"
        >
          {rows.length === 0 ? (
            <li className="text-body text-text-muted text-center py-6">
              Nada encontrado.
            </li>
          ) : (
            rows.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onPick(f)}
                  className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-bg-elevated text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-body text-text-primary truncate">
                      {f.name}
                    </span>
                    {f.brand && (
                      <span className="block text-caption text-text-muted truncate">
                        {f.brand}
                      </span>
                    )}
                  </span>
                  <span className="text-caption text-text-muted tnum shrink-0">
                    {f.kcalPer100g} kcal/100g
                  </span>
                  <Badge variant={f.isCustom ? "info" : "concluido"}>
                    {f.source}
                  </Badge>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </Dialog>
  );
}
