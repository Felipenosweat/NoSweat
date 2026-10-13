"use client";

import { ApiError, PublishSiteResponse } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishButton({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, { method: "POST" });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
        return;
      }
      PublishSiteResponse.parse(body);
      router.refresh();
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={publish}
        disabled={pending}
        className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-70"
      >
        {pending ? "Publishing..." : "Publish my website"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
