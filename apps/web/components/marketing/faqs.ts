// Perguntas frequentes da landing e de /pricing. Um lugar só: a página mostra este texto, e os
// dados estruturados (FAQPage, para o Google) e o /llms.txt (para as IAs) leem daqui também.
// Só o que o produto faz hoje. "Can I cancel?" vale nos dois modos de venda (Stripe, que renova
// sozinho, e o manual por WhatsApp/e-mail, pago adiantado e sem renovação) e não promete e-mail
// de lembrete.

import { CONTACT_EMAIL } from "./legal/contact";
import { CANCELLATION_TERMS, REFUND_TERMS } from "./legal/policy";
import { planPrices, pricingCredits } from "./pricing-data";

// Números (preços, créditos, custo de cada ação) vêm das fontes únicas via pricing-data.ts.
// Cancelamento e reembolso: as mesmas frases dos Termos (legal/policy.ts).

export type Faq = { question: string; answer: string };

const prices = planPrices();
const credits = pricingCredits();
const count = (n: number) => n.toLocaleString("en-US");
const costOf = (label: string) => credits.costs.find((cost) => cost.label === label)?.credits;
const aiChangeCost = costOf("AI change to your website");
const newSiteCost = costOf("New website");

/** "Starter 150, Pro 400 and Premium 1,000 AI credits a month". */
const MONTHLY_CREDITS_TEXT = `Starter includes ${count(credits.monthly.starter)} AI credits a month, Pro ${count(credits.monthly.pro)} and Premium ${count(credits.monthly.premium)}`;

export const LANDING_FAQS: Faq[] = [
  {
    question: "How does it work?",
    answer:
      "You describe your business in a sentence or two. We pick a page layout that fits your business, from photo-first to type-first, and write your headline, services and FAQ. You review it in a private preview, edit anything, then publish.",
  },
  {
    question: "Do I need technical experience?",
    answer:
      "No. If you can write a text message, you can do this. No code, no plugins, nothing to install.",
  },
  {
    question: "Can I customize my site?",
    answer:
      "Yes. Edit your business details, hero text, services, reviews you provide, and FAQ. Change colors, pick from ten font pairings, switch between five page layouts, and add, remove or reorder sections, all with a live preview.",
  },
  {
    question: "Can AI change my site for me?",
    answer: `Yes. Ask for changes in plain English — “add a deep-cleaning service,” “make it warmer” — and you get a new draft to review. Nothing goes live until you publish, and you can go back to an earlier version. AI changes use credits: ${MONTHLY_CREDITS_TEXT}${aiChangeCost ? `, and each change costs ${aiChangeCost}` : ""}. Editing your site by hand is always free.`,
  },
  {
    question: "Can I add my own photos?",
    answer:
      "Yes, on every plan. Upload JPG, PNG or WebP photos and show them in a gallery on your site. Every site can also start with a hero photo picked for your industry from a stock library, credited to the photographer.",
  },
  {
    question: "What happens after I publish?",
    answer:
      "Your site goes live at nosweatfd.com/s/your-business or on your own domain. You get an email when someone sends a request through your contact form, and every request is saved in your dashboard and added to your Clients list. Keep editing anytime; changes stay in a draft until you publish again.",
  },
  {
    question: "What is the Clients area?",
    answer:
      "A simple list of the people who contact you. Every request from your website’s contact form becomes a client automatically. Move each one from New to Contacted, Quoted, then Won or Lost, add notes and follow-up dates, log the jobs you did and what they paid, and tap to call, text or email them.",
  },
  {
    question: "Can it post to Instagram for me?",
    answer:
      // Enquanto SOCIAL_TESTER_ONLY=true (app da Meta ainda sem App Review), clientes postam à
      // mão pelo calendário. Quando o fundador puser SOCIAL_TESTER_ONLY=false, voltar ao texto
      // original: "You review and approve each one, and approved posts go out on schedule."
      "Yes, with your approval. Connect a professional Instagram account and AI drafts a month of posts from your website. You review and approve each one, then share it from your calendar in one tap (copy the caption, save the photo). Automatic posting turns on as soon as Instagram approves our app. Nothing is posted without your approval.",
  },
  {
    question: "How much does it cost?",
    answer: `Starter is ${prices.starter.monthly} a month, Pro ${prices.pro.monthly} and Premium ${prices.premium.monthly}, with no setup fee. Pay yearly and get 2 months free: ${prices.starter.annual}, ${prices.pro.annual} or ${prices.premium.annual} a year. Starting is free: describe your business and answer a few quick questions. You pick a plan when you want your website built. ${REFUND_TERMS}`,
  },
  {
    question: "Can I cancel?",
    answer: `Yes. ${CANCELLATION_TERMS}`,
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on every plan, if you already own one (from any domain registrar). On your site’s page we show the DNS records to add and verify the connection. You can also publish on a free nosweatfd.com/s/ address.",
  },
];

export const PRICING_FAQS: Faq[] = [
  {
    question: "Do I need a credit card to start?",
    answer:
      "No. Describe your business and answer a few quick questions for free, without a credit card. You pick a plan when you want your website built.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on every plan. You connect a domain you already own and we show you the DNS records to add at your registrar. Domain registration is not included.",
  },
  {
    question: "Can I cancel?",
    answer: `Yes. ${CANCELLATION_TERMS}`,
  },
  {
    question: "Can I get a refund?",
    answer: `Yes. ${REFUND_TERMS} To ask for one, email ${CONTACT_EMAIL}.`,
  },
  {
    question: "What are AI credits?",
    answer: `AI credits pay for the things AI does for you${newSiteCost ? `, like creating a new website (${newSiteCost} credits)` : ""}${aiChangeCost ? ` or changing your site (${aiChangeCost} credits)` : ""}. ${MONTHLY_CREDITS_TEXT}. Monthly credits refill on the 1st of each month and unused ones don’t roll over. Editing your website by hand is always free.`,
  },
  {
    question: "What happens to my website if I don’t publish?",
    answer:
      "It stays as a private draft; sign up free to keep it. Only you can see it, and you can keep editing it anytime.",
  },
];
