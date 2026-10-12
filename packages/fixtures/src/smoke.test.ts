import { expect, it } from "vitest";

// Teste provisório da Etapa 1; substituído pelos testes reais nas próximas etapas.
it("workspace package loads", async () => {
  await expect(import("./index")).resolves.toBeDefined();
});
