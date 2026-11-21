// Como falar com a No Sweat para pagar à mão (Pix/WhatsApp) quando não há checkout. Puro (sem
// React): serve ao /billing e ao pop-up de planos do /create.

export type SalesContact = {
  whatsapp: string | null;
  email: string;
  accountEmail: string | null;
  /** Id da conta: o admin acha a conta certa no /admin mesmo se o e-mail vier diferente. */
  accountId: string | null;
};

/** Mensagem pronta: o pedido, o e-mail da conta e o id da conta. */
function salesMessage(contact: SalesContact, text: string): string {
  return [
    text,
    contact.accountEmail ? `My account: ${contact.accountEmail}` : null,
    contact.accountId ? `Account ID: ${contact.accountId}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function whatsappHref(whatsapp: string, contact: SalesContact, text: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(salesMessage(contact, text))}`;
}

export function emailHref(contact: SalesContact, text: string): string {
  return `mailto:${contact.email}?subject=${encodeURIComponent("No Sweat plan")}&body=${encodeURIComponent(salesMessage(contact, text))}`;
}

/** Link do WhatsApp (se houver número) ou do e-mail, com a mensagem já escrita. */
export function contactHref(contact: SalesContact, text: string): string {
  return contact.whatsapp
    ? whatsappHref(contact.whatsapp, contact, text)
    : emailHref(contact, text);
}
