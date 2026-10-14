import type { Composition, PrimaryAction } from "@nosweat/schema";
import type { Industry, Tone } from "./signals";

// Biblioteca de design que o GERADOR usa (o app em produção não lê os arquivos de docs/).
// - COMPOSITION_GUIDE: o que cada composição pede do texto.
// - DESIGN_LIBRARY: resumos APROVADOS das referências pesquisadas. A pesquisa completa (com
//   evidências, datas e o que foi inspecionado) fica em docs/design/references.json; cada `id`
//   aqui é um `id` de lá com "approved": true (o teste design.test.ts confere).
// Para acrescentar uma referência: pesquise e registre em docs/design (ver docs/design/README.md),
// depois copie aqui só o resumo útil para a IA.

export type DesignReference = {
  id: string;
  name: string;
  approved: boolean;
  /** Composições em que os princípios desta referência funcionam. */
  compositions: Composition[];
  fits: { businesses: Industry[]; tones: Tone[]; goals: PrimaryAction[] };
  /** Princípios curtos, escritos para a IA (nada de nomes, slogans ou textos da referência). */
  principles: string[];
};

export const COMPOSITION_GUIDE: Record<Composition, { summary: string; copy: string }> = {
  "service-led": {
    summary: "Phone always in view, two-column hero with photo, service cards, sticky call bar.",
    copy: "Headline names the job and the place in plain words (6–9 words). Subtitle says how to get help. Service descriptions are practical, one sentence each.",
  },
  editorial: {
    summary:
      "Magazine page: very large headline across the page, wide photo with caption, numbered service list, generous white space.",
    copy: "Headline is a short, confident statement with a point of view (4–8 words), not a list of services. Subtitle reads like a standfirst: one calm sentence. Service names are short noun phrases; descriptions explain what the client experiences.",
  },
  immersive: {
    summary:
      "Full-bleed photo with the headline over a dark veil, an info strip (hours, area, phone) and staggered service rows.",
    copy: "Headline evokes the place or the experience in 3–7 words and must work over a photo. Subtitle invites the visit or the booking. Service names can be evocative; descriptions stay concrete and honest.",
  },
  typographic: {
    summary:
      "Type is the image: a huge headline on a brand-color block, an at-a-glance facts panel, an index of services, a big phone number in the contact.",
    copy: "Headline is direct and memorable (3–7 words), strong enough to stand alone with no photo. Subtitle is one plain sentence about who you help. Service descriptions are crisp and specific.",
  },
  modular: {
    summary:
      "Bento grid: headline, photo, hours or area and a call tile side by side; services in tiles of different sizes; FAQ tiles.",
    copy: "Headline is friendly and specific (5–8 words). Subtitle is short. Keep service descriptions to one sentence of similar length so tiles stay even; put the most requested service first.",
  },
};

/**
 * Resumos aprovados das referências (preenchidos a partir de docs/design/references.json).
 * Lista vazia ou sem combinação = o plano usa só as regras gerais (fallback).
 */
export const DESIGN_LIBRARY: DesignReference[] = [];
