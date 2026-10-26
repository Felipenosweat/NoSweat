import type { Job } from "@nosweat/schema";
import { GRID_END_HOUR, GRID_START_HOUR, zonedParts } from "./time";

// Posição dos serviços na grade da agenda (puro). Serviços que se sobrepõem no mesmo dia dividem
// a largura da coluna em faixas, como no Calendário do iPhone.

/** Serviço com dia e minutos já no fuso da empresa. */
export type PlacedJob = {
  job: Job;
  /** "AAAA-MM-DD" do início, no fuso da empresa. */
  dateKey: string;
  /** Minutos desde a meia-noite (início e fim reais; o fim passa de 1440 se virar o dia). */
  startMin: number;
  endMin: number;
};

/** Duração usada quando o serviço não tem fim. */
const DEFAULT_MINUTES = 60;

/** Serviços com data → dia e minutos no fuso. Os sem `startAt` ficam de fora. */
export function placeJobs(jobs: readonly Job[], timeZone: string): PlacedJob[] {
  const placed: PlacedJob[] = [];
  for (const job of jobs) {
    if (!job.startAt) continue;
    const startAt = new Date(job.startAt);
    if (Number.isNaN(startAt.getTime())) continue;
    const start = zonedParts(startAt, timeZone);
    let endMin = start.minutes + DEFAULT_MINUTES;
    if (job.endAt) {
      const endAt = new Date(job.endAt);
      if (!Number.isNaN(endAt.getTime()) && endAt > startAt) {
        const end = zonedParts(endAt, timeZone);
        // Terminou noutro dia: conta a partir da meia-noite do início.
        endMin =
          end.dateKey === start.dateKey
            ? end.minutes
            : start.minutes + Math.round((endAt.getTime() - startAt.getTime()) / 60_000);
      }
    }
    placed.push({ job, dateKey: start.dateKey, startMin: start.minutes, endMin });
  }
  return placed.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
}

export type GridBlock = PlacedJob & {
  /** Posição dentro da janela da grade, em minutos desde GRID_START_HOUR. */
  top: number;
  height: number;
  /** Faixa (0..lanes-1) e quantas faixas o grupo usa. */
  lane: number;
  lanes: number;
};

const GRID_START = GRID_START_HOUR * 60;
const GRID_END = GRID_END_HOUR * 60;
/** Altura mínima de um bloco (minutos): dá para ler o horário e tocar. */
const MIN_BLOCK = 30;

/**
 * Blocos de um dia: corta na janela 6h–21h (o que fica fora encosta na borda, com o horário real
 * no texto) e distribui os sobrepostos em faixas.
 */
export function layoutDay(jobs: readonly PlacedJob[]): GridBlock[] {
  const blocks: GridBlock[] = jobs.map((placed) => {
    const start = Math.min(Math.max(placed.startMin, GRID_START), GRID_END - MIN_BLOCK);
    const end = Math.min(Math.max(placed.endMin, start + MIN_BLOCK), GRID_END);
    return { ...placed, top: start - GRID_START, height: end - start, lane: 0, lanes: 1 };
  });
  blocks.sort((a, b) => a.top - b.top || b.height - a.height);

  // Grupos de blocos que se encostam; dentro do grupo, cada um na primeira faixa livre.
  let group: GridBlock[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;
  const closeGroup = () => {
    for (const block of group) block.lanes = laneEnds.length;
    group = [];
    laneEnds = [];
  };
  for (const block of blocks) {
    if (block.top >= groupEnd) {
      closeGroup();
      groupEnd = -1;
    }
    let lane = laneEnds.findIndex((end) => end <= block.top);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = block.top + block.height;
    block.lane = lane;
    group.push(block);
    groupEnd = Math.max(groupEnd, block.top + block.height);
  }
  closeGroup();
  return blocks;
}
