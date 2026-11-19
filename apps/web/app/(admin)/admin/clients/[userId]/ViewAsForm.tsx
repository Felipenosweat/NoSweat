"use client";

import { useActionState } from "react";
import { GlassButton, Notice } from "@/components/glass";
import { fieldClass, labelClass } from "../../AdminUi";
import type { ViewAsState } from "./actions";

// "Ver como esta conta": o motivo é obrigatório e vai para o registro de auditoria (/admin/audit).

type ViewAsAction = (prev: ViewAsState, formData: FormData) => Promise<ViewAsState>;

const initialState: ViewAsState = { error: null };

export function ViewAsForm({ action }: { action: ViewAsAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="grid w-full gap-2 sm:w-72">
      <label className={labelClass}>
        Reason
        <input
          name="reason"
          required
          minLength={3}
          maxLength={300}
          placeholder="e.g. Support ticket: site not loading"
          className={fieldClass}
        />
      </label>
      <GlassButton type="submit" variant="primary" loading={pending}>
        {pending ? "Opening…" : "View as this account"}
      </GlassButton>
      {state.error && (
        <Notice tone="error" size="sm">
          {state.error}
        </Notice>
      )}
    </form>
  );
}
