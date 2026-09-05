"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestQuoteAction, type QuoteState } from "@/src/lib/actions";

const INITIAL: QuoteState = { status: "idle", symbol: null, message: null };
/** How long the "Added …" confirmation stays visible (ms). */
const SUCCESS_TTL_MS = 5000;

function messageClass(status: QuoteState["status"]): string {
  switch (status) {
    case "added":
      return "text-green-600";
    case "exists":
      return "text-muted";
    default:
      return "text-red-600";
  }
}

export default function GetQuoteForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<QuoteState, FormData>(
    requestQuoteAction,
    INITIAL,
  );
  // Refresh the server-rendered watch list once per successful add, so the
  // new row appears without a page reload. Identity-keyed to survive
  // re-renders and re-adding a previously removed symbol.
  const refreshedFor = useRef<QuoteState | null>(null);
  useEffect(() => {
    if (state.status === "added" && refreshedFor.current !== state) {
      refreshedFor.current = state;
      router.refresh();
    }
  }, [state, router]);

  // Auto-dismiss the success confirmation after 5 seconds. Each new success
  // state clears the previous timer and starts a fresh one; the effect
  // cleanup clears the timer on unmount (or superseded success) so no
  // setState can fire afterwards. Other statuses are unaffected.
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dismissed, setDismissed] = useState<QuoteState | null>(null);
  useEffect(() => {
    if (state.status !== "added") return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      dismissTimer.current = null;
      setDismissed(state);
    }, SUCCESS_TTL_MS);
    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [state]);

  const showMessage =
    state.status !== "idle" &&
    state.message !== null &&
    (state.status !== "added" || dismissed !== state);
  const isError =
    state.status === "invalid" ||
    state.status === "fetch-failed" ||
    state.status === "unauthenticated";

  return (
    <div className="mb-4">
      <form action={formAction} className="flex gap-2">
        <label htmlFor="symbol-input" className="sr-only">
          Symbol
        </label>
        <input
          type="text"
          id="symbol-input"
          name="symbol"
          placeholder="Symbol"
          disabled={pending}
          className="border border-line bg-surface px-3 py-1.5 text-sm uppercase placeholder:normal-case placeholder:text-muted disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink disabled:opacity-40"
        >
          {pending ? "Getting…" : "Get Quote"}
        </button>
      </form>
      {pending && (
        <p role="status" className="mt-2 text-sm text-muted">
          Looking up quote…
        </p>
      )}
      {!pending && showMessage && (
        <p
          role={isError ? "alert" : "status"}
          className={`mt-2 text-sm ${messageClass(state.status)}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
