import { z } from "zod";

// ATENÇÃO: este arquivo é o contrato entre front, back e IA.
// Não renomeie nem remova campos sem combinar com o time. Adicionar campo opcional é ok.

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
// https:// ou uma foto hospedada pela própria No Sweat (/photos/..., usada nos exemplos).
const HttpsUrl = z
  .string()
  .max(1000)
  .regex(/^(https:\/\/\S+|\/photos\/[\w./-]+)$/);
/** Link externo do negócio (agendamento, cardápio, redes): só https://. */
const ExternalUrl = z
  .string()
  .max(500)
  .regex(/^https:\/\/\S+$/);

/**
 * Foto do site. Quem preenche é a PLATAFORMA (busca em banco de imagens ou upload do dono),
 * nunca a IA: a IA só escreve `imageQuery`.
 * - kind "scene": foto genérica de banco de imagens (cozinha limpa, ferramentas, um prato).
 *   Nunca pode aparecer como "nossa equipe", "nosso trabalho" ou "antes e depois".
 * - kind "owner": foto enviada pelo dono (a única aceita na galeria).
 */
export const SiteImage = z.object({
  url: HttpsUrl,
  alt: z.string().max(160),
  source: z.enum(["pexels", "unsplash", "upload"]),
  kind: z.enum(["scene", "owner"]),
  /** Crédito do fotógrafo (bancos de imagens pedem). */
  credit: z.object({ name: z.string().max(80), url: HttpsUrl }).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /**
   * Ponto de interesse da foto ("x% y%", como o object-position do CSS), para os cortes de
   * cada composição não cortarem o que importa. Sem ele, o centro.
   */
  focus: z
    .string()
    .regex(/^\d{1,3}% \d{1,3}%$/)
    .optional(),
  /** Legenda curta (ex.: "Ana & Luis · Biltmore Estate · 2025", o nome do prato, a técnica). */
  caption: z.string().max(100).optional(),
});
export type SiteImage = z.infer<typeof SiteImage>;

/** Pares de fontes (título + texto). Ver FONT_PAIRS em @nosweat/templates. */
export const FontId = z.enum([
  "modern",
  "classic",
  "friendly",
  "fresh",
  "editorial",
  "bold",
  "refined",
  "luxe",
  "technical",
  "gallery",
]);

export const TemplateId = z.enum([
  "home-services",
  "beauty",
  "restaurant",
  "professional",
  "portfolio",
]);
export type TemplateId = z.infer<typeof TemplateId>;

export const Theme = z.object({
  primary: Hex,
  secondary: Hex,
  background: Hex,
  /**
   * Fundo de cartões e faixas (opcional; sem ele, o template mistura texto e fundo). O texto
   * precisa ter contraste AA (4,5:1) sobre ele.
   */
  surface: Hex.optional(),
  text: Hex,
  /** Texto secundário (descrições, legendas). Opcional; contraste AA sobre o fundo. */
  muted: Hex.optional(),
  font: FontId,
});
export type Theme = z.infer<typeof Theme>;
export type FontId = z.infer<typeof FontId>;

/** Título de seção escrito pelo dono (opcional; sem ele, o título padrão do ramo). */
const SectionTitle = z.string().max(80);

export const Section = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    title: z.string(),
    subtitle: z.string(),
    ctaLabel: z.string(),
    /** 2 a 5 palavras em inglês descrevendo uma foto genérica para o topo (escrito pela IA). */
    imageQuery: z.string().max(80).optional(),
    /** Foto do topo (preenchida pela plataforma, não pela IA). */
    image: SiteImage.optional(),
  }),
  z.object({
    type: z.literal("services"),
    /** Título da seção escrito pelo dono; sem ele, o título padrão do ramo. */
    title: SectionTitle.optional(),
    items: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          /** Preço dito pelo dono (ex.: "from $85", "$45"). Nunca inventado. */
          price: z.string().max(40).optional(),
          /** Detalhe curto: duração, frequência ("Monthly", "45 min"). */
          detail: z.string().max(80).optional(),
          /** Grupo do cardápio de preços (ex.: "Color", "Tacos"). Itens seguidos se juntam. */
          group: z.string().max(40).optional(),
          /**
           * 2 a 5 palavras em inglês para uma foto genérica do serviço, sem pessoas (escrito pela
           * IA; ex.: "sparkling clean bathroom tiles"). A plataforma busca no banco de imagens.
           */
          imageQuery: z.string().max(80).optional(),
          /** Foto do serviço (banco de imagens "scene" ou do dono; preenchida pela plataforma). */
          image: SiteImage.optional(),
        }),
      )
      .max(8),
  }),
  z.object({
    type: z.literal("testimonials"),
    title: SectionTitle.optional(),
    items: z.array(z.object({ quote: z.string(), author: z.string() })).max(6),
  }),
  z.object({
    type: z.literal("faq"),
    title: SectionTitle.optional(),
    items: z.array(z.object({ q: z.string(), a: z.string() })).max(10),
  }),
  z.object({
    type: z.literal("contact"),
    title: SectionTitle.optional(),
    showForm: z.boolean(),
    showMap: z.boolean(),
  }),
  /** Galeria de fotos DO DONO (só kind "owner"). A IA nunca cria esta seção. */
  z.object({
    type: z.literal("gallery"),
    title: SectionTitle.optional(),
    images: z.array(SiteImage).max(12),
  }),
  /**
   * Quem somos: um texto curto do dono e, opcionalmente, as pessoas que atendem.
   * Fotos aqui só aparecem se forem do dono (kind "owner"), nunca de banco de imagens.
   */
  z.object({
    type: z.literal("about"),
    title: SectionTitle.optional(),
    body: z.string().max(700),
    image: SiteImage.optional(),
    people: z
      .array(
        z.object({
          name: z.string().max(80),
          role: z.string().max(80).optional(),
          /** Uma frase sobre a pessoa, nas palavras do dono (credenciais só se ele disse). */
          note: z.string().max(200).optional(),
          image: SiteImage.optional(),
        }),
      )
      .max(6)
      .optional(),
  }),
]);
export type Section = z.infer<typeof Section>;
export type SectionType = Section["type"];
/** Dados de uma seção específica, ex.: `SectionOf<"hero">`. */
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

/**
 * Composição da página: a ARQUITETURA do site (topo, ritmo das seções, navegação), separada do
 * ramo do negócio (`template`). Dois negócios do mesmo ramo podem ter composições diferentes.
 * - "service-led": telefone sempre à vista, faixa de fatos, serviços em linhas, cidades atendidas.
 * - "editorial": título enorme de revista, foto larga com legenda, serviços numerados em lista.
 * - "immersive": foto de ponta a ponta no topo, texto sobre a foto, faixa de informações.
 * - "typographic": tipografia como imagem principal, bloco de cor, índice de serviços.
 * - "modular": grade de blocos (bento) com título, foto, horário e contato lado a lado.
 */
export const Composition = z.enum([
  "service-led",
  "editorial",
  "immersive",
  "typographic",
  "modular",
]);
export type Composition = z.infer<typeof Composition>;

/** Ação principal que o site quer do visitante. */
export const PrimaryAction = z.enum(["call", "quote", "book", "visit", "browse"]);
export type PrimaryAction = z.infer<typeof PrimaryAction>;

/**
 * Direção de arte do site, escolhida ANTES de escrever o texto (ver apps/web/server/design).
 * Sem `design` (sites antigos), o site usa a composição "service-led", como sempre foi.
 */
export const SiteDesign = z.object({
  composition: Composition,
  primaryAction: PrimaryAction.optional(),
  /** Respiro entre as seções. */
  density: z.enum(["airy", "balanced", "compact"]).optional(),
  /** Tratamento das fotos: natural, com um véu da cor da marca ou em preto e branco. */
  imageTreatment: z.enum(["natural", "tinted", "monochrome"]).optional(),
  /**
   * Formato dos botões: "pill" (redondo), "sharp" (cantos retos), "caps" (cantos quase retos,
   * texto em maiúsculas) ou "line" (link sublinhado). Sem ele, sorteado pelo nome do negócio.
   */
  buttons: z.enum(["pill", "sharp", "caps", "line"]).optional(),
  /** Cabeçalho: "classic", "centered", "bar" ou "minimal". Sem ele, sorteado pelo nome. */
  header: z.enum(["classic", "centered", "bar", "minimal"]).optional(),
  /** Bloco de contato: "split", "stacked" ou "letter". Sem ele, sorteado pelo nome. */
  contact: z.enum(["split", "stacked", "letter"]).optional(),
  /** Ids das referências de design usadas no plano (docs/design/references.json), para depuração. */
  references: z.array(z.string().max(60)).max(4).optional(),
  /** Por que esta direção foi escolhida (curto, para depuração). */
  rationale: z.string().max(400).optional(),
});
export type SiteDesign = z.infer<typeof SiteDesign>;

// ---------- link de avaliações do Google ----------

/** Caminho de www.google.com / google.com aceito: só o Maps e a busca (perfil da empresa). */
const isMapsOrSearchPath = (path: string) => /^\/(maps|search)(\/|$)/.test(path);

/**
 * Endereços do Google de onde vem o link "pedir avaliação" do Perfil da Empresa (só https):
 * - g.page/r/<id>/review: o link curto de "Ask for reviews" / "Get more reviews";
 * - search.google.com/local/writereview?placeid=...: o formato longo;
 * - www.google.com e google.com: só /maps... e /search... (perfil aberto no Maps ou na busca);
 * - maps.google.com, maps.app.goo.gl e goo.gl/maps/...: links do Google Maps. No goo.gl só
 *   /maps (o encurtador antigo levava a qualquer lugar).
 * - g.co/kgs/...: o link curto de "Compartilhar" do perfil na busca. No g.co só /kgs/ (o
 *   encurtador g.co também leva a outras páginas do Google).
 * Um Map (e não um objeto) para "__proto__" e afins nunca contarem como host.
 */
const GOOGLE_REVIEW_HOSTS = new Map<string, (path: string) => boolean>([
  ["g.page", () => true],
  ["search.google.com", () => true],
  ["maps.google.com", () => true],
  ["maps.app.goo.gl", () => true],
  ["goo.gl", (path) => /^\/maps(\/|$)/.test(path)],
  ["g.co", (path) => /^\/kgs\/[^/]+/.test(path)],
  ["www.google.com", isMapsOrSearchPath],
  ["google.com", isMapsOrSearchPath],
]);

/** Mensagem (para pessoas) quando o link colado não é um link de avaliações do Google. */
export const GOOGLE_REVIEW_URL_MESSAGE =
  "Paste the review link you copied from Google. It starts with https://g.page/ or https://search.google.com/.";

/**
 * O link é um link de avaliações do Google que podemos pôr no site? Só https, sem usuário/senha
 * nem porta, e só nos hosts de GOOGLE_REVIEW_HOSTS. Não apara espaços: quem chama apara antes.
 */
export function isGoogleReviewUrl(value: string): boolean {
  if (typeof value !== "string" || value.length > 500 || /\s/.test(value)) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const allowedPath = GOOGLE_REVIEW_HOSTS.get(url.hostname.toLowerCase());
  return allowedPath ? allowedPath(url.pathname) : false;
}

/** Link de avaliações do Google (ver isGoogleReviewUrl). */
export const GoogleReviewUrl = z
  .url(GOOGLE_REVIEW_URL_MESSAGE)
  .max(500, GOOGLE_REVIEW_URL_MESSAGE)
  .refine(isGoogleReviewUrl, { message: GOOGLE_REVIEW_URL_MESSAGE });

export const SiteSpec = z.object({
  version: z.literal(1),
  template: TemplateId,
  /** Direção de arte (opcional). Ver SiteDesign. */
  design: SiteDesign.optional(),
  business: z.object({
    name: z.string(),
    phone: z.string().optional(),
    // Zod 4: `z.email()` substitui `z.string().email()` (mesma regra).
    email: z.email().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
    /** Área atendida, ex.: "Austin and nearby cities". */
    serviceArea: z.string().max(120).optional(),
    /** Horário de funcionamento, ex.: { days: "Mon–Fri", time: "8 AM – 6 PM" }. */
    hours: z
      .array(z.object({ days: z.string().max(40), time: z.string().max(40) }))
      .max(7)
      .optional(),
    /**
     * Fatos que O DONO confirmou (ex.: "Licensed & insured", "Free estimates").
     * Viram os selos do site. Nunca inventar: sem confirmação, fica vazio.
     */
    highlights: z.array(z.string().max(40)).max(4).optional(),
    /** Rua e número (ex.: "2112 Logan Ave"). Cidade e estado ficam em `city`/`state`. */
    address: z.string().max(120).optional(),
    /** Categoria em poucas palavras, como o cliente procuraria (ex.: "Plumber", "Hair salon"). */
    category: z.string().max(60).optional(),
    /** Links do negócio que o dono informou. O botão principal usa `booking` ou `order`. */
    links: z
      .object({
        booking: ExternalUrl.optional(),
        order: ExternalUrl.optional(),
        menu: ExternalUrl.optional(),
        instagram: ExternalUrl.optional(),
        facebook: ExternalUrl.optional(),
        tiktok: ExternalUrl.optional(),
        google: ExternalUrl.optional(),
        yelp: ExternalUrl.optional(),
        linkedin: ExternalUrl.optional(),
      })
      .optional(),
    /**
     * Link "deixe uma avaliação" do Perfil da Empresa no Google, colado pelo dono em /reviews.
     * Vira o botão "Review us on Google" do site. Só o dono muda (a IA nunca põe nem tira).
     */
    googleReviewUrl: GoogleReviewUrl.optional(),
  }),
  theme: Theme,
  sections: z.array(Section).min(2).max(10),
});
export type SiteSpec = z.infer<typeof SiteSpec>;
export type Business = SiteSpec["business"];
