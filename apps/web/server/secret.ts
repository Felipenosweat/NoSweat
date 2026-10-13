// Segredo do servidor para HMACs (hash de IP, código de verificação de domínio).
// IP_HASH_SALT se existir; senão a chave secreta do Supabase (existe em produção e nunca está
// no código). O valor fixo de dev só vale sem Supabase (dev local e testes).
export function serverSecret(): string {
  return process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only-secret";
}
