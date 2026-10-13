// Limite simples de envios por IP, em memória (melhor esforço).
// Cada instância do servidor (ex.: cada função da Vercel) tem a própria contagem e ela some ao
// reiniciar. Serve para frear robôs e cliques repetidos, não como proteção forte.

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  /** Conta uma tentativa. `false` se a chave já passou do limite na janela. */
  take(key: string, now = Date.now()): boolean {
    const since = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((time) => time > since);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) this.prune(since);
    return true;
  }

  private prune(since: number): void {
    for (const [key, times] of this.hits) {
      if (!times.some((time) => time > since)) this.hits.delete(key);
    }
    // Ainda grande demais (ataque com muitos IPs): começa do zero em vez de crescer sem fim.
    if (this.hits.size > this.maxKeys) this.hits.clear();
  }
}

/** IP do visitante pelos cabeçalhos do proxy (na Vercel, x-forwarded-for é confiável). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}
