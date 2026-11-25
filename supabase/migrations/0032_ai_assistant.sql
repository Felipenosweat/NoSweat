-- Atendente de IA no site publicado (plano Premium): responde os visitantes 24 horas e é pago
-- com os créditos do DONO (1 por conversa, +1 a cada 10 mensagens do visitante depois das 10
-- primeiras; apps/web/server/assistant). Nada do visitante é guardado além do que ele digitou:
-- sem IP, sem cookie, sem user agent.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

-- Liga/desliga por site (padrão: desligado; sem linha = desligado).
create table if not exists public.site_assistants (
  site_id     uuid primary key references public.sites (id) on delete cascade,
  enabled     boolean not null default false,
  updated_at  timestamptz not null default now()
);

alter table public.site_assistants enable row level security;

-- Uma linha por conversa. O id (uuid aleatório) só vale junto com o site: toda leitura e escrita
-- filtra por (id, site_id).
create table if not exists public.assistant_conversations (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null references public.sites (id) on delete cascade,
  owner_id          uuid not null references auth.users (id) on delete cascade,
  created_at        timestamptz not null default now(),
  last_message_at   timestamptz not null default now(),
  visitor_messages  int not null default 0 check (visitor_messages >= 0 and visitor_messages <= 100),
  credits_charged   int not null default 0 check (credits_charged >= 0),
  -- Primeira mensagem do visitante (lista do painel), cortada em 200 caracteres.
  preview           text check (preview is null or char_length(preview) <= 200),
  -- Pedido de contato salvo pelo atendente (mesma tabela do formulário do site).
  lead_id           uuid references public.leads (id) on delete set null
);

create index if not exists assistant_conversations_site_created_idx
  on public.assistant_conversations (site_id, created_at desc);

alter table public.assistant_conversations enable row level security;

create table if not exists public.assistant_messages (
  id               bigint generated always as identity primary key,
  conversation_id  uuid not null references public.assistant_conversations (id) on delete cascade,
  role             text not null check (role in ('visitor', 'assistant')),
  text             text not null check (char_length(text) between 1 and 2000),
  created_at       timestamptz not null default now()
);

create index if not exists assistant_messages_conversation_idx
  on public.assistant_messages (conversation_id, id);

alter table public.assistant_messages enable row level security;

-- Mensagem do visitante, numa ida só ao banco e sem corrida: soma 1 na contagem (só se a
-- conversa é deste site e ainda não chegou em p_max) e grava o texto. Devolve a nova contagem,
-- ou null (conversa de outro site/inexistente, ou limite atingido).
create or replace function public.assistant_add_visitor_message(
  p_conversation uuid,
  p_site uuid,
  p_text text,
  p_max int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.assistant_conversations c
     set visitor_messages = c.visitor_messages + 1,
         last_message_at = now(),
         preview = coalesce(c.preview, left(p_text, 200))
   where c.id = p_conversation
     and c.site_id = p_site
     and c.visitor_messages < p_max
  returning c.visitor_messages into v_count;
  if v_count is null then
    return null;
  end if;
  insert into public.assistant_messages (conversation_id, role, text)
  values (p_conversation, 'visitor', p_text);
  return v_count;
end;
$$;

-- Marca a conversa como paga até `p_needed` créditos, sem corrida: devolve quantos créditos
-- ESTE pedido precisa cobrar (0 se outro pedido já cobrou).
create or replace function public.assistant_claim_charge(p_conversation uuid, p_needed int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before int;
begin
  select c.credits_charged into v_before
    from public.assistant_conversations c
   where c.id = p_conversation
   for update;
  if v_before is null or v_before >= p_needed then
    return 0;
  end if;
  update public.assistant_conversations
     set credits_charged = p_needed
   where id = p_conversation;
  return p_needed - v_before;
end;
$$;

-- Desfaz uma cobrança (sem saldo ou a IA falhou): tira `p_credits` da conta da conversa.
create or replace function public.assistant_release_charge(p_conversation uuid, p_credits int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.assistant_conversations
     set credits_charged = greatest(0, credits_charged - p_credits)
   where id = p_conversation;
$$;

revoke all on function public.assistant_add_visitor_message(uuid, uuid, text, int)
  from public, anon, authenticated;
revoke all on function public.assistant_claim_charge(uuid, int) from public, anon, authenticated;
revoke all on function public.assistant_release_charge(uuid, int) from public, anon, authenticated;
grant execute on function public.assistant_add_visitor_message(uuid, uuid, text, int) to service_role;
grant execute on function public.assistant_claim_charge(uuid, int) to service_role;
grant execute on function public.assistant_release_charge(uuid, int) to service_role;

-- Novo tipo de uso da IA (custo estimado do /admin). A 0015 não é editada: troca só o check.
alter table public.ai_usage drop constraint if exists ai_usage_kind_check;
alter table public.ai_usage
  add constraint ai_usage_kind_check
  check (kind in ('generate', 'ai_edit', 'social_plan', 'social_caption', 'assistant_chat'));
