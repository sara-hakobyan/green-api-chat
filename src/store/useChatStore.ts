import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Chat, Message } from "../types";
import {
  chatIdsIn,
  QuotaExceededError,
  deleteNotification,
  receiveNotification,
  sendMessage,
} from "../api/greenApi";
import { useAuthStore } from "./useAuthstore";

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  allowedChatIds: string[]; // filled when GREEN-API reports the plan limit; empty = no limit known
  createChat: (phone: string) => void;
  setActiveChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  sendText: (chatId: string, text: string) => Promise<void>;
  receiveNext: () => Promise<void>;
  clearChats: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      allowedChatIds: [],

      // Phone "79001234567" -> chatId "79001234567@c.us"
      createChat: (phone) =>
        set((state) => {
          const chatId = `${phone}@c.us`;
          const exists = state.chats.some((c) => c.chatId === chatId);
          return {
            chats: exists
              ? state.chats
              : [...state.chats, { chatId, phone, messages: [] }],
            activeChatId: chatId,
          };
        }),

      // Opens a chat and marks its messages as read
      setActiveChat: (chatId) =>
        set((state) => ({
          activeChatId: chatId,
          chats: state.chats.map((c) =>
            c.chatId === chatId ? { ...c, unread: 0 } : c
          ),
        })),

      // Adds a message to a chat; skips it if a message with the same id is already there.
      // An incoming message in a chat that is not open increases its unread count.
      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((c) => {
            if (c.chatId !== chatId || c.messages.some((m) => m.id === message.id)) {
              return c;
            }
            const isUnread =
              message.direction === "incoming" && chatId !== state.activeChatId;
            return {
              ...c,
              messages: [...c.messages, message],
              unread: isUnread ? (c.unread ?? 0) + 1 : c.unread,
            };
          }),
        })),

      // Sends the text via GREEN-API, then stores it as an outgoing message.
      // Throws if sending fails, so the component can show an error.
      sendText: async (chatId, text) => {
        const credentials = useAuthStore.getState().credentials;
        if (!credentials) throw new Error("Not logged in");

        let idMessage: string;
        try {
          idMessage = await sendMessage(credentials, chatId, text);
        } catch (err) {
          // Remember the allowed chats so ChatWindow can show the limit notice
          if (err instanceof QuotaExceededError && err.allowedChatIds.length) {
            set({ allowedChatIds: err.allowedChatIds });
          }
          throw err;
        }
        get().addMessage(chatId, {
          id: idMessage,
          text,
          direction: "outgoing",
          timestamp: Date.now(),
        });
      },

      // Takes ONE notification from the queue, saves it if it is a text message
      // for one of our chats, then deletes it from the queue.
      receiveNext: async () => {
        const credentials = useAuthStore.getState().credentials;
        if (!credentials) return;

        const notification = await receiveNotification(credentials);
        if (!notification) return; // nothing arrived within receiveTimeout

        try {
          const { body } = notification;
          const chatId = body.senderData?.chatId;
          const text =
            body.messageData?.textMessageData?.textMessage ??
            body.messageData?.extendedTextMessageData?.text;
          const isOurChat = get().chats.some((c) => c.chatId === chatId);

          // Plan limit reached: the description lists the only chats that still work
          if (body.typeWebhook === "quotaExceeded" && body.quotaData) {
            const allowed = chatIdsIn(body.quotaData.description);
            if (allowed.length) set({ allowedChatIds: allowed });
          }

          if (
            body.typeWebhook === "incomingMessageReceived" &&
            chatId &&
            text &&
            isOurChat
          ) {
            get().addMessage(chatId, {
              id: body.idMessage ?? String(notification.receiptId),
              text,
              direction: "incoming",
              timestamp: body.timestamp * 1000, // GREEN-API sends seconds, JS uses milliseconds
            });
          }
        } finally {
          // Always delete, even if we ignored it, or the queue gets stuck on it
          await deleteNotification(credentials, notification.receiptId);
        }
      },

      clearChats: () => set({ chats: [], activeChatId: null, allowedChatIds: [] }),
    }),
    {
      name: "green-api-chats",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
