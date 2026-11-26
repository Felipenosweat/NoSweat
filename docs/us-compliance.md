# Conformidade nos EUA

Notas do time, não é aconselhamento jurídico. Um advogado dos EUA precisa revisar os textos
antes do lançamento pago.

## Renovação automática

Leis de renovação automática (por exemplo a ARL da Califórnia e leis parecidas em outros estados)
e a regra "click to cancel" da FTC pedem: dizer com clareza, antes de cobrar, que o plano renova
sozinho, com valor e período; deixar cancelar online com a mesma facilidade com que se assinou;
e, para planos com período anual, lembrar o cliente de 3 a 21 dias antes de renovar.

O que o app faz:

- **Antes de pagar**: a landing e `/pricing` (`PricingPlans.tsx`, `renewalTerms`) mostram embaixo
  de cada plano o valor, o período e como cancelar. A página `/billing` e o popup de planos do
  `/create` têm a frase "Plans renew automatically each month or year until you cancel. Cancel
  anytime in Billing." O Stripe Checkout mostra ao lado do botão de pagar o texto do período
  comprado (`custom_text[submit][message]`, `checkoutRenewalMessage` em `server/billing/index.ts`,
  valor vindo de `plans.ts`, que no momento da compra é o preço cobrado).
- **Cancelar**: `/billing` tem o botão "Manage or cancel your plan" (portal do Stripe). O plano
  continua até o fim do período já pago.
- **Aviso de renovação anual** (`server/billing/renewal-notice.ts`, migration 0040
  `subscriptions.renewal_notice_for`): dentro do cron diário `/api/cron/cleanup-guests`, assinatura
  Stripe `active`, anual e sem `cancelAtPeriodEnd` recebe UM e-mail quando faltam de 7 a 3 dias
  para renovar (se o cron falhar um dia, ainda sai; nunca depois de 3 dias antes). A marca é
  gravada ANTES do envio e guarda o fim do período avisado, então um período novo avisa de novo. O
  valor é lido do Stripe (preço do item da assinatura, ou a prévia da próxima fatura quando há
  cupom), nunca de `plans.ts`: quem assinou com preço antigo vê o preço que vai pagar. Sem o
  valor, nada é enviado e tenta de novo no dia seguinte (conta como falha no resumo do cron).
- **Planos mensais**: nenhum aviso é exigido por lei e o app não manda (o Stripe manda os recibos).
- **Acesso manual (Pix/WhatsApp)**: não renova sozinho; já tem os e-mails de 7 dias, 1 dia e
  encerrado (`server/billing/reminders.ts`).

Pendência (não feito): e-mail de "pagamento falhou" no webhook `invoice.payment_failed`, com
uma vez por fatura. Precisa de uma tabela de deduplicação por id da fatura; enquanto isso, o
Stripe manda esse e-mail se estiver ligado (abaixo) e `/billing` mostra o aviso de `past_due`.

## Checklist do fundador

- [ ] Stripe Dashboard, Settings, Customer emails: ligar recibos (successful payments), pagamentos
      falhos e "upcoming renewal" (aviso de renovação). Se ligar o aviso do Stripe, o e-mail do
      app para o anual fica duplicado: escolha um dos dois.
- [ ] Stripe Dashboard, Settings, Billing, Customer portal: salvar, com cancelamento ligado
      (DEPLOY.md).
- [ ] Manter `/terms#renewal` dizendo que os planos renovam automaticamente, o valor e o período,
      e como cancelar.
- [ ] Rodar a migration 0040 antes de subir esta versão.
- [ ] Um advogado dos EUA revisar os textos (Terms, frases ao lado dos botões, texto do Checkout e
      o e-mail de renovação).
