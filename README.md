# # GREEN-API Chat

A minimal WhatsApp Web–style chat for sending and receiving text messages through [GREEN-API](<[https://green-api.com/en/docs/](https://green-api.com/en/docs/)>).

Test assignment for the React Frontend Developer position. The task asks for MAX, with WhatsApp or Telegram allowed as a fallback. MAX was not available in my GREEN-API console, so the app works with a **WhatsApp** instance.

## What was implemented

- **Login** with the instance credentials: `apiUrl`, `idInstance` and `apiTokenInstance`.

- **New chat**: enter the recipient's phone number to start a chat.

- **Sending** text messages to the selected chat.

- **Receiving** the recipient's replies in real time while the app is open.

- **Logout**, which clears the session.

## Functional nuances

- **Instance check on login.** Before letting the user in, the app checks the instance state. Only an `authorized` instance (WhatsApp linked) is accepted. Wrong credentials or an unlinked instance show a clear error.

- **apiUrl is per instance.** Each GREEN-API instance has its own `apiUrl` (e.g. `https://1101.api.green-api.com`), so it is entered on login, not hardcoded. A trailing `/` is removed automatically.

- **Phone number format.** Any input like `+7 (900) 123-45-67` is reduced to digits and validated (10–15 digits with country code), then turned into a WhatsApp chatId like `79001234567@c.us`. Opening an existing number switches to that chat instead of creating a duplicate.

- **Receiving uses HTTP polling, not webhooks.** The app takes one notification at a time from the GREEN-API queue (long polling, 5 s timeout). After handling it, the app deletes the notification, so the queue never gets stuck. Polling runs only while logged in and retries after a short pause on network errors.

- **What is shown.** Only incoming text messages (plain and extended text) from chats created in the app are shown. Other notifications are removed from the queue and ignored. Duplicate messages are skipped by message id.

- **Messages to yourself.** Messages sent from the phone linked to the instance do not arrive as incoming messages. Use a different number to test replies.

- **Developer plan limit.** The free plan allows chats with only 3 numbers per month. When GREEN-API reports the limit, the app reads the list of allowed numbers from GREEN-API's response.

## Extra features for better UX

- **WhatsApp Web look**: sidebar with the chat list, chat header, white/green message bubbles with time, and an input bar.

- **Unread counter**: a green badge in the chat list shows new messages in chats that are not open. It resets when you open the chat.

- **Limit notice**: in chats outside the allowed numbers, a notice explains that the limit is reached and lists the numbers that still work.

- **Feedback states**: "Checking…" on login, "Sending…" while a message is sent, Send disabled for empty text, and readable error messages.

- **Session persistence**: credentials and chats survive a page refresh but are kept only in sessionStorage. They are cleared on logout and when the tab is closed.

- **Token hidden**: the `apiTokenInstance` field is a password input, and the token is never stored in the code.

## Technologies

- **React 19** + **TypeScript**

- **Vite** (dev server and build)

- **Zustand** for state (auth and chats), with the `persist` middleware for sessionStorage

- **CSS Modules** for component styles

- **Oxlint** for linting

- GREEN-API HTTP API via `fetch` (no extra libraries)

## Run locally

Requirements:

- **Node.js** 20.19+ or 22.12+ (required by Vite)

- **A GREEN-API instance** (see below)

```bash

git clone <repo-url>

cd green-api-chat

npm install

npm run dev

```

Open [http://localhost:5173](http://localhost:5173).

Other scripts: `npm run build` (type check + production build), `npm run preview`, `npm run lint`.

## How to test

### 1. Prepare a GREEN-API instance

1. Sign up at [[console.green-api.com](http://console.green-api.com)](<[https://console.green-api.com](https://console.green-api.com)>) and create an instance (the free **Developer** plan is enough).

2. Link WhatsApp: scan the QR code in the console with WhatsApp on your phone (Linked devices). The instance status must become **authorized**.

3. In the instance settings, make sure notifications for **incoming messages** are on.

4. Copy **apiUrl**, **idInstance** and **apiTokenInstance** from the instance page.

### 2. Test in the app

1. Log in with those three values.

2. Click **New chat** and enter a phone number with country code (e.g. `79001234567`). Use a number **different** from the one linked to the instance.

3. Send a message and check that it arrives on that phone.

4. Reply from that phone. The reply appears in the chat within a few seconds.

5. Optional: create a second chat, open the first one, and reply from the second number to see the unread counter.

6. Click **Logout** to clear the session.
