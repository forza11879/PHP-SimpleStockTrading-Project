"use client";

import { useActionState, useState } from "react";
import { registerAction, type FormState } from "@/src/lib/actions";

const inputClass =
  "mb-3 mt-1 w-full border border-line bg-surface px-3 py-1.5 text-sm";
const labelClass = "text-xs text-muted";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    registerAction,
    { errors: [], values: { email: "", name: "", pass1: "", pass2: "" } },
  );
  const [emailInUse, setEmailInUse] = useState(false);

  async function checkEmail(email: string) {
    if (email === "") {
      setEmailInUse(false);
      return;
    }
    try {
      const res = await fetch(`/ajax/emailused/${encodeURIComponent(email)}`);
      const result = await res.json();
      setEmailInUse(!!result);
    } catch {
      setEmailInUse(false);
    }
  }

  const values = state.values ?? {};

  return (
    <>
      {state.errors && state.errors.length > 0 && (
        <ul className="mb-3 text-sm text-red-600">
          {state.errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}
      <form action={formAction}>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>{" "}
        <span id="emailInUse" className="text-xs text-red-600">
          {emailInUse ? "Email already registered" : ""}
        </span>
        <input
          type="email"
          id="email"
          placeholder="Enter email"
          name="email"
          defaultValue={values.email ?? ""}
          onChange={(e) => checkEmail(e.target.value)}
          className={inputClass}
        />
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          type="text"
          id="name"
          placeholder="Enter name"
          name="name"
          defaultValue={values.name ?? ""}
          className={inputClass}
        />
        <label htmlFor="pwd" className={labelClass}>
          Password
        </label>
        <input
          type="password"
          id="pwd"
          placeholder="Enter password"
          name="pass1"
          defaultValue={values.pass1 ?? ""}
          className={inputClass}
        />
        <label htmlFor="pwd2" className={labelClass}>
          Confirm password
        </label>
        <input
          type="password"
          id="pwd2"
          placeholder="Re-enter password"
          name="pass2"
          defaultValue={values.pass2 ?? ""}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-accent px-3 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40"
        >
          Register
        </button>
      </form>
      <p className="mt-3 text-xs">
        <a href="/login" className="text-accent">
          Back to Log In
        </a>
      </p>
    </>
  );
}
