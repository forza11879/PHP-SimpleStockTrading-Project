"use client";

import { useActionState } from "react";
import {
  passResetRequestAction,
  passResetFormAction,
  type PassResetState,
} from "@/src/lib/actions";

const inputClass =
  "mb-3 mt-1 w-full border border-line bg-surface px-3 py-1.5 text-sm";
const submitClass =
  "w-full rounded bg-accent px-3 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40";

export default function PassResetForm({ token }: { token?: string }) {
  const action = token ? passResetFormAction.bind(null, token) : passResetRequestAction;
  const [state, formAction, pending] = useActionState<PassResetState, FormData>(
    action,
    { errors: [] },
  );

  if (token) {
    return (
      <>
        {state.errors && state.errors.length > 0 && (
          <ul className="mb-3 text-sm text-red-600">
            {state.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        )}
        <p className="mb-3 text-sm text-muted">Enter your new password below.</p>
        <form action={formAction}>
          <label htmlFor="pass1" className="text-xs text-muted">
            New password
          </label>
          <input
            type="password"
            id="pass1"
            name="pass1"
            className={inputClass}
          />
          <label htmlFor="pass2" className="text-xs text-muted">
            Confirm new password
          </label>
          <input
            type="password"
            id="pass2"
            name="pass2"
            className={inputClass}
          />
          <button type="submit" disabled={pending} className={submitClass}>
            Reset password
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      {state.errors && state.errors.length > 0 && (
        <p className="mb-3 text-sm text-red-600">
          <b>
            {state.errors[0]} Try again or register a new account
          </b>
        </p>
      )}
      <form action={formAction}>
        <label htmlFor="email" className="text-xs text-muted">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter email"
          className={inputClass}
        />
        <button type="submit" disabled={pending} className={submitClass}>
          Request password reset
        </button>
      </form>
    </>
  );
}
