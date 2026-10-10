import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Credentials } from "../types";

interface AuthState {
  credentials: Credentials | null;
  login: (c: Credentials) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      credentials: null,
      login: (c) => set({ credentials: c }),
      logout: () => set({ credentials: null }),
    }),
    {
      name: "green-api-auth", // key in sessionStorage
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
