import type { ClientStage } from "@nosweat/schema";
import type { ReactNode, SVGProps } from "react";
import { StatusBadge } from "@/components/DashboardUi";
import { STAGE_LABELS, STAGE_TONES } from "@/lib/clients";

// Peças visuais do módulo de clientes. Sem "use client": servem para server e client components.

/** Classe dos campos de texto (igual ao compositor de posts). */
export const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-ink placeholder:text-slate-500 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:border-red-500";

export const labelClass = "block text-[13px] font-medium text-ink";

export const hintClass = "mt-1.5 text-[13px] leading-5 text-slate-500";

export const fieldErrorClass = "mt-1.5 text-[13px] leading-5 text-red-700";

export const pageTitle =
  "font-display text-3xl leading-tight font-bold tracking-[-0.03em] text-ink lg:text-[2.5rem]";

export const sectionTitle =
  "font-display text-[17px] leading-6 font-semibold tracking-[-0.015em] text-ink";

/** Selo da etapa do cliente. */
export function StageBadge({ stage }: { stage: ClientStage }) {
  return <StatusBadge tone={STAGE_TONES[stage]}>{STAGE_LABELS[stage]}</StatusBadge>;
}

// ---------- ícones (traço 1.75, grade 24, como os da navegação) ----------

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
      {...props}
    >
      {children}
    </svg>
  );
}

export const PhoneIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
  </Icon>
);

export const TextIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 5h16v11H8l-4 4z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </Icon>
);

export const MailIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </Icon>
);

export const PinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
);

export const NoteIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 4h14v16H5z" />
    <path d="M9 9h6M9 13h6M9 17h3" />
  </Icon>
);

export const JobIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </Icon>
);

export const StageIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.5-4.5" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
