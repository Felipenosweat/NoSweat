"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { BUSINESS, SERVICES, type ServiceId } from "./content";
import { PHOTOS } from "./photos";
import { Frame } from "./ui";

// O índice de serviços como um quadro de disjuntores: cada disjuntor é um serviço da fixture,
// com o preço escrito no rótulo. Ligar um disjuntor mostra o que está incluído (só frases do
// dono) e o preço; os outros desligam. Padrão de abas (tablist vertical): setas ↑/↓ (e ←/→),
// Home/End, foco igual ao clique. O botão "Quote for this" leva o serviço para o pedido de
// orçamento (evento "bs:quote" que o QuoteRequest escuta).

export function BreakerPanel() {
  const [active, setActive] = useState<ServiceId>("panel");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const service = SERVICES.find((item) => item.id === active) ?? SERVICES[0]!;
  const index = SERVICES.indexOf(service);

  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = SERVICES.length - 1;
    const keys: Record<string, number> = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowRight: index === last ? 0 : index + 1,
      ArrowUp: index === 0 ? last : index - 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = SERVICES[next];
    if (!target) return;
    setActive(target.id);
    tabs.current[next]?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <div className="bs-panel lg:sticky lg:top-24">
          <div className="bs-panel-head" aria-hidden="true">
            <span>Bright Spark · Service panel</span>
            <span className="bs-num">5 circuits</span>
          </div>
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Services. Flip a breaker to see what's included and the price."
            className="bs-breakers"
          >
            {SERVICES.map((item, i) => {
              const on = item.id === active;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`bs-tab-${item.id}`}
                  aria-selected={on}
                  aria-controls="bs-service-detail"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(item.id)}
                  onKeyDown={onKey}
                  className="bs-breaker"
                  data-on={on || undefined}
                >
                  <span aria-hidden="true" className="bs-breaker-toggle">
                    <span className="bs-breaker-handle" />
                  </span>
                  <span className="bs-breaker-slot bs-num" aria-hidden="true">
                    {item.slot}
                  </span>
                  <span className="bs-breaker-name">{item.name}</span>
                  <span className="bs-breaker-rating bs-num">
                    {item.priceNote === "from"
                      ? `from ${item.price}`
                      : item.price === "Quoted"
                        ? "Quoted"
                        : item.price}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="bs-panel-foot" aria-hidden="true">
            <span>Flip a breaker</span>
            <span className="bs-num">↑ ↓</span>
          </p>
        </div>
      </div>

      <div
        id="bs-service-detail"
        role="tabpanel"
        aria-labelledby={`bs-tab-${service.id}`}
        tabIndex={0}
        className="bs-detail lg:col-span-7"
      >
        <div key={service.id} className="bs-detail-in grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-8">
          <div>
            <p className="bs-label">
              <span className="bs-num">Breaker {service.slot}</span> · {service.name}
            </p>
            <p className="bs-price mt-4">
              {service.priceNote === "from" ? <span className="bs-price-from">from</span> : null}
              <span className="bs-num">{service.price}</span>
              {service.priceNote !== "from" ? (
                <span className="bs-price-from">{service.priceNote}</span>
              ) : null}
            </p>
            <h3 className="bs-h3 mt-5">{service.name}</h3>
            <p className="mt-3 max-w-[46ch] text-[17px] leading-[1.6]">{service.summary}</p>
            <ol className="bs-included mt-6">
              {service.included.map((line, i) => (
                <li key={line}>
                  <span className="bs-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={`tel:${BUSINESS.tel}`} className="bs-btn bs-btn-ink">
                Call about this
              </a>
              <a
                href="#quote"
                className="bs-btn bs-btn-line"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("bs:quote", { detail: service.id }))
                }
              >
                Quote for this
              </a>
            </div>
          </div>
          <Frame
            photo={PHOTOS[service.photo]}
            fig={service.slot}
            ratio={4 / 5}
            sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 92vw"
            className="self-start"
            reveal={false}
          />
        </div>
      </div>
    </div>
  );
}
