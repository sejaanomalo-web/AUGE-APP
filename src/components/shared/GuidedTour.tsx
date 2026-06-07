"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

export interface TourStep {
  /** CSS selector do elemento a destacar. Ausente = card centralizado. */
  selector?: string;
  title: string;
  body: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const GAP = 12;
const TOOLTIP_W = 300;

function findVisible(selector: string): HTMLElement | null {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  );
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && el.offsetParent !== null) return el;
  }
  return els[0] ?? null;
}

/**
 * Tour guiado com "spotlight": escurece a tela e recorta um destaque ao redor
 * do elemento real (via box-shadow gigante), com um tooltip e os controles
 * Pular / Voltar / Próximo. Os passos apontam para elementos marcados com
 * data-tour="..." que já estão na tela (toggle, barra inferior, menu).
 */
export function GuidedTour({
  open,
  steps,
  onClose,
}: {
  open: boolean;
  steps: TourStep[];
  onClose: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);

  React.useEffect(() => setMounted(true), []);

  // Reinicia no passo 0 toda vez que abre.
  React.useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = steps[index];

  const measure = React.useCallback(() => {
    if (!step?.selector) {
      setRect(null);
      return;
    }
    const el = findVisible(step.selector);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      setRect(null);
      return;
    }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  React.useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onChange = () => measure();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [open, measure]);

  // Trava o scroll do body enquanto o tour está aberto.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open || !step) return null;

  const isLast = index === steps.length - 1;
  const isFirst = index === 0;
  const next = () => (isLast ? onClose() : setIndex((i) => i + 1));
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Posição do tooltip.
  let tooltipStyle: React.CSSProperties;
  if (rect) {
    const placeBelow = rect.top < vh / 2;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - TOOLTIP_W / 2, 12),
      vw - TOOLTIP_W - 12,
    );
    tooltipStyle = placeBelow
      ? { top: rect.top + rect.height + PAD + GAP, left }
      : {
          top: rect.top - PAD - GAP,
          left,
          transform: "translateY(-100%)",
        };
  } else {
    tooltipStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal aria-label="Tutorial">
      {rect ? (
        // Spotlight: caixa no elemento + box-shadow gigante escurece o resto.
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
            border: "2px solid rgb(var(--accent))",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/72" />
      )}

      {/* Tooltip / card */}
      <div
        className="absolute w-[300px] max-w-[calc(100vw-24px)] bg-bg-elevated border border-border-subtle rounded-2xl shadow-xl p-4 pulse-line"
        style={tooltipStyle}
      >
        <p className="text-stat-label uppercase text-accent mb-1">
          {index + 1} / {steps.length}
        </p>
        <h3 className="text-body-lg font-bold text-text-primary">
          {step.title}
        </h3>
        <p className="mt-1 text-body text-text-secondary">{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="link" size="sm" onClick={onClose}>
            Pular
          </Button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="secondary" size="sm" onClick={prev}>
                Voltar
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={next}>
              {isLast ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
