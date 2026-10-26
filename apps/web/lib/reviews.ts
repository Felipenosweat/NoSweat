// Pedido de avaliação no Google (página /reviews e ficha do cliente): o texto pronto e os links
// de SMS e e-mail. Funções puras: servem para server e client components.

/** Primeiro nome de "Ana Souza" → "Ana". Vazio se não houver nome. */
export function firstNameOf(fullName: string | null | undefined): string {
  return (fullName ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Texto pronto do pedido. Sem nome: "Hi there". */
export function reviewRequestMessage({
  firstName,
  businessName,
  link,
}: {
  firstName?: string | null;
  businessName: string;
  link: string;
}): string {
  const name = firstName?.trim() || "there";
  const business = businessName.trim() || "us";
  return `Hi ${name}, thanks for choosing ${business}! Would you mind leaving us a quick review? ${link}`;
}

/** Assunto do e-mail do pedido. */
export function reviewEmailSubject(businessName: string): string {
  const business = businessName.trim();
  return business ? `A quick favor from ${business}` : "A quick favor";
}

/**
 * Link de SMS com o texto pronto. `?&body=` funciona no iPhone e no Android. Sem telefone, o app
 * de mensagens abre para a pessoa escolher o contato.
 */
export function smsHref(phone: string | null | undefined, body: string): string {
  const to = (phone ?? "").replace(/[^\d+]/g, "");
  return `sms:${to}?&body=${encodeURIComponent(body)}`;
}

/** Link mailto: com assunto e texto (sem e-mail, o app abre com o destinatário vazio). */
export function mailtoHref(email: string | null | undefined, subject: string, body: string): string {
  const to = (email ?? "").trim();
  return `mailto:${encodeURIComponent(to).replace(/%40/g, "@")}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
