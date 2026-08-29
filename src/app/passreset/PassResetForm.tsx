"use client";

import { useActionState } from "react";
import {
  passResetRequestAction,
  passResetFormAction,
  type PassResetState,
} from "@/src/lib/actions";

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
          <ul>
            {state.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        )}
        <p>Enter your new password below.</p>
        <form action={formAction}>
          Password: <input type="password" name="pass1" />
          <br />
          Password (repeated) <input type="password" name="pass2" />
          <br />
          <input
            type="submit"
            value="Reset password"
            className="btn btn-primary"
            disabled={pending}
          />
        </form>
      </>
    );
  }

  return (
    <>
      {state.errors && state.errors.length > 0 && (
        <p>
          <b>{state.errors[0]} Try again or register a new account</b>
        </p>
      )}
      <form action={formAction}>
        Enter your email: <input type="email" name="email" />
        <br />
        <input
          type="submit"
          value="Request password reset"
          className="btn btn-primary"
          disabled={pending}
        />
      </form>
    </>
  );
}