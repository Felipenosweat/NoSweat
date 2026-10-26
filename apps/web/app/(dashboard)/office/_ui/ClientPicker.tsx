"use client";

import { ClientDetailResponse, ClientsResponse, type Client } from "@nosweat/schema";
import { useState } from "react";
import {
  GlassButton,
  GlassSearchField,
  GlassSheet,
  SpinnerIcon,
  cx,
  focusRing,
} from "@/components/glass";
import { ClientForm } from "../../clients/ClientForm";
import { Avatar } from "../../clients/ui";
import { ErrorNote, officeApi, toOfficeError, type OfficeApiError } from "./api";
import { PlusIcon, UserIcon } from "./ui";

// Escolha do cliente de um orçamento/fatura novo: um botão que abre a lista de clientes (GET
// /api/clients, lida na primeira abertura) com busca, e "New client" com o mesmo cadastro da tela
// de clientes. Depois de criado, o documento fica preso ao cliente (o contrato não muda o cliente).

export type PickedClient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

function toPicked(client: Client): PickedClient {
  return { id: client.id, name: client.name, phone: client.phone, email: client.email };
}

function matches(client: Client, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const digits = query.replace(/\D/g, "");
  return (
    client.name.toLowerCase().includes(query) ||
    (client.email ?? "").toLowerCase().includes(query) ||
    (digits.length >= 3 && (client.phone ?? "").replace(/\D/g, "").includes(digits))
  );
}

export function ClientPicker({
  value,
  onChange,
  invalid,
  errorId,
}: {
  value: PickedClient | null;
  onChange: (client: PickedClient) => void;
  invalid?: boolean;
  errorId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "new">("list");
  const [clients, setClients] = useState<Client[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const [query, setQuery] = useState("");
  const [formKey, setFormKey] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await officeApi("/api/clients", ClientsResponse);
      setClients(
        [...result.clients].sort((a, b) =>
          a.name.localeCompare(b.name, "en-US", { sensitivity: "base" }),
        ),
      );
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setLoading(false);
    }
  }

  function show() {
    setMode("list");
    setQuery("");
    setOpen(true);
    if (clients === null && !loading) void load();
  }

  function pick(client: PickedClient) {
    onChange(client);
    setOpen(false);
  }

  async function created(id: string) {
    try {
      const result = await officeApi(
        `/api/clients/${encodeURIComponent(id)}`,
        ClientDetailResponse,
      );
      setClients((list) => (list ? [result.client, ...list] : list));
      pick(toPicked(result.client));
    } catch (err) {
      setError(toOfficeError(err));
      setMode("list");
    }
  }

  const shown = clients ? clients.filter((client) => matches(client, query)) : [];

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-invalid={invalid || undefined}
        aria-describedby={errorId}
        className={cx(
          "glass glass-interactive flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left aria-invalid:ring-2 aria-invalid:ring-red-500",
          focusRing,
        )}
      >
        {value ? (
          <>
            <Avatar name={value.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-ink">
                {value.name}
              </span>
              <span className="block truncate text-[13px] text-slate-600">
                {[value.phone, value.email].filter(Boolean).join(" · ") || "No contact info"}
              </span>
            </span>
            <span className="text-[13px] font-semibold text-brand">Change</span>
          </>
        ) : (
          <>
            <span
              aria-hidden="true"
              className="glass-edge grid size-9 place-items-center rounded-full bg-brand/10 text-brand [&>svg]:size-5"
            >
              <UserIcon />
            </span>
            <span className="flex-1 text-[15px] font-semibold text-brand">Choose a client</span>
          </>
        )}
      </button>

      <GlassSheet
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "new" ? "New client" : "Choose a client"}
        size="lg"
      >
        {mode === "new" ? (
          <ClientForm
            key={formKey}
            onCancel={() => setMode("list")}
            onCreated={(id) => void created(id)}
          />
        ) : (
          <div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <GlassSearchField
                label="Search clients"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery("")}
                placeholder="Search name, phone, email"
                autoComplete="off"
                className="flex-1"
              />
              <GlassButton
                variant="secondary"
                icon={<PlusIcon />}
                onClick={() => {
                  setFormKey((key) => key + 1);
                  setMode("new");
                }}
              >
                New client
              </GlassButton>
            </div>

            {error && <ErrorNote error={error} className="mt-3" />}

            {loading ? (
              <p className="flex items-center gap-2 py-8 text-[15px] text-slate-500" role="status">
                <SpinnerIcon className="size-5" /> Loading your clients…
              </p>
            ) : clients && clients.length === 0 ? (
              <p className="py-8 text-center text-[15px] text-slate-500">
                No clients yet. Tap &ldquo;New client&rdquo; to add one.
              </p>
            ) : clients ? (
              shown.length === 0 ? (
                <p className="py-8 text-center text-[15px] text-slate-500">No clients match.</p>
              ) : (
                <ul className="mt-3 max-h-[50dvh] divide-y divide-(--glass-rim) overflow-y-auto">
                  {shown.map((client) => (
                    <li key={client.id}>
                      <button
                        type="button"
                        onClick={() => pick(toPicked(client))}
                        className={cx(
                          "flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-(--glass-ghost-hover)",
                          focusRing,
                        )}
                      >
                        <Avatar name={client.name} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-ink">
                            {client.name}
                          </span>
                          <span className="block truncate text-[13px] text-slate-600">
                            {[client.phone, client.email].filter(Boolean).join(" · ") ||
                              "No contact info"}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        )}
      </GlassSheet>
    </>
  );
}
