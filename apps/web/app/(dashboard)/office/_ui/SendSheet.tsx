"use client";

import { useId, useState } from "react";
import { GlassButton, GlassSheet, glassButtonClass } from "@/components/glass";
import { mailtoHref, shareMessage, smsHref } from "@/lib/office";
import { CopyIcon, MailIcon, OpenIcon, TextIcon } from "./ui";

// Folha "Send": o link público do orçamento/fatura e quatro jeitos de mandar — copiar, SMS com
// texto pronto para o celular do cliente, e-mail e abrir para conferir. A plataforma não manda
// nada sozinha: o dono escolhe o canal (como ele já fala com o cliente).

export type SendTarget = {
  name: string;
  phone: string | null;
  email: string | null;
};

export function SendSheet({
  open,
  onClose,
  url,
  kind,
  number,
  companyName,
  client,
  totalCents,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  kind: "estimate" | "invoice";
  number: number;
  companyName: string;
  client: SendTarget;
  totalCents: number;
}) {
  const ids = useId();
  const [copied, setCopied] = useState("");
  const noun = kind === "estimate" ? "estimate" : "invoice";
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
      setCopied("Couldn't copy. Select the link and copy it.");
    }
    window.setTimeout(() => setCopied(""), 3000);
  }

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
      <label htmlFor={`${ids}-url`} className="block text-[13px] font-medium text-ink">
        Link for your customer
      </label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input
          id={`${ids}-url`}
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 w-full min-w-0 rounded-xl border border-slate-300/80 bg-white/80 px-3 text-base text-ink focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none sm:text-[15px]"
        />
        <GlassButton variant="primary" icon={<CopyIcon />} onClick={() => void copy()}>
          Copy link
        </GlassButton>
      </div>
      <p role="status" className="mt-1.5 text-[13px] font-medium text-emerald-700 empty:hidden">
        {copied}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {/* sms: e mailto: em <a> comum (não é navegação do Next). */}
        <a
          href={smsHref(client.phone, message)}
          className={glassButtonClass({ variant: "secondary" })}
        >
          <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
            <TextIcon />
          </span>
          Text it
        </a>
        <a
          href={mailtoHref(client.email, subject, message)}
          className={glassButtonClass({ variant: "secondary" })}
        >
          <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
            <MailIcon />
          </span>
          Email it
        </a>
        <GlassButton
          href={url}
          variant="secondary"
          icon={<OpenIcon />}
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
        >
          Open
        </GlassButton>
      </div>
      {!client.phone && !client.email && (
        <p className="mt-3 text-[13px] leading-5 text-slate-500">
          This client has no phone or email saved. Add them on the client&rsquo;s page to text or
          email in one tap.
        </p>
      )}
    </GlassSheet>
  );
}
