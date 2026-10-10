import { useState } from "react";
import type { SubmitEvent } from "react";
import { useChatStore } from "../store/useChatStore";
import styles from "./NewChatForm.module.css";

function NewChatForm() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const createChat = useChatStore((s) => s.createChat);

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, ""); // keep only digits: "+7 (900) 123" -> "7900123"
    if (digits.length < 10 || digits.length > 15) {
      setError("Enter the full number with country code, e.g. 79001234567");
      return;
    }
    setError("");
    createChat(digits);
    setPhone("");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number, e.g. 79001234567"
      />
      <button className={styles.button} type="submit">New chat</button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

export default NewChatForm;
