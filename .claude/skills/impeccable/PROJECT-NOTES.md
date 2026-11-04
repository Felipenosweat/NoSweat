# Impeccable no No Sweat (notas do projeto)

- Origem: https://github.com/pbakaus/impeccable (Paul Bakaus), tag `skill-v4.8.0`, licença
  Apache 2.0 (`LICENSE` e `NOTICE.md` ficam aqui junto, como a licença pede).
- Copiados SÓ os textos: `SKILL.md` e `reference/`. Nada foi alterado em relação ao original.
- Deixados de fora de propósito: a pasta `scripts/` (launcher que baixa um programa de terceiros,
  scripts de navegador, índices de fontes), os `hooks` do plugin (rodam um programa a cada edição)
  e os 4 agentes do plugin. Sem o launcher, a skill segue o plano B dela ("Launcher unavailable"
  no `SKILL.md`): lê PRODUCT.md e DESIGN.md direto e continua. Comandos que dependem do programa
  (`pin`, `live`, detecção automática) não funcionam aqui.
- O plugin completo continua valendo no computador de quem o instalou (`/plugin`). Plugins do
  repositório não carregam em sessões na nuvem, por isso esta cópia só de texto.
- Precedência: as regras do `CLAUDE.md` (principalmente a regra 8, nada de afirmação inventada) e
  a skill `premium-web-design` (tokens `ns-*`, marca do SaaS) valem acima de qualquer sugestão
  da Impeccable.
- Para atualizar: copiar de novo `plugin/skills/impeccable/SKILL.md` e `reference/` de uma tag
  nova, depois de ler o que mudou.
