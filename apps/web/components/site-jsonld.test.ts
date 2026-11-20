import { joesPlumbing, rosasKitchen } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  areaServedOf,
  businessJsonLd,
  openingHoursSpecification,
  parseDays,
  parsePrice,
  parseTimes,
  priceRangeOf,
  schemaTypeFor,
} from "./site-jsonld";

const OPTIONS = { url: "https://example.test", origin: "https://www.nosweatfd.com" };

/** O exemplo do encanador com outro `business` e as seções trocadas. */
function spec(business: SiteSpec["business"], sections = joesPlumbing.sections): SiteSpec {
  return { ...joesPlumbing, business, sections };
}

describe("schemaTypeFor", () => {
  it.each([
    ["Plumber", "home-services", "Plumber"],
    ["Electrician", "home-services", "Electrician"],
    ["Heating and air conditioning", "home-services", "HVACBusiness"],
    ["Roofer", "home-services", "RoofingContractor"],
    ["House painter", "home-services", "HousePainter"],
    ["Landscaping & lawn care", "home-services", "HomeAndConstructionBusiness"],
    ["Auto repair shop", "home-services", "AutoRepair"],
    ["Barbershop", "beauty", "BarberShop"],
    ["Hair salon", "beauty", "HairSalon"],
    ["Nail salon", "beauty", "NailSalon"],
    ["Day spa", "beauty", "DaySpa"],
    ["Lash and brow studio", "beauty", "BeautySalon"],
    ["Tattoo studio", "beauty", "TattooParlor"],
    ["Coffee shop & roastery", "restaurant", "CafeOrCoffeeShop"],
    ["Sourdough bakery & custom cakes", "restaurant", "Bakery"],
    ["Barbecue pit & food truck", "restaurant", "Restaurant"],
    ["Wood-fired pizzeria", "restaurant", "Restaurant"],
    ["Mexican restaurant", "restaurant", "Restaurant"],
    ["Family dentist", "professional", "Dentist"],
    ["Family and estate law office", "professional", "LegalService"],
    ["Bookkeeping and tax practice", "professional", "AccountingService"],
    ["Independent insurance agency", "professional", "InsuranceAgency"],
    ["Real estate agent", "professional", "RealEstateAgent"],
    ["Yoga studio", "beauty", "ExerciseGym"],
  ] as const)("%s (%s) → %s", (category, template, type) => {
    expect(schemaTypeFor(category, template)).toBe(type);
  });

  it("não chuta quando o ramo é vago ou ambíguo", () => {
    expect(schemaTypeFor("House cleaning", "home-services")).toBe("LocalBusiness");
    expect(schemaTypeFor("Wedding photographer", "portfolio")).toBe("LocalBusiness");
    expect(schemaTypeFor("Therapy practice", "professional")).toBe("LocalBusiness");
    // "Painter" no portfólio é artista, não pintor de casa.
    expect(schemaTypeFor("Painter", "portfolio")).toBe("LocalBusiness");
    expect(schemaTypeFor("Painter", "home-services")).toBe("HousePainter");
    // "bar" fora do ramo de comida não é bar.
    expect(schemaTypeFor("Blow dry bar", "beauty")).toBe("HairSalon");
    expect(schemaTypeFor("Brow bar", "beauty")).toBe("BeautySalon");
    expect(schemaTypeFor("Cocktail bar", "restaurant")).toBe("BarOrPub");
    // "lawn" não é "law".
    expect(schemaTypeFor("Lawn mowing", "home-services")).toBe("LocalBusiness");
    expect(schemaTypeFor(undefined, "home-services")).toBe("LocalBusiness");
  });

  it("sem ramo reconhecido, o template de restaurante ainda garante FoodEstablishment", () => {
    expect(schemaTypeFor(undefined, "restaurant")).toBe("FoodEstablishment");
    expect(schemaTypeFor("Supper club", "restaurant")).toBe("FoodEstablishment");
  });
});

describe("horário", () => {
  it("lê dias em faixa, lista, grupo e com a volta da semana", () => {
    expect(parseDays("Mon–Fri")).toEqual([0, 1, 2, 3, 4]);
    expect(parseDays("Mon, Tue, Thu")).toEqual([0, 1, 3]);
    expect(parseDays("Sat & Sun")).toEqual([5, 6]);
    expect(parseDays("Tuesday through Saturday")).toEqual([1, 2, 3, 4, 5]);
    expect(parseDays("Fri-Mon")).toEqual([0, 4, 5, 6]);
    expect(parseDays("Daily")).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(parseDays("Weekends")).toEqual([5, 6]);
  });

  it("recusa dias que não são dias", () => {
    expect(parseDays("Emergencies")).toBeUndefined();
    expect(parseDays("Wed · truck at River Market")).toBeUndefined();
    expect(parseDays("Holidays")).toBeUndefined();
  });

  it("lê horas com AM/PM, meio-dia, meia-noite, duas faixas, fechado e 24 horas", () => {
    expect(parseTimes("7 AM – 6 PM")).toEqual([{ opens: "07:00", closes: "18:00" }]);
    expect(parseTimes("7:30 a.m. - 3 p.m.")).toEqual([{ opens: "07:30", closes: "15:00" }]);
    expect(parseTimes("12 PM – 11 PM")).toEqual([{ opens: "12:00", closes: "23:00" }]);
    expect(parseTimes("6pm to midnight")).toEqual([{ opens: "18:00", closes: "23:59" }]);
    expect(parseTimes("11 AM – 2 PM, 5 PM – 9 PM")).toEqual([
      { opens: "11:00", closes: "14:00" },
      { opens: "17:00", closes: "21:00" },
    ]);
    expect(parseTimes("Closed")).toEqual([]);
    expect(parseTimes("Open 24 hours")).toEqual([{ opens: "00:00", closes: "23:59" }]);
  });

  it("recusa horas ambíguas ou com observação", () => {
    expect(parseTimes("8–5")).toBeUndefined();
    expect(parseTimes("9 AM – 5 PM, by appointment")).toBeUndefined();
    expect(parseTimes("11 AM – sold out")).toBeUndefined();
    expect(parseTimes("13 PM – 2 PM")).toBeUndefined();
  });

  it("monta a especificação só quando todas as linhas são lidas", () => {
    expect(
      openingHoursSpecification([
        { days: "Mon–Fri", time: "8 AM – 6 PM" },
        { days: "Sat", time: "9 AM – 1 PM" },
        { days: "Sun", time: "Closed" },
      ]),
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "13:00",
      },
    ]);
    // Uma linha ilegível derruba tudo (horário pela metade diria que os outros dias fecham).
    expect(
      openingHoursSpecification([
        { days: "Mon–Sat", time: "7 AM – 6 PM" },
        { days: "Emergencies", time: "24/7" },
      ]),
    ).toBeUndefined();
    expect(openingHoursSpecification(undefined)).toBeUndefined();
    expect(openingHoursSpecification([{ days: "Mon", time: "Closed" }])).toBeUndefined();
  });
});

describe("preços", () => {
  it("lê só os formatos sem dúvida", () => {
    expect(parsePrice("$45")).toEqual({ min: 45, max: 45, open: false });
    expect(parsePrice("$12.50")).toEqual({ min: 12.5, max: 12.5, open: false });
    expect(parsePrice("$1,200")).toEqual({ min: 1200, max: 1200, open: false });
    expect(parsePrice("from $149")).toEqual({ min: 149, max: 149, open: true });
    expect(parsePrice("$85+")).toEqual({ min: 85, max: 85, open: true });
    expect(parsePrice("$45–$60")).toEqual({ min: 45, max: 60, open: false });
    expect(parsePrice("$45 to 60")).toEqual({ min: 45, max: 60, open: false });
    for (const text of ["$45/hr", "Call for a quote", "up to $200", "Free", "", undefined]) {
      expect(parsePrice(text)).toBeUndefined();
    }
  });

  it("faixa de preço só com os preços do dono, aberta quando o maior é 'a partir de'", () => {
    expect(priceRangeOf([])).toBeUndefined();
    expect(priceRangeOf([{ min: 45, max: 45, open: false }])).toBe("$45");
    expect(
      priceRangeOf([
        { min: 12, max: 12, open: false },
        { min: 320, max: 320, open: false },
      ]),
    ).toBe("$12–$320");
    expect(
      priceRangeOf([
        { min: 45, max: 60, open: false },
        { min: 150, max: 150, open: true },
      ]),
    ).toBe("$45–$150+");
  });
});

describe("areaServedOf", () => {
  it("separa as cidades e tira o 'and nearby'", () => {
    expect(areaServedOf("Austin, Round Rock, Cedar Park and nearby")).toEqual([
      "Austin",
      "Round Rock",
      "Cedar Park",
    ]);
    expect(areaServedOf("Worcester County")).toBe("Worcester County");
    expect(areaServedOf(undefined)).toBeUndefined();
  });
});

describe("businessJsonLd", () => {
  it("restaurante: subtipo, horário, preços e cardápio a partir dos itens", () => {
    const data = businessJsonLd(rosasKitchen, OPTIONS);
    expect(data["@type"]).toBe("Restaurant");
    expect(data.hasOfferCatalog).toBeUndefined();
    expect(data.hasMenu).toMatchObject({ "@type": "Menu" });
    expect(JSON.stringify(data.hasMenu)).toContain('"price":"18"');
    expect(data.openingHoursSpecification).toBeDefined();
    expect(data.priceRange).toMatch(/^\$\d+–\$\d+$/);
  });

  it("restaurante com link de cardápio: hasMenu é o link do dono", () => {
    const data = businessJsonLd(
      {
        ...rosasKitchen,
        business: {
          ...rosasKitchen.business,
          links: { menu: "https://menu.example.com/rosas" },
        },
      },
      OPTIONS,
    );
    expect(data.hasMenu).toBe("https://menu.example.com/rosas");
  });

  it("redes do dono viram sameAs; agendar e pedir não", () => {
    const data = businessJsonLd(
      spec({
        name: "Glow",
        links: {
          instagram: "https://instagram.com/glow",
          yelp: "https://yelp.com/biz/glow",
          booking: "https://book.example.com/glow",
          order: "https://order.example.com/glow",
        },
      }),
      OPTIONS,
    );
    expect(data.sameAs).toEqual(["https://instagram.com/glow", "https://yelp.com/biz/glow"]);
  });

  it("sem dados, sem campo: nada de horário, preço, foto, redes ou endereço inventados", () => {
    const data = businessJsonLd(
      spec({ name: "Sparkle Co" }, [
        { type: "hero", title: "Clean homes", subtitle: "", ctaLabel: "Get a quote" },
        { type: "services", items: [{ name: "Deep clean", description: "Top to bottom." }] },
      ]),
      OPTIONS,
    );
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Sparkle Co",
      description: undefined,
      url: "https://example.test",
      telephone: undefined,
      email: undefined,
      address: undefined,
      areaServed: undefined,
      openingHoursSpecification: undefined,
      image: undefined,
      logo: undefined,
      sameAs: undefined,
      priceRange: undefined,
      hasMenu: undefined,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: "Deep clean", description: "Top to bottom." },
          },
        ],
      },
    });
  });

  it("foto local da plataforma vira endereço absoluto", () => {
    const data = businessJsonLd(
      spec({ name: "Joe's" }, [
        {
          type: "hero",
          title: "Plumbing",
          subtitle: "Repairs.",
          ctaLabel: "Call",
          image: {
            url: "/photos/example-plumbing.webp",
            alt: "Tools",
            source: "unsplash",
            kind: "scene",
          },
        },
        { type: "contact", showForm: true, showMap: false },
      ]),
      OPTIONS,
    );
    expect(data.image).toBe("https://www.nosweatfd.com/photos/example-plumbing.webp");
    expect(data.hasOfferCatalog).toBeUndefined();
  });
});
