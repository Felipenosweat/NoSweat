// Planos e preços mostrados na landing e em /pricing. PROVISÓRIOS: mudar aqui muda as duas
// telas. A cobrança de verdade (Stripe) ainda não existe. Só listar o que a plataforma já faz.

export type PlanId = "free" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Taxa única de criação, em dólares (`null` = não tem). */
  setupPrice: number | null;
  /** Mensalidade em dólares (0 = grátis). */
  monthlyPrice: number;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Build your website and see it before you pay anything.",
    setupPrice: null,
    monthlyPrice: 0,
    features: [
      "No account or credit card needed to start",
      "A full website from a few sentences",
      "Private preview",
      "Edit text, colors and sections",
      "A few AI changes per day",
    ],
    cta: { label: "Start building", href: "/create" },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Your website live, with your own domain and customer messages.",
    setupPrice: 249,
    monthlyPrice: 49,
    features: [
      "Everything in Free",
      "Publish at nosweatfd.com/s/your-business",
      "Connect your own domain",
      "Contact form messages in your dashboard",
      "Version history with one-click restore",
      "More AI changes per day",
    ],
    cta: { label: "Get started", href: "/signup?next=/create" },
    highlighted: true,
  },
];

export const formatUsd = (amount: number) => `$${amount.toLocaleString("en-US")}`;
