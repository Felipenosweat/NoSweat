import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { SOCIAL_PROFILES } from "@/lib/social-profiles";
import { LiveLogo } from "./LiveLogo";
import { focusOnDark } from "./styles";

// Rodapé da landing "Live": faixa azul-escura (brand-dark), mínima. Os links são os mesmos do
// MarketingFooter (SiteChrome.tsx); o desenho é outro: uma linha de links por assunto, sem as
// quatro colunas. As âncoras (/#story, /#clients...) existem nas seções desta página.

type FooterLink = { href: string; label: string };

const GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/#story", label: "Websites" },
      { href: "/#clients", label: "Clients" },
      { href: "/#social", label: "Instagram posts" },
      { href: "/#looks", label: "Examples" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/create", label: "Build my website" },
      { href: "/login", label: "Log in" },
      { href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/data-deletion", label: "Data deletion" },
      { href: "/credits", label: "Photo credits" },
    ],
  },
  {
    title: "Follow @nosweatfd",
    links: SOCIAL_PROFILES.map((profile) => ({ href: profile.url, label: profile.label })),
  },
];

const linkClass = `inline-flex min-h-11 items-center rounded-sm text-[15px] text-white underline-offset-4 hover:underline ${focusOnDark}`;

export function LiveFooter() {
  const whatsapp = salesWhatsappUrl();
  const groups = whatsapp
    ? GROUPS.map((group) =>
        group.title === "Company"
          ? { ...group, links: [...group.links, { href: whatsapp, label: "Chat on WhatsApp" }] }
          : group,
      )
    : GROUPS;

  return (
    <footer className="bg-brand-dark pb-[calc(6rem+env(safe-area-inset-bottom))] text-white sm:pb-0">
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-12 pb-8 sm:px-8 lg:px-12">
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <LiveLogo />
          </div>
          <nav aria-label="Footer" className="grid gap-y-5 lg:col-span-9">
            {groups.map((group) => (
              <div
                key={group.title}
                className="grid gap-x-8 border-t border-white/25 pt-3 sm:grid-cols-[11rem_1fr]"
              >
                <p className="pt-2.5 text-[15px] font-semibold">{group.title}</p>
                <ul className="flex flex-wrap gap-x-6">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      {item.href.startsWith("/") ? (
                        <Link href={item.href} className={linkClass}>
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className={`${linkClass} break-all`}
                          {...(item.href.startsWith("https://")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/25 pt-6 text-sm text-white sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} No Sweat. All rights reserved.</p>
          <p>
            Example businesses on this site are made up. Photos from Unsplash and Pexels, credited
            to each photographer.
          </p>
        </div>
      </div>
    </footer>
  );
}
