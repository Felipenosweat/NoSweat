# Auditoria de mídia (2026-10-14)

O que foi olhado, o que mudou e de onde vem cada imagem. Todas as fotos ficam em
`apps/web/public/photos/` e aparecem com crédito no site e em `/credits`.

## Fotos dos sites de exemplo

| Exemplo                | Foto                                  | Origem e licença                                        | Decisão                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Joe's Plumbing         | `example-plumbing.webp` (2400×2160)   | Marian Florinel Condruz, Unsplash, Unsplash License     | Mantida: nítida, do ofício, sem texto falso.                                                                                                                                                                                                                                                                                           |
| Sparkle & Co. Cleaning | `cleaner.webp` (2400×1601)            | American Cleaning Institute, Unsplash, Unsplash License | **Trocada.** Antes `crew.webp` (Pexels): cena posada que, no corte alto da composição modular, mostrava uma pessoa em pé em cima da mesa. A nova mostra mãos organizando um armário, natural e boa no corte vertical.                                                                                                                  |
| Glow Salon             | `example-salon.webp` (2400×1601)      | Benyamin Bohlouli, Unsplash, Unsplash License           | Mantida, com tratamento preto e branco do plano editorial (o tom "elegant" pede).                                                                                                                                                                                                                                                      |
| Rosa's Kitchen         | `example-restaurant.webp` (2400×1602) | Carlos Aranda, Unsplash, Unsplash License               | Mantida **com ressalva**: é um salão de restaurante desfocado, não comida mexicana. Testei `cook.webp` (retrato 1169×1800): no topo imersivo em tela larga ficou mole e cortou a pessoa atrás do título, então voltou a original. Substituir por uma foto horizontal de tortilhas/tacos quando houver acesso ao banco (ver bloqueios). |
| Hale & Ortiz           | sem foto                              | —                                                       | De propósito: mostra que a composição tipográfica funciona sem imagem.                                                                                                                                                                                                                                                                 |

`crew.webp` continua no repositório (usada na faixa "For people who'd rather be working").

## Imagens da landing

- `public/landing/wall/*.webp` (parede do topo e galeria) e `public/landing/build/*.webp`
  (montagem do site): **capturas do nosso próprio renderer** (`/examples/<slug>/embed`), refeitas
  depois das composições novas. Direitos: nossos; as fotos dentro delas são as da tabela acima.
- Demonstrações de recursos (`components/landing/Features.tsx`): nenhuma imagem de interface. O
  celular e o navegador mostram o `<SiteRenderer>` de verdade; e-mail, painel de pedido e busca são
  HTML. Texto nítido e editável.

## Regras

- Nada de imagem gerada por IA com texto ou interface; nada de foto com anatomia estranha, texto
  falso ou cena genérica sem relação com o negócio.
- Foto de banco é "scene": nunca apresentada como equipe, trabalho ou cliente do negócio.
- Corte por composição; `image.focus` ("x% y%") quando o assunto não está no centro.

## Bloqueios

- A busca de fotos novas na Unsplash/Pexels não funcionou deste ambiente: a página da Unsplash
  responde com verificação anti-robô ("Making sure you're not a bot" / "Oh noes!") e não há
  `PEXELS_API_KEY`/`UNSPLASH_ACCESS_KEY` aqui. Nada foi pago nem baixado sem licença.
