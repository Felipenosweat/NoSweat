# Escolher a direção de um projeto novo (e não repetir)

Processo para quem desenha à mão (landing, demos, templates novos). O gerador do app tem o
próprio caminho (`generation-rules.md`).

## 1. Escreva o pedido em 3 palavras-chave

- **ramo** (`--industry`): os termos de `fits.businesses` em `references.json` e
  `archetypes.json` (hotel, restaurant, plumber, lawyer, spa...).
- **tons** (`--tones`): refined, premium, calm, warm, bold, playful, minimal.
- **objetivo** (`--goal`): book, call, quote, visit, portfolio, buy.

## 2. Rode o seletor

```bash
node docs/design/tools/select.mjs --industry hotel --tones refined,premium --goal book
```

Ele devolve (JSON):

- `archetype` + `alternatives`: o arquétipo que mais combina e os dois seguintes;
- `axes`: uma combinação dos 7 eixos (`archetypes.md`);
- `references`: as 5 referências que mais combinam, com o estudo e 3 princípios de cada;
- `recentlyUsed`: os últimos projetos do log.

Como pontua:

- referência: ramo +3, cada tom +1, objetivo +1, `verified-live` +0,5;
- arquétipo: ramo +3, cada tom +1, cada referência boa do mesmo arquétipo +1,5, menos a
  penalidade de repetição × 1,5;
- cada eixo: posição na lista de preferência do arquétipo, menos a penalidade de repetição.

**Penalidade de repetição:** para cada um dos últimos 6 projetos de `usage-log.json` que usou
o mesmo valor, soma `2 / idade` (o último projeto pesa 2, o penúltimo 1, o anterior 0,67...).
Na prática: logo depois do Aurelia, o mesmo pedido de hotel sai como `quiet-luxury`,
`split-editorial`, `grotesk-only`, `index-led`, `framed-editorial`, `top-bar`, `quiet`,
`single-paper`: outro site, não o Aurelia com outra cor.

## 3. Leia antes de desenhar

1. O estudo de cada referência escolhida (`studies/<id>.md`), separando observação de
   interpretação.
2. `patterns.md` para as receitas do arquétipo e `motion.md` para o temperamento escolhido.
3. O `avoid` do arquétipo e `anti-patterns.md`.

## 4. Explore 3 direções, escolha 1

Escreva 3 direções curtas (nome, eixos, a primeira dobra em uma frase, o risco). Pelo menos
uma delas deve vir das `alternatives`. Escolha por: serve o objetivo do negócio, aguenta o
celular, as fotos disponíveis sustentam. Registre as duas descartadas e o motivo no estudo de
caso (ver `aurelia.md`).

## 5. Grave no log quando o projeto for aprovado

```bash
node docs/design/tools/select.mjs --industry hotel --tones refined,premium --goal book --record "Nome do projeto"
```

Se a direção final mudou algum eixo em relação à sugestão, corrija a entrada em
`usage-log.json` à mão: o log tem que descrever o que foi **construído**, senão a penalidade
de repetição mira o alvo errado.

## 6. Revise com a rubrica

`review-rubric.md` antes de mostrar a qualquer pessoa.
