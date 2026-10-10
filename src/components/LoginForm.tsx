import { useState } from "react";
import type { SubmitEvent } from "react";
import type { Credentials } from "../types";
import { getStateInstance } from "../api/greenApi";
import styles from "./LoginForm.module.css";

interface Props {
  onLogin: (c: Credentials) => void;
}

function LoginForm({ onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState(""); // should be your own GREEN-API instance
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the browser from reloading the page
    const credentials: Credentials = {
      apiUrl: apiUrl.trim().replace(/\/+$/, ""), // remove a trailing "/"
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    };

    setError("");
    setLoading(true);
    try {
      const state = await getStateInstance(credentials);
      if (state === "authorized") {
        onLogin(credentials);
      } else {
        setError(
          `Instance is not ready (state: ${state}). Link WhatsApp in the GREEN-API console.`
        );
      }
    } catch {
      setError(
        "Could not log in. Check apiUrl, idInstance and apiTokenInstance."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Login to GREEN-API</h2>
        <input
          className={styles.input}
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="apiUrl from your GREEN-API console"
          required
        />
        <input
          className={styles.input}
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          placeholder="idInstance"
          required
        />
        <input
          className={styles.input}
          type="password"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
          placeholder="apiTokenInstance"
          required
        />
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Checking…" : "Login"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
}

export default LoginForm;
