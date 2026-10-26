import type { EstimateStatus, InvoiceStatus } from "@nosweat/schema";
import type { ReactNode, SVGProps } from "react";
import { GlassBadge, GlassSegmentedLinks } from "@/components/glass";
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_TONES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONES,
} from "@/lib/office";

// Peças visuais do escritório (orçamentos, faturas, tabela de preços, configurações). Sem
// "use client": servem para server e client components. Campos e títulos são os mesmos do módulo
// de clientes (mesma linguagem em todo o painel).

export {
  CalendarIcon,
  CopyIcon,
  MailIcon,
  OpenIcon,
  PhoneIcon,
  PlusIcon,
  TextIcon,
  TrashIcon,
  choicePill,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
  sectionTitle,
} from "../../clients/ui";

/** Esqueleto (bloco cinza pulsando) das telas de carregamento. */
export const skeletonBlock = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export function EstimateBadge({ status, size }: { status: EstimateStatus; size?: "sm" | "md" }) {
  return (
    <GlassBadge tone={ESTIMATE_STATUS_TONES[status]} size={size}>
      {ESTIMATE_STATUS_LABELS[status]}
    </GlassBadge>
  );
}

export function InvoiceBadge({ status, size }: { status: InvoiceStatus; size?: "sm" | "md" }) {
  return (
    <GlassBadge tone={INVOICE_STATUS_TONES[status]} size={size}>
      {INVOICE_STATUS_LABELS[status]}
    </GlassBadge>
  );
}

/** Abas "Settings · Price book · Team" do escritório. */
export function OfficeTabs({ current }: { current: "settings" | "price-book" }) {
  return (
    <GlassSegmentedLinks
      aria-label="Office"
      items={[
        { href: "/office/settings", label: "Settings", current: current === "settings" },
        { href: "/office/price-book", label: "Price book", current: current === "price-book" },
        { href: "/team", label: "Team" },
      ]}
    />
  );
}

/** Linha "rótulo ........ valor" dos totais. */
export function TotalRow({
  label,
  value,
  strong = false,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
  tone?: "emerald" | "red";
}) {
  const color =
    tone === "emerald" ? "text-emerald-700" : tone === "red" ? "text-red-700" : "text-ink";
  return (
    <div
      className={
        strong
          ? "flex items-baseline justify-between gap-4 border-t border-(--glass-rim) pt-3"
          : "flex items-baseline justify-between gap-4"
      }
    >
      <dt className={strong ? "text-[15px] font-semibold text-ink" : "text-[15px] text-slate-600"}>
        {label}
      </dt>
      <dd
        className={
          strong
            ? `font-display text-xl font-semibold tabular-nums ${color}`
            : `text-[15px] tabular-nums ${color}`
        }
      >
        {value}
      </dd>
    </div>
  );
}

// ---------- ícones (traço 1.75, grade 24, como os do módulo de clientes) ----------

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const EstimateIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3.5h8.5L19 8v12.5H6z" />
    <path d="M14 3.5V8h5M9 12.5h7M9 16h4.5" />
  </Icon>
);

export const InvoiceIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5L6 20.5z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </Icon>
);

export const SendIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4z" />
  </Icon>
);

export const PrintIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 8V3.5h10V8M7 16.5H4.5V10a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v6.5H17" />
    <path d="M7 13.5h10v7H7z" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const XIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
);

export const BookIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
    <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6" />
  </Icon>
);

export const CashIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6.5 9.5v.01M17.5 14.5v.01" />
  </Icon>
);

export const ConvertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 8h12.5M13 4.5 16.5 8 13 11.5M20 16H7.5M11 12.5 7.5 16l3.5 3.5" />
  </Icon>
);

export const SlashIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 18 12-12" />
  </Icon>
);

export const PencilIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 19.5 5.5 15 15.5 5a2 2 0 0 1 3 3l-10 10z" />
    <path d="m13.5 7 3 3" />
  </Icon>
);

export const UserIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Icon>
);
