"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FollowUpFormDialog,
  type FollowUpTemplateOption,
} from "@/components/personal/FollowUpFormDialog";

// Wrapper client p/ controlar abertura do dialog dentro de uma page server-side.
export function SendFollowUpButton({
  studentId,
  templates,
}: {
  studentId: string;
  templates: FollowUpTemplateOption[];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Send size={14} aria-hidden /> Enviar formulário
      </Button>
      <FollowUpFormDialog
        studentId={studentId}
        templates={templates}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
