# Conformidade nos EUA: checklist do fundador

> **Isto não é aconselhamento jurídico.** É um roteiro do que o produto já faz e do que falta.
> Antes de lançar, **um advogado americano precisa revisar os Termos, a Política de Privacidade e
> os textos de consentimento abaixo**. Leis e regras das operadoras mudam; confira a versão atual.

## Resumo do que o produto faz hoje

| Tema | Estado |
| --- | --- |
| SMS (lembretes) | Só consentimento + lista para o dono mandar do próprio celular. **Envio automático NÃO existe.** |
| E-mail de marketing | CAN-SPAM tratado (link de saída, `List-Unsubscribe`, endereço postal). |
| Pagamentos dos clientes dos donos | Só **informativo** (formas aceitas e usuário público). Nada é cobrado nem guardado. |
| Preços e promoções nos sites | Só o que o dono escreveu (regra 8 do CLAUDE.md). |
| Acessibilidade | Meta WCAG 2.1 AA (alvos de 44 px, contraste, foco, rótulos). |

## 1. SMS (TCPA e regras da CTIA)

**O que existe (migration 0039):**

- O dono liga "Text reminders" (padrão **desligado**) no assistente (passo "Rules") ou em
  `/office/booking`. Só então o formulário de marcação mostra a caixa.
- A caixa é **opcional, nunca vem marcada e nunca é condição para marcar**.
- O aviso mostrado está em `smsConsentText` (`packages/schema/src/booking.ts`): nome da empresa,
  "Message frequency varies", "Message and data rates may apply", "Reply STOP to opt out or HELP
  for help", "Consent is not a condition of booking" e o link da Política de Privacidade.
- O servidor guarda, na marcação, a **data** (`sms_consent_at`) e o **texto exato** (`sms_consent_text`),
  montado por ele (o navegador não consegue forjar). Isso é a prova do consentimento.
- A agenda (`/schedule`) mostra "Text reminders": clientes de **amanhã**, com consentimento, que não
  responderam STOP. Cada linha abre o app de mensagens do **celular do dono** com o texto pronto.
- **STOP:** o dono toca em "They replied STOP". O cliente fica com `sms_opt_out` (com data), aparece
  com selo na ficha e **nunca mais** entra na lista (nem por outro cadastro com o mesmo telefone).
  Se o mesmo telefone marcar de novo, o consentimento é registrado, mas o bloqueio continua.
- **Horário de silêncio:** o botão só funciona entre **8:00 AM e 9:00 PM** no fuso da empresa
  (a regra da TCPA é no fuso de quem recebe; assumimos que cliente e empresa estão no mesmo fuso).

**O que NÃO existe e por quê:**

- **Envio automático de SMS não foi construído.** Precisa de um provedor (Twilio, Telnyx etc.) e do
  **registro A2P 10DLC** (marca + campanha) nas operadoras. Esse registro exige uma **empresa
  constituída com EIN**, e a aprovação leva **semanas**. Sem isso, mensagens de apps para números
  comuns são bloqueadas.
- O desenho já deixa o caminho aberto: as regras (quem entra, silêncio, texto, STOP) estão em
  `apps/web/app/(dashboard)/schedule/sms-reminders.ts` e podem ser usadas por um envio automático.
  Quando houver provedor: tratar **STOP/HELP** nos webhooks do provedor, guardar o consentimento
  por campanha e mandar **só mensagens transacionais** (lembrete de horário, confirmação).
- **Nunca** usar esses números para propaganda sem um consentimento de marketing separado e
  escrito para isso.

**Checklist antes de ligar SMS automático:** empresa + EIN → registrar marca e campanha 10DLC →
página pública com o texto de consentimento e a política → STOP/HELP respondidos automaticamente →
guardar prova de consentimento (já guardamos) → horário de silêncio por fuso do destinatário.

## 2. E-mail (CAN-SPAM)

Já tratado nos e-mails de marketing: link de saída (`/unsubscribe`, assinado), cabeçalho
`List-Unsubscribe` de um clique, endereço postal (`MARKETING_POSTAL_ADDRESS`; sem ele não envia),
remetente e assunto verdadeiros. E-mails de confirmação de marcação e de resposta ao cliente são
transacionais. Conferir: o endereço postal real configurado em produção e o atendimento aos pedidos
de saída em até 10 dias úteis.

## 3. Preços e promoções (FTC)

- Os sites só mostram preços e ofertas que **o dono escreveu**. Nada de "from", "popular", estrelas,
  notas, "same-day" ou garantias inventados (regra 8).
- A oferta de lançamento: só o Starter tem preço normal riscado (US$ 39). Isso só é honesto se o
  preço normal for **de fato cobrado depois** da promoção (a decisão do fundador diz: depois de ~10
  clientes). Se isso mudar, tirar o preço riscado. Mostrar o preço **total** e a renovação antes da
  cobrança; deixar clara a forma de cancelar.
- Avaliações: o site só tem o link "Review us on Google" (sem notas nem estrelas). Não pedir
  avaliações só de clientes satisfeitos ("review gating") e não pagar por avaliações positivas.

## 4. Privacidade (CCPA/CPRA e básico)

- Política de Privacidade publicada, com: o que coletamos (conta, sites, pedidos do formulário,
  marcações, telefone/e-mail do cliente do dono), para quê, com quem dividimos (Supabase, Vercel,
  Resend, Stripe, provedores de IA) e como pedir acesso/exclusão.
- Os donos são os responsáveis pelos dados dos **clientes deles**; nós somos processadores. Os
  Termos devem dizer isso (um acordo de processamento de dados simples ajuda).
- Pedidos de acesso/exclusão: ter um e-mail e um prazo (45 dias na Califórnia).
- **"Do not sell or share":** não vendemos dados. Se um dia entrar publicidade ou rastreadores de
  terceiros, passa a valer o aviso e o botão de recusa.
- **Cookies:** hoje só os necessários (sessão, `ns_guest`, "ver como"). O `VisitBeacon` não guarda
  IP nem cookie do visitante. Se entrar analytics com cookie, avisar e pedir consentimento onde a
  lei exigir.
- Menores: o cadastro exige 18+. Não coletamos dados de menores de 13 (COPPA).

## 5. Acessibilidade (ADA / WCAG 2.1 AA)

Sites e painel seguem WCAG 2.1 AA como meta: contraste 4,5:1 (a cor principal é ajustada), foco
visível, alvos de toque de 44 px, rótulos em todos os campos, erros ligados aos campos
(`aria-describedby`), conteúdo sempre visível (sem revelar só por rolagem), `prefers-reduced-motion`.
Uma **declaração de acessibilidade** e um canal de contato ajudam. Auditar com leitor de tela
(VoiceOver/TalkBack) antes do lançamento.

## 6. Pagamentos (PCI)

- "How customers pay" é **só informativo**: o dono escolhe as formas que aceita (dinheiro, cartão,
  cheque, Zelle, Venmo, Cash App, PayPal) e, para algumas, um usuário público.
- **Nenhum número de cartão ou conta é coletado, guardado ou mostrado.** O schema recusa
  sequências longas de dígitos e as palavras "routing/account number" (`looksLikeAccountNumber`).
  Por isso o **escopo PCI é zero** para esse recurso.
- A cobrança do **plano da No Sweat** é pelo Stripe Checkout (página do Stripe): nós também não
  vemos cartões.
- Não há Stripe Connect nem pagamento online para o dono ainda. Quando houver, vai exigir a conta
  da empresa, KYC e novos Termos.
- Avisar o dono (Termos) que ele é responsável por receber e declarar o que cobra dos clientes dele.

## 7. Antes do lançamento

- [ ] Um **advogado americano** revisa Termos de Uso, Política de Privacidade, o texto de
      consentimento de SMS (`smsConsentText`) e a política de cancelamento sugerida.
- [ ] Constituir a empresa e obter o **EIN** (necessário para o 10DLC e o Stripe Connect).
- [ ] Conferir o endereço postal dos e-mails e o canal de pedidos de privacidade.
- [ ] Conferir as ofertas e preços riscados com a regra de "preço normal" da FTC.
- [ ] Auditoria de acessibilidade com leitor de tela.
- [ ] Rodar a migration `0039_sms_consent.sql` antes de publicar a versão com a caixa de SMS.
