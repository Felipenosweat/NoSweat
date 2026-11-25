import { isDeepStrictEqual } from "node:util";
import {
  isCalendarDate,
  type SetupPart,
  type SiteSetupRequest,
  type SiteSetupResponse,
  type SiteSpec,
  type UpdateBookingSettingsRequest,
} from "@nosweat/schema";
import { formatDuration, formatPriceText, nameKey } from "../../lib/setup/wizard";
import {
  createPriceItem,
  createTeamMember,
  getSettings as getOfficeSettings,
  listPriceItems,
  listTeam,
  updatePriceItem,
  updateSettings as updateOfficeSettings,
  updateTeamMember,
} from "../office/service";
import { OfficeError } from "../office/types";
import { getSiteStore, type SiteRecord } from "../store";
import { updateBookingSettings } from "./service";
import { isKnownTimeZone, minutesOf } from "./time";

// Assistente de configuração do dono: valida TUDO antes de gravar (`planSetup`, puro) e grava
// de novo sem duplicar (`applySetup`): serviços e pessoas são casados pelo nome. Ordem de gravação:
// serviços, equipe, site (rascunho, com versão) e, por último, as regras com o agendamento ligado.
// Nunca publica. Se uma parte falha, `SetupPartialError` diz o que já foi salvo.

/** Itens da seção de serviços (o schema limita a 8). */
const MAX_SECTION_ITEMS = 8;
const MAX_PEOPLE = 6;

type Items = Awaited<ReturnType<typeof listPriceItems>>;
type Team = Awaited<ReturnType<typeof listTeam>>;

export type SetupPlan = {
  /** Regras a gravar (já com `enabled: true`). */
  settings: UpdateBookingSettingsRequest;
  /** O que fazer com a tabela de preços (casando pelo nome). */
  priceOps: (
    | { op: "create"; input: Parameters<typeof createPriceItem>[1] }
    | { op: "update"; id: string; input: Parameters<typeof updatePriceItem>[2] }
  )[];
  teamOps: (
    | { op: "create"; input: Parameters<typeof createTeamMember>[1] }
    | { op: "update"; id: string; input: Parameters<typeof updateTeamMember>[2] }
  )[];
  /** O rascunho do site depois do assistente. */
  spec: SiteSpec;
  notes: string[];
};

const invalid = (message: string) => new OfficeError(400, "invalid_request", message);

/** Confere o pedido inteiro. Lança `OfficeError` 400 (nada foi gravado ainda). */
export function validateSetup(request: SiteSetupRequest): void {
  const { settings } = request;
  settings.weekly.forEach((ranges, day) => {
    const sorted = [...ranges].sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
    for (let i = 1; i < sorted.length; i += 1) {
      const previous = sorted[i - 1];
      const current = sorted[i];
      if (previous && current && minutesOf(current.start) < minutesOf(previous.end)) {
        throw invalid(`The hours for day ${day + 1} of the week overlap. Please fix them.`);
      }
    }
  });
  if (!settings.weekly.some((ranges) => ranges.length > 0)) {
    throw invalid("Pick at least one day with open hours.");
  }
  if (settings.closedDates.some((date) => !isCalendarDate(date))) {
    throw invalid("One of the days off doesn't exist in the calendar.");
  }
  if (request.timeZone && !isKnownTimeZone(request.timeZone)) {
    throw invalid("Please choose a valid time zone.");
  }
  const serviceNames = new Set<string>();
  for (const service of request.services) {
    const key = nameKey(service.name);
    if (serviceNames.has(key)) throw invalid(`“${service.name}” is listed twice.`);
    serviceNames.add(key);
  }
  const people = new Set<string>();
  for (const person of request.team) {
    const key = nameKey(person.name);
    if (people.has(key)) throw invalid(`“${person.name}” is listed twice.`);
    people.add(key);
  }
}

/** Primeiro item com este nome, preferindo os ativos. */
function findByName<T extends { name: string; active: boolean }>(
  list: readonly T[],
  name: string,
): T | undefined {
  const key = nameKey(name);
  return (
    list.find((item) => item.active && nameKey(item.name) === key) ??
    list.find((item) => nameKey(item.name) === key)
  );
}

/** A seção "services" do site com preço e duração do assistente (o texto do dono fica). */
function withServices(spec: SiteSpec, request: SiteSetupRequest, notes: string[]): SiteSpec {
  const index = spec.sections.findIndex((section) => section.type === "services");
  const section = spec.sections[index];
  if (!section || section.type !== "services") {
    notes.push("Your site has no Services section, so prices were saved for booking only.");
    return spec;
  }
  const items = section.items.map((item) => ({ ...item }));
  let skipped = 0;
  for (const service of request.services) {
    const price =
      service.priceCents && service.priceCents > 0
        ? formatPriceText(service.priceCents, service.priceFrom ?? false)
        : undefined;
    const detail = request.kind === "shop" ? formatDuration(service.durationMinutes) : undefined;
    const key = nameKey(service.name);
    const match = items.find((item) => nameKey(item.name) === key);
    if (match) {
      if (price) match.price = price;
      if (detail) match.detail = detail;
    } else if (items.length < MAX_SECTION_ITEMS) {
      items.push({
        name: service.name,
        description: service.description ?? "",
        ...(price ? { price } : {}),
        ...(detail ? { detail } : {}),
      });
    } else {
      skipped += 1;
    }
  }
  if (skipped > 0) {
    notes.push(
      `Your site shows up to ${MAX_SECTION_ITEMS} services, so ${skipped} ${skipped === 1 ? "was" : "were"} saved for booking only.`,
    );
  }
  const sections = spec.sections.slice();
  sections[index] = { ...section, items };
  return { ...spec, sections };
}

/** "Quem somos" com as pessoas do assistente (fotos de quem já estava continuam). */
function withPeople(spec: SiteSpec, request: SiteSetupRequest, notes: string[]): SiteSpec {
  if (request.team.length === 0) return spec;
  const index = spec.sections.findIndex((section) => section.type === "about");
  const section = spec.sections[index];
  if (!section || section.type !== "about") {
    notes.push("Your site has no About section, so the team bios were not added to it.");
    return spec;
  }
  const before = new Map((section.people ?? []).map((person) => [nameKey(person.name), person]));
  const people = request.team.slice(0, MAX_PEOPLE).map((person) => {
    const old = before.get(nameKey(person.name));
    return {
      name: person.name,
      ...(person.role ? { role: person.role } : {}),
      ...(person.bio ? { note: person.bio } : {}),
      ...(old?.image ? { image: old.image } : {}),
    };
  });
  const sections = spec.sections.slice();
  sections[index] = { ...section, people };
  return { ...spec, sections };
}

/** Telefone e área atendida (só quem vai até o cliente informa). */
function withContact(spec: SiteSpec, request: SiteSetupRequest): SiteSpec {
  const business = { ...spec.business };
  if (request.serviceArea) business.serviceArea = request.serviceArea;
  if (request.phone) business.phone = request.phone;
  if (request.city) business.city = request.city;
  if (request.state) business.state = request.state;
  return { ...spec, business };
}

/** Tudo o que vai ser gravado. Puro: recebe o que já existe e devolve o plano (ou lança 400). */
export function planSetup(input: {
  request: SiteSetupRequest;
  items: Items;
  team: Team;
  spec: SiteSpec;
}): SetupPlan {
  const { request, items, team } = input;
  validateSetup(request);
  const notes: string[] = [];

  const priceOps: SetupPlan["priceOps"] = [];
  for (const service of request.services) {
    const existing = findByName(items, service.name);
    const price = service.priceCents ?? 0;
    if (existing) {
      priceOps.push({
        op: "update",
        id: existing.id,
        input: {
          active: true,
          bookable: true,
          durationMinutes: service.durationMinutes,
          ...(price > 0 ? { unitPriceCents: price } : {}),
          ...(service.description ? { description: service.description } : {}),
        },
      });
    } else {
      priceOps.push({
        op: "create",
        input: {
          name: service.name,
          description: service.description,
          unitPriceCents: price,
          bookable: true,
          durationMinutes: service.durationMinutes,
        },
      });
    }
  }
  // Tirados da lista: deixam de ser agendáveis (o item continua na tabela de preços).
  const kept = new Set(request.services.map((service) => nameKey(service.name)));
  for (const name of request.removedServices ?? []) {
    if (kept.has(nameKey(name))) continue;
    const existing = findByName(items, name);
    if (existing) priceOps.push({ op: "update", id: existing.id, input: { bookable: false } });
  }

  const teamOps: SetupPlan["teamOps"] = [];
  for (const person of request.team) {
    const existing = findByName(team, person.name);
    if (existing) {
      teamOps.push({
        op: "update",
        id: existing.id,
        input: { active: true, ...(person.role ? { role: person.role } : {}) },
      });
    } else {
      teamOps.push({ op: "create", input: { name: person.name, role: person.role } });
    }
  }

  const { settings } = request;
  const policy = settings.cancellationPolicy?.trim() ?? "";
  const patch: UpdateBookingSettingsRequest = {
    enabled: true,
    weekly: settings.weekly,
    slotStepMinutes: settings.slotStepMinutes,
    bufferMinutes: settings.bufferMinutes,
    minNoticeHours: settings.minNoticeHours,
    maxDaysAhead: settings.maxDaysAhead,
    closedDates: settings.closedDates,
    note: settings.note,
    // Texto vazio apaga a política antiga (ausente não mudaria nada).
    cancellationPolicy: policy,
    cancellationHours: policy ? (settings.cancellationHours ?? 0) : 0,
  };

  const spec = withContact(
    withPeople(withServices(input.spec, request, notes), request, notes),
    request,
  );
  return { settings: patch, priceOps, teamOps, spec, notes };
}

/** Uma parte falhou no meio do caminho: `saved` são as que já estão gravadas. */
export class SetupPartialError extends Error {
  constructor(
    readonly part: SetupPart,
    readonly saved: SetupPart[],
    readonly reason: unknown,
  ) {
    super(`Could not save ${part}`);
    this.name = "SetupPartialError";
  }
}

const PART_LABELS: Record<SetupPart, string> = {
  services: "your services",
  team: "your team",
  site: "your website text",
  hours: "your hours and rules",
};

/** Frase para o dono: o que foi salvo e o que não foi. */
export function partialMessage(error: SetupPartialError): string {
  const saved = error.saved.map((part) => PART_LABELS[part]);
  const detail = error.reason instanceof OfficeError ? ` ${error.reason.message}` : "";
  const done = saved.length > 0 ? `We saved ${saved.join(", ")}, but ` : "We ";
  return `${done}couldn't save ${PART_LABELS[error.part]}.${detail} Please try again: nothing will be duplicated.`;
}

/**
 * Grava o plano. `site` é o rascunho atual do dono. Rodar de novo atualiza (não duplica) e um
 * rascunho que não mudou não ganha versão nova.
 */
export async function applySetup(
  ownerId: string,
  site: SiteRecord,
  request: SiteSetupRequest,
): Promise<SiteSetupResponse> {
  const [items, team] = await Promise.all([listPriceItems(ownerId), listTeam(ownerId)]);
  const plan = planSetup({ request, items, team, spec: site.spec });
  const saved: SetupPart[] = [];

  async function part(name: SetupPart, run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (error) {
      throw new SetupPartialError(name, [...saved], error);
    }
    saved.push(name);
  }

  await part("services", async () => {
    for (const op of plan.priceOps) {
      if (op.op === "create") await createPriceItem(ownerId, op.input);
      else await updatePriceItem(ownerId, op.id, op.input);
    }
  });
  await part("team", async () => {
    for (const op of plan.teamOps) {
      if (op.op === "create") await createTeamMember(ownerId, op.input);
      else await updateTeamMember(ownerId, op.id, op.input);
    }
  });
  await part("site", async () => {
    // Mesmo caminho do editor: o rascunho vira uma linha em site_versions. Sem mudança, nada grava.
    if (!isDeepStrictEqual(plan.spec, site.spec)) {
      const updated = await getSiteStore().update(site.id, plan.spec, "edit");
      if (!updated) throw new OfficeError(404, "not_found", "Site not found.");
    }
    // Com CEP e sem endereço no escritório, guarda "Cidade, UF 12345" (nunca troca um endereço).
    if (!request.zip) return;
    const office = await getOfficeSettings(ownerId);
    if (office.address?.trim()) return;
    const place = [request.city, [request.state, request.zip].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");
    await updateOfficeSettings(ownerId, { address: place });
  });
  await part("hours", async () => {
    if (request.timeZone) await updateOfficeSettings(ownerId, { timeZone: request.timeZone });
    await updateBookingSettings(ownerId, plan.settings);
  });

  return {
    siteId: site.id,
    saved,
    services: request.services.length,
    people: request.team.length,
    notes: plan.notes,
  };
}
