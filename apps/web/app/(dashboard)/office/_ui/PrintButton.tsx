"use client";

import { GlassButton } from "@/components/glass";
import { PrintIcon } from "./ui";

// Botão "Print / Save as PDF" (a folha de impressão do navegador também salva em PDF).
export function PrintButton({
  label = "Print / Save as PDF",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <GlassButton
      variant="secondary"
      icon={<PrintIcon />}
      onClick={() => window.print()}
      className={className}
    >
      {label}
    </GlassButton>
  );
}
