# Checklist de lançamento (atualizado em 19 nov 2026)

Anotações do fundador. Marque conforme for feito.

## Para testar quando der (dono do site)

- [ ] **E-mail de pedido novo (Resend).** Abrir um site publicado (`nosweatfd.com/s/...`), mandar o
      formulário de contato e ver se chega "New request from your website" no e-mail da conta dona
      do site (olhar o spam). Se não chegar: conferir em Resend → Domains se `nosweatfd.com` está
      **Verified**.
- [ ] **Visitas.** Abrir um site publicado em janela anônima e ver o contador em `/sites/<id>`
      ("Results, last 30 days").
- [ ] **Prévia dos prospects.** Em `/admin/prospects`, criar uma prévia, abri-la em janela anônima,
      clicar "Make it yours" e conferir que cai no editor com o mesmo site; a empresa deve aparecer
      como "Claimed".
- [ ] **Painel com a cara do cliente.** "Ver como" de um cliente com site: a cor e o nome da empresa
      aparecem no lugar da marca No Sweat.
- [ ] **Agendamento online.** Business → Booking: ligar, marcar um serviço como "Bookable" com
      duração, publicar e marcar um horário pelo site no celular.

## Variáveis na Vercel (só os nomes; nunca colar valores no chat)

- [x] `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `SALES_EMAIL`, `CRON_SECRET`
- [ ] `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` (webhook em
      `https://nosweatfd.com/api/billing/webhook`: `checkout.session.completed`,
      `customer.subscription.created`, `customer.subscription.updated`,
      `customer.subscription.deleted`)
- [ ] `ALERT_EMAIL` (alertas de erro de produção)
- [ ] Limite de gasto mensal de US$ 100 no painel da Anthropic

## No dia da primeira venda

- [ ] Assinar Vercel Pro e Supabase Pro (cerca de US$ 45 por mês).
- [ ] Ligar o Stripe (acima).

## Metas dos 90 dias

3 clientes pagando em 30 dias, 6 em 60, 10 em 90. No dia 60, com menos de 3 depois de 200
contatos, parar de gastar e rever preço, ramo ou abordagem.
