"use client";

import { useMemo, useState } from "react";
import { CAFE, MENU, money, money2, type MenuItem } from "./content";
import { Icon } from "./ui";

// Cardápio como página de jornal + "bilhete de retirada" (demonstração do pedido antecipado).
// Cada linha tem nome, descrição, fatos em mono e o preço; "Add" põe no bilhete. As únicas
// opções são as que o dono citou: bacon (+$2) no ovo e cheddar, moer de graça o blend.
// Nada é enviado: o botão final só mostra uma confirmação que diz isso.

type Line = { key: string; item: MenuItem; qty: number; extra?: string; extraPrice: number };

export function MenuOrder() {
  const [lines, setLines] = useState<Line[]>([]);
  const [bacon, setBacon] = useState(false);
  const [grind, setGrind] = useState(0);
  const [sent, setSent] = useState(false);
  const [announce, setAnnounce] = useState("");

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty * (l.item.price + l.extraPrice), 0),
    [lines],
  );
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  function add(item: MenuItem) {
    let extra: string | undefined;
    let extraPrice = 0;
    if (item.option?.kind === "addon" && bacon) {
      extra = `${item.option.label.replace("Add ", "+ ")}`;
      extraPrice = item.option.price;
    }
    if (item.option?.kind === "grind") extra = item.option.choices[grind];
    const key = `${item.id}:${extra ?? ""}`;
    setSent(false);
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { key, item, qty: 1, extra, extraPrice }];
    });
    setAnnounce(`${item.name}${extra ? `, ${extra}` : ""} added to your pickup slip.`);
  }

  function change(key: string, delta: number) {
    setSent(false);
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0),
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      {/* O cardápio */}
      <div className="lg:col-span-7">
        {MENU.map((group, gi) => (
          <section
            key={group.id}
            aria-labelledby={`menu-${group.id}`}
            className={gi === 0 ? "" : "mt-14"}
          >
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-[var(--nl-ink)] pb-2">
              <h3 id={`menu-${group.id}`} className="nl-display text-[28px] italic leading-tight">
                {group.title}
              </h3>
              <span className="nl-mono text-[11px] text-[var(--nl-ink-2)] tabular-nums">
                {String(gi + 1).padStart(2, "0")} / {String(MENU.length).padStart(2, "0")}
              </span>
            </div>
            {group.note ? (
              <p className="mt-3 text-[16px] text-[var(--nl-ink-2)] italic">{group.note}</p>
            ) : null}
            <ul className="mt-2">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="nl-menu-row grid grid-cols-[1fr_auto] gap-x-4 border-b border-[var(--nl-rule)] py-5"
                >
                  <div className="min-w-0">
                    <p className="flex items-baseline gap-3">
                      <span className="nl-display text-[22px] leading-tight sm:text-[24px]">
                        {item.name}
                      </span>
                      <span aria-hidden="true" className="nl-leader hidden flex-1 sm:block" />
                    </p>
                    <p className="mt-1 max-w-[52ch] text-[16px] leading-relaxed text-[var(--nl-ink-2)]">
                      {item.description}
                    </p>
                    {item.tags ? (
                      <p className="mt-2 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span key={tag} className="nl-tag">
                            {tag}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    {item.option?.kind === "addon" ? (
                      <label className="nl-focus-within mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
                        <input
                          type="checkbox"
                          checked={bacon}
                          onChange={(e) => setBacon(e.target.checked)}
                          className="nl-check"
                        />
                        {item.option.label}{" "}
                        <span className="nl-mono text-[13px]">+{money2(item.option.price)}</span>
                      </label>
                    ) : null}
                    {item.option?.kind === "grind" ? (
                      <fieldset className="mt-3">
                        <legend className="sr-only">Whole bean or ground</legend>
                        <div className="flex flex-wrap gap-2">
                          {item.option.choices.map((choice, ci) => (
                            <label
                              key={choice}
                              className={`nl-choice nl-focus-within ${grind === ci ? "is-on" : ""}`}
                            >
                              <input
                                type="radio"
                                name="grind"
                                checked={grind === ci}
                                onChange={() => setGrind(ci)}
                                className="sr-only"
                              />
                              {choice}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="nl-price">{money(item.price)}</span>
                    {item.noOrder ? (
                      <a
                        href={CAFE.phoneHref}
                        className="nl-mono nl-focus max-w-[9rem] text-right text-[11px] leading-snug underline underline-offset-4"
                      >
                        {item.noOrder}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => add(item)}
                        className="nl-add nl-focus"
                        aria-label={`Add ${item.name} to pickup slip`}
                      >
                        <Icon name="plus" className="h-4 w-4" />
                        Add
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* O bilhete de retirada */}
      <div className="lg:col-span-5 lg:col-start-8">
        <div className="lg:sticky lg:top-24">
          <div id="slip" className="nl-slip scroll-mt-24" aria-labelledby="slip-title">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="slip-title" className="nl-display text-[26px] leading-tight">
                Pickup slip
              </h3>
              <span className="nl-mono text-[10.5px]">Demo · nothing is sent</span>
            </div>
            <p className="mt-1 text-[15px] text-[var(--nl-ink-2)]">
              Order ahead and pick it up at the end of the bar.
            </p>
            <p className="sr-only" aria-live="polite">
              {announce}
            </p>
            {lines.length === 0 ? (
              <p className="nl-mono mt-6 border-y border-dashed border-[var(--nl-rule-strong)] py-6 text-center text-[12px] text-[var(--nl-ink-2)]">
                Tap “Add” on anything in the menu
              </p>
            ) : (
              <ul className="mt-5 border-y border-dashed border-[var(--nl-rule-strong)] py-3">
                {lines.map((l) => (
                  <li
                    key={l.key}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2"
                  >
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => change(l.key, -1)}
                        className="nl-step nl-focus"
                        aria-label={`One less ${l.item.name}`}
                      >
                        <Icon name="minus" className="h-3.5 w-3.5" />
                      </button>
                      <span className="nl-mono w-5 text-center text-[13px] tabular-nums">
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => change(l.key, 1)}
                        className="nl-step nl-focus"
                        aria-label={`One more ${l.item.name}`}
                      >
                        <Icon name="plus" className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    <span className="min-w-0 text-[16px] leading-snug">
                      {l.item.name}
                      {l.extra ? (
                        <span className="nl-mono block text-[11px] text-[var(--nl-ink-2)]">
                          {l.extra}
                        </span>
                      ) : null}
                    </span>
                    <span className="nl-mono text-[14px] tabular-nums">
                      {money2(l.qty * (l.item.price + l.extraPrice))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 flex items-baseline justify-between">
              <span className="nl-mono text-[12px]">
                Subtotal · {count} item{count === 1 ? "" : "s"}
              </span>
              <span className="nl-mono text-[20px] tabular-nums">{money2(total)}</span>
            </p>
            <p className="nl-mono mt-1 text-[10.5px] text-[var(--nl-ink-2)]">Before tax</p>
            <button
              type="button"
              disabled={count === 0}
              onClick={() => setSent(true)}
              className="nl-btn nl-focus mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send to the bar
              <Icon name="arrow" className="h-4 w-4" />
            </button>
            <div role="status" className="mt-4 text-[15px] leading-relaxed">
              {sent ? (
                <p className="border-l-2 border-[var(--nl-blue)] pl-3">
                  This is a design demo, so nothing was sent or charged. At the real café you would
                  finish at <span className="nl-mono text-[13px]">{CAFE.orderHost}</span> and pick
                  it up at the end of the bar.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Atalho no celular para o bilhete, só quando há itens */}
      {count > 0 ? (
        <a href="#slip" className="nl-slip-chip nl-focus lg:hidden">
          <span>Pickup slip · {count}</span>
          <span className="tabular-nums">{money2(total)}</span>
        </a>
      ) : null}
    </div>
  );
}
