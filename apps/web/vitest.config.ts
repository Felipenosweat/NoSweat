import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // O MockGenerator espera 1,5 s de propósito.
    testTimeout: 10_000,
    // Limites diários altos nos testes; o teste de limite baixa o valor quando precisa.
    env: {
      AI_DAILY_GENERATIONS: "1000",
      AI_DAILY_EDITS: "1000",
      AI_DAILY_SOCIAL_PLANS: "1000",
      AI_DAILY_SOCIAL_CAPTIONS: "1000",
      // Cota de créditos alta para a conta sem plano (DEV_USER); os testes de créditos usam
      // contas próprias e baixam o valor quando precisam.
      CREDITS_MONTHLY_NO_PLAN: "1000000",
    },
  },
});
