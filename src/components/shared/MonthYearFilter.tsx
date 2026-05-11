"use client";

import { X } from "lucide-react";
import { Select } from "@/components/ui/Select";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export interface MonthYearValue {
  year: number | null;
  month: number | null;
}

export function MonthYearFilter({
  value,
  onChange,
  availableYears,
  className,
}: {
  value: MonthYearValue;
  onChange: (next: MonthYearValue) => void;
  availableYears: number[];
  className?: string;
}) {
  const active = value.year !== null || value.month !== null;

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Select
        aria-label="Mês"
        value={value.month ?? ""}
        onChange={(e) =>
          onChange({
            ...value,
            month: e.target.value === "" ? null : Number(e.target.value),
          })
        }
        className="w-auto min-w-[140px]"
      >
        <option value="">Todos os meses</option>
        {MONTH_NAMES.map((name, i) => (
          <option key={i} value={i}>
            {name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Ano"
        value={value.year ?? ""}
        onChange={(e) =>
          onChange({
            ...value,
            year: e.target.value === "" ? null : Number(e.target.value),
          })
        }
        className="w-auto min-w-[110px]"
      >
        <option value="">Todos os anos</option>
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      {active && (
        <button
          type="button"
          onClick={() => onChange({ year: null, month: null })}
          className="text-text-muted hover:text-text-primary p-2"
          aria-label="Limpar filtro"
        >
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
