import type { ReactNode } from "react";
import { CloseIcon } from "./icons";
import { cx, focusRing } from "./styles";

// Aviso em linha: resultado de uma ação, erro ao carregar a página, alerta de configuração.
// Faixa clara na cor do tom com o ícone do status na frente (a cor nunca é o único sinal).
// Sem "use client": serve em server e client components (`onDismiss` só dentro de um client).
// Tamanhos: "md" (padrão) para a página; "sm" dentro de cartões, folhas e formulários.

export type NoticeTone = "success" | "error" | "warning" | "info";

const TONES: Record<NoticeTone, { box: string; icon: string }> = {
  success: { box: "bg-emerald-50/90 text-emerald-950", icon: "text-emerald-600" },
  error: { box: "bg-red-50/90 text-red-800", icon: "text-red-600" },
  warning: { box: "bg-amber-50/90 text-amber-950", icon: "text-amber-700" },
  info: { box: "bg-blue-50/90 text-[#0b2a5c]", icon: "text-brand" },
};

/** Ícone do tom (18px, traço 2px, herda a cor). */
function ToneIcon({ tone, className }: { tone: NoticeTone; className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {tone === "success" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.5 2.5 2.5 4.5-5" />
        </>
      ) : tone === "warning" ? (
        <>
          <path d="M10.3 4.3 2.7 17.4a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
          <path d="M12 9.5v4M12 17h.01" />
        </>
      ) : tone === "error" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5M12 16.5h.01" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5.5M12 7.5h.01" />
        </>
      )}
    </svg>
  );
}

export type NoticeProps = {
  tone: NoticeTone;
  /** "md" = faixa da página (raio 2xl); "sm" = dentro de cartões e folhas (raio xl, texto 14px). */
  size?: "md" | "sm";
  /**
   * Papel ARIA. Padrão: "alert" para erro e "status" para o resto. `null` = sem papel (texto que
   * já vem com a página e não precisa ser anunciado).
   */
  role?: "alert" | "status" | "note" | null;
  id?: string;
  /** Mostra o "×" para fechar (só em client components). */
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
  children: ReactNode;
};

export function Notice({
  tone,
  size = "md",
  role,
  id,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
  children,
}: NoticeProps) {
  const style = TONES[tone];
  const small = size === "sm";
  const ariaRole =
    role === undefined ? (tone === "error" ? "alert" : "status") : (role ?? undefined);
  return (
    <div
      id={id}
      role={ariaRole}
      className={cx(
        "glass-edge flex items-start",
        small
          ? "gap-2.5 rounded-xl px-3 py-2.5 text-sm leading-5"
          : "gap-3 rounded-2xl px-4 py-3 text-[15px] leading-[1.5]",
        style.box,
        className,
      )}
    >
      <ToneIcon
        tone={tone}
        className={cx("size-[18px] shrink-0", small ? "mt-px" : "mt-0.5", style.icon)}
      />
      <div className="min-w-0 flex-1 break-words">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cx(
            "-my-2.5 -mr-3 grid size-11 shrink-0 place-items-center rounded-full text-current opacity-70 hover:bg-black/5 hover:opacity-100 sm:-my-1.5 sm:-mr-2 sm:size-9",
            focusRing,
          )}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
