import type { ClientStage } from "@nosweat/schema";
import type { ReactNode, SVGProps } from "react";
import { sectionTitle as baseSectionTitle } from "@/components/DashboardUi";
import { GlassBadge, cx } from "@/components/glass";
import {
  STAGE_LABELS,
  STAGE_TONES,
  followUpState,
  formatDateOnly,
  initialsOf,
} from "@/lib/clients";

// Peças visuais do módulo de clientes (Liquid Glass). Sem "use client": servem para server e
// client components.

/**
 * Campo de texto sobre o vidro: claro e legível, 16px no celular (o iOS não dá zoom no campo) e
 * 44px de altura mínima nos de uma linha (quem usa põe `h-11`).
 */
export const fieldClass =
  "w-full rounded-xl border border-slate-300/80 bg-white/80 px-3 text-base text-ink placeholder:text-slate-500 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500 sm:text-[15px]";

export const labelClass = "block text-[13px] font-medium text-ink";

export const hintClass = "mt-1.5 text-[13px] leading-5 text-slate-500";

export const fieldErrorClass = "mt-1.5 text-[13px] leading-5 text-red-700";

/** Opção em cápsula (rádio escondido dentro do <label>): etapa, tipo de registro. */
export const choicePill =
  "glass glass-flat glass-interactive flex min-h-11 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold text-(--glass-fg) has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand has-disabled:cursor-not-allowed has-disabled:opacity-60";

// Título de seção: o mesmo do painel inteiro (DashboardUi).
export const sectionTitle = baseSectionTitle;

/** Selo da etapa do cliente. */
export function StageBadge({ stage, size }: { stage: ClientStage; size?: "sm" | "md" }) {
  return (
    <GlassBadge tone={STAGE_TONES[stage]} size={size}>
      {STAGE_LABELS[stage]}
    </GlassBadge>
  );
}

/** Selo do retorno: vermelho se venceu, âmbar se é hoje, neutro se ainda vai chegar. */
export function FollowUpBadge({
  date,
  today,
  size,
}: {
  date: string;
  today: string;
  size?: "sm" | "md";
}) {
  const state = followUpState(date, today);
  if (state === "overdue") {
    return (
      <GlassBadge tone="danger" size={size}>
        Overdue · {formatDateOnly(date, today)}
      </GlassBadge>
    );
  }
  if (state === "today") {
    return (
      <GlassBadge tone="pending" size={size}>
        Follow up today
      </GlassBadge>
    );
  }
  return (
    <GlassBadge tone="neutral" size={size} dot={false}>
      <CalendarIcon className="size-3.5 opacity-70" />
      {formatDateOnly(date, today)}
    </GlassBadge>
  );
}

/**
 * Etiquetas do dono em cápsulas pequenas. Feita de <span> (com papel de lista) para poder ficar
 * dentro de links e de textos.
 */
export function TagList({ tags, className }: { tags: readonly string[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <span role="list" aria-label="Tags" className={cx("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span role="listitem" key={tag}>
          <GlassBadge tone="neutral" size="sm" dot={false}>
            {tag}
          </GlassBadge>
        </span>
      ))}
    </span>
  );
}

const AVATAR_SIZES = {
  sm: "size-9 text-[13px]",
  md: "size-11 text-sm",
  lg: "size-16 text-xl",
} as const;

/** Avatar com as iniciais (cor da marca sobre vidro). */
export function Avatar({
  name,
  size = "sm",
  className,
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "glass-edge grid shrink-0 place-items-center rounded-full bg-brand/10 font-display font-semibold text-brand",
        AVATAR_SIZES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
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
      focusable="false"
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

export const DirectionsIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" />
    <path d="M9 14v-2.5a1.5 1.5 0 0 1 1.5-1.5H15m-2-2 2 2-2 2" />
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

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CalendarIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14" />
  </Icon>
);

export const ListIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <circle cx="4.75" cy="6.5" r="0.75" fill="currentColor" />
    <circle cx="4.75" cy="12" r="0.75" fill="currentColor" />
    <circle cx="4.75" cy="17.5" r="0.75" fill="currentColor" />
  </Icon>
);

export const BoardIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="4" width="5" height="16" rx="1.5" />
    <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
    <rect x="15.5" y="4" width="5" height="13" rx="1.5" />
  </Icon>
);

export const MoneyIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5v17M16 7.5c-.6-1.3-2.1-2-4-2-2.3 0-4 1.1-4 3s1.7 2.6 4 3.1 4 1.3 4 3.2-1.7 3.2-4 3.2c-2 0-3.6-.8-4.2-2.2" />
  </Icon>
);

export const TrophyIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" />
  </Icon>
);

export const InboxIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 13.5 6.5 5h11l2.5 8.5V19H4z" />
    <path d="M4 13.5h4.5l1 2h5l1-2H20" />
  </Icon>
);

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 7h15M10 7V4.5h4V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />
  </Icon>
);

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </Icon>
);

export const OpenIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 4.5h5.5V10M19.5 4.5 11 13M17 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10" />
  </Icon>
);
