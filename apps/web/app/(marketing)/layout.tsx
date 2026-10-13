import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { container } from "@/components/marketing/styles";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#what-it-does", label: "What your site does" },
      { href: "/#examples", label: "Examples" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/create", label: "Build my website" },
      { href: "/login", label: "Log in" },
      { href: "/examples/joes-plumbing", label: "See an example" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className={`${container} flex h-16 items-center justify-between gap-4`}>
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm md:flex lg:gap-8">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-11 items-center rounded-sm font-semibold text-slate-600 transition-colors hover:text-ink ${focusRing}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm font-semibold sm:gap-3">
            {/* Abaixo de 360px só cabem a logo e o CTA. */}
            <Link
              href="/login"
              className={`inline-flex h-11 items-center rounded-lg px-2 whitespace-nowrap text-slate-700 transition-colors hover:text-ink max-[359px]:hidden ${focusRing}`}
            >
              Log in
            </Link>
            <Link
              href="/create"
              className={`inline-flex h-11 items-center rounded-lg bg-brand px-3 whitespace-nowrap text-white transition-colors hover:bg-brand-dark active:translate-y-px sm:px-4 ${focusRing}`}
            >
              Start building
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-surface">
        <div className={`${container} grid gap-10 py-14 md:grid-cols-12 md:gap-x-8`}>
          <div className="md:col-span-5">
            <Logo tagline />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Websites for small businesses, built from a sentence and easy to keep up to date.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-semibold text-ink">{group.title}</p>
                <ul className="mt-2 text-sm">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`inline-flex min-h-11 items-center rounded-sm text-slate-600 transition-colors hover:text-ink ${focusRing}`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-slate-200">
          <div
            className={`${container} flex flex-col gap-2 py-6 text-sm text-slate-500 sm:flex-row sm:justify-between`}
          >
            <p>&copy; {new Date().getFullYear()} NoSweat. All rights reserved.</p>
            <p>nosweatfd.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
