"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { GlassButton, GlassSheet } from "@/components/glass";
import { ClientForm } from "./ClientForm";
import { PlusIcon } from "./ui";

// "Add client": abre o cadastro numa folha de vidro na mesma tela (responde na hora, sem esperar
// a navegação). É um link para /clients/new por baixo: sem JavaScript (ou com Ctrl/⌘+clique) a
// página própria abre normalmente.

export function AddClientButton({
  variant = "primary",
  label = "Add client",
}: {
  variant?: "primary" | "secondary";
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Muda a cada abertura: o formulário recomeça vazio.
  const [formKey, setFormKey] = useState(0);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // Abrir em outra aba/janela continua indo para a página.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    setFormKey((key) => key + 1);
    setOpen(true);
  }

  return (
    <>
      <GlassButton
        href="/clients/new"
        variant={variant}
        icon={<PlusIcon />}
        onClick={onClick}
        prefetch={false}
      >
        {label}
      </GlassButton>
      <GlassSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add client"
        description="For people you already work with. Messages from your website's contact form are added on their own."
        size="lg"
      >
        {open && (
          <ClientForm
            key={formKey}
            onCancel={() => setOpen(false)}
            onCreated={(id) => {
              setOpen(false);
              router.push(`/clients/${encodeURIComponent(id)}`);
              router.refresh();
            }}
          />
        )}
      </GlassSheet>
    </>
  );
}
