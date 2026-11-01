import { getBookingStore } from "./store";

// Mantém as marcações do site iguais ao serviço (job) da agenda quando é o DONO quem mexe no
// serviço (server/office/service.ts chama estas funções). Nunca lançam: a mudança do dono já foi
// feita e o erro aqui só deixaria a marcação desatualizada.

/** O dono cancelou ou apagou o serviço: a marcação ligada a ele também é cancelada (o horário reabre). */
export async function cancelBookingForJob(ownerId: string, jobId: string): Promise<void> {
  try {
    await getBookingStore().cancelByJobId(ownerId, jobId);
  } catch (error) {
    console.error("[booking] could not cancel the booking of a job", error);
  }
}

/** O dono remarcou o serviço: a marcação ligada passa a ter o mesmo horário (o antigo reabre). */
export async function moveBookingForJob(
  ownerId: string,
  jobId: string,
  startAt: string,
  endAt: string,
): Promise<void> {
  try {
    await getBookingStore().updateTimesByJobId(ownerId, jobId, startAt, endAt);
  } catch (error) {
    console.error("[booking] could not move the booking of a job", error);
  }
}
