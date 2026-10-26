# Rubrica de revisão

Para avaliar uma página antes de mostrar a alguém. Nota de 0 a 4 em cada critério. Para
passar: **nenhum critério abaixo de 2** e **média ≥ 3**. Os critérios marcados com **(trava)**
precisam de 4.

| #   | Critério                   | 0                                     | 2                                         | 4                                                                 |
| --- | -------------------------- | ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| 1   | Ideia                      | não dá para dizer em uma frase        | ideia clara, execução genérica            | uma ideia que só serve a este negócio, visível na primeira dobra  |
| 2   | Primeira dobra             | qualquer site poderia ter             | bonita mas esquecível                     | dá vontade de mostrar para alguém                                 |
| 3   | Hierarquia                 | tudo do mesmo tamanho                 | um foco por tela na maior parte           | um foco por tela, sempre; o olho sabe onde ir                     |
| 4   | Tipografia                 | fonte padrão, entrelinha frouxa       | par bom, escala com alguns saltos errados | escala com propósito, medida 60–75, detalhes (versalete, números) |
| 5   | Ritmo                      | mesma seção repetida                  | alterna, mas espaçamento carimbado        | cada seção com forma e espaço próprios; a página "respira"        |
| 6   | Imagem                     | foto genérica ou sem crédito          | boas fotos, corte automático              | corte e forma deliberados, fotos coerentes entre si               |
| 7   | Movimento                  | atrapalha ou não existe onde ajudaria | correto, sem temperamento                 | um temperamento só, explica a estrutura, nunca atrasa a ação      |
| 8   | Ação principal             | difícil de achar                      | visível no topo                           | a um toque em qualquer ponto, no celular também                   |
| 9   | Celular **(trava)**        | quebra ou rola de lado                | funciona, mas é o computador espremido    | desenhado para o polegar; sem rolagem lateral                     |
| 10  | Acessibilidade **(trava)** | sem foco, contraste ruim              | o básico passa                            | `accessibility-performance.md` inteiro, testado                   |
| 11  | Desempenho                 | trava em máquina fraca                | ok em máquina boa                         | modo leve, imagens certas, sem pulo de layout                     |
| 12  | Honestidade **(trava)**    | prêmio, nota ou depoimento inventado  | —                                         | só fatos do dono; demo e ficção rotuladas; créditos das fotos     |
| 13  | Não repete                 | igual ao último projeto com outra cor | eixos diferentes, mesma sensação          | outro arquétipo ou outra combinação de eixos (`usage-log.json`)   |

## Teste dos 5 segundos (antes da rubrica)

Mostre a primeira dobra por 5 segundos (print) e pergunte: que negócio é? o que eu faço aqui?
parece feito por quem? Se a terceira resposta for "IA" ou "um template", volte ao critério 1.

## Sinais de "cara de IA" (zera o critério 2)

Gradiente roxo-azul, bolhas desfocadas, "Elevate your…", três cartões iguais com ícone, selo
"Trusted by" sem nomes, emoji em título, sombra enorme em tudo. Lista completa em
`.claude/skills/premium-web-design/anti-patterns.md` e `copy-rules.md`.

## Como registrar

No estudo de caso do projeto: a nota de cada critério, o que mudou depois da revisão e o que
ficou conscientemente de fora (ver `aurelia.md`).
