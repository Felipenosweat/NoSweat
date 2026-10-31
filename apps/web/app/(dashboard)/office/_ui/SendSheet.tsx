"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { fieldClass, labelClass } from "@/components/DashboardUi";
import { GlassButton, GlassSheet, Notice, glassButtonClass } from "@/components/glass";
import { mailtoHref, shareMessage, smsHref } from "@/lib/office";
import { CopyIcon, MailIcon, OpenIcon, TextIcon } from "./ui";

// Folha "Send": o link público do orçamento/fatura e os jeitos de mandar. O botão grande é o
// canal mais provável: SMS com texto pronto se o cliente tem telefone, senão e-mail, senão copiar
// o link. O resto fica embaixo, secundário. A plataforma não manda nada sozinha: o dono escolhe o
// canal (como ele já fala com o cliente).

export type SendTarget = {
  name: string;
  phone: string | null;
  email: string | null;
};

/** Ícone dentro de um <a> montado à mão (mesmo tamanho do <GlassButton icon>). */
function LinkIcon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
      {children}
    </span>
  );
}

export function SendSheet({
  open,
  onClose,
  url,
  kind,
  number,
  companyName,
  client,
  totalCents,
  missingPaymentInstructions = false,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  kind: "estimate" | "invoice";
  number: number;
  companyName: string;
  client: SendTarget;
  totalCents: number;
  /** Fatura sem "How to pay" nas configurações: avisa que o cliente não vai ver como pagar. */
  missingPaymentInstructions?: boolean;
}) {
  const ids = useId();
  const [copied, setCopied] = useState("");
  // A caixa com o link só aparece se copiar falhar (para a pessoa copiar à mão).
  const [showUrl, setShowUrl] = useState(false);
  const noun = kind === "estimate" ? "estimate" : "invoice";
  const firstName = client.name.trim().split(/\s+/)[0] ?? "";
  const message = shareMessage({
    kind,
    companyName,
    clientName: client.name,
    number,
    url,
    totalCents,
  });
  const subject = `${kind === "estimate" ? "Estimate" : "Invoice"} #${number}${
    companyName ? ` from ${companyName}` : ""
  }`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("Link copied");
    } catch {
      setShowUrl(true);
      setCopied("Couldn't copy. Select the link and copy it.");
    }
    window.setTimeout(() => setCopied(""), 3000);
  }

  // Canal principal: telefone → SMS; só e-mail → e-mail; nenhum → copiar o link.
  const primary: "text" | "email" | "copy" = client.phone
    ? "text"
    : client.email
      ? "email"
      : "copy";

  // sms: e mailto: em <a> comum (não é navegação do Next).
  const textLink = (variant: "primary" | "secondary") => (
    <a
      key="text"
      href={smsHref(client.phone, message)}
      className={glassButtonClass({ variant, fullWidth: true })}
    >
      <LinkIcon>
        <TextIcon />
      </LinkIcon>
      {variant === "primary" && firstName ? `Text it to ${firstName}` : "Text it"}
    </a>
  );
  const emailLink = (variant: "primary" | "secondary") => (
    <a
      key="email"
      href={mailtoHref(client.email, subject, message)}
      className={glassButtonClass({ variant, fullWidth: true })}
    >
      <LinkIcon>
        <MailIcon />
      </LinkIcon>
      Email it
    </a>
  );
  const copyButton = (variant: "primary" | "secondary") => (
    <GlassButton
      key="copy"
      variant={variant}
      icon={<CopyIcon />}
      onClick={() => void copy()}
      fullWidth
    >
      Copy link
    </GlassButton>
  );

  const secondary =
    primary === "text"
      ? [emailLink("secondary"), copyButton("secondary")]
      : primary === "email"
        ? [textLink("secondary"), copyButton("secondary")]
        : [textLink("secondary"), emailLink("secondary")];

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title={`Send ${noun} #${number}`}
      description={
        kind === "estimate"
          ? `${client.name} can open this link, see the price and approve it from their phone.`
          : `${client.name} can open this link to see what they owe and how to pay.`
      }
      footer={
        <GlassButton variant="secondary" onClick={onClose}>
          Done
        </GlassButton>
      }
    >
      {missingPaymentInstructions && (
        <Notice tone="warning" size="sm" role={null} className="mb-4">
          Your customer won&rsquo;t see how to pay.{" "}
          <Link
            href="/office/settings"
            className="font-semibold underline underline-offset-4 hover:no-underline"
          >
            Add payment instructions in Business settings
          </Link>
          .
        </Notice>
      )}

      {primary === "text"
        ? textLink("primary")
        : primary === "email"
          ? emailLink("primary")
          : copyButton("primary")}

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {secondary}
        <GlassButton
          href={url}
          variant="secondary"
          icon={<OpenIcon />}
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
          fullWidth
          className="sm:col-span-2"
        >
          See what they see
        </GlassButton>
      </div>

      <p role="status" className="mt-2 text-[13px] font-medium text-emerald-700 empty:hidden">
        {copied}
      </p>

      {showUrl && (
        <div className="mt-3">
          <label htmlFor={`${ids}-url`} className={labelClass}>
            Link for your customer
          </label>
          <input
            id={`${ids}-url`}
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className={`${fieldClass} mt-1.5 h-11 min-w-0`}
          />
        </div>
      )}

      {!client.phone && !client.email && (
        <p className="mt-3 text-[13px] leading-5 text-(--glass-fg-muted)">
          This client has no phone or email saved. Add them on the client&rsquo;s page to text or
          email in one tap.
        </p>
      )}
    </GlassSheet>
  );
}
