import type { SoftCtx } from "./context";
import type { DockSlot } from "./SoftDock";
import { primaryCta } from "./variant-data";

/**
 * Abas da barra flutuante de cada ramo (só entram as que têm destino de verdade):
 * - casa: Ligar (principal) / Orçamento / Área
 * - restaurante: Cardápio / Pedir ou Reservar (principal) / Ligar / Como chegar
 * - profissional: Agendar (principal) / Ligar
 * - portfólio: Pedir data (principal) / Ligar
 */
export function variantSlots(ctx: SoftCtx, options: { area: boolean }): DockSlot[] {
  const { model, variant, hasBooking, hasContact } = ctx;
  const { business, phoneHref } = model;
  const slots: DockSlot[] = [];
  const call: DockSlot | undefined =
    phoneHref && business.phone
      ? {
          key: "call",
          href: phoneHref,
          label: "Call",
          ariaLabel: `Call ${business.phone}`,
        }
      : undefined;
  const hasServices = model.links.some((link) => link.anchor === "services");

  if (variant === "trade") {
    if (call) slots.push({ ...call, primary: true });
    if (hasContact) {
      slots.push({ key: "estimate", href: "#contact", label: "Estimate", primary: !call });
    }
    if (options.area) slots.push({ key: "area", href: "#area", label: "Area" });
    return slots;
  }

  if (variant === "food") {
    if (hasServices) slots.push({ key: "menu", href: "#services", label: "Menu" });
    const cta = primaryCta(ctx);
    if (cta.kind === "call") {
      if (call) slots.push({ ...call, primary: true });
    } else {
      const reserve = !business.links?.order && Boolean(business.links?.booking);
      slots.push({
        key: "order",
        href: cta.href,
        label: reserve ? "Reserve" : "Order",
        external: cta.external,
        primary: true,
      });
      if (call) slots.push(call);
    }
    if (model.directionsHref) {
      slots.push({ key: "find", href: model.directionsHref, label: "Find us", external: true });
    } else if (hasContact) {
      slots.push({ key: "find", href: "#contact", label: "Find us" });
    }
    return slots;
  }

  // Profissional e portfólio: duas abas.
  const label = variant === "pro" ? "Book" : "Inquire";
  const key = variant === "pro" ? "book" : "inquire";
  if (hasBooking) {
    slots.push({
      key: "book",
      href: "#book",
      label,
      bookLink: true,
      fallbackHref: model.ctaHref,
      primary: true,
    });
  } else {
    slots.push({
      key,
      href: model.ctaHref,
      label,
      external: model.ctaExternal,
      primary: true,
    });
  }
  if (call) slots.push(call);
  return slots;
}
