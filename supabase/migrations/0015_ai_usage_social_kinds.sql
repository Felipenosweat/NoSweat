-- Novos tipos de uso da IA no módulo de redes sociais: montar o mês (social_plan) e escrever
-- legendas (social_caption). A migration 0007 não é editada: troca só a regra (check).

alter table public.ai_usage drop constraint if exists ai_usage_kind_check;
alter table public.ai_usage
  add constraint ai_usage_kind_check
  check (kind in ('generate', 'ai_edit', 'social_plan', 'social_caption'));
