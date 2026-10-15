import type { CaptionRequest, SocialPillar } from "@nosweat/schema";
import type { BusinessContext } from "./context";

// Prompts da IA de redes sociais. Legendas em inglês (clientes nos EUA); a nota para o dono
// (`ownerNotePt`) em português do Brasil. Mesmas proibições da regra 8 do CLAUDE.md.

/** Ordem em que os temas se alternam ao longo do mês. */
export const PILLAR_ROTATION: SocialPillar[] = [
  "tip",
  "service",
  "area",
  "behind_the_scenes",
  "seasonal",
  "cta",
];

/** Máximo de hashtags por post. */
export const MAX_HASHTAGS = 8;

/** Datas e épocas dos EUA que rendem posts em cada mês (1 = janeiro). */
export const US_SEASONAL_MOMENTS: Record<number, string[]> = {
  1: ["New Year's Day (Jan 1)", "New Year resolutions", "Martin Luther King Jr. Day (3rd Monday)", "winter weather"],
  2: ["Super Bowl Sunday", "Valentine's Day (Feb 14)", "Presidents' Day (3rd Monday)", "late winter"],
  3: ["St. Patrick's Day (Mar 17)", "daylight saving time starts (2nd Sunday)", "first day of spring", "spring cleaning"],
  4: ["Easter (date varies)", "Earth Day (Apr 22)", "spring showers", "Tax Day (around Apr 15)"],
  5: ["Mother's Day (2nd Sunday)", "Memorial Day (last Monday)", "graduation season", "start of summer prep"],
  6: ["Father's Day (3rd Sunday)", "Juneteenth (Jun 19)", "first day of summer", "summer break"],
  7: ["Independence Day (Jul 4)", "summer heat", "vacation season"],
  8: ["back to school", "late-summer heat", "end of summer"],
  9: ["Labor Day (1st Monday)", "first day of fall", "football season", "fall maintenance"],
  10: ["Halloween (Oct 31)", "fall colors", "fall home prep", "cooler weather"],
  11: ["Veterans Day (Nov 11)", "daylight saving time ends (1st Sunday)", "Thanksgiving (4th Thursday)", "Small Business Saturday (Saturday after Thanksgiving)"],
  12: ["holiday season", "Christmas (Dec 25)", "Hanukkah (date varies)", "New Year's Eve (Dec 31)", "winter prep"],
};

const RULES = `Hard rules (the business could get in legal trouble if you break them):
- Never invent facts. Only use what is in <business>. Do NOT mention reviews, ratings, stars, testimonials, "#1", "best in town", awards, licenses, insurance, bonding, certifications, guarantees, warranties, "same-day", "24/7", years of experience, founding year, discounts, "% off", prices, "$", free estimates, coupons or promotions UNLESS that exact fact is listed in the business highlights.
- Never claim results, customers or jobs that are not given. Do not describe a photo as "our work" unless it is one of the owner's photos listed below.
- Never ask people to DM for prices, never mention competitors, never use medical, legal or financial promises.
- No emojis spam: at most 2 emojis per caption. No ALL CAPS sentences.`;

const STYLE = `Caption style:
- English, for customers in the United States. Friendly, warm, local, plain words (6th-grade reading level). Sound like a real small-business owner, not an ad agency.
- Short: at most 600 characters before the hashtags. Usually 2-4 short sentences.
- Then a blank line and up to ${MAX_HASHTAGS} relevant hashtags (local + service), all inside the caption text. Also return the same hashtags in the "hashtags" array.
- Mention the city or service area naturally when it fits.`;

const OWNER_NOTE = `"ownerNotePt": ONE plain sentence in Brazilian Portuguese explaining to the owner what this post is about and why (for example: "Dica rápida para lembrar os clientes de limpar as calhas antes das chuvas de novembro."). The owner may not read English well. Max 300 characters. This note is never published.`;

export const SOCIAL_PLAN_SYSTEM_PROMPT = `You plan one month of Instagram posts for a small local business in the United States. The owner will review and approve every post; you never publish anything.

Return exactly one post for each date slot you are given (same date, same time), in date order.

Pillars ("pillar"), rotating so the month feels varied:
- "tip": a short, useful tip related to the business's services.
- "service": present one of the listed services and who it helps.
- "area": local pride: the city or service area, a local moment of the season.
- "behind_the_scenes": how the business works, tools, preparation, care (no invented stories or people).
- "seasonal": a US seasonal moment of that month (holiday, weather, season) tied to the business.
- "cta": invite people to get in touch. ONLY "cta" posts include a call to action with the phone number (if given) or "link in bio". Other pillars do not include the phone number or "link in bio".

${STYLE}

${RULES}

Photos ("photoIndex"): the owner's own photos are listed with an index. Use the index of a photo that fits the post, or null when none fits or when no photos are listed. Never use an index that is not listed. Try not to repeat the same photo many times.

${OWNER_NOTE}`;

export const SOCIAL_CAPTION_SYSTEM_PROMPT = `You write or improve ONE Instagram caption for a small local business in the United States. The owner reviews it before anything is posted.

Actions:
- "write": write a new caption from the owner's idea (the idea may be in Portuguese or English; the caption is always in English).
- "shorter": make the current caption shorter, keeping its meaning and hashtags (fewer hashtags is fine).
- "friendlier": make the current caption warmer and more personal, same facts.
- "cta": add a clear call to action at the end: the phone number if given, otherwise "link in bio".
Only "cta" (or an idea that explicitly asks for it) adds the phone number or "link in bio".

${STYLE}

${RULES}

${OWNER_NOTE}`;

/** Bloco <business> com os dados do site (o mesmo para mês e legenda). */
export function businessBlock(ctx: BusinessContext): string {
  const location = [ctx.city, ctx.state].filter(Boolean).join(", ");
  const lines = [
    `Name: ${ctx.businessName}`,
    `Location: ${location || "not given"}`,
    `Service area: ${ctx.serviceArea ?? "not given"}`,
    `Phone: ${ctx.phone ?? "not given"}`,
    `Services: ${ctx.services.length ? ctx.services.join("; ") : "not given"}`,
    `Highlights confirmed by the owner (the ONLY claims you may use): ${
      ctx.highlights.length ? ctx.highlights.join("; ") : "none"
    }`,
  ];
  return `<business>\n${lines.join("\n")}\n</business>`;
}

export function photosBlock(ctx: BusinessContext): string {
  if (!ctx.photos.length) return "<photos>\nNo photos. Use photoIndex null.\n</photos>";
  const lines = ctx.photos.map((photo, index) => `${index}: ${photo.alt || "photo"}`);
  return `<photos>\n${lines.join("\n")}\n</photos>`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Pedido do mês: negócio, fotos, épocas do mês e as datas exatas dos posts. */
export function planRequest(
  ctx: BusinessContext,
  month: string,
  slots: { date: string; time: string }[],
  timezone: string,
): string {
  const monthNumber = Number(month.slice(5, 7));
  const year = month.slice(0, 4);
  const moments = US_SEASONAL_MOMENTS[monthNumber] ?? [];
  const slotLines = slots.map((slot, index) => {
    const pillar = PILLAR_ROTATION[index % PILLAR_ROTATION.length];
    return `${slot.date} ${slot.time} (suggested pillar: ${pillar})`;
  });
  return [
    businessBlock(ctx),
    photosBlock(ctx),
    `<month>\n${MONTH_NAMES[monthNumber - 1] ?? month} ${year} (time zone ${timezone})\nUS seasonal moments this month: ${moments.join("; ") || "none"}\n</month>`,
    `<slots>\n${slotLines.join("\n")}\n</slots>`,
    `Write ${slots.length} posts, one per slot. The suggested pillars are a guide; keep the mix varied and make sure at least one post is "cta" and one is "seasonal" when there are 4 or more slots.`,
  ].join("\n\n");
}

/** Pedido de uma legenda (escrever, encurtar, deixar mais simpática ou pôr chamada). */
export function captionRequest(ctx: BusinessContext, req: CaptionRequest): string {
  const parts = [businessBlock(ctx), `Action: ${req.action}`];
  if (req.idea) parts.push(`<owner_idea>\n${req.idea}\n</owner_idea>`);
  if (req.currentCaption) parts.push(`<current_caption>\n${req.currentCaption}\n</current_caption>`);
  return parts.join("\n\n");
}
