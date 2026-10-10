import LoginForm from "./components/LoginForm";
import NewChatForm from "./components/NewChatForm";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import { useAuthStore } from "./store/useAuthstore";
import { useChatStore } from "./store/useChatStore";
import { useNotificationPolling } from "./hooks/useNotificationPolling";
import styles from "./App.module.css";

function App() {
  const credentials = useAuthStore((s) => s.credentials);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const clearChats = useChatStore((s) => s.clearChats);

  useNotificationPolling();

  if (!credentials) {
    return <LoginForm onLogin={login} />;
  }

  function handleLogout() {
    clearChats();
    logout();
  }

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <span>Instance {credentials.idInstance}</span>
          <button className={styles.logout} onClick={handleLogout}>
            Logout
          </button>
        </header>
        <NewChatForm />
        <ChatList />
      </aside>

      <main className={styles.main}>
        <ChatWindow />
      </main>
    </div>
  );
}

export default App;
