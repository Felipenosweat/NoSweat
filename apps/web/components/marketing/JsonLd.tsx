/** Dados estruturados (JSON-LD) já escapados por lib/structured-data.ts. */
export function JsonLd({ data }: { data: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: data }} />;
}
