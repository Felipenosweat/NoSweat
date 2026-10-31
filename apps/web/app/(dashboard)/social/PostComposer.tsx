"use client";

import {
  CaptionResponse,
  MAX_CAPTION_LENGTH,
  MAX_SOCIAL_MEDIA,
  SocialPostResponse,
  SocialPostsResponse,
  UploadSocialMediaResponse,
  type CaptionAction,
  type CaptionRequest,
  type CreateSocialPostRequest,
  type SocialMedia,
  type SocialPost,
  type SocialStateResponse,
  type UpdateSocialPostRequest,
} from "@nosweat/schema";
import { useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { z } from "zod";
import {
  fieldClass,
  focusRing,
  primaryButton,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";
import { Notice, glassButtonClass } from "@/components/glass";
import { prepareSocialImage, ratioOf, type SocialRatio } from "@/lib/social-image";
import { ManualPostButton } from "./ManualPostButton";
import {
  EDITABLE_STATUSES,
  ErrorNote,
  SocialApiError,
  StatusChip,
  formatWhen,
  socialApi,
  toApiError,
  zoneName,
  zonedDateKey,
  zonedTimeKey,
  zonedToUtcIso,
} from "./shared";

// Gaveta de criar/editar um post: fotos, legenda (com IA), data e hora no fuso da empresa,
// prévia parecida com o Instagram e as ações (rascunho, aprovar, publicar agora, apagar).
// A IA só sugere texto: aprovar e publicar são sempre cliques do dono.

const DeleteResponse = z.object({ ok: z.literal(true) });

const AI_ACTIONS: { action: CaptionAction; label: string; needsCaption: boolean }[] = [
  { action: "write", label: "Write", needsCaption: false },
  { action: "shorter", label: "Shorter", needsCaption: true },
  { action: "friendlier", label: "Friendlier", needsCaption: true },
  { action: "cta", label: "Add call to action", needsCaption: true },
];

type Busy = "save" | "approve" | "publish" | "retry" | "delete" | "upload" | CaptionAction | null;

/** Botão de texto vermelho (apagar). */
const dangerTextButton = textButton
  .replace("text-slate-600", "text-red-700")
  .replace("hover:text-ink", "hover:text-red-800");

function sameMedia(a: SocialMedia[], b: SocialMedia[]): boolean {
  return a.length === b.length && a.every((item, i) => item.path === b[i]?.path);
}

/** Amanhã no fuso da empresa ("YYYY-MM-DD"). */
function tomorrowIn(timeZone: string): string {
  return zonedDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000), timeZone);
}

export function PostComposer({
  post,
  defaultDate,
  state,
  onClose,
  onSynced,
  onDone,
  onDeleted,
  onAiUsed,
}: {
  /** Post existente ou `null` para um novo. */
  post: SocialPost | null;
  /** Dia clicado no calendário ("YYYY-MM-DD"), para um post novo. */
  defaultDate: string | null;
  state: SocialStateResponse;
  onClose: () => void;
  /** O post mudou no servidor, mas a gaveta continua aberta. */
  onSynced: (post: SocialPost) => void;
  /** Ação concluída: atualiza a lista, fecha e mostra a mensagem. */
  onDone: (post: SocialPost, message: string) => void;
  onDeleted: (id: string) => void;
  onAiUsed: () => void;
}) {
  const { settings, capability, account } = state;
  const tz = settings.timezone;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const ids = useId();

  const [current, setCurrent] = useState<SocialPost | null>(post);
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [media, setMedia] = useState<SocialMedia[]>(post?.media ?? []);
  const [date, setDate] = useState(() =>
    post?.scheduledAt
      ? zonedDateKey(new Date(post.scheduledAt), tz)
      : (defaultDate ?? tomorrowIn(tz)),
  );
  const [time, setTime] = useState(() =>
    post?.scheduledAt ? zonedTimeKey(new Date(post.scheduledAt), tz) : settings.postTime,
  );
  const [note, setNote] = useState(post?.ownerNotePt ?? "");
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<SocialApiError | null>(null);
  const [status, setStatus] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [discardAsk, setDiscardAsk] = useState(false);
  const [slide, setSlide] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const editable = !current || EDITABLE_STATUSES.includes(current.status);
  const scheduledAt = date && time ? zonedToUtcIso(date, time, tz) : null;
  const dirty =
    !current ||
    caption !== current.caption ||
    !sameMedia(media, current.media) ||
    scheduledAt !== current.scheduledAt;
  const autoReady = capability.publishMode === "auto" && account?.status === "active";
  const captionsLeft = state.aiRemaining.captions;
  const aiOut = captionsLeft !== null && captionsLeft <= 0;
  const missing =
    media.length === 0
      ? "Add at least one photo — Instagram posts need a photo."
      : !caption.trim()
        ? "Write a caption."
        : !scheduledAt
          ? "Pick a date and time."
          : null;
  /** Já aprovado e sem mudanças: não há o que aprovar de novo. */
  const showApprove =
    editable && !(current && ["approved", "scheduled"].includes(current.status) && !dirty);
  const isBusy = busy !== null || uploading > 0;
  const shownSlide = Math.min(slide, Math.max(0, media.length - 1));
  const slideMedia = media[shownSlide];
  const previewRatio: SocialRatio = media[0]
    ? ratioOf(media[0].width, media[0].height)
    : "portrait";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    dialog.showModal();
    captionRef.current?.focus({ preventScroll: true });
  }, []);

  function handleClose() {
    onClose();
    const opener = openerRef.current;
    if (opener?.isConnected) opener.focus();
  }

  /** Fechar pede confirmação uma vez se houver mudanças sem salvar. */
  function requestClose() {
    if (editable && dirty && (current || caption.trim() || media.length) && !discardAsk) {
      setDiscardAsk(true);
      return;
    }
    dialogRef.current?.close();
  }

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (!isBusy) requestClose();
  }

  // ---------- servidor ----------

  async function persist(): Promise<SocialPost> {
    if (!current) {
      const body: CreateSocialPostRequest = { caption, media, scheduledAt };
      const result = await socialApi("/api/social/posts", SocialPostResponse, {
        method: "POST",
        body,
      });
      setCurrent(result.post);
      onSynced(result.post);
      return result.post;
    }
    if (!dirty) return current;
    const body: UpdateSocialPostRequest = { caption, media, scheduledAt };
    const result = await socialApi(
      `/api/social/posts/${encodeURIComponent(current.id)}`,
      SocialPostResponse,
      { method: "PATCH", body },
    );
    setCurrent(result.post);
    onSynced(result.post);
    return result.post;
  }

  async function approveOne(saved: SocialPost): Promise<SocialPost> {
    const result = await socialApi("/api/social/posts/approve", SocialPostsResponse, {
      method: "POST",
      body: { ids: [saved.id] },
    });
    return result.posts.find((p) => p.id === saved.id) ?? result.posts[0] ?? saved;
  }

  /** Atualiza a lista do calendário e fecha a gaveta. */
  function finish(saved: SocialPost, message: string) {
    onDone(saved, message);
    dialogRef.current?.close();
  }

  async function run(kind: Exclude<Busy, null>, task: () => Promise<void>) {
    setBusy(kind);
    setError(null);
    setDiscardAsk(false);
    try {
      await task();
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setBusy(null);
    }
  }

  const saveDraft = () =>
    run("save", async () => {
      const saved = await persist();
      finish(saved, "Draft saved.");
    });

  const approve = () =>
    run("approve", async () => {
      const saved = await persist();
      const approved = await approveOne(saved);
      const when = approved.scheduledAt ? formatWhen(approved.scheduledAt, tz) : "";
      finish(
        approved,
        approved.status === "scheduled"
          ? `Approved. It goes out ${when}.`
          : `Approved. It's on your calendar as Ready to post${when ? ` for ${when}` : ""}.`,
      );
    });

  const publishNow = () =>
    run("publish", async () => {
      let saved = await persist();
      if (saved.status === "draft") saved = await approveOne(saved);
      const result = await socialApi(
        `/api/social/posts/${encodeURIComponent(saved.id)}/publish-now`,
        SocialPostResponse,
        { method: "POST" },
      );
      finish(
        result.post,
        result.post.status === "published"
          ? "Posted to Instagram."
          : result.post.lastError
            ? `Not posted yet: ${result.post.lastError}`
            : "Posting now. It can take a minute to show on Instagram.",
      );
    });

  const retry = () =>
    run("retry", async () => {
      if (!current) return;
      const saved = dirty ? await persist() : current;
      const result = await socialApi(
        `/api/social/posts/${encodeURIComponent(saved.id)}/retry`,
        SocialPostResponse,
        { method: "POST" },
      );
      finish(result.post, "We'll try posting it again.");
    });

  const remove = () =>
    run("delete", async () => {
      if (!current) {
        dialogRef.current?.close();
        return;
      }
      await socialApi(`/api/social/posts/${encodeURIComponent(current.id)}`, DeleteResponse, {
        method: "DELETE",
      });
      onDeleted(current.id);
      dialogRef.current?.close();
    });

  const askAi = (action: CaptionAction) =>
    run(action, async () => {
      const body: CaptionRequest = {
        action,
        ...(idea.trim() ? { idea: idea.trim() } : {}),
        ...(caption.trim() ? { currentCaption: caption } : {}),
        ...(current?.siteId ? { siteId: current.siteId } : {}),
      };
      const result = await socialApi("/api/social/caption", CaptionResponse, {
        method: "POST",
        body,
      });
      setCaption(result.caption);
      setNote(result.ownerNotePt);
      onAiUsed();
      setStatus("New caption written. Review it before you approve.");
      captionRef.current?.focus();
    });

  // ---------- fotos ----------

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const total = files.length;
    const room = MAX_SOCIAL_MEDIA - media.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (list.length === 0) return;
    setError(null);
    setUploading(list.length);
    // As fotos de um carrossel têm o mesmo formato: segue o da primeira foto do post.
    let ratio: SocialRatio | undefined = media[0]
      ? ratioOf(media[0].width, media[0].height)
      : undefined;
    let added = 0;
    try {
      for (const file of list) {
        const prepared = await prepareSocialImage(file, ratio ? { ratio } : {});
        ratio ??= ratioOf(prepared.width, prepared.height);
        const form = new FormData();
        form.append("file", prepared.file);
        const result = await socialApi("/api/social/media", UploadSocialMediaResponse, {
          method: "POST",
          form,
        });
        setMedia((items) => [...items, result.media].slice(0, MAX_SOCIAL_MEDIA));
        added++;
        setUploading((n) => Math.max(0, n - 1));
      }
      setStatus(`${added} photo${added === 1 ? "" : "s"} added.`);
    } catch (err) {
      setError(
        err instanceof Error && !(err instanceof SocialApiError)
          ? new SocialApiError("image_error", err.message, 0)
          : toApiError(err),
      );
    } finally {
      setUploading(0);
      if (fileRef.current) fileRef.current.value = "";
    }
    if (total > list.length) {
      setStatus(`Only ${MAX_SOCIAL_MEDIA} photos fit in one post.`);
    }
  }

  function move(index: number, delta: number) {
    setMedia((items) => {
      const target = index + delta;
      if (target < 0 || target >= items.length) return items;
      const next = [...items];
      const [item] = next.splice(index, 1);
      if (item) next.splice(target, 0, item);
      return next;
    });
  }

  function removeMedia(index: number) {
    setMedia((items) => items.filter((_, i) => i !== index));
  }

  // ---------- tela ----------

  const title = !current ? "New post" : editable ? "Edit post" : "Post";
  const username = account && account.status !== "revoked" ? account.username : "yourbusiness";
  const count = caption.length;
  const longCaption = caption.length > 125;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${ids}-title`}
      onClose={handleClose}
      onCancel={onCancel}
      className="glass-strong m-0 h-dvh max-h-none w-full max-w-none border-0 p-0 text-ink backdrop:bg-ink/40 md:ml-auto md:w-[min(100%,1000px)]"
    >
      <div className="flex h-full flex-col">
        <header className="glass-bar flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <h2
              id={`${ids}-title`}
              className="font-display text-lg leading-7 font-semibold tracking-[-0.02em]"
            >
              {title}
            </h2>
            {current && <StatusChip post={current} />}
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={isBusy}
            aria-label="Close"
            className={`-mr-2 ${glassButtonClass({ variant: "ghost", iconOnly: true })}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-8 px-5 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_320px] md:py-6">
            {/* ---------- formulário ---------- */}
            <div className="min-w-0 space-y-6">
              {current?.lastError && ["failed", "paused", "missed"].includes(current.status) && (
                <Notice tone="warning" size="sm" role={null}>
                  {current.status === "missed"
                    ? "This post missed its time. Pick a new date and approve it again."
                    : current.lastError}
                </Notice>
              )}

              <section aria-labelledby={`${ids}-photos`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 id={`${ids}-photos`} className="text-[13px] font-medium text-ink">
                    Photos
                  </h3>
                  <span className="text-[13px] text-slate-500 tabular-nums">
                    {media.length} / {MAX_SOCIAL_MEDIA}
                  </span>
                </div>
                <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {media.map((item, index) => (
                    <li key={item.path} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- foto no storage (host externo) */}
                      <img
                        src={item.url}
                        alt={item.alt ?? `Photo ${index + 1}`}
                        className="aspect-square w-full rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      {editable && (
                        <div className="mt-1 flex justify-between">
                          <button
                            type="button"
                            onClick={() => move(index, -1)}
                            disabled={index === 0 || isBusy}
                            aria-label={`Move photo ${index + 1} earlier`}
                            className={`inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:text-slate-300 ${focusRing}`}
                          >
                            <span aria-hidden="true">&larr;</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            disabled={isBusy}
                            aria-label={`Remove photo ${index + 1}`}
                            className={`inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:text-slate-300 ${focusRing}`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="size-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            >
                              <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, 1)}
                            disabled={index === media.length - 1 || isBusy}
                            aria-label={`Move photo ${index + 1} later`}
                            className={`inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:text-slate-300 ${focusRing}`}
                          >
                            <span aria-hidden="true">&rarr;</span>
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                  {editable && media.length < MAX_SOCIAL_MEDIA && (
                    <li>
                      <label
                        className={`flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-center text-[13px] font-medium text-slate-600 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${
                          isBusy ? "pointer-events-none opacity-60" : ""
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="size-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        >
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                        {uploading > 0 ? `Adding ${uploading}…` : "Add photos"}
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isBusy}
                          onChange={(event) => void addFiles(event.target.files)}
                          className="sr-only"
                        />
                      </label>
                    </li>
                  )}
                </ul>
                {editable && (
                  <p className="mt-2 text-[13px] leading-5 text-slate-500">
                    Photos of your real work do best. We crop them to Instagram&rsquo;s size.
                  </p>
                )}
              </section>

              <section aria-labelledby={`${ids}-caption-label`}>
                <div className="flex items-baseline justify-between gap-3">
                  <label
                    id={`${ids}-caption-label`}
                    htmlFor={`${ids}-caption`}
                    className="text-[13px] font-medium text-ink"
                  >
                    Caption
                  </label>
                  <span
                    id={`${ids}-count`}
                    className={`text-[13px] tabular-nums ${
                      count > MAX_CAPTION_LENGTH - 100
                        ? "font-semibold text-red-700"
                        : "text-slate-500"
                    }`}
                  >
                    {count.toLocaleString("en-US")} / {MAX_CAPTION_LENGTH.toLocaleString("en-US")}
                  </span>
                </div>
                <textarea
                  ref={captionRef}
                  id={`${ids}-caption`}
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  maxLength={MAX_CAPTION_LENGTH}
                  rows={8}
                  readOnly={!editable}
                  aria-describedby={`${ids}-count${note ? ` ${ids}-note` : ""}`}
                  placeholder="What do you want your customers to know?"
                  className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
                />
                {note && (
                  <p id={`${ids}-note`} className="mt-2 text-[13px] leading-5 text-slate-500">
                    <span className="font-medium text-slate-600">Note (Portuguese): </span>
                    <span lang="pt-BR">{note}</span>
                  </p>
                )}
                {current?.claimsFlagged && (
                  <Notice tone="warning" size="sm" role="note" className="mt-3">
                    This caption mentions things like reviews, ratings, guarantees or licenses. Keep
                    them only if they&rsquo;re true for your business.
                  </Notice>
                )}

                {editable && (
                  <div className="glass-inset mt-4 rounded-xl p-4">
                    <label
                      htmlFor={`${ids}-idea`}
                      className="block text-[13px] font-medium text-ink"
                    >
                      Ask AI{" "}
                      <span className="font-normal text-slate-500">
                        {captionsLeft === null
                          ? ""
                          : `· ${captionsLeft} caption${captionsLeft === 1 ? "" : "s"} left today`}
                      </span>
                    </label>
                    <input
                      id={`${ids}-idea`}
                      value={idea}
                      onChange={(event) => setIdea(event.target.value)}
                      maxLength={1000}
                      placeholder="Idea for “Write” (English or Portuguese), e.g. we just finished a deck in Oak Park"
                      className={`${fieldClass} mt-1.5 h-11`}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {AI_ACTIONS.map(({ action, label, needsCaption }) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => void askAi(action)}
                          disabled={isBusy || aiOut || (needsCaption && !caption.trim())}
                          className={`${secondaryButton} min-h-10 px-3 text-sm`}
                        >
                          {busy === action ? "Writing…" : label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <fieldset disabled={!editable}>
                <legend className="text-[13px] font-medium text-ink">When to post</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-3 sm:max-w-sm">
                  <label className="block text-[13px] text-slate-600">
                    Date
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className={`${fieldClass} mt-1 h-11`}
                    />
                  </label>
                  <label className="block text-[13px] text-slate-600">
                    Time
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      step={300}
                      className={`${fieldClass} mt-1 h-11`}
                    />
                  </label>
                </div>
                <p className="mt-2 text-[13px] text-slate-500">
                  Your business time: {zoneName(tz)} ({tz.replace(/_/g, " ")})
                </p>
              </fieldset>

              {current?.status === "approved" && !dirty && (
                <ManualPostButton
                  post={current}
                  onPosted={(posted) => finish(posted, "Marked as posted.")}
                />
              )}

              {current?.permalink && (
                <p>
                  <a
                    href={current.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[15px] font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    View on Instagram<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              )}
            </div>

            {/* ---------- prévia ---------- */}
            <aside aria-label="Instagram preview" className="md:sticky md:top-0 md:self-start">
              <p className="text-[13px] font-medium text-ink">Preview</p>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  {account?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- foto de perfil do Instagram
                    <img
                      src={account.avatarUrl}
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true" className="size-8 rounded-full bg-slate-200" />
                  )}
                  <span className="truncate text-[13px] font-semibold text-ink">{username}</span>
                </div>
                <div
                  className={`relative bg-slate-100 ${previewRatio === "portrait" ? "aspect-[4/5]" : "aspect-square"}`}
                >
                  {slideMedia ? (
                    // eslint-disable-next-line @next/next/no-img-element -- foto no storage (host externo)
                    <img
                      src={slideMedia.url}
                      alt={slideMedia.alt ?? ""}
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] text-slate-500">
                      Your photo shows here
                    </span>
                  )}
                  {media.length > 1 && (
                    <>
                      <span className="absolute top-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-[12px] font-medium text-white tabular-nums">
                        {shownSlide + 1}/{media.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSlide(Math.max(0, shownSlide - 1))}
                        disabled={shownSlide === 0}
                        aria-label="Previous photo"
                        className={`absolute top-1/2 left-2 inline-flex size-11 -translate-y-1/2 sm:size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow disabled:hidden ${focusRing}`}
                      >
                        <span aria-hidden="true">&lsaquo;</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlide(Math.min(media.length - 1, shownSlide + 1))}
                        disabled={shownSlide === media.length - 1}
                        aria-label="Next photo"
                        className={`absolute top-1/2 right-2 inline-flex size-11 -translate-y-1/2 sm:size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow disabled:hidden ${focusRing}`}
                      >
                        <span aria-hidden="true">&rsaquo;</span>
                      </button>
                    </>
                  )}
                </div>
                <div className="px-3 pt-2.5 pb-3">
                  <div aria-hidden="true" className="flex gap-3 text-ink">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <svg
                      viewBox="0 0 24 24"
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <svg
                      viewBox="0 0 24 24"
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-[13px] leading-[1.45] break-words whitespace-pre-line text-ink">
                    <span className="font-semibold">{username}</span>{" "}
                    {caption ? (
                      expanded || !longCaption ? (
                        caption
                      ) : (
                        `${caption.slice(0, 125).trimEnd()}… `
                      )
                    ) : (
                      <span className="text-slate-500">Your caption shows here.</span>
                    )}
                    {longCaption && !expanded && (
                      <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className={`text-slate-500 ${focusRing}`}
                      >
                        more
                      </button>
                    )}
                  </p>
                  {scheduledAt && (
                    <p className="mt-2 text-[12px] tracking-wide text-slate-500 uppercase">
                      {formatWhen(scheduledAt, tz)}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        <footer className="glass-bar px-5 py-3 sm:px-6">
          <div aria-live="polite" className="text-[13px] text-slate-600">
            {discardAsk ? (
              <p className="mb-2 font-medium text-amber-900">
                You have unsaved changes. Close again to discard them.
              </p>
            ) : status ? (
              <p className="mb-2">{status}</p>
            ) : null}
          </div>
          {error && <ErrorNote error={error} className="mb-2" />}
          {showApprove && missing && (
            <p className="mb-2 text-[13px] text-slate-500">To approve: {missing}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {showApprove && (
              <button
                type="button"
                onClick={() => void approve()}
                disabled={isBusy || missing !== null}
                className={primaryButton}
              >
                {busy === "approve"
                  ? "Approving…"
                  : current && current.status !== "draft" && dirty
                    ? "Save and approve"
                    : "Approve"}
              </button>
            )}
            {editable && (
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={isBusy || !dirty}
                className={secondaryButton}
              >
                {busy === "save" ? "Saving…" : "Save draft"}
              </button>
            )}
            {autoReady &&
              current &&
              ["approved", "scheduled", "draft"].includes(current.status) && (
                <button
                  type="button"
                  onClick={() => void publishNow()}
                  disabled={isBusy || missing !== null}
                  className={secondaryButton}
                >
                  {busy === "publish" ? "Posting…" : "Publish now"}
                </button>
              )}
            {current?.status === "failed" && (
              <button
                type="button"
                onClick={() => void retry()}
                disabled={isBusy}
                className={secondaryButton}
              >
                {busy === "retry" ? "Trying…" : "Try again"}
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {(editable || current?.status === "canceled") &&
                (confirmDelete ? (
                  <>
                    <span className="text-[13px] text-slate-600">Delete this post?</span>
                    <button
                      type="button"
                      onClick={() => void remove()}
                      disabled={isBusy}
                      className={dangerTextButton}
                    >
                      {busy === "delete" ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isBusy}
                      className={textButton}
                    >
                      Keep
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isBusy}
                    className={textButton}
                  >
                    Delete
                  </button>
                ))}
            </div>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
