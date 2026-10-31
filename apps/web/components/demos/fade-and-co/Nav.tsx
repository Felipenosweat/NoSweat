"use client";

import { useEffect, useRef, useState } from "react";

// Menu da Fade & Co.: uma pílula flutuante. No computador fica no alto, centrada, com as
// seções, o telefone e "Book a chair". No celular desce para baixo (zona do polegar) com três
// botões: menu, ligar e reservar. O menu do celular abre uma folha vermelha com as seções em
// letra grande; Esc fecha e o foco volta ao botão (resto da página fica `inert`).

const LINKS = [
  { href: "#prices", label: "Prices" },
  { href: "#barbers", label: "Barbers" },
  { href: "#book", label: "Book" },
  { href: "#visit", label: "Hours & visit" },
];

export function Nav({ phone, phoneHref }: { phone: string; phoneHref: string }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const main = document.getElementById("main");
    const footer = document.getElementById("f-footer");
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="f-pill-wrap" data-open={open || undefined}>
        <nav aria-label="Main" className="f-pill">
          <a
            href="#top"
            className="f-pill-brand f-focus"
            aria-label="Fade & Co. Barbers, back to top"
          >
            <span aria-hidden="true" className="f-pill-dot" />
            <span className="f-pill-name">Fade&nbsp;&amp;&nbsp;Co.</span>
          </a>
          <ul className="f-pill-links">
            {LINKS.slice(0, 2)
              .concat(LINKS.slice(3))
              .map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="f-pill-link f-focus">
                    {link.label}
                  </a>
                </li>
              ))}
          </ul>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="f-menu"
            onClick={() => setOpen((value) => !value)}
            className="f-pill-menu f-focus"
          >
            <span aria-hidden="true" className="f-burger" data-open={open || undefined}>
              <span />
              <span />
            </span>
            {open ? "Close" : "Menu"}
          </button>
          <a href={phoneHref} className="f-pill-call f-focus">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="currentColor">
              <path d="M5.6 2.5c.5-.2 1 0 1.3.4l1.7 2.6c.3.4.2 1-.1 1.4L7.4 8a10.6 10.6 0 0 0 4.6 4.6l1.1-1.1c.4-.4 1-.4 1.4-.1l2.6 1.7c.4.3.6.8.4 1.3l-.6 1.7c-.3.8-1.1 1.3-2 1.2C8.6 16.6 3.4 11.4 2.7 5.1c-.1-.9.4-1.7 1.2-2l1.7-.6Z" />
            </svg>
            <span className="f-pill-call-num">{phone}</span>
            <span className="f-pill-call-short">Call</span>
          </a>
          <a href="#book" className="f-pill-book f-focus">
            Book a chair
          </a>
        </nav>
      </header>

      <div
        id="f-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        data-open={open || undefined}
        className="f-menu"
      >
        <ol>
          {LINKS.map((link, index) => (
            <li key={link.href} style={{ transitionDelay: open ? `${80 + index * 60}ms` : "0ms" }}>
              <a href={link.href} onClick={() => setOpen(false)} className="f-menu-link f-focus">
                <span className="f-menu-num">{String(index + 1).padStart(2, "0")}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ol>
        <p className="f-menu-note">A fictional shop · Design demo by No Sweat</p>
      </div>
    </>
  );
}
