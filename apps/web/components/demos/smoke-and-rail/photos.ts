// Fotos da demonstração Smoke & Rail BBQ (Unsplash, hotlink com crédito, como pedem as regras
// do Unsplash). Vieram de 5 buscas na API (2026-10-26); o texto alternativo foi escrito à mão a
// partir do que a foto mostra. São cenas (fogo, fumaça, carne, pátio de trens): nenhuma é
// apresentada como a equipe ou o lugar do negócio, que é fictício.

export type SrPhoto = {
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

const photo = (
  id: string,
  raw: string,
  width: number,
  height: number,
  color: string,
  alt: string,
  author: string,
  username: string,
  page: string,
): SrPhoto => ({
  id,
  raw: `https://images.unsplash.com/${raw}`,
  width,
  height,
  color,
  alt,
  author,
  authorUrl: `https://unsplash.com/@${username}?${UTM}`,
  photoUrl: `https://unsplash.com/photos/${page}?${UTM}`,
});

export const PHOTOS = {
  hero: photo(
    "r7LklCGF2vE",
    "photo-1771308456346-4b5da82ecf46?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTV8fGJicSUyMHNtb2tlciUyMHNtb2tlfGVufDB8MHx8fDE3OTMwMzMxMTN8MA&ixlib=rb-4.1.0",
    8192,
    5464,
    "#262626",
    "Smoke rising off meat on a grate inside a dark smoker",
    "Jason Leung",
    "ninjason",
    "smoke-rising-from-food-cooking-on-a-grill-r7LklCGF2vE",
  ),
  fire: photo(
    "3I2whz2-q1I",
    "photo-1664514931261-bc519a436078?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTZ8fGJicSUyMHNtb2tlciUyMHNtb2tlfGVufDB8MHx8fDE3OTMwMzMxMTN8MA&ixlib=rb-4.1.0",
    5184,
    3456,
    "#405959",
    "Flames and smoke climbing out of a firebox in the dark",
    "Tonmoy Iftekhar",
    "xalfa",
    "a-person-burning-a-fire-3I2whz2-q1I",
  ),
  smoker: photo(
    "8iiiyBBBDDQ",
    "photo-1642553796642-9b959a8aafaf?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MjN8fGJicSUyMHNtb2tlciUyMHNtb2tlfGVufDB8MHx8fDE3OTMwMzMxMTN8MA&ixlib=rb-4.1.0",
    5472,
    3648,
    "#262626",
    "A black offset smoker under a roof, split logs stacked behind it and smoke leaving the stack",
    "Alex S",
    "alien_roger",
    "a-large-barrel-sitting-next-to-a-pile-of-wood-8iiiyBBBDDQ",
  ),
  bark: photo(
    "KIFo2HBAs7E",
    "photo-1623174460936-db852c007c5b?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8OHx8YnJpc2tldHxlbnwwfDB8fHwxNzkzMDMzMDc4fDA&ixlib=rb-4.1.0",
    5472,
    3648,
    "#262626",
    "Seasoning falling onto the black crust of a smoked brisket",
    "Luis Santoyo",
    "shootwithlou",
    "brown-and-black-grilled-meat-KIFo2HBAs7E",
  ),
  sliced: photo(
    "IePWXTF3-0Y",
    "photo-1623174025518-b49000fb653d?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8YnJpc2tldHxlbnwwfDB8fHwxNzkzMDMzMDc4fDA&ixlib=rb-4.1.0",
    5472,
    3078,
    "#262626",
    "Brisket sliced on a wooden board, a pink smoke ring under the black bark",
    "Luis Santoyo",
    "shootwithlou",
    "sliced-meat-on-brown-wooden-chopping-board-IePWXTF3-0Y",
  ),
  smoke: photo(
    "XczW8QZK5bo",
    "photo-1662141048633-b52c0f2174fd?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8NHx8YmJxJTIwc21va2VyJTIwc21va2V8ZW58MHwwfHx8MTc5MzAzMzExM3ww&ixlib=rb-4.1.0",
    5895,
    3930,
    "#c0c0c0",
    "A cloud of white smoke against a dark background",
    "Brian Wangenheim",
    "brianwangenheim",
    "a-cloud-of-smoke-XczW8QZK5bo",
  ),
  whole: photo(
    "JaOpdRlmkhg",
    "photo-1694619003734-0ee52758ddc3?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8N3x8YnJpc2tldHxlbnwwfDB8fHwxNzkzMDMzMDc4fDA&ixlib=rb-4.1.0",
    6000,
    4000,
    "#402626",
    "Gloved hands holding a whole smoked brisket on a cutting board",
    "Alex Moliski",
    "alexmoliski",
    "a-person-cutting-up-a-piece-of-meat-on-a-cutting-board-JaOpdRlmkhg",
  ),
  ribs: photo(
    "QtLYiB6P-KM",
    "photo-1679711246825-1f2bd51b16d0?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8c21va2VkJTIwcmlicyUyMGJhcmJlY3VlfGVufDB8MHx8fDE3OTMwMzMxODF8MA&ixlib=rb-4.1.0",
    4928,
    3712,
    "#260c0c",
    "A glazed rack of spare ribs on a smoker grate",
    "Brian Wegman",
    "trytoscareme",
    "a-rack-of-ribs-cooking-on-a-grill-QtLYiB6P-KM",
  ),
  pork: photo(
    "aNxuG51cYg0",
    "photo-1581940597412-a16f95c6ca93?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTR8fHB1bGxlZCUyMHBvcmslMjBzYW5kd2ljaHxlbnwwfDB8fHwxNzkzMDMzMjEyfDA&ixlib=rb-4.1.0",
    5184,
    3456,
    "#260c0c",
    "A row of pulled pork sandwiches on soft buns in takeout trays",
    "Ethan Wilkinson",
    "ethanrwilkinson",
    "burger-on-black-plastic-tray-aNxuG51cYg0",
  ),
  tray: photo(
    "OGUAm5YUoyc",
    "photo-1560024818-2c6d122cfbe2?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8YnJpc2tldHxlbnwwfDB8fHwxNzkzMDMzMDc4fDA&ixlib=rb-4.1.0",
    4032,
    3024,
    "#59260c",
    "A sheet tray of sliced brisket and ribs with beans, slaw, pickles and a corn muffin",
    "Jacob Stone",
    "thejacobstone",
    "cooked-food-OGUAm5YUoyc",
  ),
  yard: photo(
    "uCQXiQ_-8pA",
    "photo-1788463023413-07fce513fedf?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8ZnJlaWdodCUyMHRyYWluJTIwcmFpbCUyMHlhcmQlMjBuaWdodHxlbnwwfDB8fHwxNzkzMDMzMTQ1fDA&ixlib=rb-4.1.0",
    4032,
    3024,
    "#262626",
    "A freight yard seen from above at golden hour, rows of railcars beside lit tracks",
    "Arnold Krausz",
    "arnoldx17",
    "train-station-and-freight-yard-uCQXiQ_-8pA",
  ),
  night: photo(
    "P7mSLyrDgDs",
    "photo-1771150535337-debe34189e58?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8ZnJlaWdodCUyMHRyYWluJTIwcmFpbCUyMHlhcmQlMjBuaWdodHxlbnwwfDB8fHwxNzkzMDMzMTQ1fDA&ixlib=rb-4.1.0",
    6972,
    3922,
    "#260c0c",
    "Freight cars lined up in a rail yard at night under floodlights",
    "Yuriy Vertikov",
    "noa69",
    "freight-train-cars-at-a-railyard-at-night-P7mSLyrDgDs",
  ),
} satisfies Record<string, SrPhoto>;

export type PhotoKey = keyof typeof PHOTOS;

/** Endereço da foto na largura pedida (o Unsplash redimensiona; `crop` recorta pela proporção). */
export function src(photo: SrPhoto, width: number, ratio?: number): string {
  const size = ratio
    ? `&w=${width}&h=${Math.round(width / ratio)}&fit=crop&crop=entropy`
    : `&w=${width}&fit=max`;
  return `${photo.raw}&q=72&fm=jpg&auto=format${size}`;
}

/** srcset com larguras fixas (o navegador escolhe pela tela). */
export function srcSet(
  photo: SrPhoto,
  ratio?: number,
  widths = [480, 768, 1080, 1440, 1920, 2560],
): string {
  return widths.map((w) => `${src(photo, w, ratio)} ${w}w`).join(", ");
}
