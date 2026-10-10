import { useActionState, useId } from "react";
import { useChatStore } from "../store/useChatStore";
import styles from "./NewChatForm.module.css";

// What the action returns: an error to show, and the text to put back in the input
interface NewChatState {
  error: string;
  phone: string;
}

function NewChatForm() {
  const createChat = useChatStore((s) => s.createChat);
  const errorId = useId();

  // Runs on form submit and keeps the returned state, so no useState is needed
  const [state, newChatAction] = useActionState<NewChatState, FormData>(
    (_prev, formData) => {
      const phone = String(formData.get("phone") ?? "");
      const digits = phone.replace(/\D/g, ""); // keep only digits: "+7 (900) 123" -> "7900123"
      if (digits.length < 10 || digits.length > 15) {
        return {
          error: "Enter the full number with country code, e.g. 79001234567",
          phone,
        };
      }
      createChat(digits);
      return { error: "", phone: "" };
    },
    { error: "", phone: "" }
  );

  return (
    // With action={...} React resets the form after submit; on error the input
    // is refilled from state.phone so the user can fix the number
    <form className={styles.form} action={newChatAction}>
      <input
        className={styles.input}
        name="phone"
        defaultValue={state.phone}
        placeholder="Phone number, e.g. 79001234567"
        aria-label="Phone number"
        aria-invalid={!!state.error}
        aria-describedby={state.error ? errorId : undefined}
      />
      <button className={styles.button} type="submit">New chat</button>
      {state.error && (
        <p id={errorId} className={styles.error} role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

export default NewChatForm;
