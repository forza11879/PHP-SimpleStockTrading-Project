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
        <p className="errorList">{state.errors[0]}</p>
      )}
      <form action={formAction}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            className="form-control"
            id="email"
            placeholder="Enter email"
            name="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pwd">Password:</label>
          <input
            type="password"
            className="form-control"
            id="pwd"
            placeholder="Enter password"
            name="password"
          />
        </div>
        <div>
          <label>
            <a href="/register">Register</a>
          </label>
          <br />
        </div>
        <button type="submit" className="btn btn-default" disabled={pending}>
          Submit
        </button>
      </form>
    </>
  );
}