import { TEAM_COLORS, type Job, type JobStatus, type TeamColor, type TeamMember } from "@nosweat/schema";
import type { ReactNode, SVGProps } from "react";
import { GlassBadge, cx, type GlassBadgeTone } from "@/components/glass";

// Peças visuais da agenda e da equipe (Liquid Glass). Sem "use client": servem para server e
// client components. Campos e ícones comuns vêm de ../clients/ui.

export const STATUS_LABELS: Record<JobStatus, string> = {
  unscheduled: "Unscheduled",
  scheduled: "Scheduled",
  in_progress: "In progress",
  done: "Done",
  canceled: "Canceled",
};

const STATUS_TONES: Record<JobStatus, GlassBadgeTone> = {
  unscheduled: "neutral",
  scheduled: "info",
  in_progress: "pending",
  done: "live",
  canceled: "draft",
};

export function JobStatusBadge({ status, size }: { status: JobStatus; size?: "sm" | "md" }) {
  return (
    <GlassBadge tone={STATUS_TONES[status]} size={size}>
      {STATUS_LABELS[status]}
    </GlassBadge>
  );
}

// ---------- cores da equipe ----------

type ColorStyle = {
  /** Bolinha da pessoa. */
  dot: string;
  /** Bloco do serviço na grade (fundo claro, borda à esquerda na cor, texto escuro AA). */
  block: string;
  label: string;
};

/** Classes inteiras (o Tailwind precisa achá-las no código). */
export const TEAM_COLOR_STYLES: Record<TeamColor, ColorStyle> = {
  blue: { dot: "bg-blue-500", block: "border-blue-500 bg-blue-50 text-blue-950", label: "Blue" },
  green: {
    dot: "bg-emerald-500",
    block: "border-emerald-500 bg-emerald-50 text-emerald-950",
    label: "Green",
  },
  orange: {
    dot: "bg-orange-500",
    block: "border-orange-500 bg-orange-50 text-orange-950",
    label: "Orange",
  },
  purple: {
    dot: "bg-violet-500",
    block: "border-violet-500 bg-violet-50 text-violet-950",
    label: "Purple",
  },
  pink: { dot: "bg-pink-500", block: "border-pink-500 bg-pink-50 text-pink-950", label: "Pink" },
  teal: { dot: "bg-teal-500", block: "border-teal-500 bg-teal-50 text-teal-950", label: "Teal" },
  red: { dot: "bg-red-500", block: "border-red-500 bg-red-50 text-red-950", label: "Red" },
  gray: { dot: "bg-slate-400", block: "border-slate-400 bg-slate-100 text-slate-900", label: "Gray" },
};

/** Primeira cor ainda sem dono entre os ativos (cada pessoa com a sua, quando dá). */
export function nextFreeColor(members: readonly Pick<TeamMember, "color" | "active">[]): TeamColor {
  const used = new Set(members.filter((m) => m.active).map((m) => m.color));
  return TEAM_COLORS.find((color) => !used.has(color)) ?? "blue";
}

/** Serviço sem ninguém: cinza com borda tracejada (diferente de um membro "gray"). */
export const UNASSIGNED_BLOCK = "border-dashed border-slate-400 bg-white/85 text-slate-700";

/** Cor do serviço: a do primeiro responsável (sem ninguém = cinza tracejado). */
export function jobBlockClass(job: Pick<Job, "assigneeIds">, team: ReadonlyMap<string, TeamMember>) {
  const first = job.assigneeIds.map((id) => team.get(id)).find(Boolean);
  return first ? TEAM_COLOR_STYLES[first.color].block : UNASSIGNED_BLOCK;
}

export function TeamDot({ color, className }: { color: TeamColor | null; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-block size-2.5 shrink-0 rounded-full",
        color ? TEAM_COLOR_STYLES[color].dot : "border border-dashed border-slate-400 bg-white",
        className,
      )}
    />
  );
}

/** Nomes dos responsáveis ("Mike, Ana" / "No one assigned"). */
export function assigneeNames(job: Pick<Job, "assigneeIds">, team: ReadonlyMap<string, TeamMember>) {
  const names = job.assigneeIds.map((id) => team.get(id)?.name).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "No one assigned";
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

export const ChevronLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m14.5 6-6 6 6 6" />
  </Icon>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
);

export const WeekIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M9.2 10v10M14.8 10v10" />
  </Icon>
);

export const DayIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 14h8" />
  </Icon>
);

export const PersonIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Icon>
);

export const InvoiceIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </Icon>
);

export const EstimateIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" />
    <path d="M14 3.5V8h4M9 12.5h6M9 16h4" />
  </Icon>
);

export const CancelIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Icon>
);

export const EditIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </Icon>
);

export const RestoreIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" />
    <path d="M4.5 4.5V9H9" />
  </Icon>
);
