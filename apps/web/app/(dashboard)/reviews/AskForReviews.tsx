"use client";

import { useId, useMemo, useState } from "react";
import { GlassButton, GlassCard, cx, glassButtonClass } from "@/components/glass";
import { qrPath, qrSvgDataUrl, QR_MARGIN } from "@/lib/qr";
import {
  mailtoHref,
  reviewEmailSubject,
  reviewRequestMessage,
  smsHref,
} from "@/lib/reviews";
import {
  CopyIcon,
  DownloadIcon,
  MailIcon,
  TextIcon,
  fieldClass,
  hintClass,
  labelClass,
  sectionTitle,
} from "../clients/ui";

// "Ask your clients": o link e o texto prontos para mandar por SMS ou e-mail, e um QR code para o
// balcão ou o caminhão. Nada aqui muda dados (funciona também no modo "ver como" do admin).

function QrCode({ value, className = "" }: { value: string; className?: string }) {
  const { size, path } = useMemo(() => qrPath(value), [value]);
  const box = size + QR_MARGIN * 2;
  return (
    <svg
      viewBox={`${-QR_MARGIN} ${-QR_MARGIN} ${box} ${box}`}
      role="img"
      aria-label="QR code that opens your Google review page"
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x={-QR_MARGIN} y={-QR_MARGIN} width={box} height={box} className="fill-white" />
      <path d={path} className="fill-ink" />
    </svg>
  );
}

export function AskForReviews({ link, businessName }: { link: string; businessName: string }) {
  const nameId = useId();
  const [firstName, setFirstName] = useState("");
  const [copied, setCopied] = useState("");

  const message = reviewRequestMessage({ firstName, businessName, link });
  const qrHref = useMemo(() => qrSvgDataUrl(link), [link]);

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(done);
    } catch {
      setCopied("Couldn't copy. Select the text and copy it yourself.");
    }
    window.setTimeout(() => setCopied(""), 2500);
  }

  return (
    <GlassCard as="section" aria-labelledby="ask-heading">
      <h2 id="ask-heading" className={sectionTitle}>
        Ask your clients
      </h2>
      <p className="mt-1 max-w-[60ch] text-[15px] leading-[1.6] text-slate-600">
        The best time to ask is right after a job goes well. Send the text below, or let them scan
        the QR code.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <label htmlFor={nameId} className={labelClass}>
            Client&rsquo;s first name <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="off"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            maxLength={40}
            placeholder="Ana"
            className={cx(fieldClass, "mt-1.5 h-11 max-w-xs")}
          />

          <p className={cx(labelClass, "mt-4")}>
            Message
          </p>
          <p className="glass-edge mt-1.5 rounded-xl bg-white/80 px-3.5 py-3 text-[15px] leading-[1.6] break-words text-ink"
          >
            {message}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <GlassButton
              variant="primary"
              icon={<CopyIcon />}
              onClick={() => void copy(message, "Message copied")}
            >
              Copy message
            </GlassButton>
            <a href={smsHref(null, message)} className={glassButtonClass({ variant: "secondary" })}>
              <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
                <TextIcon />
              </span>
              Text it
            </a>
            <a
              href={mailtoHref(null, reviewEmailSubject(businessName), message)}
              className={glassButtonClass({ variant: "secondary" })}
            >
              <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
                <MailIcon />
              </span>
              Email it
            </a>
            <GlassButton
              variant="ghost"
              icon={<CopyIcon />}
              onClick={() => void copy(link, "Link copied")}
            >
              Copy link only
            </GlassButton>
          </div>
          <p role="status" className="mt-2 text-[13px] font-medium text-emerald-700 empty:hidden">
            {copied}
          </p>
        </div>

        <figure className="flex flex-col items-start gap-3 lg:w-48 lg:items-center">
          <QrCode value={link} className="size-40 rounded-xl ring-1 ring-slate-200 lg:size-44" />
          <figcaption className={cx(hintClass, "mt-0 lg:text-center")}>
            Print it for your counter or truck. Clients scan it with their phone camera.
          </figcaption>
          <a
            href={qrHref}
            download="google-review-qr.svg"
            className={glassButtonClass({ variant: "secondary", size: "sm" })}
          >
            <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
              <DownloadIcon />
            </span>
            Download QR code
          </a>
        </figure>
      </div>
    </GlassCard>
  );
}
