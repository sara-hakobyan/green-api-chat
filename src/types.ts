// Login details from the GREEN-API console
export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

// One message in a chat
export interface Message {
  id: string;
  text: string;
  direction: "incoming" | "outgoing";
  timestamp: number;
}

// One chat with a phone number
export interface Chat {
  chatId: string; // e.g. 79001234567@c.us
  phone: string;
  messages: Message[];
  unread?: number; // incoming messages not seen yet (shown as a badge in ChatList)
}

// The parts of an incoming notification that we use
export interface GreenApiNotification {
  receiptId: number;
  body: {
    typeWebhook: string; // 'incomingMessageReceived' for new messages
    idMessage?: string;
    timestamp: number;
    senderData?: { chatId: string; senderName?: string };
    messageData?: {
      typeMessage: string; // 'textMessage' | 'extendedTextMessage' | ...
      textMessageData?: { textMessage: string };
      extendedTextMessageData?: { text: string };
    };
    // only in 'quotaExceeded' notifications; description lists the allowed chats
    quotaData?: { status: string; description: string };
  };
}
