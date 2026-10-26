import type { SiteSpec, TemplateId } from "@nosweat/schema";
import { factsFromBrief, servicesFromWhat, whatFromBrief } from "./brief-facts";
import { lintFill, type BriefFacts, type ModelFill } from "./model-fill";

// Modo modelo (produção sem chave de IA): o site parte do site-modelo mais parecido, mas TODO o
// texto vem daqui ou do pedido do dono. Do modelo não sai nenhum nome de serviço, oferta ou
// título (o modelo "Rosa's Kitchen" tem "Visit us on Logan Ave", outros têm "Book a free
// consultation"): os títulos das seções são os genéricos do ramo e os serviços são os que o dono
// digitou ou uma lista genérica da categoria.
// Regra 8 nas listas genéricas: nada de "free", "emergency", "same-day", números, dias, ruas,
// preços, licenças, garantias ou anos. O teste template-mode.test.ts confere todas.

type ServiceItem = readonly [name: string, description: string];

/** Um tipo de negócio do modo modelo: textos genéricos, busca da foto e (às vezes) o modelo. */
export type TemplateProfile = {
  id: string;
  template: TemplateId;
  /** Palavras do pedido (sem acento, minúsculas) que apontam para este tipo. */
  match?: RegExp;
  /** Categoria como o cliente procuraria ("Plumber"). Vai para `business.category`. */
  category: string;
  /** Palavra do nome provisório quando o dono não deu nome ("Austin Plumbing"). */
  word: string;
  /** Busca da foto do topo (cena genérica, sem pessoas). Portfólio não tem: só foto do dono. */
  imageQuery?: string;
  /** Site-modelo preferido (slug); sem ele, o mais parecido da categoria (pickModel). */
  model?: string;
  hero: { title: string; subtitle?: string; ctaLabel?: string };
  services: readonly ServiceItem[];
};

type TemplateCopy = {
  subtitle: string;
  ctaLabel: string;
  /** Descrições para os serviços que o dono digitou (alternadas, para não repetir). */
  notes: readonly string[];
  faq: (area: string | undefined) => ModelFill["faq"];
  titles: NonNullable<ModelFill["titles"]>;
};

const areaAnswer = (area: string | undefined, fallback: string) =>
  area ? `We work in ${area}. If you're nearby, ask us about your address.` : fallback;

/** Textos de cada template (valem para qualquer negócio do ramo). */
export const TEMPLATE_COPY: Record<TemplateId, TemplateCopy> = {
  "home-services": {
    subtitle: "Tell us what is going on and we will explain the options before any work starts.",
    ctaLabel: "Request an estimate",
    notes: [
      "Tell us what you need and we'll explain the options before we start.",
      "Describe the job and we'll walk you through how we'd handle it.",
      "Ask us about it and we'll give you a clear answer and a price before any work.",
    ],
    faq: (area) => [
      {
        q: "How do I get a price?",
        a: "Send the form or call us and describe the job. We explain the price before we start.",
      },
      {
        q: "What areas do you work in?",
        a: areaAnswer(area, "Ask us about your address when you get in touch."),
      },
      {
        q: "Do I need to be home?",
        a: "For most jobs, yes, at least at the start, so we can walk through it together.",
      },
    ],
    titles: {
      services: "Services",
      about: "About us",
      testimonials: "Reviews",
      faq: "Questions",
      contact: "Contact us",
    },
  },
  beauty: {
    subtitle: "Every appointment starts with a conversation about what you want.",
    ctaLabel: "Book an appointment",
    notes: [
      "Tell us what you have in mind and we'll plan it with you.",
      "Ask us about it when you book and we'll explain how it works.",
      "We'll talk it through with you before we start.",
    ],
    faq: () => [
      {
        q: "Do I need an appointment?",
        a: "Booking ahead is the best way to get the time you want.",
      },
      {
        q: "How long does a visit take?",
        a: "It depends on the service. We'll tell you when you book.",
      },
      {
        q: "Can I ask questions before booking?",
        a: "Of course. Send the form and we'll get back to you.",
      },
    ],
    titles: {
      services: "Services",
      about: "About us",
      testimonials: "Reviews",
      faq: "Questions",
      contact: "Contact us",
    },
  },
  restaurant: {
    subtitle: "Come hungry. Ask us what is good today.",
    ctaLabel: "Plan your visit",
    notes: [
      "Ask us what's in it and how we make it.",
      "Made in our kitchen. Ask us about it.",
      "Ask us about this one when you visit.",
    ],
    faq: () => [
      { q: "Do you take reservations?", a: "Call us or send the form and we'll let you know." },
      {
        q: "Can I order for a group?",
        a: "Tell us the date and how many people, and we'll let you know what we can do.",
      },
      {
        q: "Do you have options for dietary needs?",
        a: "Ask us about any dish and we'll tell you what is in it.",
      },
    ],
    titles: {
      services: "Menu",
      about: "Our story",
      testimonials: "Reviews",
      faq: "Questions",
      contact: "Contact us",
    },
  },
  professional: {
    subtitle: "Start with a conversation about where things stand and what you need.",
    ctaLabel: "Get in touch",
    notes: [
      "Tell us where things stand and we'll explain the next step.",
      "We'll explain how this works in plain words.",
      "Ask us about it and we'll tell you what to expect.",
    ],
    faq: (area) => [
      { q: "How do we start?", a: "Send the form or call us and tell us what is going on." },
      {
        q: "What should I bring?",
        a: "Anything about your question. We'll tell you if anything else is needed.",
      },
      {
        q: "Where do you work?",
        a: areaAnswer(area, "Ask us when you get in touch and we'll find what works for you."),
      },
    ],
    titles: {
      services: "Services",
      about: "About us",
      testimonials: "Reviews",
      faq: "Questions",
      contact: "Contact us",
    },
  },
  portfolio: {
    subtitle: "Tell me about your project and we'll see if it is a good fit.",
    ctaLabel: "Get in touch",
    notes: [
      "Tell me about your project and I'll explain how this works.",
      "Planned together, from the first conversation.",
      "Ask me about it when you get in touch.",
    ],
    faq: (area) => [
      { q: "How do we start?", a: "Send the form with a few details about your project." },
      { q: "How far ahead should I book?", a: "As early as you can. Ask me about your date." },
      {
        q: "Where do you work?",
        a: areaAnswer(area, "Ask me about your location when you get in touch."),
      },
    ],
    titles: {
      services: "Services",
      about: "About",
      testimonials: "Reviews",
      faq: "Questions",
      contact: "Get in touch",
    },
  },
};

/**
 * Tipos de negócio, na ordem em que são testados (o primeiro que casa vence; os mais
 * específicos vêm antes: "nail salon" antes de "salon", "drain cleaning" é encanador).
 */
export const PROFILES: readonly TemplateProfile[] = [
  // ---------- serviços para casa ----------
  {
    id: "plumbing",
    template: "home-services",
    match: /\b(plumb|drain|water heater|sewer|faucet|toilet|pipes?\b|repip)/,
    category: "Plumber",
    word: "Plumbing",
    imageQuery: "plumber tools copper pipes",
    hero: { title: "Plumbing repairs, done carefully" },
    services: [
      ["Plumbing repairs", "Leaks, drips and anything that isn't working right."],
      ["Drain cleaning", "Slow and clogged drains cleared."],
      ["Water heaters", "Water heater repairs and replacements."],
      ["Fixture installs", "Faucets, sinks and toilets put in properly."],
    ],
  },
  {
    id: "electrical",
    template: "home-services",
    match: /\b(electric|wiring|rewir|breaker|outlet|panel upgrade|ev charger)/,
    category: "Electrician",
    word: "Electric",
    imageQuery: "electrician wiring electrical panel",
    hero: { title: "Electrical work, done carefully" },
    services: [
      ["Electrical repairs", "Outlets, switches and circuits that stopped working."],
      ["Lighting", "New fixtures and lighting put in and wired properly."],
      ["Panel work", "Electrical panels checked, repaired or replaced."],
      ["Ceiling fans", "Fans installed and wired."],
    ],
  },
  {
    id: "hvac",
    template: "home-services",
    match: /\b(hvac|heating|cooling|air condition|a\/c|furnace|heat pump|ductwork|ac repair)/,
    category: "Heating and air conditioning",
    word: "Heating & Air",
    imageQuery: "air conditioner unit outside house",
    hero: { title: "Heating and cooling, done right" },
    services: [
      ["AC repair", "Air conditioning that isn't keeping up, looked at and fixed."],
      ["Heating repair", "Furnaces and heat pumps checked and repaired."],
      ["New systems", "Help choosing and installing a new system."],
      ["Maintenance", "Tune-ups that keep your system running well."],
    ],
  },
  {
    id: "roofing",
    template: "home-services",
    match: /\b(roof|shingle|gutter)/,
    category: "Roofer",
    word: "Roofing",
    imageQuery: "roof shingles house",
    hero: { title: "Roofing work, done carefully" },
    services: [
      ["Roof repairs", "Leaks, missing shingles and worn spots fixed."],
      ["Roof replacement", "A new roof, planned with you from start to finish."],
      ["Roof inspections", "A look at your roof and a plain answer about what it needs."],
      ["Gutters", "Gutters cleaned, repaired or replaced."],
    ],
  },
  {
    id: "landscaping",
    template: "home-services",
    match: /\b(landscap|lawn|mowing|yard|garden|tree service|irrigation|sprinkler|hedge)/,
    category: "Landscaping & lawn care",
    word: "Landscaping",
    imageQuery: "green lawn garden landscaping",
    hero: { title: "Lawn and landscape care" },
    services: [
      ["Lawn care", "Mowing, edging and keeping the lawn healthy."],
      ["Landscape design", "Planting plans made with you for your yard."],
      ["Planting", "Shrubs, trees and flower beds put in."],
      ["Yard cleanup", "Leaves, branches and overgrowth cleared out."],
    ],
  },
  {
    id: "painting",
    template: "home-services",
    match: /\b(paint|drywall|stain)/,
    category: "Painter",
    word: "Painting",
    imageQuery: "painter roller fresh wall",
    hero: { title: "Painting done neatly" },
    services: [
      ["Interior painting", "Walls, ceilings and trim, with floors and furniture covered."],
      ["Exterior painting", "Siding, trim and doors prepped and painted."],
      ["Cabinet painting", "Kitchen and bathroom cabinets refreshed."],
      ["Drywall repair", "Holes and cracks patched before painting."],
    ],
  },
  {
    id: "auto-repair",
    template: "home-services",
    match:
      /\b(auto repair|auto body|mechanic|car repair|oil change|brakes?\b|transmission|tires?\b|auto shop)/,
    category: "Auto repair shop",
    word: "Auto Repair",
    imageQuery: "mechanic car repair garage",
    hero: { title: "Car repairs, explained clearly", ctaLabel: "Request a quote" },
    services: [
      ["Diagnostics", "We find out what's wrong and explain it before any repair."],
      ["Brakes", "Brakes checked and repaired."],
      ["Oil changes", "Oil and filter changes and a quick look at the basics."],
      ["Engine repair", "Engine problems looked at and fixed."],
    ],
  },
  {
    id: "cleaning",
    template: "home-services",
    match: /\b(clean|maid|housekeep|janitor)/,
    category: "Cleaning service",
    word: "Cleaning",
    imageQuery: "clean bright living room",
    hero: { title: "A clean home, without the work", ctaLabel: "Request a quote" },
    services: [
      ["Regular cleaning", "Your home cleaned on a schedule that works for you."],
      ["Deep cleaning", "A top-to-bottom clean for the spots that need more time."],
      ["Move-in and move-out cleaning", "An empty home cleaned and ready."],
      ["One-time cleaning", "A single visit when you need it."],
    ],
  },
  {
    id: "home-services",
    template: "home-services",
    category: "Home services",
    word: "Home Services",
    imageQuery: "tools on a workbench",
    hero: { title: "Home repairs and care, done right" },
    services: [
      ["Repairs", "Tell us what's broken and we'll explain how we'd fix it."],
      ["Installations", "New fixtures and equipment put in properly."],
      ["Maintenance", "Regular care that keeps small problems small."],
      ["Small projects", "The jobs on your list, handled carefully."],
    ],
  },
  // ---------- beleza, cuidados pessoais e bem-estar ----------
  {
    id: "barber",
    template: "beauty",
    match: /\b(barber|fades?\b|beard)/,
    category: "Barbershop",
    word: "Barbers",
    imageQuery: "barbershop chair interior",
    hero: { title: "Clean cuts, done with care" },
    services: [
      ["Haircuts", "Cut the way you like it."],
      ["Fades", "Tapers and fades, blended clean."],
      ["Beard trims", "Shaped and lined up."],
      ["Shaves", "A close, careful shave."],
    ],
  },
  {
    id: "nails",
    template: "beauty",
    match: /\b(nail|manicure|pedicure)/,
    category: "Nail salon",
    word: "Nails",
    imageQuery: "manicure nail salon table",
    hero: { title: "Nails done with care" },
    services: [
      ["Manicures", "Shaped, cleaned up and polished."],
      ["Pedicures", "Relaxing foot care and polish."],
      ["Gel nails", "Long-lasting gel color."],
      ["Nail art", "Designs planned with you."],
    ],
  },
  {
    id: "lash-brow",
    template: "beauty",
    match: /\b(lash|brow)/,
    category: "Lash and brow studio",
    word: "Lash & Brow",
    imageQuery: "lash studio soft light",
    hero: { title: "Lashes and brows, planned with you" },
    services: [
      ["Lash extensions", "A look chosen with you before we start."],
      ["Lash lifts", "A natural lift for your own lashes."],
      ["Brow shaping", "Brows shaped to suit your face."],
      ["Brow tinting", "Color that frames your brows."],
    ],
  },
  {
    id: "spa",
    template: "beauty",
    match: /\b(spa|spas|massages?|facials?|esthetic|esthetician|bodywork)\b/,
    category: "Spa",
    word: "Spa",
    imageQuery: "calm spa room towels candles",
    hero: { title: "Time to slow down", ctaLabel: "Book a visit" },
    services: [
      ["Massage", "Pressure and focus planned with you before we start."],
      ["Facials", "Skin care chosen for your skin."],
      ["Body treatments", "Treatments to relax and reset."],
      ["Skin care", "Products and routines chosen for your skin."],
    ],
  },
  {
    id: "yoga",
    template: "beauty",
    match: /\byoga\b/,
    category: "Yoga studio",
    word: "Yoga",
    imageQuery: "yoga studio wood floor mats",
    model: "still-water-spa",
    hero: {
      title: "Yoga for every body",
      subtitle: "New or experienced, start with a class that fits where you are.",
      ctaLabel: "Book a class",
    },
    services: [
      ["Group classes", "Classes for different levels and paces."],
      ["Beginner classes", "A gentle place to start."],
      ["Private sessions", "One-on-one practice planned around you."],
      ["Workshops", "Longer sessions on one part of the practice."],
    ],
  },
  {
    id: "pilates",
    template: "beauty",
    match: /\bpilates\b/,
    category: "Pilates studio",
    word: "Pilates",
    imageQuery: "pilates reformer studio",
    model: "still-water-spa",
    hero: {
      title: "Pilates, at your pace",
      subtitle: "Start with a class that fits where you are.",
      ctaLabel: "Book a class",
    },
    services: [
      ["Mat classes", "Core and mobility work on the mat."],
      ["Reformer classes", "Classes on the reformer."],
      ["Private sessions", "One-on-one sessions planned around you."],
      ["Beginner sessions", "A careful introduction to the basics."],
    ],
  },
  {
    id: "fitness",
    template: "beauty",
    match:
      /\b(fitness|gyms?|personal train\w*|trainers?|training studio|crossfit|boot ?camps?|strength training|kickboxing|boxing|martial arts?|spin class\w*)\b/,
    category: "Fitness studio",
    word: "Fitness",
    imageQuery: "gym weights fitness studio",
    model: "fade-and-co-barbers",
    hero: {
      title: "Get stronger, at your pace",
      subtitle: "Tell us where you are now and what you want to work on.",
      ctaLabel: "Book a session",
    },
    services: [
      ["Personal training", "One-on-one sessions planned around your goals."],
      ["Group classes", "Train with others, at your level."],
      ["Strength training", "Build strength with good form."],
      ["Beginner programs", "A careful start if you're new or coming back."],
    ],
  },
  {
    id: "pet-grooming",
    template: "beauty",
    match: /\b(pet groom|dog groom|cat groom|grooming|groomer|groomers)\b/,
    category: "Pet grooming",
    word: "Pet Grooming",
    imageQuery: "dog grooming salon",
    hero: { title: "Grooming your pet will love", ctaLabel: "Book a groom" },
    services: [
      ["Bath and brush", "A good wash, dry and brush-out."],
      ["Full grooming", "Bath, haircut and tidy-up."],
      ["Nail trims", "Nails trimmed carefully."],
      ["Ear cleaning", "Gentle ear care."],
    ],
  },
  {
    id: "tattoo",
    template: "beauty",
    match: /\btattoo/,
    category: "Tattoo studio",
    word: "Tattoo",
    imageQuery: "tattoo studio interior",
    hero: { title: "Tattoos planned with you", ctaLabel: "Ask about a tattoo" },
    services: [
      ["Custom tattoos", "A design drawn with you, from your idea."],
      ["Flash", "Ready-made designs."],
      ["Cover-ups", "A plan for an old tattoo."],
      ["Consultations", "Talk through your idea before booking."],
    ],
  },
  {
    id: "hair",
    template: "beauty",
    match: /\b(hair|salon|stylist|balayage|blowout|highlights)/,
    category: "Hair salon",
    word: "Salon",
    imageQuery: "bright modern hair salon interior",
    hero: { title: "Hair planned with you first" },
    services: [
      ["Haircuts", "A cut planned with you at the chair."],
      ["Color", "Color chosen with you before we start."],
      ["Blowouts", "Washed and styled."],
      ["Styling", "Styling for an event or a night out."],
    ],
  },
  {
    id: "beauty",
    template: "beauty",
    category: "Beauty studio",
    word: "Studio",
    imageQuery: "beauty studio interior soft light",
    hero: { title: "A look planned with you first" },
    services: [
      ["Consultations", "Talk through what you want before we start."],
      ["Treatments", "Care chosen for you."],
      ["Styling", "Finished the way you like it."],
      ["Touch-ups", "Keep your look fresh between visits."],
    ],
  },
  // ---------- comida ----------
  {
    id: "bbq",
    template: "restaurant",
    match: /\b(bbq|barbecue|barbeque|smoke|smoked|smoker|smokehouse|brisket|pitmaster)/,
    category: "Barbecue",
    word: "BBQ",
    imageQuery: "barbecue brisket smoked meat board",
    model: "smoke-and-rail-bbq",
    hero: { title: "Barbecue, smoked low and slow" },
    services: [
      ["Smoked meats", "Ask us what came off the smoker today."],
      ["Plates", "Meat with sides."],
      ["Sandwiches", "Smoked meat on a bun."],
      ["Sides", "Ask us what's on today."],
    ],
  },
  {
    id: "food-truck",
    template: "restaurant",
    match: /\bfood truck/,
    category: "Food truck",
    word: "Food Truck",
    imageQuery: "food truck street food",
    model: "rosas-kitchen",
    hero: {
      title: "Good food, made fresh on the truck",
      subtitle: "Follow us to find out where we're parked and what we're cooking.",
      ctaLabel: "Get in touch",
    },
    services: [
      ["Mains", "Ask us what we're cooking today."],
      ["Sides", "Something to go with it."],
      ["Drinks", "Something cold to go with your order."],
      ["Desserts", "Something sweet to finish."],
    ],
  },
  {
    id: "pizza",
    template: "restaurant",
    match: /\b(pizza|pizzeria)/,
    category: "Pizzeria",
    word: "Pizza",
    imageQuery: "pizza fresh from the oven",
    hero: { title: "Pizza made in our kitchen" },
    services: [
      ["Pizzas", "Ask us about today's pies."],
      ["Salads", "Fresh and simple."],
      ["Sides", "Something to share."],
      ["Drinks", "Something to go with it."],
    ],
  },
  {
    id: "coffee",
    template: "restaurant",
    match: /\b(coffee|cafe|espresso|latte|tea house|teahouse)/,
    category: "Coffee shop",
    word: "Coffee",
    imageQuery: "coffee cup cafe counter",
    hero: { title: "Good coffee, made with care" },
    services: [
      ["Coffee", "Espresso drinks and brewed coffee."],
      ["Tea", "Hot and iced."],
      ["Pastries", "Something to go with your coffee."],
      ["Breakfast", "Ask us what's on the menu."],
    ],
  },
  {
    id: "bakery",
    template: "restaurant",
    match: /\b(bakery|bakeries|bakeshop|baker|bread|cakes?\b|pastr|cookies|cupcake|donut)/,
    category: "Bakery",
    word: "Bakery",
    imageQuery: "fresh bread bakery counter",
    hero: { title: "Baked fresh, made with care" },
    services: [
      ["Bread", "Ask us what came out of the oven."],
      ["Pastries", "Sweet and savory."],
      ["Cakes", "Ask us about cakes for your occasion."],
      ["Cookies", "Something sweet to take home."],
    ],
  },
  {
    id: "catering",
    template: "restaurant",
    match: /\b(catering|caterer)\b/,
    category: "Catering",
    word: "Catering",
    imageQuery: "catering buffet table",
    hero: {
      title: "Food for your event, planned with you",
      subtitle: "Tell us the date and how many people, and we'll plan the food with you.",
      ctaLabel: "Plan your event",
    },
    services: [
      ["Event catering", "Food for your party or gathering."],
      ["Office meals", "Food for your team."],
      ["Platters", "Easy food to share."],
      ["Custom menus", "A menu planned with you."],
    ],
  },
  {
    id: "mexican",
    template: "restaurant",
    match: /\b(taco|taqueria|mexican|burrito|tamale)/,
    category: "Mexican restaurant",
    word: "Taqueria",
    imageQuery: "mexican tacos table warm light",
    hero: { title: "Mexican food, made in our kitchen" },
    services: [
      ["Tacos", "Ask us what's good today."],
      ["Burritos", "Big and filling."],
      ["Plates", "A full plate with sides."],
      ["Drinks", "Something cold to go with it."],
    ],
  },
  {
    id: "restaurant",
    template: "restaurant",
    category: "Restaurant",
    word: "Kitchen",
    imageQuery: "restaurant table warm light",
    hero: { title: "Good food, made in our kitchen" },
    services: [
      ["Starters", "Something to share."],
      ["Mains", "Ask us what's good today."],
      ["Sides", "Something to go with it."],
      ["Desserts", "Something sweet to finish."],
    ],
  },
  // ---------- serviços profissionais e saúde ----------
  {
    id: "dental",
    template: "professional",
    match: /\b(dentist|dental|teeth|orthodont)/,
    category: "Dentist",
    word: "Dental",
    imageQuery: "bright dental office chair",
    hero: { title: "Dental care, explained clearly", ctaLabel: "Book a visit" },
    services: [
      ["Checkups and cleanings", "Regular visits to keep your teeth healthy."],
      ["Fillings", "Cavities treated and explained."],
      ["Whitening", "Ask us if whitening is right for you."],
      ["Kids' visits", "Gentle visits for younger patients."],
    ],
  },
  {
    id: "chiropractor",
    template: "professional",
    match: /\bchiropract/,
    category: "Chiropractor",
    word: "Chiropractic",
    imageQuery: "chiropractic clinic treatment table",
    hero: { title: "Chiropractic care, explained clearly", ctaLabel: "Book a visit" },
    services: [
      ["First visits", "We talk through what's going on before any treatment."],
      ["Adjustments", "Chiropractic adjustments, explained as we go."],
      ["Posture and mobility", "Help moving and sitting more comfortably."],
      ["Follow-up care", "Visits planned around how you're doing."],
    ],
  },
  {
    id: "therapy",
    template: "professional",
    match: /\b(therap|counsel|mental health|psycholog)/,
    category: "Therapy practice",
    word: "Counseling",
    imageQuery: "quiet room soft window light",
    hero: { title: "A calm place to talk", ctaLabel: "Reach out" },
    services: [
      ["Individual therapy", "One-on-one sessions at your pace."],
      ["Couples counseling", "Sessions for partners who want to talk things through."],
      ["Family sessions", "Time for the family to talk together."],
      ["First conversation", "A short talk to see if it's a good fit."],
    ],
  },
  {
    id: "accounting",
    template: "professional",
    match: /\b(bookkeep|tax|accountant|accounting|cpa\b|payroll)/,
    category: "Accounting and bookkeeping",
    word: "Accounting",
    imageQuery: "tidy desk ledger notebook",
    hero: { title: "Clear books, explained in plain words", ctaLabel: "Book a consultation" },
    services: [
      ["Bookkeeping", "Your books kept up to date and easy to read."],
      ["Tax preparation", "Returns prepared and explained."],
      ["Payroll", "Payroll handled so your team is paid right."],
      ["Questions about your numbers", "Plain answers about where things stand."],
    ],
  },
  {
    id: "law",
    template: "professional",
    match: /\b(law firm|law office|lawyer|attorney|legal|estate planning|probate|divorce)/,
    category: "Law office",
    word: "Law",
    imageQuery: "law office desk documents",
    hero: { title: "Legal help, explained in plain words", ctaLabel: "Book a consultation" },
    services: [
      ["Consultations", "Talk through your situation and your options."],
      ["Legal documents", "Documents prepared and explained."],
      ["Document review", "A careful read before you sign."],
      ["Representation", "Someone in your corner when you need it."],
    ],
  },
  {
    id: "insurance",
    template: "professional",
    match: /\binsurance\b/,
    category: "Insurance agency",
    word: "Insurance",
    imageQuery: "family home front porch",
    hero: { title: "Insurance, explained in plain words", ctaLabel: "Ask for a quote" },
    services: [
      ["Home insurance", "Coverage for your home, explained clearly."],
      ["Auto insurance", "Coverage for your car."],
      ["Business insurance", "Coverage for your business."],
      ["Policy reviews", "A look at what you have now and what it covers."],
    ],
  },
  {
    id: "real-estate",
    template: "professional",
    match: /\b(realtor|real estate|realty|homes for sale|home buyers|home sellers)/,
    category: "Real estate agent",
    word: "Realty",
    imageQuery: "house for sale front yard",
    hero: { title: "Buying or selling a home, explained clearly" },
    services: [
      ["Buying a home", "Help finding a home and making an offer."],
      ["Selling a home", "A plan for getting your home on the market."],
      ["Home value questions", "A conversation about what your home could sell for."],
      ["First-time buyers", "Every step explained."],
    ],
  },
  {
    id: "tutoring",
    template: "professional",
    match: /\b(tutor|test prep|homework|lessons?\b)/,
    category: "Tutoring",
    word: "Tutoring",
    imageQuery: "books desk study lamp",
    hero: { title: "Learning at the right pace", ctaLabel: "Book a session" },
    services: [
      ["One-on-one tutoring", "Sessions planned around the student."],
      ["Homework help", "Support with assignments as they come."],
      ["Test prep", "Practice and a plan before the test."],
      ["Study skills", "Habits that make studying easier."],
    ],
  },
  {
    id: "professional",
    template: "professional",
    category: "Professional services",
    word: "Advisors",
    imageQuery: "tidy office desk notebook",
    hero: { title: "Clear answers, from people who listen", ctaLabel: "Book a consultation" },
    services: [
      ["Consultations", "A conversation about where things stand."],
      ["Planning", "A clear plan for what comes next."],
      ["Ongoing support", "Help when questions come up."],
      ["Questions answered", "Plain answers to your questions."],
    ],
  },
  // ---------- criativos e portfólio (sem foto genérica: só fotos do dono) ----------
  {
    id: "photography",
    template: "portfolio",
    match: /\b(photograph|photo shoot|photoshoot|headshot)/,
    category: "Photographer",
    word: "Photography",
    hero: { title: "Photos made with care" },
    services: [
      ["Portrait sessions", "Photos of you, your family or your team."],
      ["Event photography", "Your event, photographed as it happens."],
      ["Brand photos", "Photos for your business."],
      ["Photo editing", "Edited, ready-to-share photos."],
    ],
  },
  {
    id: "video",
    template: "portfolio",
    match: /\b(videograph|video|filmmak|films?\b)/,
    category: "Videographer",
    word: "Films",
    hero: { title: "Films made with care" },
    services: [
      ["Event films", "Your event, filmed as it happens."],
      ["Brand videos", "Video for your business."],
      ["Short films", "A short story, told well."],
      ["Editing", "Footage edited and ready to share."],
    ],
  },
  {
    id: "interiors",
    template: "portfolio",
    match: /\b(interior design|interiors|decorator)/,
    category: "Interior designer",
    word: "Interiors",
    hero: { title: "Rooms planned around how you live" },
    services: [
      ["Design consultations", "A first conversation about your space."],
      ["Room design", "A plan for one room or the whole home."],
      ["Furniture and decor", "Pieces chosen with you."],
      ["Project planning", "A clear plan from idea to finished room."],
    ],
  },
  {
    id: "design",
    template: "portfolio",
    match: /\b(graphic design|designer|branding|logo|illustrat)/,
    category: "Designer",
    word: "Design Studio",
    hero: { title: "Design made with care" },
    services: [
      ["Logo design", "A mark made for your business."],
      ["Brand identity", "Colors, type and a look that fits together."],
      ["Print design", "Cards, menus, signs and more."],
      ["Web graphics", "Graphics for your site and social media."],
    ],
  },
  {
    id: "portfolio",
    template: "portfolio",
    category: "Creative studio",
    word: "Studio",
    hero: { title: "Work made with care, start to finish" },
    services: [
      ["Projects", "Work planned with you from the first conversation."],
      ["Consultations", "A first talk about your idea."],
      ["Custom work", "Made for you."],
      ["Collaborations", "Working together on something new."],
    ],
  },
];

/**
 * Negócio que não se encaixa em nada: textos neutros e o modelo de serviços profissionais de
 * layout "service-led" (topo com foto, serviços logo abaixo), que serve para qualquer ramo.
 */
export const GENERIC_PROFILE: TemplateProfile = {
  id: "other",
  template: "professional",
  category: "Local business",
  word: "Company",
  imageQuery: "small business storefront",
  model: "keystone-insurance",
  hero: {
    title: "Here to help, and easy to reach",
    subtitle: "Tell us what you need and we'll get back to you.",
    ctaLabel: "Get in touch",
  },
  services: [
    ["What we do", "Tell us what you need and we'll explain how we can help."],
    ["How it works", "Get in touch and we'll walk you through the next step."],
    ["Questions", "Ask us anything before you decide."],
  ],
};

/** Sem acento, em minúsculas e sem as linhas de dica do /create (tipo, layout e estilo). */
function body(brief: string): string {
  return brief
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/type of business:[^.\n]*\.?/g, " ")
    .replace(/preferred layout:[^.\n]*\.?/g, " ")
    .replace(/(?:^|\n)\s*style:[^\n]*/g, " ");
}

/**
 * Tipo de negócio do pedido. Com `template` (o ramo que server/design leu, ou o tipo que o dono
 * escolheu), só os tipos desse template contam e, sem nenhum, fica o genérico dele. Sem
 * template (ramo incerto): o primeiro tipo que casar, senão o perfil neutro (GENERIC_PROFILE).
 */
export function profileFor(brief: string, template: TemplateId | null): TemplateProfile {
  const text = body(brief);
  const pool = template ? PROFILES.filter((p) => p.template === template) : PROFILES;
  const hit = pool.find((p) => p.match?.test(text));
  if (hit) return hit;
  if (template) return pool.find((p) => !p.match) ?? GENERIC_PROFILE;
  return GENERIC_PROFILE;
}

/** Os serviços do site: os que o dono digitou (até 8), completados com os genéricos até 3. */
export function templateServices(brief: string, profile: TemplateProfile): ModelFill["services"] {
  const notes = TEMPLATE_COPY[profile.template].notes;
  const what = whatFromBrief(brief);
  const typed = what ? servicesFromWhat(what) : [];
  const services: ModelFill["services"] = typed.map((name, i) => ({
    name: name.slice(0, 60),
    description: notes[i % notes.length] ?? notes[0] ?? "Ask us about it.",
  }));
  const taken = new Set(services.map((s) => s.name.toLowerCase()));
  for (const [name, description] of profile.services) {
    if (services.length >= 3 && typed.length > 0) break;
    if (services.length >= 8) break;
    if (taken.has(name.toLowerCase())) continue;
    services.push({ name, description });
  }
  return services;
}

/** Só os serviços genéricos do tipo (quando os digitados não passam no lintFill). */
function genericServices(profile: TemplateProfile): ModelFill["services"] {
  return profile.services.map(([name, description]) => ({ name, description }));
}

/** Nome provisório quando o dono não deu um: "Austin Plumbing", ou "Main Street Plumbing". */
function fallbackName(profile: TemplateProfile, city: string | undefined): string {
  return city ? `${city} ${profile.word}` : `Main Street ${profile.word}`;
}

/**
 * O ModelFill do modo modelo: textos genéricos do tipo de negócio, títulos genéricos das
 * seções, os serviços do dono (ou genéricos) e os fatos lidos do pedido. Passa pelo lintFill
 * (com o modelo, para pegar fato do modelo que vazou); se os serviços digitados derem erro,
 * ficam os genéricos.
 */
export function templateFill(brief: string, profile: TemplateProfile, model: SiteSpec): ModelFill {
  const copy = TEMPLATE_COPY[profile.template];
  const facts: BriefFacts = factsFromBrief(brief);
  const testimonials = [...brief.matchAll(/"([^"]{10,300})"\s*\(([^)]{2,60})\)/g)].flatMap((m) =>
    m[1] && m[2] ? [{ quote: m[1], author: m[2] }] : [],
  );
  const fill: ModelFill = {
    hero: {
      title: profile.hero.title,
      subtitle: profile.hero.subtitle ?? copy.subtitle,
      ctaLabel: profile.hero.ctaLabel ?? copy.ctaLabel,
      ...(profile.imageQuery ? { imageQuery: profile.imageQuery } : {}),
    },
    services: templateServices(brief, profile),
    faq: copy.faq(facts.serviceArea),
    about: null,
    testimonials: testimonials.slice(0, 6),
    titles: { ...copy.titles },
    category: profile.category,
    business: { ...facts, name: facts.name ?? fallbackName(profile, facts.city) },
  };
  const problems = lintFill(fill, brief, model);
  if (problems.length === 0) return fill;
  const generic: ModelFill = { ...fill, services: genericServices(profile), testimonials: [] };
  const left = lintFill(generic, brief, model);
  if (left.length) console.warn("[ai] template mode copy has lint problems", left);
  return generic;
}
