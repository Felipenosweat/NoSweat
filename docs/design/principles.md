# Princípios de design (aprendidos das referências e dos nossos erros)

Lições práticas para os sites que a No Sweat gera e para a landing. Cada uma diz de onde veio:
estudo (`studies/<id>.md`) ou falha nossa (`anti-patterns.md`). As referências ensinam
princípios; nunca copiamos código, marca, fotos ou textos delas.

## Composição

1. **A estrutura muda antes da pele.** Dois sites diferentes precisam de topo, ritmo das seções e
   navegação diferentes, não só de outra cor, fonte e foto (C1). A composição é escolhida antes do
   texto (`generation-rules.md`).
2. **Conteúdo calmo, ação constante.** A atmosfera pode ser lenta; as 1–2 ações principais ficam
   sempre a um toque: canto superior direito no computador, barra fixa no celular
   (tandjung-sari). Nossa `MobileCallBar` segue a ação principal do plano (C8).
3. **Uma ação manda.** A ação principal (ligar, orçamento, agendar, visitar, ver trabalhos) decide a
   ordem dos botões; a secundária fica em contorno. Não repetir "ligue" três vezes no mesmo topo (C6).
4. **Sem foto boa, a tipografia é a imagem.** Título em largura total, uma família, hierarquia só
   por tamanho; fatos reais e discretos nos cantos (haven-constructions). Nunca abrir mão de um h1
   de verdade nem do telefone visível.
5. **Serviços como blocos de cor calma** com nome e uma linha honesta, lado a lado no computador e
   empilhados no celular, sem ícones decorativos (lpas). Grade sem buracos: o primeiro ou o último
   bloco ocupa duas colunas quando a conta não fecha.
6. **Ritmo variado.** Alternar largura cheia, colunas desencontradas, índice numerado e blocos.
   Repetir "título centralizado + 3 cartões" em todas as seções é o sinal mais forte de site genérico.

## Tipografia

7. **Uma promessa em linguagem simples** no h1, não uma lista de serviços (kummerlein). O guia de
   texto de cada composição (`COMPOSITION_GUIDE`) diz o tamanho certo do título.
8. **Escala com propósito:** títulos de topo com `clamp()` pela largura do site (cqw), entrelinha
   apertada (0,9–1,05) e `text-wrap: balance`; texto corrido 16–18 px, 60–75 caracteres por linha.
9. **Rótulos pequenos em caixa alta e espaçados** só para metadados (Hours, Serving, Phone), nunca
   para frases.

## Fotos e mídia

10. **A foto define o clima; o fundo acompanha.** Fundos quentes e discretos com foto de
    hospitalidade, serif de display com corpo neutro (tandjung-sari).
11. **Corte deliberado.** Cada composição corta a foto de um jeito (21:9 editorial, ponta a ponta na
    imersiva, faixa 3:1 na tipográfica, bloco alto na modular). Use `image.focus` quando o assunto
    não está no centro. Retrato esticado em tela larga fica mole: prefira outra composição.
12. **Nunca texto longo sobre foto no celular**: empilhe foto e texto (kummerlein). Quando houver
    texto sobre foto (imersiva), véu escuro garante o contraste em qualquer imagem.
13. **Prova é fato, não adjetivo.** Lugar, ano, nome do serviço vindos do dono (lpas, tandjung-sari).
    Nada de selos, notas ou "melhor da cidade" sem o dono dizer (regra 8).
14. **Fotos de banco são cenas, não "nossa equipe".** Sempre com crédito; o texto nunca diz que a
    foto mostra o negócio.

## Demonstração do produto (landing)

15. **Cada promessa ao lado do que a prova** (attio): o componente real ou uma reprodução fiel em
    HTML, em tamanho legível, nunca barras cinza (D1).
16. **Mostrar a mudança acontecendo:** pedido, resumo e o antes/depois marcado (D2).
17. **Dados de exemplo rotulados** ("Example request", "Connected · example") e demos inertes (D7).

## Movimento

18. **Movimento explica, não decora:** entrada curta, toque demonstrado no botão de ligar, abrir
    e fechar de perguntas. Nada de sequestro de rolagem nos sites dos clientes: nenhuma das
    referências testadas desligou o efeito com "reduzir movimento", e isso é exatamente o que não
    queremos (access-log, comparação de movimento reduzido).
19. **Tudo para com `prefers-reduced-motion`**, e nada que se mexe esconde conteúdo ou atrasa o
    botão principal.
