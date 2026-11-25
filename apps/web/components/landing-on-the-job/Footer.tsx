import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FOOTER_LINKS, salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { SocialLinks } from "@/components/marketing/SocialLinks";
import { FOOTER_NOTE } from "./content";
import { photoCredits, unsplashLink } from "./photos";

// 8. Rodapé da landing "On the job": os mesmos links do MarketingFooter (FOOTER_LINKS, mais o
// WhatsApp de vendas quando existe), o logo, as redes e a linha de créditos das fotos (exigida
// pelo Unsplash: cada fotógrafo com link para o perfil, e o Unsplash).

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function Footer() {
  const whatsapp = salesWhatsappUrl();
  const groups = FOOTER_LINKS.map((group) =>
    group.title === "Company" && whatsapp
      ? {
          ...group,
          links: [...group.links, { href: whatsapp, label: "Chat on WhatsApp", external: true }],
        }
      : group,
  );
  const credits = photoCredits();
  const link = `inline-flex min-h-11 min-w-11 items-center rounded-sm text-slate-600 transition-colors duration-150 hover:text-ink ${ring}`;
  const inline = `rounded-sm underline decoration-slate-300 underline-offset-2 hover:text-ink hover:decoration-ink ${ring}`;

  return (
    <footer className="border-t border-slate-200 bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="otj-grid py-14 lg:py-20">
        <div className="col-[2/14] lg:col-[2/6]">
          <div className="[&>a]:min-h-11">
            <Logo />
          </div>
          <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-slate-600">
            Websites for small businesses, built from a few sentences and easy to keep up to date.
          </p>
          <p className="mt-6 text-[15px] font-semibold text-ink">Follow @nosweatfd</p>
          <SocialLinks tone="light" className="mt-3" />
        </div>
        <nav
          aria-label="Footer"
          className="col-[2/14] mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-[6/14] lg:mt-0"
        >
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-[15px] font-semibold text-ink">{group.title}</p>
              <ul className="mt-2 text-[15px]">
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
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-200">
        <div className="otj-grid py-6 text-[14px] leading-relaxed text-slate-600">
          <div className="col-[2/14] grid gap-2">
            <p>{FOOTER_NOTE}</p>
            <p>
              Photos:{" "}
              {credits.map((credit, index) => (
                <span key={credit.name}>
                  <a
                    href={unsplashLink(credit.profile)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={inline}
                  >
                    {credit.name}
                  </a>
                  {index < credits.length - 2 ? ", " : index === credits.length - 2 ? " and " : ""}
                </span>
              ))}{" "}
              on{" "}
              <a
                href={unsplashLink("https://unsplash.com")}
                target="_blank"
                rel="noopener noreferrer"
                className={inline}
              >
                Unsplash
              </a>
              , shown for illustration.
            </p>
            <p className="mt-2 flex flex-wrap justify-between gap-x-6 gap-y-1">
              <span>&copy; {new Date().getFullYear()} No Sweat. All rights reserved.</span>
              <span>nosweatfd.com</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
