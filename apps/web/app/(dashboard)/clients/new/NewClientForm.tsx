"use client";

import { useRouter } from "next/navigation";
import { GlassButton } from "@/components/glass";
import { ClientForm } from "../ClientForm";

// Formulário da página /clients/new: depois de salvar, abre a ficha nova.
export function NewClientForm() {
  const router = useRouter();
  return (
    <ClientForm
      cancelSlot={
        <GlassButton href="/clients" variant="secondary">
          Cancel
        </GlassButton>
      }
      onCreated={(id) => {
        router.push(`/clients/${encodeURIComponent(id)}`);
        router.refresh();
      }}
    />
  );
}
