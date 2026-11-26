// Regras puras da folha "Walk-in" da agenda.

/** Duração padrão de um walk-in sem serviço escolhido (minutos). */
export const WALK_IN_DEFAULT_MINUTES = 30;

/**
 * "Agora" arredondado para cima ao próximo quarto de hora ("HH:MM"). Passou das 23:45, fica 23:45
 * (o dia não vira). `nowMinutes` = minutos desde a meia-noite no fuso da empresa.
 */
export function roundUpToQuarter(nowMinutes: number): string {
  const rounded = Math.min(23 * 60 + 45, Math.ceil(Math.max(0, nowMinutes) / 15) * 15);
  const hh = String(Math.floor(rounded / 60)).padStart(2, "0");
  const mm = String(rounded % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
