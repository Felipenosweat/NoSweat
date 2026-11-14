// EXPERIMENTO "caminho A": o que a página gerada pode carregar de fora (lista fechada).
// O pedido (prompt.ts) e a limpeza (sanitize.ts) usam as MESMAS listas, para a IA não escrever
// algo que a limpeza vai tirar. Roda também direto no Node: sem imports.

/**
 * Scripts de animação permitidos, por URL EXATA (versão fixa). GSAP 3.13 traz ScrollTrigger e
 * SplitText de graça; Lenis faz a rolagem suave. Nada mais: o resto do JS é inline.
 */
export const FREEFORM_SCRIPT_URLS = [
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/SplitText.min.js",
  "https://cdn.jsdelivr.net/npm/lenis@1.3.4/dist/lenis.min.js",
] as const;

/** Hosts de fontes: Google Fonts e Fontshare (Indian Type Foundry, licença grátis de uso). */
export const FREEFORM_LINK_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "api.fontshare.com",
  "cdn.fontshare.com",
] as const;
