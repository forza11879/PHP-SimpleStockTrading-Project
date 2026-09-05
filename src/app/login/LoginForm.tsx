"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/src/lib/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    loginAction,
    { errors: [] },
  );

  return (
    <>
      {state.errors && state.errors.length > 0 && (
        <p className="mb-3 text-sm text-red-600">{state.errors[0]}</p>
      )}
      <form action={formAction}>
        <label htmlFor="email" className="text-xs text-muted">
          Email
        </label>
        <input
          type="email"
          id="email"
          placeholder="Enter email"
          name="email"
          className="mb-3 mt-1 w-full border border-line bg-surface px-3 py-1.5 text-sm"
        />
        <label htmlFor="pwd" className="text-xs text-muted">
          Password
        </label>
        <input
          type="password"
          id="pwd"
          placeholder="Enter password"
          name="password"
          className="mb-3 mt-1 w-full border border-line bg-surface px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-accent px-3 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40"
        >
          Log In
        </button>
      </form>
      <p className="mt-3 flex justify-between text-xs">
        <a href="/register" className="text-accent">
          Register
        </a>
        <a href="/passreset" className="text-accent">
          Forgot password?
        </a>
      </p>
    </>
  );
}
