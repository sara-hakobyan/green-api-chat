import { useActionState, useId } from "react";
import type { Credentials } from "../types";
import { ApiError, getStateInstance } from "../api/greenApi";
import { useAuthStore } from "../store/useAuthstore";
import styles from "./LoginForm.module.css";

// What the login action returns: an error to show, and the values to put back in the inputs
interface LoginState {
  error: string;
  values: Credentials;
}

const initialState: LoginState = {
  error: "",
  values: { apiUrl: "", idInstance: "", apiTokenInstance: "" }, // apiUrl: your own GREEN-API instance
};

// Turns a failed getStateInstance call into a message that says what to fix
function loginErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return "Wrong idInstance or apiTokenInstance. Copy them again from the GREEN-API console.";
    }
    return `GREEN-API returned an error (${err.status}). Check idInstance and try again.`;
  }
  // fetch itself throws a TypeError when the server can't be reached (wrong host, offline)
  if (err instanceof TypeError) {
    return "Could not reach apiUrl. Check the address and your internet connection.";
  }
  return "Could not log in. Check apiUrl, idInstance and apiTokenInstance.";
}

function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const errorId = useId();

  // Runs on form submit. useActionState tracks isPending and keeps the returned state,
  // so we don't need useState for every field, the error and loading.
  const [state, loginAction, isPending] = useActionState<LoginState, FormData>(
    async (_prev, formData) => {
      const field = (name: string) => String(formData.get(name) ?? "").trim();
      const credentials: Credentials = {
        apiUrl: field("apiUrl").replace(/\/+$/, ""), // remove a trailing "/"
        idInstance: field("idInstance"),
        apiTokenInstance: field("apiTokenInstance"),
      };

      try {
        const instanceState = await getStateInstance(credentials);
        if (instanceState === "authorized") {
          login(credentials);
          return initialState;
        }
        return {
          error: `Instance is not ready (state: ${instanceState}). Link WhatsApp in the GREEN-API console.`,
          values: credentials,
        };
      } catch (err) {
        return { error: loginErrorMessage(err), values: credentials };
      }
    },
    initialState
  );

  // Shared props that link each input to the error message for screen readers
  const errorProps = {
    "aria-invalid": !!state.error,
    "aria-describedby": state.error ? errorId : undefined,
  };

  return (
    <div className={styles.page}>
      {/* With action={...} React resets the form after submit. The inputs are
          uncontrolled, so on failure they are refilled from state.values. */}
      <form className={styles.form} action={loginAction}>
        <h2 className={styles.title}>Login to GREEN-API</h2>
        <input
          className={styles.input}
          name="apiUrl"
          defaultValue={state.values.apiUrl}
          placeholder="apiUrl from your GREEN-API console"
          aria-label="apiUrl"
          autoComplete="url"
          required
          {...errorProps}
        />
        <input
          className={styles.input}
          name="idInstance"
          defaultValue={state.values.idInstance}
          placeholder="idInstance"
          aria-label="idInstance"
          autoComplete="username"
          required
          {...errorProps}
        />
        <input
          className={styles.input}
          type="password"
          name="apiTokenInstance"
          defaultValue={state.values.apiTokenInstance}
          placeholder="apiTokenInstance"
          aria-label="apiTokenInstance"
          autoComplete="current-password"
          required
          {...errorProps}
        />
        <button className={styles.button} type="submit" disabled={isPending}>
          {isPending ? "Checking…" : "Login"}
        </button>
        {state.error && (
          <p id={errorId} className={styles.error} role="alert">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}

export default LoginForm;
