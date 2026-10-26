"use client";

import {
  CreateTeamMemberRequest,
  TEAM_COLORS,
  TeamMemberResponse,
  UpdateTeamMemberRequest,
  type TeamColor,
  type TeamMember,
} from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import {
  ConfirmDialog,
  GlassButton,
  GlassMenu,
  GlassSheet,
  cx,
  type GlassMenuItem,
} from "@/components/glass";
import { phoneHref } from "@/lib/clients";
import { ErrorNote, clientsApi, toClientsError, type ClientsApiError } from "../clients/api";
import {
  PhoneIcon,
  PlusIcon,
  TextIcon,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
} from "../clients/ui";
import { CancelIcon, EditIcon, RestoreIcon, TEAM_COLOR_STYLES } from "../schedule/ui";

// Equipe (/team): cadastrar e editar numa folha de vidro, desativar pelo "⋯" com confirmação.
// Ninguém da equipe entra no sistema ainda: os membros servem para atribuir serviços e colorir a
// agenda. Desativar (e não apagar) mantém o nome nos serviços antigos.

function memberUrl(id: string): string {
  return `/api/office/team/${encodeURIComponent(id)}`;
}

/** Funções comuns de pequenos negócios dos EUA (um toque para preencher). */
const SUGGESTED_ROLES = ["Technician", "Helper", "Office", "Owner"] as const;

// ---------- cadastrar ----------

export function AddMemberButton({
  defaultColor,
  label = "Add team member",
}: {
  defaultColor: TeamColor;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <GlassButton variant="primary" icon={<PlusIcon />} onClick={() => setOpen(true)}>
        {label}
      </GlassButton>
      <GlassSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add team member"
        description="They won’t get a login. You’ll assign them to jobs on your schedule."
        size="lg"
        dismissible={!busy}
      >
        {open && (
          <MemberForm
            member={null}
            defaultColor={defaultColor}
            onBusy={setBusy}
            onCancel={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        )}
      </GlassSheet>
    </>
  );
}

// ---------- menu de uma pessoa ----------

export function MemberMenu({ member, readOnly }: { member: TeamMember; readOnly: boolean }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setActive(active: boolean) {
    setPending(true);
    setError(null);
    try {
      await clientsApi(memberUrl(member.id), TeamMemberResponse, {
        method: "PATCH",
        body: UpdateTeamMemberRequest.parse({ active }),
      });
      setConfirmOpen(false);
      router.refresh();
    } catch (err) {
      const problem = toClientsError(err).message;
      setError(problem);
      // Reativar não tem caixa de confirmação: mostra o erro numa folha simples.
      if (active) setConfirmOpen(true);
    } finally {
      setPending(false);
    }
  }

  const items: GlassMenuItem[] = [];
  if (!readOnly) {
    items.push({ label: "Edit", icon: <EditIcon />, onSelect: () => setEditOpen(true) });
  }
  if (member.phone) {
    const tel = phoneHref(member.phone);
    items.push(
      { type: "link", label: "Call", href: `tel:${tel}`, icon: <PhoneIcon />, key: "call" },
      { type: "link", label: "Text", href: `sms:${tel}`, icon: <TextIcon />, key: "text" },
    );
  }
  if (!readOnly) {
    if (member.active) {
      items.push(
        { type: "separator", key: "sep" },
        {
          label: "Deactivate",
          icon: <CancelIcon />,
          destructive: true,
          onSelect: () => {
            setError(null);
            setConfirmOpen(true);
          },
        },
      );
    } else {
      items.push({
        label: "Reactivate",
        icon: <RestoreIcon />,
        disabled: pending,
        onSelect: () => void setActive(true),
      });
    }
  }
  if (items.length === 0) return null;

  return (
    <>
      <GlassMenu items={items} label={`More actions for ${member.name}`} />
      {!readOnly && (
        <>
          <GlassSheet
            open={editOpen}
            onClose={() => setEditOpen(false)}
            title={`Edit ${member.name}`}
            size="lg"
            dismissible={!busy}
          >
            {editOpen && (
              <MemberForm
                member={member}
                defaultColor={member.color}
                onBusy={setBusy}
                onCancel={() => setEditOpen(false)}
                onSaved={() => {
                  setEditOpen(false);
                  router.refresh();
                }}
              />
            )}
          </GlassSheet>
          <ConfirmDialog
            open={confirmOpen}
            title={member.active ? `Deactivate ${member.name}?` : `Couldn’t reactivate ${member.name}`}
            confirmLabel={member.active ? "Deactivate" : "Try again"}
            pendingLabel={member.active ? "Deactivating…" : "Saving…"}
            tone={member.active ? "destructive" : "primary"}
            pending={pending}
            error={error}
            onConfirm={() => void setActive(!member.active)}
            onCancel={() => setConfirmOpen(false)}
          >
            {member.active
              ? "They come off the team list and can’t be assigned to new jobs. Jobs they already have keep their name. You can reactivate them anytime."
              : undefined}
          </ConfirmDialog>
        </>
      )}
    </>
  );
}

// ---------- formulário ----------

type Field = "name" | "role" | "phone" | "email";

function MemberForm({
  member,
  defaultColor,
  onBusy,
  onCancel,
  onSaved,
}: {
  /** `null` = cadastro novo. */
  member: TeamMember | null;
  defaultColor: TeamColor;
  onBusy: (busy: boolean) => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const ids = useId();
  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState(member?.role ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [color, setColor] = useState<TeamColor>(member?.color ?? defaultColor);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const body = {
      name,
      role: role.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      color,
    };
    const parsed = member
      ? UpdateTeamMemberRequest.safeParse(body)
      : CreateTeamMemberRequest.safeParse(body);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "name" || key === "role" || key === "phone" || key === "email") && !next[key]) {
          next[key] = issue.message;
        }
      }
      if (Object.keys(next).length === 0) {
        next.name = parsed.error.issues[0]?.message ?? "Please check the form.";
      }
      setErrors(next);
      document.getElementById(`${ids}-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setErrors({});
    setPending(true);
    onBusy(true);
    try {
      await clientsApi(
        member ? memberUrl(member.id) : "/api/office/team",
        TeamMemberResponse,
        { method: member ? "PATCH" : "POST", body: parsed.data },
      );
      onBusy(false);
      onSaved();
    } catch (err) {
      setError(toClientsError(err));
      setPending(false);
      onBusy(false);
    }
  }

  const errorProps = (field: Field) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `${ids}-${field}-error` }
      : {};

  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`${ids}-${field}-error`} className={fieldErrorClass}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-label={member ? "Edit team member" : "Add team member"}>
      <fieldset disabled={pending} className="grid gap-5">
        <div>
          <label htmlFor={`${ids}-name`} className={labelClass}>
            Name
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            autoCapitalize="words"
            maxLength={120}
            className={`${fieldClass} mt-1.5 h-11`}
            {...errorProps("name")}
          />
          {errorText("name")}
        </div>

        <div>
          <label htmlFor={`${ids}-role`} className={labelClass}>
            Role <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id={`${ids}-role`}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            autoComplete="off"
            autoCapitalize="words"
            maxLength={40}
            placeholder="Technician"
            className={`${fieldClass} mt-1.5 h-11`}
            {...errorProps("role")}
          />
          {errorText("role")}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED_ROLES.filter((r) => r.toLowerCase() !== role.trim().toLowerCase()).map(
              (suggestion) => (
                <GlassButton key={suggestion} variant="secondary" onClick={() => setRole(suggestion)}>
                  {suggestion}
                </GlassButton>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${ids}-phone`} className={labelClass}>
              Mobile phone <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id={`${ids}-phone`}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="off"
              placeholder="(512) 555-0100"
              maxLength={40}
              className={`${fieldClass} mt-1.5 h-11`}
              {...errorProps("phone")}
            />
            {errorText("phone")}
          </div>
          <div>
            <label htmlFor={`${ids}-email`} className={labelClass}>
              Email <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id={`${ids}-email`}
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              maxLength={254}
              className={`${fieldClass} mt-1.5 h-11`}
              {...errorProps("email")}
            />
            {errorText("email")}
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Calendar color</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {TEAM_COLORS.map((option) => (
              <label
                key={option}
                title={TEAM_COLOR_STYLES[option].label}
                className="grid size-11 cursor-pointer place-items-center rounded-full has-checked:ring-2 has-checked:ring-ink has-checked:ring-offset-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-brand"
              >
                <input
                  type="radio"
                  name={`${ids}-color`}
                  value={option}
                  checked={color === option}
                  onChange={() => setColor(option)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cx("size-8 rounded-full", TEAM_COLOR_STYLES[option].dot)}
                />
                <span className="sr-only">{TEAM_COLOR_STYLES[option].label}</span>
              </label>
            ))}
          </div>
          <p className={hintClass}>Their jobs show in this color on the schedule.</p>
        </fieldset>
      </fieldset>

      {error && <ErrorNote error={error} className="mt-5" />}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <GlassButton variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" variant="primary" loading={pending}>
          {pending ? "Saving…" : member ? "Save changes" : "Add to team"}
        </GlassButton>
      </div>
    </form>
  );
}
