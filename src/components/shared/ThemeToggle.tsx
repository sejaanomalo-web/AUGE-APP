"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const isDark = (theme ?? resolvedTheme) === "dark";

  return (
    <div className="flex items-center justify-between p-4 bg-bg-surface border border-border-subtle rounded-xl pulse-line">
      <div className="flex items-center gap-3 min-w-0">
        {isDark ? (
          <Moon className="w-5 h-5 text-accent shrink-0" aria-hidden />
        ) : (
          <Sun className="w-5 h-5 text-accent shrink-0" aria-hidden />
        )}
        <div className="min-w-0">
          <div className="font-semibold text-body text-text-primary">Tema</div>
          <div className="text-caption text-text-muted">
            {isDark ? "Modo escuro ativado" : "Modo claro ativado"}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative w-12 h-7 rounded-full transition shrink-0 ${
          isDark ? "bg-bg-elevated" : "bg-accent"
        }`}
        aria-label="Alternar tema"
        aria-pressed={!isDark}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-200 ${
            isDark ? "left-1" : "left-6"
          }`}
        />
      </button>
    </div>
  );
}
