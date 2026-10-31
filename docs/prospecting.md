# Prospecção: achar clientes, fazer a prévia, mandar a mensagem

Guia do fundador para a aba **Prospects** do painel (`nosweatfd.com/admin/prospects`, só admins).
A ideia: achar pequenas empresas dos EUA **sem site** (ou com um site fraco), montar uma prévia do
site delas na No Sweat e mandar o link. Quem vê o próprio site pronto responde muito mais.

O app **não envia e-mail** nesta versão: ele gera um CSV que você importa numa ferramenta de
e-mail frio (Instantly, Smartlead...). Ligações são feitas por você, uma a uma.

## Passo a passo

1. **Buscar.** Clique em **Find leads**, sem digitar nada: a plataforma sorteia uma cidade dos EUA
   (com 50 mil moradores ou mais) que ainda não foi buscada e traz empresas de **qualquer ramo**
   que têm telefone e **não têm site** (redes e franquias ficam de fora). Cada clique = outra
   cidade. Se quiser algo específico, abra _Search a specific trade or city_ e digite o ramo
   (ex.: `plumber`) e/ou a cidade (`Austin`, `TX`); ramo desconhecido procura a palavra no nome.
   Cada busca grava até 80 empresas e confere o site de cada uma:
   - **No website**: não tem site. Melhor alvo.
   - **Weak site**: sem `https`, não funciona bem no celular (sem _viewport_), página
     "coming soon"/estacionada, quase vazia, ou o "site" é só um Facebook/Yelp.
   - **OK**: tem um site razoável. Normalmente não vale a pena.
   - **Unknown**: o site não abriu.

   O e-mail aparece só se estiver escrito no site da empresa (ou na ficha pública do
   OpenStreetMap). **Nunca adivinhe e-mails** (`info@...`): é spam e queima o domínio.

2. **Filtrar.** Use os filtros (sem site / site fraco, com e-mail, status).
3. **Criar as prévias.** Marque as empresas e clique em **Create preview sites**. Vai uma por vez
   (no máximo 10 por clique, para controlar o custo da IA). Cada prévia é um rascunho na sua
   conta e ganha um link secreto `nosweatfd.com/p/<código>`. A prévia usa **só** o que a fonte
   pública tem (nome, ramo, cidade, telefone, endereço, horário): nada de avaliações, prêmios ou
   garantias inventadas. No topo aparece a faixa "A preview No Sweat made for {business}. It isn't
   live and isn't affiliated with {business} until they say so." e o botão **Make it yours**.
4. **Exportar.** **Export for email tool** baixa o CSV
   `email, business, trade, city, state, preview_url, website_status` (só quem tem e-mail e não
   está como _Do not contact_). Importe na ferramenta e use `{{business}}`, `{{city}}`,
   `{{preview_url}}` nos modelos abaixo. **Call list** (aba ou CSV) lista quem não tem e-mail:
   nome, telefone, cidade e link da prévia.
5. **Acompanhar.** Depois de enviar, marque **Mark contacted**. Quando alguém responde, mude o
   status da linha (Replied / Won / Lost). Pediu para parar? **Do not contact** na hora: a pessoa
   sai das exportações e a prévia dela sai do ar.

## De onde vêm os dados

- **Padrão (grátis): OpenStreetMap**, pela Overpass API. Sem chave e sem custo. Dados ©
  OpenStreetMap contributors, licença ODbL (a atribuição aparece na página). **A cobertura de
  pequenos negócios no OpenStreetMap é incompleta**: espere menos resultados que no Google, poucas
  empresas de limpeza e nenhuma nota/avaliação. Ramos que funcionam: plumber, electrician,
  painter, roofer, HVAC, handyman, landscaping, house cleaning (pouco), auto repair,
  barber/hair, nail salon, restaurant, bakery, cafe. A busca é num raio de 15 km do centro da
  cidade escolhida na lista.
- **Google Places (pago, opcional):** com `GOOGLE_MAPS_API_KEY` na Vercel a busca passa a usar o
  Google (mais completo). Regra do Google: só o `place_id` pode ficar guardado sem prazo; o resto
  é cache de no máximo 30 dias. O app renova sozinho o que passou de 30 dias antes de criar a
  prévia ou exportar.

## Regras (leia antes de mandar o primeiro e-mail)

- **CAN-SPAM** (lei dos EUA para e-mail comercial):
  - remetente verdadeiro (seu nome e a No Sweat, de um domínio que é seu);
  - assunto honesto (nada de "Re:" falso ou "Your order");
  - **endereço postal** da empresa em todo e-mail (use o mesmo `MARKETING_POSTAL_ADDRESS` do app);
  - **descadastro que funciona** (a ferramenta põe o link) e respeitado em até 10 dias úteis.
    Quem pediu para sair: **Do not contact** aqui também.
- **TCPA:** nada de SMS nem ligação automática/robô para essas empresas. Ligação só feita por
  você, discando, em horário comercial.
- **Nada de listas compradas.** Só empresas achadas aqui, com dados públicos.
- **Do not contact é para sempre.** Não reimporte quem pediu para sair.

## Configuração recomendada para e-mail frio

- **Domínio separado para envio** (ex.: `getnosweat.com` ou `nosweathq.com`), redirecionando
  para nosweatfd.com. Nunca mande e-mail frio do `nosweatfd.com` (se ele queimar, os e-mails do
  produto e dos clientes param de chegar).
- **2 a 3 caixas** nesse domínio (ex.: `davi@`, `hello@`), com SPF, DKIM e DMARC configurados.
- **Aquecimento** (_warm-up_) de 2 a 3 semanas antes de enviar (a ferramenta faz isso).
- **30 a 50 e-mails por dia por caixa**, no máximo. Melhor poucos e bons.
- Ferramenta: **Instantly** ou **Smartlead** (importam o CSV, cuidam do aquecimento, do
  descadastro e param a sequência quando a pessoa responde).
- Texto puro, sem imagens, um link só (a prévia). Responda rápido quem responder.

## Sequência de e-mails (inglês)

Variáveis: `{business}`, `{city}`, `{preview_url}`. Assine com seu nome. O rodapé com endereço e
descadastro vem da ferramenta.

### Email 1 (day 0)

**Subject:** I made a website for {business}

> Hi there,
>
> I couldn't find a website for {business}, so I made you one to show what it could look like:
>
> {preview_url}
>
> It's a preview, not live, and only uses what's public (your name, phone and city). If you like
> it, you can make it yours in a few minutes, change anything, and put it on your own domain.
>
> Worth a look?
>
> Davi
> No Sweat, nosweatfd.com

_(Para quem tem site fraco, troque a primeira frase por: "Your current site is hard to use on a
phone, so I made a mobile-friendly version for {business}:")_

### Email 2 (day 3)

**Subject:** Re: I made a website for {business}

> Hi, quick follow-up. The preview for {business} is still here:
>
> {preview_url}
>
> Most people in {city} look up local businesses on their phone. A simple site with a call
> button and your hours helps them pick you. Happy to adjust it for you, no charge to look.
>
> Davi

### Email 3 (day 8)

**Subject:** Should I take down the {business} preview?

> Hi, last note from me. I'll take the preview for {business} down soon unless you want it:
>
> {preview_url}
>
> If now's not the time, no problem. Just reply "no" and I won't email again.
>
> Davi

## Roteiro de ligação (30 segundos, inglês)

> Hi, is this the owner of {business}? This is Davi from No Sweat, I'll be quick.
> I noticed {business} doesn't have a website, so I actually built you a free preview of one.
> Can I email you the link so you can see it? (Se disser sim: peça o e-mail; **não mande
> SMS automático**.)
> It's not live, and it's yours only if you want it. If you like it, it takes a few minutes to put
> online. Does that sound worth a look?
>
> Se disser não: "No problem at all, thanks for your time. I'll make sure we don't call again."
> → marque **Do not contact**.

## Limites desta versão

- Sem envio de e-mail pelo app (de propósito: a ferramenta cuida de aquecimento e descadastro).
- A prévia fica na sua conta (rascunho). "Make it yours" leva a pessoa ao `/create`; passar a
  prévia para a conta do cliente ainda é manual.
- Cada prévia gasta uma geração da IA (aparece no custo do /admin).
