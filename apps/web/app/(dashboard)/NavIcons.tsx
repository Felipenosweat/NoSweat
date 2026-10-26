import type { ReactElement, SVGProps } from "react";
import type { HubModule } from "@/lib/modules";

// Ícones da navegação do painel (barra lateral e abas do celular). Traço 1.75, mesma grade 24.

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Icon>
);

// Janela do navegador: o site do cliente.
export const WebsiteIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
  </Icon>
);

// Balão de conversa: mensagens do formulário de contato.
export const MessagesIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 5h16v11H8l-4 4z" />
  </Icon>
);

// Foto de post (quadrado com lente): redes sociais. Diferente do calendário da agenda.
export const SocialIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.75" />
    <path d="M16.9 7.1h.01" />
  </Icon>
);

// Calendário com blocos de horário: a agenda de serviços.
export const ScheduleIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4M7 13h4M7 16.5h7" />
  </Icon>
);

// Folha com canto dobrado: orçamentos.
export const EstimatesIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
    <path d="M14 3v5h5M8.5 12.5h7M8.5 16h4.5" />
  </Icon>
);

// Recibo com o fundo picotado: faturas.
export const InvoicesIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21 7.33 19.5 5 21z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </Icon>
);

// Três cabeças: a equipe (diferente das duas pessoas de "Clients").
export const TeamIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="7.5" r="3" />
    <path d="M6.5 20a5.5 5.5 0 0 1 11 0" />
    <circle cx="5" cy="10" r="2.25" />
    <circle cx="19" cy="10" r="2.25" />
    <path d="M1.75 18.5A4 4 0 0 1 5 14.6M22.25 18.5A4 4 0 0 0 19 14.6" />
  </Icon>
);

// Estrela (contorno): avaliações do Google.
export const StarIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </Icon>
);

// Controles deslizantes: configurações da empresa.
export const SettingsIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1" />
    <circle cx="15" cy="6.5" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="17.5" r="2" />
  </Icon>
);

export const ClientsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
  </Icon>
);

export const ReviewsIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 5h16v11H8l-4 4z" />
    <path d="m9 10.5 2 2 4-4" />
  </Icon>
);

// Cartão: cobrança.
export const BillingIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
  </Icon>
);

// Pessoa num círculo: configurações da conta.
export const AccountIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.2 18.4a6.5 6.5 0 0 1 11.6 0" />
  </Icon>
);

// Ponto de interrogação num círculo: falar com a equipe.
export const HelpIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01" />
  </Icon>
);

// Escudo: painel do admin.
export const AdminIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6z" />
  </Icon>
);

// Porta com seta: sair da conta.
export const LogOutIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
  </Icon>
);

// Três pontos: aba "More".
export const MoreIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

// ---------- ícones das listas do painel ("Needs you", painéis do site) ----------

// Prancheta com visto: posts esperando aprovação.
export const ApproveIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1M9 12.5l2 2 4-4" />
  </Icon>
);

// Elos de corrente: reconectar a conta.
export const LinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
  </Icon>
);

// Relógio: retornos e histórico de versões.
export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

// Triângulo de alerta: posts que não saíram.
export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    <path d="M12 9.5v4M12 17h.01" />
  </Icon>
);

// Visto: nada pendente / passo feito.
export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
);

// Globo: publicar e domínio próprio.
export const GlobeIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Icon>
);

// Lixeira: apagar o site.
export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);

/** Ícone de cada módulo do hub. */
export const MODULE_ICONS: Record<HubModule["key"], (props: IconProps) => ReactElement> = {
  website: WebsiteIcon,
  social: SocialIcon,
  clients: ClientsIcon,
  reviews: ReviewsIcon,
};
