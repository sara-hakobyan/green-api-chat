import LoginForm from "./components/LoginForm";
import NewChatForm from "./components/NewChatForm";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import { useAuthStore } from "./store/useAuthstore";
import { useNotificationPolling } from "./hooks/useNotificationPolling";
import styles from "./App.module.css";

function App() {
  const credentials = useAuthStore((s) => s.credentials);
  const logout = useAuthStore((s) => s.logout);

  useNotificationPolling();

  if (!credentials) {
    return <LoginForm />;
  }

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <span>Instance {credentials.idInstance}</span>
          <button className={styles.logout} onClick={logout}>
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
