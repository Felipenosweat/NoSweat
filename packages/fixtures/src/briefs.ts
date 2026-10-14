// Descrições (como um dono escreveria no /create) de cada site de exemplo. Todo fato que o site
// de exemplo mostra (anos, licenças, horário, "same day"...) está aqui, dito pelo "dono":
// a regra 8 vale também para os exemplos. Os negócios são fictícios.
// O teste apps/web/server/design/design.test.ts passa cada descrição pelo gerador de verdade e
// confere que a direção de arte da fixture é a mesma que o gerador escolhe.

import type { FixtureSlug } from "./index";

export const exampleBriefs: Record<FixtureSlug, string> = {
  "joes-plumbing":
    "Joe's Plumbing in Austin, TX. Licensed and insured, free estimates with a flat upfront price, 24/7 emergency service. Water heaters (usually same day), drain cleaning with camera inspection, slab leak detection, whole-home repiping and fixture installs. We cover Austin, Round Rock, Cedar Park, Pflugerville, Georgetown and Buda. Phone (512) 555-0142, service@joesplumbing.example.com.",
  "sparkle-cleaning":
    "Sparkle & Co. Cleaning, house cleaning in Worcester, MA and nearby towns. Weekly, biweekly and one-time cleans, deep cleaning, move-in/move-out and post-renovation. We bring our own supplies and give a price by home size before the first visit. Open Mon–Fri 8 AM – 6 PM, Sat 9 AM – 2 PM. (508) 555-0142, hello@sparkleco.example.com.\nStyle: warm & friendly",
  "glow-salon":
    "Glow Salon is a hair studio in Wynwood, Miami, FL. Precision cuts with a blowout, balayage and color, keratin smoothing (lasts up to 12 weeks), bridal and event hair and makeup, scalp treatments. Appointments recommended, walk-ins when we have openings, 24 hours notice to cancel. (305) 555-0187, hello@glowsalon.example.com.\nStyle: elegant",
  "rosas-kitchen":
    "Rosa's Kitchen, a family Mexican restaurant in Barrio Logan, San Diego, CA. Family recipes and handmade corn tortillas: carne asada plates, fish tacos with chipotle crema, grandma's mole poblano on Sundays, weekend brunch and catering trays. Walk-ins welcome, call to reserve a table. Open Tue–Sun 11 AM – 9 PM. (619) 555-0163, eat@rosaskitchen.example.com.",
  "hale-ortiz":
    "Hale & Ortiz is a two-person bookkeeping and tax practice in Denver, CO. Monthly bookkeeping for small businesses, individual and business tax returns, quarterly estimated taxes and help answering IRS letters. By appointment, Mon–Fri 9 AM – 5 PM. (720) 555-0148, hello@haleortiz.example.com.",
};

/**
 * Um segundo pedido para o MESMO negócio (Rosa's Kitchen), mudando só o estilo escolhido:
 * o gerador deve escolher outra composição, não só outras cores (ver design.test.ts).
 */
export const secondDirectionBrief = `${exampleBriefs["rosas-kitchen"]}\nStyle: bold & local`;
