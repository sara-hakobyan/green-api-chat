import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthstore";
import { useChatStore } from "../store/useChatStore";

const RETRY_DELAY_MS = 3000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// While logged in, keeps asking GREEN-API for new notifications, one after another.
export function useNotificationPolling() {
  const credentials = useAuthStore((s) => s.credentials);
  const receiveNext = useChatStore((s) => s.receiveNext);

  useEffect(() => {
    if (!credentials) return;

    let active = true;

    async function loop() {
      while (active) {
        try {
          await receiveNext(); // waits up to receiveTimeout (5 s) when the queue is empty
        } catch {
          await wait(RETRY_DELAY_MS); // network or API error: pause, then try again
        }
      }
    }

    loop();

    // Runs on logout or when the component unmounts: stops the loop
    return () => {
      active = false;
    };
  }, [credentials, receiveNext]);
}
