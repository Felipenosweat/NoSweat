# Padrões: layout, narrativa, componentes e interação

Receitas reaproveitáveis. Cada uma diz de onde veio (id em `references.json` ou o projeto
nosso em que foi construída) e para quais arquétipos serve (`archetypes.md`). Uma receita é um
ponto de partida, não um carimbo: o seletor (`selection.md`) existe para que dois projetos
não usem o mesmo conjunto.

## Layout

| Padrão                            | Como é                                                                                                               | Fonte                            | Arquétipos                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------- |
| **Monumento tipográfico**         | o nome em largura total sobre foto escura, fatos pequenos nos cantos, fio fino embaixo                               | Aurelia, haven-constructions     | heritage-grandeur, service-direct       |
| **Coluna + arco**                 | texto em 7 colunas, imagem em arco nas 5 restantes, desalinhada para baixo                                           | Aurelia (I Estate)               | heritage-grandeur, organic-naturalist   |
| **Pares desiguais deslocados**    | duas imagens de tamanhos diferentes, uma mais baixa que a outra, numa grade de 10–12 colunas                         | explora-journal                  | broadsheet-editorial, quiet-luxury      |
| **Faixa de cor inteira**          | de tempos em tempos uma faixa de cor chapada (areia, oliva) com texto e foto, para quebrar o ritmo                   | explora-journal                  | broadsheet-editorial, warm-hospitality  |
| **Grade à mostra**                | colunas e margens desenhadas (tracejado, fios), o próprio grid vira ornamento                                        | a-lign-studio                    | experimental-grid, broadsheet-editorial |
| **Dossiê**                        | ficha com datas, nomes e fotos de arquivo recortadas; capitular + lista de fatos                                     | mosbys-files                     | broadsheet-editorial, heritage-grandeur |
| **Linha de fatos**                | 3 números grandes (48 / 212 / 1789) com rótulo em versalete, separados por fios                                      | Aurelia, haven-constructions     | heritage-grandeur, service-direct       |
| **Grandeza pela escala**          | marfim, tinta quase preta, um serif e **um** gesto enorme (título em script de 128 px ou marca-d'água de ~150 px)    | royal-savoy, castello-del-sole   |
| **Sinal de herança como sistema** | um elemento real da casa (brasão, recorte do toldo, arco art déco) vira borda, selo e moldura do rodapé, numa cor só | grand-hotel-miramare, era-estate |
| **Fatos práticos no topo**        | datas de fechamento e reabertura da temporada, o que acontece nesta estação, logo abaixo do herói                    | castello-del-sole, royal-savoy   |

## Narrativa

1. **Capítulos numerados.** Numeral (romano itálico ou 01–05) + fio que se desenha + título
   com uma palavra em itálico. O leitor sabe onde está e quanto falta (Aurelia).
2. **Noite e dia.** Capítulos escuros e claros alternam; o escuro guarda as cenas
   (suítes, galeria), o claro guarda leitura e decisão (introdução, reserva) (Aurelia).
3. **Painéis presos em sequência.** Seções de tela cheia que se empilham com `sticky`
   (joshuas-magazine); boa para revista, pesada para serviço.
4. **"Próximo →" no fim.** Cada página termina levando à seguinte, sem beco sem saída
   (mosbys-files).
5. **Uma promessa, depois a prova.** Primeira dobra promete (lugar, ano, o que é); o primeiro
   capítulo prova com fatos do dono, não com adjetivos.
6. **A história de fundação como prova.** Um manifesto curto em caixa-alta com o ano e a
   família, uma foto de arquivo ou um bilhete assinado do dono. Sem superlativos
   (grand-hotel-miramare, velaa). Só com fatos do dono (regra 8).
7. **A decisão por último, mas sempre a um toque.** A reserva é o capítulo final e também o
   botão fixo no topo (Aurelia, explora-journal).

## Componentes

| Componente                          | Comportamento                                                                                                         | Fonte                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Acordeão de arcos**               | 4 arcos; o escolhido se abre (flex 4,2), os outros viram faixa com o nome na vertical; mouse, foco, clique            | Aurelia (suítes)               |
| **Foto presa por capítulo**         | foto em arco presa à esquerda troca quando o capítulo da direita chega ao meio                                        | Aurelia (experiências)         |
| **Enfilada**                        | galeria horizontal presa à rolagem, arcos e quadros alternados, linha de progresso                                    | Aurelia (galeria)              |
| **Lightbox nativo**                 | `<dialog>` com setas, Esc, botão "Close", legenda e crédito                                                           | Aurelia                        |
| **Reserva em passos**               | 3 passos curtos com indicador, validação por passo, confirmação em `role="status"`                                    | Aurelia                        |
| **Barra de categorias presa**       | ao rolar, a barra de categorias substitui o cabeçalho                                                                 | explora-journal                |
| **Doca fixa pequena**               | ação principal num botão pequeno fixo no canto                                                                        | a-lign-studio                  |
| **Rótulo de fato**                  | versalete 10–11 px sobre o título: "02 · FROM €1,450 A NIGHT", "THE DESTINATIONS • 7 MIN READ"                        | Aurelia, explora-journal       |
| **Reserva que pergunta a intenção** | um único botão "Book" abre um painel: estadia, mesa, spa, experiências, vale-presente; telefone e e-mail sempre junto | royal-savoy, castello-del-sole |
| **Vantagens de reservar direto**    | as vantagens que o dono oferece (só as reais) dentro do painel de reserva, ao lado de datas e hóspedes                | grand-hotel-miramare           |

## Interação

- **Hover que informa:** o arco abre e mostra preço e tamanho; nunca hover só decorativo.
- **Foco igual ao hover:** tudo que abre com mouse abre com Tab.
- **Cursor próprio só como rótulo** ("View", "Open") sobre elementos marcados, com ponteiro
  fino; o cursor do sistema continua visível.
- **Botão de reservar sóbrio:** cor chapada, texto em versalete, sem brilho nem pulsar
  (explora-journal mantém "Reserve" + telefone no topo; no celular, ícone de telefone).
- **Reservar visível no celular:** botão no cabeçalho ou botão flutuante de ligar. A velaa
  esconde "Book" dentro do menu: não copiar.
- **Pré-carregador, pop-up de promoção e muro de consentimento sobre o herói, nunca.** O h1
  da royal-savoy só aparece depois de 7,4 s; o aviso de cookies cobre 30–100% da primeira tela
  do celular na grand-hotel-miramare e na castello-del-sole.
- **Pop-up no meio da leitura, nunca** (o modal de newsletter da joshuas-magazine cobre a
  página no meio da rolagem).

Movimento de cada padrão: `motion.md`. Acessibilidade: `accessibility-performance.md`.
