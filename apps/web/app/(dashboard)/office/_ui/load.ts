import type { DocumentParty, OfficeSettings } from "@nosweat/schema";
import { dateKeyIn } from "@/lib/office";
import { getClientDetail } from "@/server/clients/service";
import { getOfficeSettings } from "@/server/office/service";
import type { PickedClient } from "./ClientPicker";

// Leituras do servidor comuns às páginas de orçamento e fatura (só para server components).

/** Configurações da empresa e "hoje" no fuso dela. */
export async function loadOfficeContext(ownerId: string): Promise<{
  settings: OfficeSettings;
  today: string;
  company: Pick<OfficeSettings, "companyName" | "phone" | "email" | "address">;
}> {
  const settings = await getOfficeSettings(ownerId);
  return {
    settings,
    today: dateKeyIn(settings.timeZone, new Date()),
    company: {
      companyName: settings.companyName,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
    },
  };
}

/**
 * Contato do cliente (para o SMS/e-mail do "Send" e para a impressão). `null` = não achou (ex.:
 * cliente apagado) ou erro: a tela segue só com o nome guardado no documento.
 */
export async function loadClientContact(
  ownerId: string,
  clientId: string,
): Promise<{ picked: PickedClient; party: DocumentParty } | null> {
  try {
    const detail = await getClientDetail(ownerId, clientId);
    if (!detail) return null;
    const { client } = detail;
    return {
      picked: { id: client.id, name: client.name, phone: client.phone, email: client.email },
      party: {
        name: client.name,
        phone: client.phone,
        email: client.email,
        address: client.address,
      },
    };
  } catch (error) {
    console.error("[office] could not read the client", error);
    return null;
  }
}
