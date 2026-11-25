import type { SiteSpec } from "@nosweat/schema";
import type { BookingDemo } from "../../sections/BookingSection";
import type { SiteModel } from "../model";

/** O que todas as peças da composição "soft" precisam saber do site. */
export type SoftCtx = {
  model: SiteModel;
  spec: SiteSpec;
  /** Existe uma seção de agendamento ligada (a API está no ar ou o modo exemplo). */
  hasBooking: boolean;
  bookingEndpoint?: string;
  demo?: BookingDemo;
  /** Existe uma seção de contato (para "Ask" e para o plano B dos botões). */
  hasContact: boolean;
  /** Para onde vai o "+" / "Book" quando NÃO há agendamento: link do dono, telefone ou #contact. */
  bookFallbackHref: string;
};
