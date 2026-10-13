import { SiteSpec } from "@nosweat/schema";
import { z } from "zod";

// Conversa entre o editor (página pai) e a prévia (iframe em /sites/[id]/edit/canvas).
// As duas páginas são da mesma origem; cada lado só aceita mensagens dessa origem e do
// outro lado da conversa (window.parent ou o contentWindow do iframe), sempre validadas aqui.

const SectionIndex = z.number().int().min(0).max(9);

/** Editor → prévia. */
export const EditorMessage = z.discriminatedUnion("type", [
  /** Rascunho atual (validado) para desenhar. */
  z.object({ source: z.literal("ns-editor"), type: z.literal("spec"), spec: SiteSpec }),
  /** Seção destacada; `scroll` rola a prévia até ela (quando a escolha veio do painel). */
  z.object({
    source: z.literal("ns-editor"),
    type: z.literal("select"),
    index: SectionIndex.nullable(),
    scroll: z.boolean(),
  }),
]);
export type EditorMessage = z.infer<typeof EditorMessage>;

/** Prévia → editor. */
export const CanvasMessage = z.discriminatedUnion("type", [
  /** A prévia carregou e quer o rascunho atual. */
  z.object({ source: z.literal("ns-canvas"), type: z.literal("ready") }),
  /** O dono clicou numa seção da prévia. */
  z.object({ source: z.literal("ns-canvas"), type: z.literal("select"), index: SectionIndex }),
]);
export type CanvasMessage = z.infer<typeof CanvasMessage>;

/** Distribui o tipo para cada variante (Omit direto num union perde o discriminante). */
type WithoutSource<T> = T extends unknown ? Omit<T, "source"> : never;

/** Lê uma mensagem recebida, ou `null` se não for de quem esperamos ou não for válida. */
export function readMessage<T extends z.ZodType>(
  schema: T,
  event: MessageEvent,
  expectedSource: MessageEventSource | null | undefined,
): z.infer<T> | null {
  if (event.origin !== window.location.origin) return null;
  if (!expectedSource || event.source !== expectedSource) return null;
  const parsed = schema.safeParse(event.data);
  return parsed.success ? parsed.data : null;
}

export function postToCanvas(
  target: Window | null | undefined,
  message: WithoutSource<EditorMessage>,
) {
  target?.postMessage({ source: "ns-editor", ...message }, window.location.origin);
}

export function postToEditor(message: WithoutSource<CanvasMessage>) {
  if (window.parent === window) return;
  window.parent.postMessage({ source: "ns-canvas", ...message }, window.location.origin);
}
