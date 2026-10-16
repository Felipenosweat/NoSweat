import { llmsText } from "@/lib/llms";

// /llms.txt: resumo da No Sweat em Markdown para assistentes de IA (ChatGPT, Claude, Perplexity,
// Gemini) entenderem e citarem a plataforma com fatos certos. Formato: https://llmstxt.org
// O texto sai de lib/llms.ts, das mesmas fontes do site, para nunca dizer algo diferente da página.

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsText(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
