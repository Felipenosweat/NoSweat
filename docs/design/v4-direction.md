# V4 — Direção de design do site da No Sweat ("Ordem de serviço")

Data: 2026-10-13. Escopo: **site de marketing** (landing `/`, `/pricing`, header e rodapé). O app
(criar, editor, painel) já foi redesenhado na V3 e só herda os tokens. Fonte das regras:
`.claude/skills/premium-web-design/`.

## 1. Briefing preenchido

| Campo                     | No Sweat                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Produto                   | No Sweat (nosweatfd.com)                                                                                                                                                                                                                    |
| Em uma frase              | O dono descreve o negócio numa frase e recebe um site completo do seu ramo, que ele muda pedindo à IA e publica num endereço grátis ou no próprio domínio.                                                                                  |
| Público                   | Donos de pequenos negócios locais nos EUA (encanador, limpeza, salão, restaurante…), ocupados e não técnicos; muitos imigrantes (inclusive brasileiros), com inglês como segunda língua.                                                    |
| Problema → resultado      | Não têm tempo nem conhecimento para fazer um site, e perdem ligações e pedidos de orçamento → site no ar no mesmo dia, que recebe ligações e pedidos pelo formulário.                                                                       |
| Fluxos essenciais (ordem) | 1) Descrever o negócio e ver o site pronto (`/create`). 2) Mudar o site pedindo à IA ou editando (`/sites/[id]/edit`). 3) Publicar e receber pedidos (`/sites/[id]`, endereço grátis ou domínio).                                           |
| Escopo                    | Redesign do site de marketing (decisão do fundador: "reformule o nosso site"). Os fluxos do app já existem e funcionam.                                                                                                                     |
| Modelo e integrações      | Starter $39/mês, Pro $69, Premium $129; anual = 10× o mensal; setup de $249 no mensal. Supabase (auth/banco), Vercel (hospedagem/domínios), Anthropic (IA), Resend (e-mail), Turnstile (captcha). Stripe ainda não ligado (nada é cobrado). |
| Personalidade e visual    | "Um vizinho capaz, não uma máquina de hype." Profissional, americano, claro, sem cara de IA. Paleta Tech Blue aprovada e fixa: #0066FF, #071B33, #F8FAFC, #00C2FF. Fontes: Plus Jakarta Sans + Inter. Fotos reais no próprio site.          |
| Ativos e restrições       | Logo "N" em fita dobrada com brilho (`docs/brand/`). Fotos licenciadas (`components/photos.ts`, créditos em `/credits`). 4 sites de exemplo fictícios (rotulados). Regra 8: nada de prova inventada.                                        |
| Restrições técnicas       | Next.js 16 + React 19 + Tailwind v4, Vercel, sem dependências novas sem necessidade, sem fontes novas (regra B6).                                                                                                                           |
| Idioma da interface       | **Inglês americano** (o público está nos EUA; regra 7 do CLAUDE.md prevalece sobre o padrão do prompt).                                                                                                                                     |
| Idioma dos relatórios     | Português do Brasil.                                                                                                                                                                                                                        |

## 2. Pesquisa de referências

**Limite do ambiente:** o awwwards.com é bloqueado aqui (o proxy recusa a conexão), então o
Awwwards **não foi aberto**. Os prêmios abaixo só contam quando um resultado de busca diz isso
explicitamente. Os sites foram **abertos de verdade** num Chromium (1440×900 e 390×844, rolagem
em 6 passos, hover em um CTA). Capturas: `.design-shots/v4-refs/` (fora do Git).

| Site (URL verificada)                                                | Prêmio                                                                          | O que foi visto                                                                                               | Princípio                                                                    | Aplicação na No Sweat                                                         | Evitar                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Mercury — https://mercury.com/                                       | não verificado                                                                  | Hero com campo de e-mail + "Open account" e "Launch demo"; depois menu lateral fixo ao lado de uma tela real. | A ação principal mora no primeiro viewport; produto real ao lado dos passos. | O campo "descreva seu negócio" no hero; passos fixos ao lado das telas reais. | Mudar de claro para escuro no meio; rodapé jurídico enorme.   |
| Attio — https://attio.com/                                           | não verificado                                                                  | Janela do app com um prompt se digitando; menu de passos fixo que acende o passo atual; no celular vira abas. | Mostrar a IA trabalhando dentro do produto, não ilustrações.                 | A frase do dono vira o site, com o que foi digitado ligado ao resultado.      | Qualquer coisa por cima da demo (o cookie deles cobria tudo). |
| Averi AI — https://www.averi.ai/                                     | "Honorable Mention" só num resultado de busca, não confirmado                   | Nav em pílula; linha do tempo de 4 passos; faixas escuras arredondadas; CTA fixo no header do celular.        | Ritmo: passos curtos e um contraste escuro por página.                       | Uma faixa escura só (exemplos); CTA sempre alcançável no celular.             | Ícones dentro do título; hover cinza que parece desativado.   |
| Epiminds — https://epiminds.com/                                     | Honorable Mention (resultado de busca: awwwards.com/websites/%23946CE9/?page=2) | Pedido em balão → resposta "On it!" → chip "Task Updated ✓".                                                  | A IA como conversa com resultado concreto.                                   | "Add Saturday hours" → "Done: hours added to your footer and contact."        | Rolagem sequestrada; texto pequeno e claro demais.            |
| Coffee Collective (categoria vizinha) — https://coffeecollective.dk/ | não verificado                                                                  | Marca local: blocos de cor sólida em creme, faixa de fotos reais das lojas por bairro.                        | Comércio local se mostra por lugares e pessoas reais, com legenda.           | Fotos documentais com legenda de ofício; exemplos rotulados por cidade.       | Pop-up cobrindo a página; nav minúscula em caixa alta.        |

Padrões vistos em mais de um site: ação no 1º viewport + "ver demo"; passos fixos ao lado do
produto (abas no celular); IA como conversa. Antipadrões vistos: sobreposições na demo, rolagem
sequestrada, texto pequeno de baixo contraste.

## 3. Três direções

1. **"Ordem de serviço" (escolhida).** Linguagem de ficha de trabalho: papel branco, linhas finas
   (`slate-200`), campos numerados, tudo alinhado numa grade de 12 colunas. Tipografia: Jakarta
   600–700 apertada nos títulos, Inter no texto, números tabulares nos rótulos. Imagem: telas
   reais e fotos de ofício com legenda. Interação: precisa, explicativa (pinos numerados que
   acendem). Combina com o público de ofícios e com a promessa "a gente cuida do serviço".
2. **"Main Street".** Editorial de revista: fotos grandes sangradas, serifada no destaque, muito
   branco. Calorosa, mas depende de fotos de banco (o fundador não gostou das imagens) e mostra
   pouco o produto.
3. **"Turno da noite".** Fundo `ink`, interface flutuando com brilho ciano, cara de SaaS de dev.
   Impressiona à primeira vista, mas é o visual mais genérico de "produto de IA", cansa em telas
   longas e conversa mal com um encanador de 50 anos.

**Por que a 1:** é a única em que a forma explica o produto. O dono entende em segundos que a
frase dele vira o site, e o visual de "ficha bem preenchida" passa competência sem hype.

## 4. A direção

- **Impressão:** "Essa gente faz o serviço direito." Calma, precisa, prática, americana.
- **Ideia-assinatura:** a **Ordem de serviço**. No hero, a frase que o dono digitaria aparece
  numa ficha com trechos numerados (nome, o que faz, cidade, oferta, telefone). Do lado, o site
  gerado tem pinos com os mesmos números, onde cada trecho foi parar. Passar o mouse ou focar um
  trecho acende o lugar no site. Abas trocam entre 4 ofícios (encanador, limpeza, salão,
  restaurante). No celular, a captura do celular e uma legenda numerada.
- **Hierarquia:** 1) título + campo real ("Build my website"); 2) a ordem de serviço (prova de
  como funciona); 3) passos com telas reais; 4) IA como conversa; 5) exemplos; 6) preço com
  regras de renovação; 7) dúvidas; 8) CTA final.
- **Linguagem comum site + app:** os mesmos tokens (cores, raios 8/12 px, sombra de moldura,
  linhas `slate-200`, easing), o mesmo botão primário e o mesmo foco visível.
- **Expressivo × uso diário:** o expressivo fica no hero e nos exemplos; preço, FAQ e formulários
  são sóbrios e densos, como uma ferramenta.

## 5. Sistema (tokens)

- **Tipo:** h1 `clamp(2.625rem, 5.2vw, 4.5rem)`/1.02/-0.035em; h2 1.875→2.75rem/1.08/-0.03em;
  corpo 16–17px/1.65, máx. 65ch; rótulos 13px, números tabulares.
- **Cores:** as 5 da marca + `slate` (texto 600, secundário 500, linhas 200). Azul só para ação.
- **Espaço:** ritmo de 8 px; seções 80/112/160 px; container 1200 px; grade de 12 colunas.
- **Bordas e raios:** 1 px `slate-200`; 8 px (controles), 12 px (cartões/molduras). Pinos 999 px.
- **Elevação:** uma sombra de moldura (`frameShadow`), nada de vidro.
- **Movimento:** 150–250 ms na interface, 400–600 ms nas revelações, `cubic-bezier(.2,.8,.2,1)`;
  tudo desligado com `prefers-reduced-motion`.
- **Ícones:** a mesma família de traço 1.5 (Heroicons outline) já usada.

## 6. Caminho mais curto até o resultado

Landing → digita a frase no hero → `/create` já preenchido → 3 passos curtos → "Your site is
ready" → editor → Publish → link no ar. Cada tela da landing responde a uma dúvida desse caminho:
"o que eu digito?" (hero), "vai sair do meu jeito?" (ordem de serviço e exemplos), "e se eu quiser
mudar?" (IA como conversa), "quanto custa e como cancelo?" (preço com renovação), "e se eu travar?"
(gente responde e-mail).

## 7. Critérios de aceite (verificados em 2026-10-13)

Condições: build de produção local (`next start`), Chromium 1440×900, 768×1024, 390×844 e 320×640.

- [x] O hero tem o campo real que leva ao `/create` preenchido: digitado "Family-owned landscaping
      in Tampa…" → `/create?brief=…` com o texto no campo; Voltar do navegador volta à landing.
- [x] Ordem de serviço com mouse, toque e teclado: Tab chega às abas; setas, Home e End trocam de aba;
      Tab entra na lista e Enter fixa o destaque (`aria-pressed`). Sem transições com movimento reduzido.
- [x] Pinos no lugar certo: coordenadas medidas no navegador (script em `components/marketing/work-orders.ts`)
      e conferidas nas capturas das 4 abas em 1440 e 390. Teste `work-orders.test.ts` garante que nome,
      telefone, título e botão batem com as fixtures.
- [x] Nenhuma prova inventada; todo exemplo rotulado como fictício.
- [x] Sem rolagem horizontal em 390, 768, 1440 e 320 px (landing, preço, termos, cadastro, descadastro,
      exemplos). Zoom de texto 200%: 0 px em 1440; em 390 sobram até 45 px em alguns trechos (conteúdo
      continua acessível rolando). O teste de refluxo de 320 px (WCAG 1.4.10) passa em todas as páginas.
- [x] axe-core 4.10 (WCAG 2.0/2.1/2.2 A e AA + boas práticas): 0 violações na landing, `/pricing`,
      `/credits`, `/terms`, `/privacy`, `/unsubscribe`. Nas páginas de exemplo sobram 2–3 avisos
      "moderate" de região (o link "Skip to content" e a faixa do topo do template fora de landmarks).
      Revisão manual: foco visível em todos os controles da landing; campo do hero ganhou anel de foco.
- [x] Sem erros no console. As únicas requisições com falha são prefetches cancelados ao fechar o navegador de teste.
- [x] Desempenho (local, não é dado de campo): computador sem limitação LCP ≈ 0,15 s, CLS 0;
      celular simulado (1,6 Mbps, 150 ms de latência, CPU 4× mais lenta) LCP ≈ 1,2 s, CLS 0;
      ~340–370 KB transferidos no carregamento inicial.
- [x] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` passam.

## 8. Crítica de design (depois da 1ª versão) e o que mudou

1. O "How it works" repetia a promessa do hero ("From a sentence to a live site") → virou
   "What happens after you hit Build." e os números dos passos viraram os mesmos pinos da ficha.
2. No celular a captura ficava longe da ficha (a relação se perdia) → captura primeiro, ficha embaixo.
3. Pinos cobriam o texto ou se encostavam → posição por regra (margem esquerda no computador,
   direita no celular; o do nome sempre à direita do logo).
4. Ao trocar de aba a moldura aparecia vazia com pinos flutuando → pinos só depois da imagem
   carregar, fundo reservado e pré-carregamento das outras abas.
5. A faixa "Built with No Sweat" virou redundante com as abas do hero → removida.
