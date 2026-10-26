// Chamadas à API do escritório a partir dos componentes de cliente. Mesmo mecanismo do módulo de
// clientes (fetch + validação da resposta com o schema, erros `{ error: { code, message } }`):
// reaproveita o de lá em vez de copiar.

export {
  ClientsApiError as OfficeApiError,
  ErrorNote,
  clientsApi as officeApi,
  clientsApiNoContent as officeApiNoContent,
  toClientsError as toOfficeError,
} from "../../clients/api";

const enc = encodeURIComponent;

export const estimateUrl = (id: string, suffix = "") => `/api/office/estimates/${enc(id)}${suffix}`;
export const invoiceUrl = (id: string, suffix = "") => `/api/office/invoices/${enc(id)}${suffix}`;
export const priceItemUrl = (id: string) => `/api/office/price-items/${enc(id)}`;
