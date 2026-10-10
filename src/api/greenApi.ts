import type { Credentials, GreenApiNotification } from "../types";

// Builds e.g. https://7107.api.greenapi.com/waInstance1101000001/sendMessage/TOKEN
function buildUrl(c: Credentials, method: string) {
  return `${c.apiUrl}/waInstance${c.idInstance}/${method}/${c.apiTokenInstance}`;
}

// Finds all chatIds like "79001234567@c.us" in a text
export function chatIdsIn(text: string) {
  return [...new Set(text.match(/\d+@c\.us/g) ?? [])];
}

// Thrown when GREEN-API answers with an error status; status lets callers tell
// e.g. a wrong token (401) from other errors
export class ApiError extends Error {
  status: number;
  constructor(method: string, status: number) {
    super(`${method} failed: ${status}`);
    this.status = status;
  }
}

// Thrown when GREEN-API answers 466: the Developer plan limit is reached.
// allowedChatIds = the only chats that still work this month (read from the error body)
export class QuotaExceededError extends Error {
  allowedChatIds: string[];
  constructor(allowedChatIds: string[]) {
    super("quotaExceeded");
    this.allowedChatIds = allowedChatIds;
  }
}

// Send a text message. Returns the id of the sent message.
export async function sendMessage(
  c: Credentials,
  chatId: string,
  message: string
) {
  const res = await fetch(buildUrl(c, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
  });
  // 466 = a Developer plan limit is reached (e.g. more than 3 chats this month)
  if (res.status === 466) {
    throw new QuotaExceededError(chatIdsIn(await res.text()));
  }
  if (!res.ok) throw new ApiError("sendMessage", res.status);
  const data: { idMessage: string } = await res.json();
  return data.idMessage;
}

// Take the next notification from the queue (null if the queue is empty).
export async function receiveNotification(c: Credentials) {
  const res = await fetch(
    buildUrl(c, "receiveNotification") + "?receiveTimeout=5"
  );
  if (!res.ok) throw new ApiError("receiveNotification", res.status);
  const text = await res.text();
  return text ? (JSON.parse(text) as GreenApiNotification | null) : null;
}

// Remove a notification from the queue after we have handled it.
export async function deleteNotification(c: Credentials, receiptId: number) {
  const res = await fetch(`${buildUrl(c, "deleteNotification")}/${receiptId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new ApiError("deleteNotification", res.status);
}

// Check the instance: returns e.g. 'authorized' or 'notAuthorized'.
export async function getStateInstance(c: Credentials) {
  const res = await fetch(buildUrl(c, "getStateInstance"));
  if (!res.ok) throw new ApiError("getStateInstance", res.status);
  const data: { stateInstance: string } = await res.json();
  return data.stateInstance;
}
