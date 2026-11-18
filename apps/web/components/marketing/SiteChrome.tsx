import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SocialLinks } from "./SocialLinks";
import { container, focusRing } from "./styles";

// Rodapé do site de marketing (landing e páginas claras), em dois tons. O cabeçalho é o
// LandingHeader (components/landing), o mesmo na landing e em /pricing.
// Server component: lê SALES_WHATSAPP direto do ambiente (sem a variável, o link não aparece).

type Tone = "light" | "dark";

type FooterLink = { href: string; label: string; external?: boolean };

/** Link do WhatsApp de vendas (SALES_WHATSAPP, só dígitos como o wa.me pede) ou `null`. */
export function salesWhatsappUrl(): string | null {
  const digits = process.env.SALES_WHATSAPP?.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent("Hi! I have a question about No Sweat.")}`;
}

// Rodapé em 4 colunas (brief). Termos e privacidade são rascunhos (ver as próprias páginas).
const FOOTER_LINKS: { title: string; links: FooterLink[]; note?: string }[] = [
  {
    title: "Product",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/#office", label: "The office" },
      { href: "/#examples", label: "Examples" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/create", label: "Build my website" },
      { href: "/login", label: "Log in" },
      { href: "/contact", label: "Contact" },
      { href: "mailto:hello@nosweatfd.com", label: "hello@nosweatfd.com", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund", label: "Refund Policy" },
      { href: "/data-deletion", label: "Data deletion" },
    ],
    note: "Example businesses on this site are fictional.",
  },
  {
    title: "Image credits",
    links: [{ href: "/credits", label: "Photo credits" }],
    note: "Photos from Unsplash and Pexels, credited to each photographer.",
  },
];

export function MarketingFooter({ tone = "light" }: { tone?: Tone }) {
  const dark = tone === "dark";
  const whatsapp = salesWhatsappUrl();
  const groups = whatsapp
    ? FOOTER_LINKS.map((group) =>
        group.title === "Company"
          ? {
              ...group,
              links: [
                ...group.links,
                { href: whatsapp, label: "Chat on WhatsApp", external: true },
              ],
            }
          : group,
      )
    : FOOTER_LINKS;
  const link = `inline-flex min-h-11 items-center rounded-sm transition-colors duration-150 ${focusRing} ${
    dark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-ink"
  }`;
  return (
    <footer
      className={`border-t pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0 ${
        dark ? "border-white/10 bg-ink" : "border-slate-200 bg-surface"
      }`}
    >
      <div className={`${container} grid gap-10 py-14 lg:grid-cols-12 lg:gap-x-8`}>
        <div className="lg:col-span-4">
          <Logo tagline tone={tone} />
          <p
            className={`mt-4 max-w-xs text-sm leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}
          >
            Websites for local businesses, built from four questions, with the office tools behind
            them.
          </p>
          <p className={`mt-6 text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>
            Follow @nosweatfd
          </p>
          <SocialLinks tone={dark ? "dark" : "light"} className="mt-3" />
        </div>
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-8"
        >
          {groups.map((group) => (
            <div key={group.title}>
              <p className={`text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>
                {group.title}
              </p>
              <ul className="mt-2 text-sm">
                {group.links.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a
                        href={item.href}
                        className={`${link} break-all`}
                        {...(item.href.startsWith("https://")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className={link}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              {group.note && (
                <p
                  className={`mt-2 max-w-[28ch] text-[13px] leading-normal ${dark ? "text-slate-400" : "text-(--glass-fg-muted)"}`}
                >
                  {group.note}
                </p>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className={`border-t ${dark ? "border-white/10" : "border-slate-200"}`}>
        <div
          className={`${container} flex flex-col gap-2 py-6 text-sm sm:flex-row sm:justify-between ${dark ? "text-slate-400" : "text-(--glass-fg-muted)"}`}
        >
          <p>&copy; {new Date().getFullYear()} No Sweat. All rights reserved.</p>
          <p>nosweatfd.com</p>
        </div>
      </div>
    </footer>
  );
}
