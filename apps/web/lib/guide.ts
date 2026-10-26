// Conteúdo da página /guide ("How No Sweat works"): uma seção por área do painel e as perguntas
// frequentes. Só dados (sem React). Cada resposta foi conferida no código: nada de recurso que
// não existe (ex.: pagamento online por cartão ainda não existe; a IA nunca publica sozinha).
// Os `id`s viram âncoras (/guide#clients) usadas pelos estados vazios das páginas.

export type GuideSectionId =
  | "home"
  | "website"
  | "clients"
  | "schedule"
  | "estimates"
  | "invoices"
  | "social"
  | "reviews"
  | "settings"
  | "team"
  | "billing";

/** Ícone da seção (os desenhos ficam em app/(dashboard)/NavIcons.tsx). */
export type GuideIcon =
  | "home"
  | "website"
  | "clients"
  | "schedule"
  | "estimates"
  | "invoices"
  | "social"
  | "reviews"
  | "settings"
  | "team"
  | "billing";

export type GuideSection = {
  id: GuideSectionId;
  title: string;
  icon: GuideIcon;
  /** 2–4 frases curtas. */
  body: string;
  cta: { label: string; href: string };
  /** Mini passo a passo (3 passos). */
  steps: readonly [string, string, string];
};

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: "home",
    title: "Home",
    icon: "home",
    body: "Home is your day at a glance: today’s jobs, the money coming in and what needs you. The checklist shows what’s left to finish your website.",
    cta: { label: "Open Home", href: "/dashboard" },
    steps: [
      "Check today’s jobs at the top.",
      "Handle anything under “Needs you”.",
      "Tick off the website checklist.",
    ],
  },
  {
    id: "website",
    title: "Website",
    icon: "website",
    body: "Your website is ready to edit. Change any text or photo, or ask AI to make a change for you. Publish puts it online at a free address, and you can connect your own domain later. Messages from your contact form show up on the website page and in Clients.",
    cta: { label: "Open Website", href: "/dashboard#sites" },
    steps: [
      "Open your site and tap Edit to change text and photos.",
      "Tap Publish to put it online.",
      "Under Domain, connect yourbusiness.com when you’re ready.",
    ],
  },
  {
    id: "clients",
    title: "Clients",
    icon: "clients",
    body: "Everyone who fills out your website’s contact form becomes a client on their own. Call or text them in one tap, add notes and tags, and move them through stages as the work goes on.",
    cta: { label: "Open Clients", href: "/clients" },
    steps: [
      "Add the people you already work with.",
      "Tap a client to call, text or add a note.",
      "Use the ⋯ menu to move them to the next stage.",
    ],
  },
  {
    id: "schedule",
    title: "Schedule",
    icon: "schedule",
    body: "Schedule is your jobs calendar. Book a job for a client, pick a time and assign someone from your team.",
    cta: { label: "Open Schedule", href: "/schedule" },
    steps: [
      "Tap an open time or “New job”.",
      "Pick the client, the time and who’s going.",
      "Save. The job shows up on Home that day.",
    ],
  },
  {
    id: "estimates",
    title: "Estimates",
    icon: "estimates",
    body: "Build an estimate from your price book and text or email your customer a link. They open it on their phone and approve it by typing their name. No account needed. Once it’s approved, turn it into a job, an invoice or both.",
    cta: { label: "Open Estimates", href: "/estimates" },
    steps: [
      "Pick a client and add your services and prices.",
      "Send the link by text or email.",
      "When they approve, tap “Create job or invoice”.",
    ],
  },
  {
    id: "invoices",
    title: "Invoices",
    icon: "invoices",
    body: "Send an invoice link by text or email. Your customer sees what they owe and how to pay you. When the cash, check or Zelle comes in, record the payment and the invoice is marked paid.",
    cta: { label: "Open Invoices", href: "/invoices" },
    steps: [
      "Create an invoice or turn an approved estimate into one.",
      "Send the link to your customer.",
      "Tap “Record payment” when you get paid.",
    ],
  },
  {
    id: "social",
    title: "Social",
    icon: "social",
    body: "AI drafts a month of Instagram posts from your website. You read, edit, approve or delete each one. Nothing goes out until you approve it.",
    cta: { label: "Open Social", href: "/social" },
    steps: [
      "Tap “Fill my month with AI”.",
      "Read each draft. Edit, approve or delete it.",
      "Approved posts go out on their day, or you post them yourself.",
    ],
  },
  {
    id: "reviews",
    title: "Google reviews",
    icon: "reviews",
    body: "Paste your Google review link once. Your website gets a “Review us on Google” button, and you get quick ways to ask your clients by text, email or QR code.",
    cta: { label: "Open Google reviews", href: "/reviews" },
    steps: [
      "In your Google Business Profile, tap “Ask for reviews” and copy the link.",
      "Paste it on the Google reviews page and save.",
      "Send it to happy clients by text, email or QR code.",
    ],
  },
  {
    id: "settings",
    title: "Business settings and price book",
    icon: "settings",
    body: "Set your company details, sales tax, how long estimates are good for, when invoices are due and how customers can pay you. Save the services you sell most in your price book so estimates and invoices take a few taps.",
    cta: { label: "Open Business settings", href: "/office/settings" },
    steps: [
      "Add your company name, phone and address.",
      "Write how customers can pay you (cash, check, Zelle…).",
      "Add your usual services to the price book.",
    ],
  },
  {
    id: "team",
    title: "Team",
    icon: "team",
    body: "Add your technicians, helpers or office staff. Each person gets a color so you can see who’s on which job. Team members don’t log in yet.",
    cta: { label: "Open Team", href: "/team" },
    steps: [
      "Tap “Add team member”.",
      "Type their name and pick a color.",
      "Assign them to jobs on your schedule.",
    ],
  },
  {
    id: "billing",
    title: "Billing",
    icon: "billing",
    body: "Billing shows your plan and your AI credits. Your plan decides how many websites you can have online and whether you can use your own domain, which comes with Pro and Premium.",
    cta: { label: "Open Billing", href: "/billing" },
    steps: [
      "Open Billing to see your plan.",
      "Pick the plan that fits you.",
      "Come back anytime to change it.",
    ],
  },
];

export type GuideFaq = { id: string; question: string; answer: string };

export const GUIDE_FAQ: readonly GuideFaq[] = [
  {
    id: "get-paid",
    question: "How do I get paid?",
    answer:
      "Send your customer an invoice link. It shows what they owe and the payment instructions from your Business settings (cash, check, Zelle or whatever you accept). When the money comes in, open the invoice and tap “Record payment”. Online card payments aren’t available yet, so for now you record payments yourself.",
  },
  {
    id: "customer-account",
    question: "Do my customers need an account?",
    answer:
      "No. Estimates and invoices are sent as a link. Your customer opens it on any phone or computer, and approves an estimate by typing their name.",
  },
  {
    id: "domain",
    question: "How do I connect my domain?",
    answer:
      "Open your website and go to Domain. Type the domain you own, like yourbusiness.com. First you add a TXT record that proves it’s yours, then an A record and a CNAME record where you bought the domain. We show you the exact values. Your own domain comes with the Pro and Premium plans.",
  },
  {
    id: "ai-posts",
    question: "Will AI post without me?",
    answer:
      "Never. AI only writes drafts. Nothing goes out until you approve it, and you can edit or delete any post. If automatic posting is turned on for your account, approved posts go out on their day. If not yet, you open the post on its day, copy the caption, save the photo and share it on Instagram yourself.",
  },
  {
    id: "google-reviews",
    question: "How do I add my Google reviews?",
    answer:
      "In your Google Business Profile, tap “Ask for reviews” and copy the link. Paste it on the Google reviews page. Your website gets a “Review us on Google” button that sends people to Google. We don’t copy your stars or reviews onto your site.",
  },
  {
    id: "cancel",
    question: "How do I cancel?",
    answer:
      "If you pay by card, open Billing and tap “Manage billing” to change plans or cancel. Your plan stays on until the end of the period you already paid for. If our team set up your plan with you, it simply ends on its end date. Message us with Help if you have questions.",
  },
];

/** Endereço de uma seção do guia (para os links "New here? See how it works"). */
export function guideHref(section: GuideSectionId): string {
  return `/guide#${section}`;
}
