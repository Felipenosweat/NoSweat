import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// EXPERIMENTO "caminho A" (código livre), só no desenvolvimento: mostra as páginas que
// scripts/freeform-batch.mts salvou em apps/web/.freeform-samples/. Em produção é 404.
//
// Isolamento: cada página abre num <iframe sandbox="allow-scripts" srcDoc=…> SEM
// allow-same-origin. O documento roda numa origem opaca: o JS gerado não lê cookies, sessão,
// localStorage nem o DOM desta página, não envia formulários, não abre janelas e não navega a
// página de cima. Não acrescentar allow-same-origin (com allow-scripts ele desfaz o sandbox).

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free-form lab",
  robots: { index: false, follow: false },
};

const SAMPLES_DIR = path.join(process.cwd(), ".freeform-samples");

type SampleMeta = {
  model?: string;
  estimatedUsd?: number | null;
  seconds?: number;
  bytes?: number;
  usage?: { output_tokens?: number };
  removedBySanitizer?: string[];
  brief?: { description?: string };
};

type Sample = { slug: string; html: string; direction: string | null; meta: SampleMeta | null };

function readSamples(): Sample[] {
  let files: string[];
  try {
    files = readdirSync(SAMPLES_DIR);
  } catch {
    return [];
  }
  return files
    .filter((file) => file.endsWith(".html"))
    .sort()
    .map((file) => {
      const slug = file.slice(0, -".html".length);
      const html = readFileSync(path.join(SAMPLES_DIR, file), "utf8");
      let meta: SampleMeta | null = null;
      try {
        meta = JSON.parse(
          readFileSync(path.join(SAMPLES_DIR, `${slug}.json`), "utf8"),
        ) as SampleMeta;
      } catch {
        meta = null;
      }
      const direction = /<!--\s*ns:direction:?\s*([\s\S]*?)-->/i.exec(html)?.[1]?.trim() ?? null;
      return { slug, html, direction, meta };
    });
}

/** Página gerada em largura real, reduzida por escala para caber na tela. */
function Frame({
  title,
  html,
  width,
  height,
  scale,
}: {
  title: string;
  html: string;
  width: number;
  height: number;
  scale: number;
}) {
  return (
    <figure className="shrink-0">
      <figcaption className="mb-2 text-xs text-ink/60">{width} px</figcaption>
      <div
        className="overflow-hidden rounded-md border border-black/15 bg-white"
        style={{ width: width * scale, height: height * scale }}
      >
        <iframe
          title={title}
          sandbox="allow-scripts"
          srcDoc={html}
          referrerPolicy="no-referrer"
          loading="lazy"
          style={{
            width,
            height,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
          }}
        />
      </div>
    </figure>
  );
}

export default function FreeformLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const samples = readSamples();

  return (
    <main id="main" className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-semibold text-ink">Free-form generation lab</h1>
      <p className="mt-2 max-w-[70ch] text-sm text-ink/70">
        Experiment only (development). Each page below was written as raw HTML by the AI and runs in
        a sandboxed iframe with scripts allowed and no access to this site&apos;s origin.
      </p>

      {samples.length === 0 ? (
        <p className="mt-8 rounded-md border border-black/15 p-4 text-sm text-ink/80">
          No samples yet. In <code>apps/web</code>, run{" "}
          <code>ANTHROPIC_API_KEY=… node scripts/freeform-batch.mts</code>, then reload.
        </p>
      ) : (
        samples.map((sample) => (
          <section key={sample.slug} className="mt-12 border-t border-black/10 pt-6">
            <h2 className="text-lg font-semibold text-ink">{sample.slug}</h2>
            <p className="mt-1 text-xs text-ink/60">
              {[
                sample.meta?.model,
                sample.meta?.usage?.output_tokens !== undefined
                  ? `${sample.meta.usage.output_tokens} output tokens`
                  : null,
                typeof sample.meta?.estimatedUsd === "number"
                  ? `~$${sample.meta.estimatedUsd.toFixed(3)}`
                  : null,
                sample.meta?.seconds !== undefined ? `${sample.meta.seconds}s` : null,
                sample.meta?.bytes !== undefined
                  ? `${Math.round(sample.meta.bytes / 1024)} KB`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {sample.meta?.brief?.description ? (
              <p className="mt-3 max-w-[90ch] text-sm text-ink/80">
                <span className="font-medium">Brief:</span> {sample.meta.brief.description}
              </p>
            ) : null}
            {sample.direction ? (
              <p className="mt-2 max-w-[90ch] text-sm text-ink/80">
                <span className="font-medium">Direction:</span> {sample.direction}
              </p>
            ) : null}
            {sample.meta?.removedBySanitizer?.length ? (
              <p className="mt-2 text-xs text-ink/70">
                Removed by the sanitizer: {sample.meta.removedBySanitizer.join("; ")}
              </p>
            ) : null}
            <div className="mt-4 flex gap-6 overflow-x-auto pb-2">
              <Frame
                title={`${sample.slug} at desktop width`}
                html={sample.html}
                width={1440}
                height={900}
                scale={0.55}
              />
              <Frame
                title={`${sample.slug} at phone width`}
                html={sample.html}
                width={390}
                height={844}
                scale={0.6}
              />
            </div>
          </section>
        ))
      )}
    </main>
  );
}
