# Pacote da revisão da Meta (Instagram)

Tudo o que a Meta pede para liberar o Instagram a todos os clientes (DEPLOY.md, Passo 7.8), com
os textos prontos em inglês. **Só dá para enviar depois da verificação da empresa** (Business
Verification), que exige uma empresa de verdade com documento oficial.

## 0. Antes de começar

- [ ] Empresa aberta (nome, endereço e documento de registro). O nome que a Meta vê tem que ser
      o mesmo dos Termos e da Privacidade do site.
- [ ] Business Verification concluída (Security Center, no Business Manager). Pode levar mais de
      10 dias; sem ela o botão de enviar a revisão fica travado.
- [ ] Domínio `nosweatfd.com` verificado no Business Manager.
- [ ] Endereços públicos já no ar (conferir que abrem sem login):
  - Privacidade: https://www.nosweatfd.com/privacy
  - Termos: https://www.nosweatfd.com/terms
  - Exclusão de dados: https://www.nosweatfd.com/data-deletion
  - Callback de desautorização: https://www.nosweatfd.com/api/meta/deauthorize
  - Callback de exclusão de dados: https://www.nosweatfd.com/api/meta/data-deletion
- [ ] E-mail de contato do app: hello@nosweatfd.com.
- [ ] Um usuário de teste: conta No Sweat com plano ativo + um Instagram **profissional** de teste.

## 1. Permissões que pedimos

| Permissão | Para quê |
| --- | --- |
| `instagram_business_basic` | Ler o perfil (@, nome, foto) da conta que o dono conecta e, no futuro, as postagens dele para mostrar no site ("our work"). |
| `instagram_business_content_publish` | Publicar no Instagram do dono os posts que ele aprovou, no horário que ele escolheu. |

Não pedimos mensagens, comentários, insights nem nada de outras contas.

## 2. Texto para colar em cada permissão (inglês)

**instagram_business_basic**

> No Sweat helps small businesses in the United States build their website and keep their
> Instagram active. A business owner connects their own Instagram professional account in the
> Social page. We use this permission only to read the account's username, name and profile
> picture, to show which account is connected and to let the owner confirm it is the right one.
> We do not read data from anyone other than the owner who connected the account.

**instagram_business_content_publish**

> After connecting, the owner reviews a monthly content plan. Every post starts as a draft that the
> owner edits and approves one by one. Only approved posts are published, at the date and time the
> owner chose, to the owner's own Instagram account. We never publish anything the owner has not
> approved, and the owner can disconnect at any time, which removes our access and deletes the
> stored token.

## 3. Roteiro do vídeo (em inglês, com legendas)

Um vídeo só, sem cortar a tela da Meta, mostrando a URL `nosweatfd.com` o tempo todo:

1. Entrar na No Sweat com a conta de teste → **Social**.
2. **Connect Instagram** → a tela de permissão da Meta aparecendo inteira → aceitar.
3. Voltar à No Sweat: a conta conectada aparece com o @.
4. Criar um post (ou pedir à IA um rascunho) → mostrar que ele nasce como **Draft**.
5. Editar a legenda → **Approve** → escolher dia e hora.
6. Mostrar o post publicado no Instagram (abrir o perfil de teste).
7. **Disconnect** → mostrar que a conexão sumiu.

## 4. Instruções para quem revisa

> 1. Open https://www.nosweatfd.com/login and sign in with the test account below.
> 2. Go to Social and tap Connect Instagram. Sign in with the test Instagram professional account
>    and accept the permissions.
> 3. Create a post, approve it and choose a time a few minutes ahead. It is published to the test
>    account at that time.
> 4. Tap Disconnect to remove the connection.
>
> Test account: (preencher) / (preencher). Test Instagram: (preencher).

## 5. Perguntas de uso de dados (respostas)

- **Que dados recebemos?** @, nome e foto do perfil; id da conta; um token de acesso.
- **Onde ficam?** No nosso banco (Supabase). O token é guardado **criptografado** (chaves em
  `SOCIAL_TOKEN_KEYS`).
- **Por quanto tempo?** Enquanto a conta estiver conectada. Ao desconectar, o token é apagado.
- **Como o usuário apaga os dados?** Desconectando em Social, ou pela página de exclusão de dados
  (`/data-deletion`). O pedido que a Meta envia ao desautorizar o app também apaga a conexão
  (`/api/meta/deauthorize` e `/api/meta/data-deletion`).
- **Vendemos ou compartilhamos?** Não.

## 6. O que costuma reprovar

- Vídeo que corta a tela de permissão da Meta, ou que não mostra a URL.
- Política de privacidade ou Termos que citam outro nome de empresa ou não falam de Instagram.
- Usuário de teste sem plano ativo (o revisor não consegue chegar ao botão de conectar).
- Pedir permissão que o vídeo não mostra sendo usada.
- App em modo Development no momento de enviar: ponha o app em **Live** só depois da aprovação.

## 7. Depois de aprovado

DEPLOY.md, Passo 7.8, itens 4 e 5: mudar o app para **Live** e pôr `SOCIAL_TESTER_ONLY=false`
na Vercel (com Redeploy).
