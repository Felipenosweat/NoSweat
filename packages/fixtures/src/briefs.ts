// Descrições (como um dono escreveria no /create) de cada site de exemplo. Todo fato que o site
// de exemplo mostra (anos, licenças, horário, preços, endereço, pessoas, depoimentos, "same day"...)
// está aqui, dito pelo "dono": a regra 8 vale também para os exemplos. Os negócios são fictícios
// (telefones 555, e-mails e links em .example.com).
// O teste apps/web/server/design/design.test.ts passa cada descrição pelo gerador de verdade e
// confere que a direção de arte da fixture é a mesma que o gerador escolhe. Ao mudar um texto
// daqui, cuidado com as palavras que o planejador lê (server/design/signals.ts).

import type { FixtureSlug } from "./index";

export const exampleBriefs: Record<FixtureSlug, string> = {
  "joes-plumbing": [
    "Joe's Plumbing in Austin, TX. I'm Joe Ramirez, master plumber; I started the company in 2009. My wife Maria runs the schedule and the estimates, so when you call you talk to one of us, not a call center.",
    "Licensed and insured, free estimates and a flat price before any work starts. Office hours Mon–Sat 7 AM – 6 PM, 24/7 emergency service.",
    "Emergency repairs, water heaters (tank and tankless, usually same day), drain cleaning with camera inspection from $149, slab leak detection, whole-home PEX repiping and fixture installs. The service call is $89 and we waive it if we do the work.",
    "We cover Austin, Round Rock, Cedar Park, Pflugerville, Georgetown and Buda.",
    'Two customers said we could quote them: Laura P. in Round Rock, "Our water heater died on a Sunday. Maria had someone at the house by noon and the price was exactly what she said on the phone." And Dev S. in Cedar Park, "They ran a camera down the drain and showed me the root. No upsell, they just fixed it."',
    "Phone (512) 555-0142, service@joesplumbing.example.com.",
  ].join("\n"),
  "sparkle-cleaning": [
    "Sparkle & Co. Cleaning, house cleaning in Worcester, MA and nearby towns. Weekly, biweekly and one-time cleans, deep cleaning, move-in/move-out and post-renovation.",
    "We bring our own supplies and give a price by home size before the first visit. Same two-person team every visit for recurring clients. Open Mon–Fri 8 AM – 6 PM, Sat 9 AM – 2 PM.",
    "(508) 555-0142, hello@sparkleco.example.com.",
    "Style: warm & friendly",
  ].join("\n"),
  "glow-salon": [
    "Glow Salon is a hair studio at 2520 NW 2nd Ave in Wynwood, Miami, FL. Camila Reyes (owner, colorist) opened it in 2019; Jordan Lee does precision cuts and curly hair and Aisha Grant does keratin, blowouts and event styling.",
    "Prices: precision cut and blowout from $85 (60 min), blowout $55 (45 min), balayage from $220 (about 3 hours), single-process color from $110 (90 min), keratin smoothing from $250 (lasts up to 12 weeks), scalp treatment $45 (30 min). Bridal and event hair and makeup by request.",
    "Open Tue–Sat 10 AM – 7 PM, Sun 11 AM – 5 PM. Appointments recommended, walk-ins when we have openings, 24 hours notice to cancel. Online booking at book.glowsalon.example.com.",
    'From clients: "Camila asked more questions than any colorist I have had, and my balayage grew out beautifully." (Natalie R.) and "Jordan finally gave my curls a shape that works on day three." (Marcus T.)',
    "(305) 555-0187, hello@glowsalon.example.com.",
    "Style: elegant",
  ].join("\n"),
  "rosas-kitchen": [
    "Rosa's Kitchen, a family Mexican restaurant at 2196 Logan Ave in Barrio Logan, San Diego, CA. Rosa Delgado opened it in 2014 with her mother's recipes; her son Marco runs the grill and the corn tortillas are pressed by hand every morning.",
    "Menu: carne asada plate $18, grandma's mole poblano $17 (Sundays), fish tacos with chipotle crema $14, tacos al pastor $12, chilaquiles $13 for Sunday brunch until 1 PM, and catering: a taco bar for 20 for $320 with 48 hours notice.",
    "Walk-ins welcome, call to reserve a table. Open Tue–Sat 11 AM – 9 PM, Sun 9 AM – 8 PM. Street parking on Logan Ave.",
    'Guests wrote: "The mole tastes like my abuela\'s, and I don\'t say that lightly." (Teresa M.) and "We order the taco bar for every office lunch now." (Kevin L.)',
    "(619) 555-0163, eat@rosaskitchen.example.com.",
  ].join("\n"),
  "hale-ortiz": [
    "Hale & Ortiz is a two-person bookkeeping and tax practice at 1550 Wynkoop St, Suite 300 in Denver, CO. Dana Hale is a CPA licensed in Colorado and handles business returns and bookkeeping; Luis Ortiz is an enrolled agent and handles individual returns and IRS letters. You always work with one of us.",
    "Monthly bookkeeping for small businesses from $350 a month, business tax returns from $900, individual returns from $300, quarterly estimated taxes $150 a quarter, and help answering IRS letters.",
    "By appointment, Mon–Fri 9 AM – 5 PM. Book a consultation online at haleortiz.example.com/book.",
    'Clients said: "Dana caught a payroll mistake in our first month that would have cost us more than a year of her fees." (Priya S., small business owner) and "Luis turned a scary IRS letter into a two-page reply and it was over." (Tom W.)',
    "(720) 555-0148, hello@haleortiz.example.com.",
  ].join("\n"),
  "vega-photo": [
    "Marisol Vega Photography, a wedding photographer in Asheville, NC. I photograph weddings and elopements across Asheville and western North Carolina since 2016, quiet and unposed, about 20 weddings a year so I answer every email myself.",
    "Elopements from $1,800 (up to 3 hours), full wedding day from $4,200 (8 hours, second photographer included), engagement portraits $450 (1 hour). Every couple gets an online gallery of edited photos within 6 weeks. Travel within 2 hours of Asheville is included.",
    "My portfolio has weddings at the Biltmore Estate, the Blue Ridge Parkway and a few backyards.",
    'Couples wrote: "We forgot Marisol was there, and then we saw the photos." (Ana & Luis) and "She caught every face during the toasts, even the ones we missed." (Grace & Owen)',
    "(828) 555-0119, hello@marisolvega.example.com.",
  ].join("\n"),
};

/**
 * Um segundo pedido para o MESMO negócio (Rosa's Kitchen), mudando só o estilo escolhido:
 * o gerador deve escolher outra composição, não só outras cores (ver design.test.ts).
 */
export const secondDirectionBrief = `${exampleBriefs["rosas-kitchen"]}\nStyle: bold & local`;
