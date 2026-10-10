import { useChatStore } from "../store/useChatStore";
import styles from "./ChatList.module.css";

function ChatList() {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);

  return (
    <ul className={styles.list}>
      {chats.map((c) => (
        <li
          key={c.chatId}
          className={c.chatId === activeChatId ? `${styles.item} ${styles.active}` : styles.item}
          onClick={() => setActiveChat(c.chatId)}
        >
          +{c.phone}
          {!!c.unread && <span className={styles.badge}>{c.unread}</span>}
        </li>
      ))}
    </ul>
  );
}

export default ChatList;
