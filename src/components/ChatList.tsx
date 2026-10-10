import type { Chat } from "../types";
import { useChatStore } from "../store/useChatStore";
import styles from "./ChatList.module.css";

// Time of the newest message; a chat without messages counts as newest,
// so a chat you just created shows up at the top
function lastActivity(chat: Chat) {
  return chat.messages.at(-1)?.timestamp ?? Infinity;
}

function ChatList() {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);

  if (!chats.length) {
    return (
      <p className={styles.empty}>
        No chats yet. Enter a phone number above to start one.
      </p>
    );
  }

  // Most recent chat first. Sorted here, not in the selector: a selector that returns
  // a new array every time would make Zustand re-render forever.
  const sorted = [...chats].sort((a, b) => lastActivity(b) - lastActivity(a));

  return (
    <ul className={styles.list}>
      {sorted.map((c) => {
        const isActive = c.chatId === activeChatId;
        return (
          <li key={c.chatId}>
            <button
              type="button"
              className={
                isActive ? `${styles.item} ${styles.active}` : styles.item
              }
              aria-current={isActive}
              onClick={() => setActiveChat(c.chatId)}
            >
              +{c.phone}
              {!!c.unread && (
                <span
                  className={styles.badge}
                  aria-label={`${c.unread} unread`}
                >
                  {c.unread}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default ChatList;
