import type { SectionType } from "@nosweat/schema";
import {
  ClockIcon,
  HomeIcon,
  ShieldIcon,
  SparkIcon,
  TagIcon,
  WrenchIcon,
} from "../../components/icons";

// Textos fixos do template home-services (interface em inglês americano).

// Selos e destaques vêm de business.highlights (fatos confirmados pelo dono), nunca do template.

export const SERVICE_ICONS = [WrenchIcon, HomeIcon, SparkIcon, ShieldIcon, ClockIcon, TagIcon];

/** Âncora e rótulo do menu para cada tipo de seção (o hero não entra no menu). */
export const NAV: Partial<Record<SectionType, { anchor: string; label: string }>> = {
  services: { anchor: "services", label: "Services" },
  gallery: { anchor: "work", label: "Our work" },
  testimonials: { anchor: "reviews", label: "Reviews" },
  faq: { anchor: "faq", label: "FAQ" },
  contact: { anchor: "contact", label: "Contact" },
};
