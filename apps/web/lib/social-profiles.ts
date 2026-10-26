// Perfis oficiais da No Sweat nas redes sociais. É a única lista: o rodapé do marketing, a faixa
// "Follow us" da landing e o `sameAs` dos dados estruturados (lib/structured-data.ts) leem daqui.
// Só entra perfil confirmado pelo fundador: link para um @ que não é nosso leva o visitante para
// a conta de outra pessoa. Para ligar uma rede, é só acrescentar a linha.

export type SocialNetwork = "instagram" | "x" | "tiktok" | "facebook" | "youtube" | "linkedin";

export type SocialProfile = {
  network: SocialNetwork;
  /** Nome da rede para leitores de tela e para o texto do link ("Instagram"). */
  label: string;
  handle: string;
  url: string;
};

export const SOCIAL_PROFILES: SocialProfile[] = [
  {
    network: "instagram",
    label: "Instagram",
    handle: "@nosweatfd",
    url: "https://www.instagram.com/nosweatfd/",
  },
];
