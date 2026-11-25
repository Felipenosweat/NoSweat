-- Bônus da oferta (créditos extras no primeiro pagamento): no máximo UM por conta, mesmo com dois
-- eventos do Stripe chegando juntos. Ver apps/web/server/credits/offer-bonus.ts.
create unique index if not exists credit_ledger_one_offer_bonus
  on public.credit_ledger (user_id)
  where reason = 'topup' and (meta ->> 'kind') = 'offer_bonus';
