// Os "blocos" de um site desenhado pelo <SiteRenderer>, na ordem em que a moldura da landing monta
// o site: o menu, as peças do topo (título, texto, botões, foto) e depois cada seção. Serve para
// a troca de ramo no topo (Web Animations, uma vez) e para a cena presa à rolagem (GSAP).
// Só lê o DOM; não depende da composição (pega o que existir).

export function siteBlocks(root: HTMLElement): HTMLElement[] {
  const site = root.querySelector<HTMLElement>(".ns-site");
  if (!site) return [];
  const main = site.querySelector<HTMLElement>("main");
  const sections = main ? Array.from(main.children) : [];
  const [first, ...rest] = sections as HTMLElement[];
  const nav = Array.from(site.querySelectorAll<HTMLElement>("header, nav")).filter(
    (el) => !main?.contains(el),
  )[0];
  const topParts = first
    ? Array.from(first.querySelectorAll<HTMLElement>("h1, h1 ~ p, img, a.ns-btn")).filter(
        // Sem peças aninhadas umas nas outras (animar o pai e o filho dobraria o movimento).
        (el, _i, all) => !all.some((other) => other !== el && other.contains(el)),
      )
    : [];
  return [
    ...(nav ? [nav] : []),
    ...(topParts.length > 0 ? topParts : first ? [first] : []),
    ...rest,
  ];
}

/** Monta o site bloco a bloco (cada um desce 40 px e aparece), 70 ms entre um e outro. */
export function dropIn(root: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  siteBlocks(root).forEach((el, index) => {
    el.animate(
      [
        { opacity: 0, transform: "translateY(-40px)" },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 720,
        delay: 120 + Math.min(index, 10) * 70,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "backwards",
      },
    );
  });
}
