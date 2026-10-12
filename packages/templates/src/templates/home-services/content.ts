import type { SectionType } from "@nosweat/schema";
import {
  ClockIcon,
  HomeIcon,
  ShieldIcon,
  SparkIcon,
  TagIcon,
  ThumbsUpIcon,
  WrenchIcon,
} from "../../components/icons";

// Textos fixos do template home-services (interface em inglês americano).

// TODO: levar os selos para o SiteSpec (campo opcional) para a IA escolher os que são verdade
// para cada negócio. Por enquanto são genéricos do template.
export const TRUST_BADGES = [
  { label: "Licensed & Insured", Icon: ShieldIcon },
  { label: "Upfront Pricing", Icon: TagIcon },
  { label: "Same-Day Service", Icon: ClockIcon },
  { label: "Satisfaction Guaranteed", Icon: ThumbsUpIcon },
] as const;

// TODO: mesmo caso dos selos: mover para o SiteSpec quando a IA puder preencher.
export const HERO_CARD_POINTS = [
  "Free, no-obligation estimates",
  "Flat-rate pricing before we start",
  "Clean, respectful technicians",
];

export const SERVICE_ICONS = [WrenchIcon, HomeIcon, SparkIcon, ShieldIcon, ClockIcon, TagIcon];

/** Âncora e rótulo do menu para cada tipo de seção (o hero não entra no menu). */
export const NAV: Partial<Record<SectionType, { anchor: string; label: string }>> = {
  services: { anchor: "services", label: "Services" },
  testimonials: { anchor: "reviews", label: "Reviews" },
  faq: { anchor: "faq", label: "FAQ" },
  contact: { anchor: "contact", label: "Contact" },
};
