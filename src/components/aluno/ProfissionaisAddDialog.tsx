"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { LinkTrainerDialog } from "./LinkTrainerDialog";

/**
 * Thin wrapper to keep the page-level signature stable while reusing the
 * existing LinkTrainerDialog (which already does dual-lookup for personal +
 * nutricionista invite codes).
 */
export function ProfissionaisAddDialog() {
  return <LinkTrainerDialog />;
}

ProfissionaisAddDialog.displayName = "ProfissionaisAddDialog";

// Re-export so the page imports don't break if we later swap the dialog impl.
export { Plus };
