// Perguntas frequentes da landing e de /pricing. Um lugar só: a página mostra este texto, e os
// dados estruturados (FAQPage, para o Google) e o /llms.txt (para as IAs) leem daqui também.
// Só o que o produto faz hoje.

export type Faq = { question: string; answer: string };

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
    answer:
      "Yes. Ask for changes in plain English — “add a deep-cleaning service,” “make it warmer” — and you get a new draft to review. Nothing goes live until you publish, and you can go back to an earlier version. Starter includes 30 AI edits a month, Pro 150 and Premium 500. AI edits reset monthly and don’t roll over.",
  },
  {
    question: "Can I add my own photos?",
    answer:
      "Yes, on Pro and Premium. Upload JPG, PNG or WebP photos and show them in a gallery on your site. Every site can also start with a hero photo picked for your industry from a stock library, credited to the photographer.",
  },
  {
    question: "What happens after I publish?",
    answer:
      "Your site goes live at nosweatfd.com/s/your-business or on your own domain. You get an email when someone sends a request through your contact form, and every request is saved in your dashboard. Keep editing anytime; changes stay in a draft until you publish again.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Starter is $39 a month, Pro $69 and Premium $129. Monthly Starter and Pro plans have a one-time $249 setup fee. Pay yearly and get 2 months free with no setup fee: $390, $690 or $1,290 a year. Creating an account and previewing your site are free; you pick a plan when you go live.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Yes. Plans renew automatically until you cancel, and you can cancel anytime in your account. You keep your plan until the end of the month or year you already paid for. For annual plans, we email you a reminder before each renewal. Nothing is charged today.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on Pro and Premium, if you already own one (from any domain registrar). On your site’s page we show the DNS records to add and verify the connection. Every plan can publish on a free nosweatfd.com/s/ address.",
  },
];

export const PRICING_FAQS: Faq[] = [
  {
    question: "Do I need a credit card to start?",
    answer:
      "No. Describe your business and get a full website draft without a credit card. You don’t even need an account to start.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on Pro and Premium. You connect a domain you already own and we show you the DNS records to add at your registrar. Domain registration is not included.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Yes. Plans renew automatically until you cancel, and you can cancel anytime in your account. You keep your plan until the end of the month or year you already paid for. For annual plans, we email you a reminder before each renewal. Nothing is charged today.",
  },
  {
    question: "What happens to my website if I don’t publish?",
    answer:
      "It stays as a private draft in your account. Only you can see it, and you can keep editing it anytime.",
  },
];
