import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#examples", label: "Examples" },
  { href: "/#faq", label: "FAQ" },
];

const FOOTER_LINKS = [
  {
    title: "Product",
    links: NAV,
  },
  {
    title: "Get started",
    links: [
      { href: "/create", label: "Build your website" },
      { href: "/login", label: "Log in" },
      { href: "/examples/joes-plumbing", label: "See an example" },
    ],
  },
];

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-medium md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-600 transition hover:text-slate-950"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm font-semibold sm:gap-3">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-slate-700 transition hover:text-slate-950"
            >
              Log in
            </Link>
            <Link
              href="/create"
              className="rounded-full bg-slate-950 px-4 py-2 text-white shadow-sm transition hover:bg-slate-800"
            >
              Get started<span className="hidden sm:inline"> free</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Professional websites for small businesses, ready in minutes. Built for the folks who
              keep our neighborhoods running.
            </p>
          </div>
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-slate-950">{group.title}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-600 transition hover:text-slate-950"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6">
            <p>&copy; {new Date().getFullYear()} No Sweat. All rights reserved.</p>
            <p>nosweatfd.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
