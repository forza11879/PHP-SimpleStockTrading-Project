"use client";

import { useActionState, useState } from "react";
import { registerAction, type FormState } from "@/src/lib/actions";

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
        <ul className="errorList">
          {state.errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}
      <form action={formAction}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>{" "}
          <span style={{ color: "red" }} id="emailInUse">
            {emailInUse ? "Email already registered" : ""}
          </span>
          <input
            type="email"
            className="form-control"
            id="email"
            placeholder="Enter email"
            name="email"
            defaultValue={values.email ?? ""}
            onChange={(e) => checkEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            className="form-control"
            id="name"
            placeholder="Enter name"
            name="name"
            defaultValue={values.name ?? ""}
          />
        </div>
        <div className="form-group">
          <label htmlFor="pass1">Password:</label>
          <input
            type="password"
            className="form-control"
            id="pwd"
            placeholder="Enter password"
            name="pass1"
            defaultValue={values.pass1 ?? ""}
          />
        </div>
        <div className="form-group">
          <label htmlFor="pass2">Password:</label>
          <input
            type="password"
            className="form-control"
            id="pwd2"
            placeholder="Re-Enter password"
            name="pass2"
            defaultValue={values.pass2 ?? ""}
          />
        </div>
        <div className="checkbox">
          <label>
            <a href="/login">Login</a>
          </label>
        </div>
        <button type="submit" className="btn btn-default" disabled={pending}>
          Submit
        </button>
      </form>
    </>
  );
}