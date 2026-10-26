"use client";

import { ClientResponse, type ClientStage } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ConfirmDialog,
  GlassButton,
  GlassMenu,
  GlassSheet,
  SpinnerIcon,
  type GlassMenuItem,
} from "@/components/glass";
import { CLIENT_STAGES, STAGE_LABELS, directionsHref, phoneHref } from "@/lib/clients";
import {
  clientUrl,
  clientsApi,
  clientsApiNoContent,
  toClientsError,
  type ClientsApiError,
} from "./api";
import {
  CopyIcon,
  DirectionsIcon,
  MailIcon,
  OpenIcon,
  PhoneIcon,
  StageIcon,
  TextIcon,
  TrashIcon,
} from "./ui";

// Menu "⋯" de um cliente (linha da lista, cartão do quadro e topo da ficha): ligar, mandar SMS,
// e-mail, rota, mudar de etapa e apagar (com confirmação). No modo "ver como" do admin
// (`readOnly`) só ficam os atalhos que não mudam nada.

export type ClientMenuClient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  stage: ClientStage;
};

export function ClientMenu({
  client,
  readOnly = false,
  context = "row",
  triggerVariant = "ghost",
}: {
  client: ClientMenuClient;
  readOnly?: boolean;
  /** "row"/"board": tem "Open" e mudar de etapa; "detail": a ficha já mostra a etapa. */
  context?: "row" | "board" | "detail";
  triggerVariant?: "ghost" | "secondary";
}) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [problem, setProblem] = useState<ClientsApiError | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  // As folhas só entram na página depois da primeira vez (a lista tem um menu por cliente).
  const [confirmMounted, setConfirmMounted] = useState(false);

  const busy = moving || refreshing;

  async function moveTo(stage: ClientStage) {
    setMoving(true);
    try {
      await clientsApi(clientUrl(client.id), ClientResponse, {
        method: "PATCH",
        body: { stage },
      });
      startRefresh(() => router.refresh());
    } catch (err) {
      setProblem(toClientsError(err));
    } finally {
      setMoving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await clientsApiNoContent(clientUrl(client.id), { method: "DELETE" });
      setConfirmOpen(false);
      if (context === "detail") router.push("/clients");
      router.refresh();
    } catch (err) {
      setDeleteError(toClientsError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copied");
    } catch {
      setCopied("Couldn't copy");
    }
    window.setTimeout(() => setCopied(""), 2500);
  }

  const items: GlassMenuItem[] = [];
  if (context !== "detail") {
    items.push({
      type: "link",
      label: "Open client",
      href: `/clients/${encodeURIComponent(client.id)}`,
      icon: <OpenIcon />,
    });
  }
  if (client.phone) {
    const tel = phoneHref(client.phone);
    items.push(
      { type: "link", label: "Call", href: `tel:${tel}`, icon: <PhoneIcon />, key: "call" },
      { type: "link", label: "Text", href: `sms:${tel}`, icon: <TextIcon />, key: "text" },
    );
  }
  if (client.email) {
    items.push({
      type: "link",
      label: "Email",
      href: `mailto:${client.email}`,
      icon: <MailIcon />,
      key: "email",
    });
  }
  if (client.address) {
    items.push({
      type: "link",
      label: "Directions",
      href: directionsHref(client.address),
      icon: <DirectionsIcon />,
      external: true,
      key: "directions",
    });
  }
  if (context === "detail") {
    if (client.phone) {
      const phone = client.phone;
      items.push({
        label: "Copy phone number",
        icon: <CopyIcon />,
        onSelect: () => void copy(phone),
      });
    }
    if (client.email) {
      const email = client.email;
      items.push({
        label: "Copy email",
        icon: <CopyIcon />,
        onSelect: () => void copy(email),
      });
    }
  }
  if (!readOnly && context !== "detail") {
    items.push({ type: "separator", key: "stage-sep" });
    for (const stage of CLIENT_STAGES) {
      if (stage === client.stage) continue;
      items.push({
        label: `Move to ${STAGE_LABELS[stage]}`,
        icon: <StageIcon />,
        onSelect: () => void moveTo(stage),
        disabled: busy,
        key: `stage-${stage}`,
      });
    }
  }
  if (!readOnly) {
    items.push(
      { type: "separator", key: "delete-sep" },
      {
        label: "Delete client",
        icon: <TrashIcon />,
        destructive: true,
        onSelect: () => {
          setDeleteError(null);
          setConfirmMounted(true);
          setConfirmOpen(true);
        },
        key: "delete",
      },
    );
  }

  return (
    <>
      <GlassMenu
        items={items}
        label={`More actions for ${client.name}`}
        triggerVariant={triggerVariant}
        triggerIcon={busy ? <SpinnerIcon /> : undefined}
      />
      <span aria-live="polite" className="sr-only">
        {busy ? `Moving ${client.name}…` : ""}
      </span>
      {/* Aviso de "copiado" ao lado do botão (nada de `fixed`: dentro de um cartão de vidro ele
          ficaria preso ao cartão por causa do backdrop-filter). */}
      <span role="status" className="text-[13px] font-medium text-emerald-700 empty:hidden">
        {copied}
      </span>

      {confirmMounted && (
        <ConfirmDialog
          open={confirmOpen}
          title={`Delete ${client.name}?`}
          confirmLabel="Delete client"
          pendingLabel="Deleting…"
          pending={deleting}
          error={deleteError}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmOpen(false)}
        >
          Their contact details, notes and job history are erased. Messages from your website stay
          in your site&rsquo;s inbox. This can&rsquo;t be undone.
        </ConfirmDialog>
      )}

      {problem && (
        <GlassSheet
          open
          onClose={() => setProblem(null)}
          title={`Couldn't update ${client.name}`}
          description={problem?.message}
          size="sm"
          footer={
            <GlassButton variant="primary" onClick={() => setProblem(null)}>
              OK
            </GlassButton>
          }
        />
      )}
    </>
  );
}
