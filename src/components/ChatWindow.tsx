import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useOptimistic,
  useRef,
  useState,
} from "react";
import type { SubmitEvent } from "react";
import type { Chat, Message } from "../types";
import { useChatStore } from "../store/useChatStore";
import styles from "./ChatWindow.module.css";

type ShownMessage = Message & { pending?: boolean };

// "14:05" from a timestamp in milliseconds
function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatWindow() {
  const activeChat = useChatStore((s) =>
    s.chats.find((c) => c.chatId === s.activeChatId)
  );

  if (!activeChat) {
    return <p className={styles.empty}>Select a chat or create a new one</p>;
  }

  return <ActiveChat key={activeChat.chatId} chat={activeChat} />;
}

function ActiveChat({ chat }: { chat: Chat }) {
  const sendText = useChatStore((s) => s.sendText);
  const allowedChatIds = useChatStore((s) => s.allowedChatIds);

  const messagesRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  // Show the message right away, before the server answers.
  // If sending works, the real message takes its place. If it fails, it disappears.
  const [messages, addOptimisticMessage] = useOptimistic<
    ShownMessage[],
    ShownMessage
  >(chat.messages, (current, message) => [...current, message]);

  const [text, setText] = useState("");

  // Sends one message. useActionState tracks isPending and keeps the error it returns.
  const [error, sendAction, isPending] = useActionState<string, string>(
    async (_prev, message) => {
      addOptimisticMessage({
        id: crypto.randomUUID(),
        text: message,
        direction: "outgoing",
        timestamp: Date.now(),
        pending: true,
      });
      try {
        await sendText(chat.chatId, message);
        return "";
      } catch {
        // Put the text back so the user can retry without typing it again.
        // If they already started typing something new, keep that instead.
        setText((current) => current || message);
        return "Message was not sent. Try again.";
      } finally {
        // Clicking "Send" moves focus to the button; put it back so the user can keep typing
        inputRef.current?.focus();
      }
    },
    ""
  );

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = text.trim();
    if (!message) return;

    setText(""); // clear the input right away; the message is already shown in the chat
    // An action called outside <form action> must run inside startTransition
    startTransition(() => sendAction(message));
  }

  // Scroll to the newest message. Changing the DOM's scroll position is a side effect
  // that rendering can't do, so it goes in an effect. It runs after React has added the
  // new <li>, so scrollHeight already includes it. It runs when the chat opens (mount)
  // and every time a message is sent, shown optimistically or received (length changes).
  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  // Limit reached and this chat is not one of the allowed ones
  const isLimited =
    allowedChatIds.length > 0 && !allowedChatIds.includes(chat.chatId);
  const allowedPhones = allowedChatIds
    .map((id) => "+" + id.replace("@c.us", ""))
    .join(", ");
  const showError = !!error && !isLimited;

  return (
    <>
      <header className={styles.header}>+{chat.phone}</header>

      <ul ref={messagesRef} className={styles.messages}>
        {messages.map((m) => (
          <li
            key={m.id}
            className={[
              styles.bubble,
              m.direction === "outgoing" && styles.outgoing,
              m.pending && styles.pending,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {m.text}
            <span className={styles.time}>
              {m.pending ? "Sending…" : formatTime(m.timestamp)}
            </span>
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
      {showError && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}

      {/* onSubmit, not action={...}: with a form action React clears the input only after
          the server answers, but here it should be empty as soon as Send is clicked */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          className={styles.input}
          placeholder="Type a message"
          aria-label="Message"
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
        />
        <button
          className={styles.send}
          type="submit"
          disabled={isPending || !text.trim()}
        >
          {isPending ? "Sending…" : "Send"}
        </button>
      </form>
    </>
  );
}

export default ChatWindow;
