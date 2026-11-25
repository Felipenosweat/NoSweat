"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

// Botão do atendente de IA no site publicado (plano Premium). Só o botão vem com a página: o
// painel da conversa (e o Zod que valida as respostas) é baixado no primeiro clique (ou quando o
// mouse/foco chega no botão, para abrir sem espera). Fechar descarta a conversa: abrir de novo é
// uma conversa nova (cobrada do dono na primeira mensagem). Nada fica guardado no navegador.

const loadChat = () => import("./AssistantChat");
const AssistantChat = lazy(loadChat);

/** Cores derivadas que o `.ns-site` define nos sites (o botão fica fora dele). */
const DERIVED_VARS = {
  "--ns-surface": "color-mix(in srgb, var(--ns-text) 4%, var(--ns-background))",
  "--ns-muted": "color-mix(in srgb, var(--ns-text) 72%, var(--ns-background))",
  "--ns-border": "color-mix(in srgb, var(--ns-text) 12%, var(--ns-background))",
} as CSSProperties;

export function AssistantLauncher({
  siteId,
  businessName,
  themeVars,
}: {
  siteId: string;
  businessName: string;
  /** Variáveis --ns-* do tema do site (themeToCssVars, calculadas no servidor). */
  themeVars: CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  // Cada abertura monta um painel novo (key): conversa nova, sem nada da anterior.
  const [session, setSession] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const close = useCallback(() => setOpen(false), []);

  // Ao fechar, o foco volta para o botão.
  useEffect(() => {
    if (wasOpen.current && !open) buttonRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const style: CSSProperties = { ...DERIVED_VARS, ...themeVars };
  const panelId = `ns-assistant-${siteId}`;

  return (
    <div style={style} className="font-ns-body text-ns-text">
      {!open && (
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-controls={panelId}
          onPointerEnter={() => void loadChat()}
          onFocus={() => void loadChat()}
          onClick={() => {
            setSession((value) => value + 1);
            setOpen(true);
          }}
          className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 inline-flex size-14 cursor-pointer items-center justify-center rounded-full bg-ns-primary text-ns-on-primary shadow-[0_8px_24px_-6px_rgb(0_0_0/0.35),0_2px_6px_rgb(0_0_0/0.12)] transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ns-primary active:scale-95 motion-reduce:transition-none md:right-6 md:bottom-6"
        >
          <ChatIcon />
          <span className="sr-only">Chat with {businessName}</span>
        </button>
      )}
      {open && (
        <Suspense fallback={<PanelLoading id={panelId} />}>
          <AssistantChat
            key={session}
            id={panelId}
            siteId={siteId}
            businessName={businessName}
            onClose={close}
          />
        </Suspense>
      )}
    </div>
  );
}

/** Enquanto o painel baixa (só no primeiro clique, em rede lenta): o mesmo lugar, vazio. */
function PanelLoading({ id }: { id: string }) {
  return (
    <div
      id={id}
      role="status"
      className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 inline-flex size-14 items-center justify-center rounded-full bg-ns-primary text-ns-on-primary md:right-6 md:bottom-6"
    >
      <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
      <span className="sr-only">Opening chat…</span>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
    >
      <path d="M20 12.5c0 3.9-3.6 7-8 7-1.1 0-2.2-.2-3.1-.6L4 20l1.2-3.6C4.4 15.3 4 14 4 12.5c0-3.9 3.6-7 8-7s8 3.1 8 7Z" />
      <path d="M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01" strokeWidth={2.4} />
    </svg>
  );
}
