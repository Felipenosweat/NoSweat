import { describe, expect, it } from "vitest";
import {
  ageOn,
  confirmationErrors,
  hasCompleteProfile,
  latestBirthDate,
  passwordProblems,
  profileMetadata,
  signUpSchema,
} from "./signup-rules";

const TODAY = new Date("2026-10-13T12:00:00Z");
const today = () => TODAY;

const valid = {
  firstName: "Maria",
  lastName: "O'Neil-Silva",
  birthDate: "1990-05-20",
  marketing: true,
  email: "maria@example.com",
  emailConfirm: "Maria@Example.com",
  password: "Sweat!2026x",
  passwordConfirm: "Sweat!2026x",
  terms: true,
};

describe("ageOn", () => {
  it("conta a idade completa, inclusive no dia do aniversário", () => {
    expect(ageOn("2008-10-13", TODAY)).toBe(18);
    expect(ageOn("2008-10-14", TODAY)).toBe(17);
    expect(ageOn("1990-05-20", TODAY)).toBe(36);
  });

  it("recusa datas que não existem ou fora do formato", () => {
    expect(ageOn("2001-02-30", TODAY)).toBeNull();
    expect(ageOn("10/13/2000", TODAY)).toBeNull();
    expect(ageOn("", TODAY)).toBeNull();
  });
});

describe("passwordProblems", () => {
  it("lista o que falta", () => {
    expect(passwordProblems("short")).toEqual([
      "At least 10 characters",
      "One uppercase letter",
      "One number",
      "One symbol (like ! @ # $)",
    ]);
    expect(passwordProblems("Sweat!2026x")).toEqual([]);
  });
});

describe("signUpSchema", () => {
  it("aceita um cadastro válido (e-mail confirmado sem diferenciar maiúsculas)", () => {
    expect(signUpSchema(today).safeParse(valid).success).toBe(true);
  });

  it("recusa menor de 18", () => {
    const result = signUpSchema(today).safeParse({ ...valid, birthDate: "2008-10-14" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/at least 18/);
  });

  it("recusa data no futuro", () => {
    expect(signUpSchema(today).safeParse({ ...valid, birthDate: "2030-01-01" }).success).toBe(
      false,
    );
  });

  it("recusa e-mails ou senhas diferentes", () => {
    const emails = signUpSchema(today).safeParse({ ...valid, emailConfirm: "other@example.com" });
    expect(emails.error?.issues.map((i) => i.path[0])).toContain("emailConfirm");
    const passwords = signUpSchema(today).safeParse({ ...valid, passwordConfirm: "Sweat!2026y" });
    expect(passwords.error?.issues.map((i) => i.path[0])).toContain("passwordConfirm");
  });

  it("mostra todos os erros de uma vez, mesmo com a data inválida", () => {
    const result = signUpSchema(today).safeParse({
      ...valid,
      birthDate: "2010-01-01",
      password: "weak",
      passwordConfirm: "other",
    });
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toContain("birthDate");
    expect(fields).toContain("password");
    expect(
      confirmationErrors({ ...valid, password: "weak", passwordConfirm: "other" }).passwordConfirm,
    ).toBe("The passwords don’t match.");
  });

  it("recusa senha fraca", () => {
    const result = signUpSchema(today).safeParse({
      ...valid,
      password: "password123",
      passwordConfirm: "password123",
    });
    expect(result.error?.issues[0]?.message).toMatch(/uppercase/);
  });

  it("exige aceitar os termos e o nome completo", () => {
    expect(signUpSchema(today).safeParse({ ...valid, terms: false }).success).toBe(false);
    expect(signUpSchema(today).safeParse({ ...valid, lastName: " " }).success).toBe(false);
    expect(signUpSchema(today).safeParse({ ...valid, firstName: "<script>" }).success).toBe(false);
  });
});

describe("perfil", () => {
  it("monta os metadados e reconhece perfil completo", () => {
    const metadata = profileMetadata(valid, TODAY);
    expect(metadata.full_name).toBe("Maria O'Neil-Silva");
    expect(hasCompleteProfile(metadata)).toBe(true);
    expect(hasCompleteProfile({ first_name: "Maria" })).toBe(false);
    expect(hasCompleteProfile(null)).toBe(false);
  });

  it("data máxima do campo = 18 anos atrás", () => {
    expect(latestBirthDate(TODAY)).toBe("2008-10-13");
  });
});
