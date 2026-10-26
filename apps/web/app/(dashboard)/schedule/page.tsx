import type { Job, TeamMember } from "@nosweat/schema";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getViewer } from "@/server/auth/viewer";
import { getClientDetail } from "@/server/clients/service";
import { getOfficeSettings, listJobs, listTeam } from "@/server/office/service";
import type { NewJobClient } from "./JobForm";
import {
  parseScheduleParams,
  visibleRange,
  type RawSearchParams,
  type ScheduleParams,
} from "./params";
import { ScheduleBoard } from "./ScheduleBoard";
import { safeTimeZone, zonedParts, zonedToUtc } from "./time";

export const metadata: Metadata = { title: "Schedule", robots: { index: false } };

type SchedulePageProps = { searchParams: Promise<RawSearchParams> };

/** Fuso da empresa (configurações do escritório). Erro ou fuso inválido = Nova York. */
async function companyTimeZone(ownerId: string): Promise<string> {
  try {
    return safeTimeZone((await getOfficeSettings(ownerId))?.timeZone);
  } catch (error) {
    console.error("[schedule] could not read office settings", error);
    return safeTimeZone(null);
  }
}

/**
 * Cliente que a folha "New job" já traz escolhido (link "Book a job" da ficha do cliente). Cliente
 * de outro dono, apagado ou erro = `null` (o dono escolhe na folha, como sempre).
 */
async function preselectedClient(
  ownerId: string,
  clientId: string | null,
): Promise<NewJobClient | null> {
  if (!clientId) return null;
  try {
    const detail = await getClientDetail(ownerId, clientId);
    if (!detail) return null;
    const { id, name, phone, address } = detail.client;
    return { id, name, phone, address };
  } catch (error) {
    console.error("[schedule] could not read the client for the new job", error);
    return null;
  }
}

/**
 * Tudo o que a agenda mostra (fora do componente: usa o relógio). "Hoje" e o período no fuso da
 * empresa. `jobs: null` = erro ao ler (a página avisa); equipe com erro = sem cores nem filtro.
 */
async function loadSchedule(ownerId: string, params: ScheduleParams) {
  const timeZone = await companyTimeZone(ownerId);
  const now = zonedParts(new Date(), timeZone);
  const today = now.dateKey;
  const date = params.date ?? today;
  const range = visibleRange(params.view, date);
  const from = zonedToUtc(range.start, "00:00", timeZone);
  const to = zonedToUtc(range.end, "00:00", timeZone);

  const [jobs, unscheduled, done, team] = await Promise.all([
    listJobs(ownerId, { from: from.toISOString(), to: to.toISOString() }).catch(
      (error: unknown): Job[] | null => {
        console.error("[schedule] could not list jobs", error);
        return null;
      },
    ),
    listJobs(ownerId, { status: "unscheduled" }).catch((error: unknown): Job[] => {
      console.error("[schedule] could not list unscheduled jobs", error);
      return [];
    }),
    listJobs(ownerId, { status: "done" }).catch((error: unknown): Job[] => {
      console.error("[schedule] could not list done jobs", error);
      return [];
    }),
    listTeam(ownerId).catch((error: unknown): TeamMember[] => {
      console.error("[schedule] could not list the team", error);
      return [];
    }),
  ]);

  // Só o que cai no período (o filtro também é conferido aqui, para a grade nunca mostrar outro
  // dia por engano).
  const inRange = jobs?.filter((job) => {
    if (!job.startAt) return false;
    const at = Date.parse(job.startAt);
    return at >= from.getTime() && at < to.getTime();
  });
  const waiting = unscheduled.filter(
    (job) => job.status === "unscheduled" || (!job.startAt && job.status === "scheduled"),
  );

  return {
    timeZone,
    today,
    nowMinutes: now.minutes,
    date,
    rangeStart: range.start,
    jobs: inRange ?? null,
    unscheduled: waiting,
    toInvoice: done.filter((job) => !job.invoiceId),
    team,
  };
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  // No modo "ver como" do admin, a agenda da conta vista (só leitura: sem marcar nem mudar).
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/schedule");
  const readOnly = viewer.viewingAs !== null;
  const params = parseScheduleParams(await searchParams);
  const [data, newJobClient] = await Promise.all([
    loadSchedule(viewer.ownerId, params),
    // Só quando a folha abre (no "ver como" ela nunca abre).
    preselectedClient(viewer.ownerId, params.openNew && !readOnly ? params.clientId : null),
  ]);

  if (data.jobs === null) {
    return (
      <div>
        <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-ink">
          Schedule
        </h1>
        <p
          role="alert"
          className="glass-edge mt-8 rounded-2xl bg-red-50/90 px-4 py-3 text-[15px] text-red-700"
        >
          We couldn&rsquo;t load your schedule. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <ScheduleBoard
      // Nova chave a cada período/filtro: a folha e a bandeja recomeçam fechadas.
      key={`${params.view ?? "auto"}|${data.date}|${params.team ?? ""}`}
      view={params.view}
      date={data.date}
      rangeStart={data.rangeStart}
      today={data.today}
      nowMinutes={data.nowMinutes}
      timeZone={data.timeZone}
      team={data.team}
      teamFilter={params.team}
      jobs={data.jobs}
      unscheduled={data.unscheduled}
      toInvoice={data.toInvoice}
      readOnly={readOnly}
      openNew={params.openNew}
      newJobClient={newJobClient}
    />
  );
}
