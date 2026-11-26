# Sites-modelo (um por categoria)

Aprovado pelo fundador em 2026-10-18. Objetivo: cada modelo já é um site profissional que um negócio
real publicaria trocando só os seus dados; a IA depois só personaliza o modelo (barato) em vez de
desenhar do zero. Fotos do portfólio de exemplo: Unsplash com crédito visível, só no `/examples`.

## Os cinco modelos

| Categoria     | Modelo (fictício, marcado como exemplo)                                                      | Composição (alt)                         | Ação principal   | Densidade | Fonte       | Tratamento                                 |
| ------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------- | --------- | ----------- | ------------------------------------------ |
| home-services | Joe's Plumbing, Austin TX (`joes-plumbing`); alt Sparkle & Co. (`sparkle-cleaning`, modular) | service-led reconstruído (typographic)   | call             | compact   | `bold`      | natural                                    |
| beauty        | Glow Salon, Wynwood, Miami FL (`glow-salon`)                                                 | editorial (immersive para spa)           | book             | airy      | `editorial` | natural (nunca monochrome em salão de cor) |
| restaurant    | Rosa's Kitchen, Barrio Logan, San Diego CA (`rosas-kitchen`)                                 | immersive (editorial sem foto de comida) | book ou visit    | balanced  | `fresh`     | natural                                    |
| professional  | Hale & Ortiz, Denver CO (`hale-ortiz`)                                                       | typographic (editorial se "elegante")    | book             | balanced  | `refined`   | natural                                    |
| portfolio     | **Novo:** Marisol Vega Photography, Asheville NC (`vega-photo`)                              | editorial                                | browse → inquiry | airy      | `gallery`   | natural sempre                             |

Fatos dos modelos (endereço, preços, pessoas, depoimentos) ficam escritos em
`packages/fixtures/src/briefs.ts` como palavras do dono. Telefones 555 e e-mails `.example.com`.

### Ordem das seções

- **Joe's:** hero (+ faixa de fatos: horário/24h se o dono disse, área, highlights, ligar) → services
  em linhas (sem ícones; `detail`/`price` só do dono) → about (quem atende o telefone) → gallery
  "Recent jobs" com legendas → testimonials (se houver) → faq → lista de cidades atendidas → contact
  (telefone grande, horário, formulário "trade"). Tirar do h1 "Trusted"/"On time every time".
- **Glow:** hero (ponto de vista, "Book an appointment" → `links.booking`) → services como cardápio
  de preços agrupado (Cut & style / Color / Treatments) → about "The chairs" com pessoas → gallery
  "Recent work" (legenda = técnica) → testimonials → faq "Before your appointment" → contact "Book
  your visit" (link de agendamento, endereço + rota, horário, formulário "appointment"). O ramo de
  beleza usa a composição própria "soft" (`compositions/soft`, cara de app de salão; ver
  `docs/design/studies/founder-salon-app-reference.md`) e a seção "booking" logo depois dos
  serviços. Paleta (roxa, do dono): fundo `#F5F6FD`, texto `#17164F`, primária `#181966`,
  secundária `#D9D4FF` (nunca como texto), muted `#666B8A`; fonte `modern`.
- **Rosa's:** hero com faixa de info (Horário · Find us + Directions · Ligar) → menu em grupos com
  preços → about "Our story" → gallery "At the table" (legenda = prato) → testimonials → faq "Good to
  know" → contact "Visit us" → placa de vitrine (horário + endereço grandes). Fonte `fresh` (não
  `friendly`). Foto de herói = comida, não salão desfocado. Paleta: `#FFF8EE` / `#2A211C` /
  `#B23A1E` / `#2F5D3A`.
- **Hale & Ortiz:** hero + painel de fatos → services como "livro-caixa" (número | nome | descrição |
  cadência/preço) → about "Who you'll work with" (credenciais do dono) → testimonials → faq com
  espaço cheio → contact "Book a consultation" (link Calendly, formulário "consultation"). Paleta:
  `#FAFAF7` / `#14181F` / `#1E3A5F` / `#B08D57` (latão só como fio de 2px).
- **Vega (novo):** hero (só foto da dona; sem foto = só tipografia) → gallery "Selected work" logo
  depois do hero, "folha de contato" com legendas "01 · Ana & Luis · Biltmore Estate · 2025" →
  services "Packages" com preços → about → testimonials → faq "Working together" → contact "Check your
  date" (formulário "inquiry": nomes, data, local, mensagem). Paleta: `#FAFAF8` / `#121212` /
  primária `#121212` / `#A4532E`.

## Regras gerais

- Fatos como placa: micro-rótulo em caixa alta + fato simples (Hours / Serving / Find us / Phone /
  From). Nunca adjetivos. Preços e horários com `tabular-nums`, "from $85", "11 AM – 9 PM".
- Uma cor de ação. Em serviços para casa, laranja = ligar, só isso.
- Legendas como prova: nome · lugar · ano (ou prato / técnica).
- Até 2 raios por site; bordas de 1px antes de sombras (tirar `shadow-2xl`, `shadow-lg
shadow-ns-primary/25`). Só cores `ns-*` nos templates. Nada de selo fixo (regra 8).
- Remover: `MapPlaceholder` (mapa falso), `Stars` (5 estrelas fixas), `SERVICE_ICONS` (ícones em
  rodízio), "✓" do formulário (usar `CheckIcon`).
- Fotos do dono (`kind: "owner"`) nunca recebem filtro monochrome/tinted.

## Contrato (só campos opcionais novos em `packages/schema/src/site.ts`)

- `SiteImage.caption?` (≤100)
- `business.address?` (rua), `business.category?` ("Plumber", "Hair salon"),
  `business.links?` { booking, order, menu, instagram, facebook, tiktok, google, yelp, linkedin }
  (URLs https)
- `services.items[].price?`, `.detail?`, `.group?`; `title?` em services/testimonials/faq/contact
- Seção nova `about`: { title?, body ≤700, image?, people?: [{ name, role?, note?, image? }] ≤6 }

## Renderer (packages/templates)

1. Reconstruir **service-led** como `compositions/ServiceLed.tsx` sobre `buildModel`/`shared.tsx`
   (faixa de fatos, serviços em linhas, lista de cidades) e apontar `COMPOSITIONS["service-led"]` para
   ele; tirar do caminho o stack antigo `templates/home-services/*` e `sections/{Hero,Services,
Testimonials,Contact}.tsx`.
2. `model.tsx`: vocabulário por categoria (títulos, rótulos do menu, texto do formulário), respeitar
   `title` da seção, `ctaHref` = `links.booking ?? links.order ?? (#contact | tel:)`,
   `directionsHref` (Google Maps search, sem chave), "Find us" em beleza/restaurante (não "Service
   area").
3. Peças novas em `shared.tsx`: `PriceList` (grupos, pontilhado, preço), `AddressBlock`,
   `HeaderAction`, `PeopleList`, `ServiceAreaList`.
4. `about` nas 5 composições.
5. `Gallery`: variantes sheet / wall / grid / tiles, com legendas, raio e espaçamento da composição.
6. `ContactForm`: raio da composição, sem sombra, presets por categoria (trade / appointment /
   catering / consultation / inquiry); campos extras vão juntos no `message` (o `LeadRequest` não
   muda).
7. `MobileCallBar` em `shared.tsx`: botão largo = ação principal; quadrado = telefone (ou rota, ou
   e-mail). Links externos com `target="_blank" rel="noopener"`.
8. Rodapé: nome, rua, cidade/estado, telefone, e-mail, horário resumido, área, redes em texto, rota.

## Geração a partir do modelo (backend)

A IA não desenha mais o site: parte do modelo da categoria (estrutura, composição, tema, ordem) e
devolve só um `ModelFill` pequeno (textos do hero, serviços, faq, about, títulos, categoria + fatos
que estão literalmente no pedido). Código junta tudo, `SiteSpec.parse`, checagem de honestidade
(recusa `$`, "years", "licensed", "insured", "guarantee", "same-day", "24/7", "#1"... que não estejam
no pedido). Modelo barato (Haiku), com volta para o caminho atual (Sonnet) se falhar. Estimativa:
~US$0,06 → ~US$0,005 por site.

## Visual "soft" nos quatro ramos (casa, restaurante, profissional, portfólio)

Os cinco ramos usam a composição `soft` (`packages/templates/src/compositions/soft`), a que o dono
aprovou na beleza: cartões de 24 px, azulejos com ícone, botões em pílula com disco de seta, chips,
sombras suaves da cor principal, tudo visível de início (sem revelar ao rolar, sem paralaxe, sem
cortina). A beleza é a base; os outros quatro são variantes (`data-variant` no `.ns-soft`:
`trade`, `food`, `pro`, `work`) que mudam a prioridade da primeira tela, a densidade, a foto, a
paleta e a fonte. Plano B: `SOFT_TEMPLATES` em `SiteRenderer.tsx` (tirar um ramo da lista devolve
ele ao molde Signature, que segue no repositório e nos testes via a prop `signature`).

| Ramo                 | Primeira tela                                                                                                                                                                                                                                                                                      | Serviços                                                                                                                                                              | Barra do celular                                     | Paleta e fonte                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Casa (`trade`)       | Título com o ofício e a cidade, pílula "Call (xxx) xxx-xxxx" na cor de ação, "Get an estimate", "Schedule a visit" só com agendamento ligado; abaixo, cartão de fatos (Hours, Serving, Phone + "Text us"). Foto do dono num cartão ao lado (computador), sem foto o cartão some. Cabeçalho sólido. | Linhas com ícone do ofício (chave, ralo, aquecedor, cano, vassoura, folha...) e pílula "Estimate" (ou "Book" com agendamento). Cidades atendidas como nuvem de chips. | Call (principal) / Estimate / Area                   | Azul-aço + UM laranja só no botão de ligar (`--v-action`, vem da cor secundária se ela contrasta), página branco-fria, fonte `bold` |
| Restaurante (`food`) | Foto de comida que some no fundo (celular), título, ação principal (só links do dono: pedido, reserva; senão Call), "View the menu". Faixa de fatos: horário como escrito, Find us + Directions, Order/Reserve/Call. Sem tira de datas.                                                            | Um cartão por grupo; linha com foto do dono ou azulejo (talher, xícara, chama, bolo), descrição, preço à direita e pílula "Order" SÓ com `links.order`.               | Menu / Order ou Reserve (principal) / Call / Find us | Tomate ou oliva sobre creme, títulos `fresh` (Fraunces), nunca itálico                                                              |
| Profissional (`pro`) | Tipográfica: título, "Book a consultation" (link do dono ou #contact), telefone, fatos (horário, endereço). Retrato só se o dono tem foto dele. Sombras chapadas.                                                                                                                                  | "Ways we can help": linhas com azulejos numerados 01, 02... e pílula discreta; FAQ com a primeira aberta.                                                             | 2 abas: Book (principal) / Call                      | Azul-tinta + latão sobre branco quente, títulos `refined` (DM Serif Display), corpo DM Sans                                         |
| Portfólio (`work`)   | Topo mínimo (nome, uma linha, "Check your date" + telefone); a galeria sobe para logo depois do topo (fora do editor).                                                                                                                                                                             | Pacotes: linhas com preço e "Inquire".                                                                                                                                | 2 abas: Inquire (principal) / Call                   | Quase monocromático (branco e tinta) + UM acento no botão, fonte `gallery`                                                          |

Galeria do portfólio (`WorkGallery`): grade que sempre fecha (2 colunas no celular, 6 no
computador, ver `workShapes`), quadros grandes, legenda "casal · lugar · ano" só se existir, sem
quadro vazio. Fotos pequenas demais (lado maior < 600 px na galeria, < 1200 px no topo) são
descartadas; o topo cai para um painel de cor quando não há foto boa. Chips de "highlights" só
aparecem se o dono os escreveu (regra 8).

Desempenho e convenções dos EUA: nenhum JavaScript novo (só `<details>`, âncoras e a barra que já
existia); `width`/`height` em toda foto, só a do topo é `eager`; desfoque só nas pílulas pequenas do
cabeçalho; telefone `(305) 555-0187` com `tel:` e "Text us" (`sms:`) nos serviços para casa;
endereço "Rua, Cidade, UF 12345" (campo opcional `business.zip`, novo); preços em US$; horários em
12 h. Os sites-modelo usam fotos locais que combinam com o ofício (`plumber.webp`, `crew.webp`,
`cook.webp`) e o portfólio usa as fotos verificadas de `unsplash-photos.ts`.
