-- Aviso de renovação anual (leis de renovação automática dos EUA): guarda o fim do período que
-- já foi avisado por e-mail. Gravado ANTES do envio; um período novo (data diferente) volta a
-- avisar. Nulo = nunca avisado.

alter table public.subscriptions
  add column if not exists renewal_notice_for timestamptz;
