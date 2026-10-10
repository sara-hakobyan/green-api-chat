import { useState } from "react";
import type { SubmitEvent } from "react";
import { useChatStore } from "../store/useChatStore";
import styles from "./ChatWindow.module.css";

// "14:05" from a timestamp in milliseconds
function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatWindow() {
  const activeChat = useChatStore((s) =>
    s.chats.find((c) => c.chatId === s.activeChatId)
  );
  const sendText = useChatStore((s) => s.sendText);
  const allowedChatIds = useChatStore((s) => s.allowedChatIds);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!activeChat) {
    return <p className={styles.empty}>Select a chat or create a new one</p>;
  }

  // Limit reached and this chat is not one of the allowed ones
  const isLimited =
    allowedChatIds.length > 0 && !allowedChatIds.includes(activeChat.chatId);
  const allowedPhones = allowedChatIds
    .map((id) => "+" + id.replace("@c.us", ""))
    .join(", ");

  async function handleSend(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = text.trim();
    if (!message || !activeChat) return;

    setSending(true);
    setError("");
    try {
      await sendText(activeChat.chatId, message);
      setText("");
    } catch {
      setError("Message was not sent. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <header className={styles.header}>+{activeChat.phone}</header>

      <ul className={styles.messages}>
        {activeChat.messages.map((m) => (
          <li
            key={m.id}
            className={m.direction === "outgoing" ? `${styles.bubble} ${styles.outgoing}` : styles.bubble}
          >
            {m.text}
            <span className={styles.time}>{formatTime(m.timestamp)}</span>
          </li>
        ))}
      </ul>

      {isLimited && (
        <p className={styles.notice}>
          Message limit reached. This month you can only send and receive
          messages with: {allowedPhones}. Messages with this number will not go
          through.
        </p>
      )}
      {error && !isLimited && (
        <p className={styles.error}>{error}</p>
      )}

      <form className={styles.form} onSubmit={handleSend}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
        />
        <button className={styles.send} type="submit" disabled={sending || !text.trim()}>
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </>
  );
}

export default ChatWindow;
