// Fotos da demonstração Greenline Landscaping (Unsplash, hotlink com crédito, como pedem as
// regras do Unsplash). Vêm de 6 buscas na API do Unsplash (2026-10-26); o texto alternativo foi
// escrito à mão. São cenas (gramado, cerca-viva, irrigação, folhas, geada): nenhuma é apresentada
// como "nossa equipe" ou "nosso trabalho".

export type GreenlinePhoto = {
  id: string;
  /** URL base (raw) do Unsplash; o tamanho entra por parâmetro (ver `src`). */
  raw: string;
  width: number;
  height: number;
  color: string;
  alt: string;
  author: string;
  authorUrl: string;
  photoUrl: string;
};

const UTM = "utm_source=nosweat&utm_medium=referral";

export const PHOTOS = {
  yard: {
    id: "-1arfQkE9IQ",
    raw: "https://images.unsplash.com/photo-1729058015948-592a8e4a1772?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8NHx8YXV0dW1uJTIwbGVhdmVzJTIwb24lMjBsYXduJTIwYmFja3lhcmR8ZW58MHwwfHx8MTc5MzA1Mjk5MHww&ixlib=rb-4.1.0",
    width: 5184,
    height: 3456,
    color: "#40400c",
    alt: "Low view across a backyard lawn in late-afternoon light, with a tree and a wooden fence behind it",
    author: "Alexandra Gold",
    authorUrl: `https://unsplash.com/@alexandragold?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-grassy-yard-with-a-tree-and-fence-in-the-background--1arfQkE9IQ?${UTM}`,
  },
  trimmer: {
    id: "JB-QHEehcwI",
    raw: "https://images.unsplash.com/photo-1543309959-4d45288d1629?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8aGVkZ2UlMjBzaGVhcnMlMjB0cmltbWluZyUyMHNocnVicyUyMGdhcmRlbnxlbnwwfDB8fHwxNzkzMDUzMDUyfDA&ixlib=rb-4.1.0",
    width: 5245,
    height: 3497,
    color: "#0c260c",
    alt: "A hedge trimmer blade passing over the top of a rounded green shrub",
    author: "Peter Beukema",
    authorUrl: `https://unsplash.com/@peterbeukema?${UTM}`,
    photoUrl: `https://unsplash.com/photos/person-using-hedge-trimmer-JB-QHEehcwI?${UTM}`,
  },
  sprinkler: {
    id: "-zbcx0Lvsfw",
    raw: "https://images.unsplash.com/photo-1622122123829-e0490a288d04?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8Z2FyZGVuJTIwc3ByaW5rbGVyJTIwd2F0ZXJpbmclMjBsYXdufGVufDB8MHx8fDE3OTMwNTMwMjF8MA&ixlib=rb-4.1.0",
    width: 6000,
    height: 4000,
    color: "#405926",
    alt: "An impact sprinkler throwing a fan of water across a lawn",
    author: "Paul Moody",
    authorUrl: `https://unsplash.com/@pjonesmoody?${UTM}`,
    photoUrl: `https://unsplash.com/photos/green-and-black-lego-toy-on-green-grass-during-daytime--zbcx0Lvsfw?${UTM}`,
  },
  mown: {
    id: "zXH4Y7bRu3Y",
    raw: "https://images.unsplash.com/photo-1764969370921-7c8df49171cd?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8N3x8bGF3biUyMG1vd2luZyUyMHN0cmlwZXN8ZW58MHwwfHx8MTc5MzA1Mjk0Mnww&ixlib=rb-4.1.0",
    width: 4032,
    height: 3024,
    color: "#26400c",
    alt: "A freshly mown lawn in light and dark stripes, shaded by tall trees on a sunny day",
    author: "MV Vacation",
    authorUrl: `https://unsplash.com/@mvvacation?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-freshly-mown-lawn-in-a-sunny-park-zXH4Y7bRu3Y?${UTM}`,
  },
  shadows: {
    id: "5anFaOnNNYk",
    raw: "https://images.unsplash.com/photo-1787108171622-49533e97b34e?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTd8fGxhd24lMjBtb3dpbmclMjBzdHJpcGVzfGVufDB8MHx8fDE3OTMwNTI5NDJ8MA&ixlib=rb-4.1.0",
    width: 4632,
    height: 3088,
    color: "#0c260c",
    alt: "Long diagonal shadows lying across short green grass",
    author: "Kauê Martins Bergamasco",
    authorUrl: `https://unsplash.com/@_raccoon_holmes?${UTM}`,
    photoUrl: `https://unsplash.com/photos/diagonal-shadows-on-green-grass-5anFaOnNNYk?${UTM}`,
  },
  leaves: {
    id: "vInOWo0GpaY",
    raw: "https://images.unsplash.com/photo-1606090310079-4be08582f123?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8YXV0dW1uJTIwbGVhdmVzJTIwb24lMjBsYXduJTIwYmFja3lhcmR8ZW58MHwwfHx8MTc5MzA1Mjk5MHww&ixlib=rb-4.1.0",
    width: 4032,
    height: 3024,
    color: "#260c0c",
    alt: "A lawn covered in fallen orange and yellow leaves under a tree, a house beyond the fence",
    author: "naomi tamar",
    authorUrl: `https://unsplash.com/@naomitamar?${UTM}`,
    photoUrl: `https://unsplash.com/photos/brown-tree-with-yellow-leaves-on-ground-vInOWo0GpaY?${UTM}`,
  },
  fence: {
    id: "nLVEboeNU_E",
    raw: "https://images.unsplash.com/photo-1763385831966-aeccd2e37fb7?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8YXV0dW1uJTIwbGVhdmVzJTIwb24lMjBsYXduJTIwYmFja3lhcmR8ZW58MHwwfHx8MTc5MzA1Mjk5MHww&ixlib=rb-4.1.0",
    width: 7099,
    height: 5504,
    color: "#404059",
    alt: "Yellow maple leaves on a branch and on the ground along a grey wooden fence",
    author: "Srini Somanchi",
    authorUrl: `https://unsplash.com/@sriniunsplash?${UTM}`,
    photoUrl: `https://unsplash.com/photos/yellow-autumn-leaves-fall-near-a-wooden-fence-nLVEboeNU_E?${UTM}`,
  },
  frost: {
    id: "cB-HV4bCjAs",
    raw: "https://images.unsplash.com/photo-1609272321225-0ff8f85d1427?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8N3x8ZnJvc3QlMjBnYXJkZW4lMjB3aW50ZXIlMjBtb3JuaW5nfGVufDB8MHx8fDE3OTMwNTMxMDJ8MA&ixlib=rb-4.1.0",
    width: 5353,
    height: 4024,
    color: "#f3f3f3",
    alt: "Frost on dried seed pods in low winter light",
    author: "Dominik Scythe",
    authorUrl: `https://unsplash.com/@drscythe?${UTM}`,
    photoUrl: `https://unsplash.com/photos/brown-dried-leaf-in-close-up-photography-cB-HV4bCjAs?${UTM}`,
  },
  golden: {
    id: "qo-b_CFngso",
    raw: "https://images.unsplash.com/photo-1787080181155-ada01ab07d53?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTB8fGdhcmRlbiUyMHNwcmlua2xlciUyMHdhdGVyaW5nJTIwbGF3bnxlbnwwfDB8fHwxNzkzMDUzMDIxfDA&ixlib=rb-4.1.0",
    width: 6240,
    height: 4160,
    color: "#40400c",
    alt: "Sprinklers watering a lawn among young trees, the spray lit gold by a low sun",
    author: "Ksenia Obukhova",
    authorUrl: `https://unsplash.com/@fez_wee?${UTM}`,
    photoUrl: `https://unsplash.com/photos/sprinklers-watering-lawn-in-golden-light-qo-b_CFngso?${UTM}`,
  },
  pruners: {
    id: "axZQeOgrZvk",
    raw: "https://images.unsplash.com/photo-1680124744737-03fb697f303d?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MjV8fGhlZGdlJTIwc2hlYXJzJTIwdHJpbW1pbmclMjBzaHJ1YnMlMjBnYXJkZW58ZW58MHwwfHx8MTc5MzA1MzA1Mnww&ixlib=rb-4.1.0",
    width: 4272,
    height: 2848,
    color: "#407326",
    alt: "Hands cutting a green stem with a pair of pruning shears",
    author: "Margarita Shtyfura",
    authorUrl: `https://unsplash.com/@kvitka?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-person-holding-a-pair-of-scissors-in-front-of-a-plant-axZQeOgrZvk?${UTM}`,
  },
  hedge: {
    id: "Wi9t2hFiQSY",
    raw: "https://images.unsplash.com/photo-1707844941144-b54f6cc40ada?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTB8fGhlZGdlJTIwc2hlYXJzJTIwdHJpbW1pbmclMjBzaHJ1YnMlMjBnYXJkZW58ZW58MHwwfHx8MTc5MzA1MzA1Mnww&ixlib=rb-4.1.0",
    width: 3456,
    height: 2304,
    color: "#c0d973",
    alt: "A long clipped hedge curving along the edge of a lawn, with a tall rusted-steel sculpture",
    author: "Lucy Nysen",
    authorUrl: `https://unsplash.com/@mastergardens?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-long-row-of-hedges-in-a-garden-Wi9t2hFiQSY?${UTM}`,
  },
} satisfies Record<string, GreenlinePhoto>;

export type PhotoKey = keyof typeof PHOTOS;

/** Endereço da foto na largura pedida (o Unsplash redimensiona; com `ratio`, recorta). */
export function src(photo: GreenlinePhoto, width: number, ratio?: number): string {
  const size = ratio
    ? `&w=${width}&h=${Math.round(width / ratio)}&fit=crop&crop=entropy`
    : `&w=${width}&fit=max`;
  return `${photo.raw}${photo.raw.includes("?") ? "" : "?"}&q=72&fm=jpg&auto=format${size}`;
}

/** srcset com larguras fixas (o navegador escolhe pela tela e pelo `sizes`). */
export function srcSet(
  photo: GreenlinePhoto,
  ratio?: number,
  widths = [480, 768, 1080, 1440, 1920, 2560],
): string {
  return widths.map((w) => `${src(photo, w, ratio)} ${w}w`).join(", ");
}
