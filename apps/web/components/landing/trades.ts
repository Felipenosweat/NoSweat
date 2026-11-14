// Os ramos da frase do topo ("I run a ___ in ___.") e o site de exemplo (fictício, da biblioteca
// de modelos em @nosweat/fixtures) que a moldura mostra para cada um. `phrase` entra no brief que
// vai para o /create; `city` é a do negócio fictício; `host` é o endereço grátis de mentira da cena "Live at …".
// O ramo escolhido fica num store mínimo do módulo: o topo e a seção "how it works" leem o
// mesmo valor (useSyncExternalStore), sem contexto e sem evento global.

export const TRADES = [
  {
    slug: "greenline-landscaping",
    label: "landscaping company",
    phrase: "Landscaping company",
    host: "greenline",
    city: "Charlotte, NC",
  },
  {
    slug: "smoke-and-rail-bbq",
    label: "barbecue restaurant",
    phrase: "Barbecue restaurant",
    host: "smokeandrail",
    city: "Kansas City, MO",
  },
  {
    slug: "still-water-spa",
    label: "day spa",
    phrase: "Day spa",
    host: "stillwater",
    city: "Scottsdale, AZ",
  },
  {
    slug: "mercer-law",
    label: "law firm",
    phrase: "Law firm",
    host: "mercerlaw",
    city: "Columbus, OH",
  },
  {
    slug: "fade-and-co-barbers",
    label: "barbershop",
    phrase: "Barbershop",
    host: "fadeandco",
    city: "Chicago, IL",
  },
  {
    slug: "sunrise-bakery",
    label: "bakery",
    phrase: "Bakery",
    host: "sunrise",
    city: "Sacramento, CA",
  },
] as const;

export type TradeSlug = (typeof TRADES)[number]["slug"];

export const tradeOf = (slug: string) => TRADES.find((t) => t.slug === slug) ?? TRADES[0];

let current: TradeSlug = TRADES[0].slug;
const listeners = new Set<() => void>();

export const tradeStore = {
  get: (): TradeSlug => current,
  getServer: (): TradeSlug => TRADES[0].slug,
  set(slug: TradeSlug) {
    if (slug === current) return;
    current = slug;
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
