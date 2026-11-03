# 📬 CalmInbox

**An AI assistant that reads your email for you and only pings you about the messages that actually matter.**

No more scrolling through promotions, newsletters and spam. CalmInbox quietly checks your Gmail every few minutes, decides what is important, and sends a short summary to the chat app you already use (Discord, Google Chat, Telegram or WhatsApp).

It costs nothing to run and needs no server, no computer left switched on, and no programming skills. If you can copy and paste, you can set it up.

---

## 📖 Table of Contents

1. [What does it do? (In plain English)](#-what-does-it-do-in-plain-english)
2. [An example](#-an-example)
3. [How it works behind the scenes](#-how-it-works-behind-the-scenes)
4. [What you need before you start](#-what-you-need-before-you-start)
5. [Setup guide](#-setup-guide-about-15-minutes)
6. [Choose where alerts are sent](#-choose-where-alerts-are-sent)
7. [Customize what counts as "important"](#-customize-what-counts-as-important)
8. [Settings you can change](#-settings-you-can-change)
9. [Privacy and safety](#-privacy-and-safety)
10. [Troubleshooting](#-troubleshooting)
11. [Glossary](#-glossary-tech-words-explained)
12. [License](#-license)

---

## 🧠 What does it do? (In plain English)

Think of CalmInbox as a personal assistant who sits next to your inbox:

1. 📥 **Picks up** your new, unread emails.
2. 👀 **Reads** each one, including pictures (like event posters) and PDF attachments.
3. 🤔 **Decides**: *"Does this person need to see this, or is it junk?"*
4. 🔔 **Tells you** about the important ones with a short summary: what it is, how urgent it is, any deadline, and what you need to do.
5. 🤫 **Stays silent** about everything else.
6. 🏷️ **Tidies up** by tagging each email it checked and marking it as read, so it never checks the same email twice.

The "brain" is **Google Gemini**, a free-to-use AI from Google. The "robot" that runs it automatically is **Google Apps Script**, a free tool that lives inside your Google account.

---

## ✉️ An example

**Email arrives:** "Your university fee payment is due on 15 March. Please pay online to avoid a late charge."

**You get a message like this on your phone:**

> 🔴 **Urgency: HIGH**
> **Category:** Billing
> **Deadline:** 15 March
> **Summary:** The university fee payment is due soon.
> **What to do:** Pay the fee online before the deadline.

**Email arrives:** "🔥 50% OFF everything this weekend only!!!"

**You get:** nothing. It is silently filed away.

---

## 🔧 How it works behind the scenes

```
 Your Gmail ──► Google Apps Script ──► Google Gemini (AI) ──► Your chat app
 (new mail)     (runs every 5 min)     "Is this important?"   (Discord / Google Chat /
                                                               Telegram / WhatsApp)
```

- **Every 5–10 minutes**, a timer wakes the script up.
- It grabs up to **4 unread emails** at a time (so it stays within free limits).
- For each email it sends the sender, subject, the first part of the text, and any **images or PDFs under 4 MB** to Gemini.
- Gemini answers with a structured note: *important or not, category, urgency, deadline, summary, action needed.*
- If it is important, the note is sent to your chat app. Either way, the email gets the label **CalmInbox-Processed** and is marked as read.
- It waits a few seconds between emails and automatically tries backup Gemini models if one is busy. This keeps it inside the free usage limits.

### What is in this project?

| File | What it is for |
| :--- | :--- |
| `src/Code.js` | The main engine: finds emails, asks the AI, labels them. |
| `src/Prompt.js` | **The rulebook** telling the AI what is important. This is the file you will most likely want to edit. |
| `src/Providers.js` | The "delivery person": formats and sends alerts to Discord, Google Chat, Telegram or WhatsApp. |
| `appsscript.json` | Permission settings (lets the script read Gmail and contact the internet). |
| `cloudflare-worker/worker.js` | Optional helper that makes Discord delivery reliable (see Discord section). |

---

## ✅ What you need before you start

- A **Google account** with Gmail (the one whose inbox you want to monitor).
- About **15 minutes**.
- An account on **one** chat app: Discord, Google Chat, Telegram, or WhatsApp.
- *(Discord only, optional but recommended)* a free Cloudflare account.

You do **not** need to install anything on your computer.

---

## 🚀 Setup guide (about 15 minutes)

### Step 1: Get a free Gemini key (the AI's "password")
1. Go to https://aistudio.google.com/ and sign in with Google.
2. Click **Get API key** → **Create API key**.
3. Copy the key and keep it somewhere safe for a moment. Treat it like a password and don't share it.

### Step 2: Create a new Apps Script project
1. Go to https://script.google.com/.
2. Click **+ New project** (top left).
3. Click the project name at the top and rename it to **CalmInbox**.

### Step 3: Copy the project files in
For each file below, open it in this repository, copy everything, and paste it into Apps Script.

1. **Code.gs**: open the existing `Code.gs`, delete what is there, paste the contents of `src/Code.js`.
2. **Prompt.gs**: hover over **Files** in the left sidebar → **+** → **Script** → name it `Prompt` → paste the contents of `src/Prompt.js`.
3. **Providers.gs**: same again → name it `Providers` → paste the contents of `src/Providers.js`.
4. **appsscript.json**:
   - Click the **⚙️ gear (Project Settings)** on the left.
   - Tick **"Show 'appsscript.json' manifest file in editor"**.
   - Go back to the editor (`< >` icon), open `appsscript.json`, and replace its contents with the one from this repo.
5. Press **Ctrl+S** (or **Cmd+S** on Mac) to save.

### Step 4: Enter your settings
1. Click **⚙️ Project Settings** → scroll to **Script Properties**.
2. Click **Edit script properties** → **Add script property**.
3. Add these (the next section explains exactly what to put for your chat app):

| Name | What to put |
| :--- | :--- |
| `GEMINI_API_KEY` | The key from Step 1 |
| `NOTIFICATION_PROVIDER` | `DISCORD`, `GCHAT`, `TELEGRAM` or `WHATSAPP` |
| `TARGET_DESTINATION` | Where to send alerts (web link, ID or phone number, depending on the app) |
| `AUTH_TOKEN` | A token/key, only for Telegram and WhatsApp (otherwise leave empty) |

### Step 5: Test it
1. At the top of the editor, pick **testNotificationProvider** in the function dropdown.
2. Click **Run**.
3. Google will ask for permission. This is normal: the script needs to read your Gmail and talk to the internet. Click through and allow it.
4. A test alert should appear in your chat app. 🎉 If it doesn't, see [Troubleshooting](#-troubleshooting).

### Step 6: Turn on automatic checking
1. Click the **⏰ Triggers** (alarm clock) icon on the left.
2. Click **+ Add Trigger** (bottom right).
3. Choose:
   - **Function to run:** `runEmailTriage`
   - **Deployment:** Head
   - **Event source:** Time-driven
   - **Type of time based trigger:** Minutes timer
   - **Interval:** Every 5 minutes (or 10)
4. Click **Save**.

That's it. CalmInbox now works around the clock, even when your computer is off.

---

## 📡 Choose where alerts are sent

Pick **one**. You only need the details for the app you choose.

| App | `NOTIFICATION_PROVIDER` | `TARGET_DESTINATION` | `AUTH_TOKEN` |
| :--- | :--- | :--- | :--- |
| **Discord** | `DISCORD` | Webhook (or Worker) link | *(empty)* |
| **Google Chat** | `GCHAT` | Webhook link | *(empty)* |
| **Telegram** | `TELEGRAM` | Your numeric Chat ID | Your bot token |
| **WhatsApp** | `WHATSAPP` | Your phone number with country code | CallMeBot API key |

> 💡 A **webhook** is simply a private web address that lets other programs post messages into a chat room. Anyone with the link can post, so keep it private.

### Option A: Discord

1. In Discord, open your server → **Server Settings** → **Integrations** → **Webhooks** → **New Webhook**, pick a channel, and **Copy Webhook URL**.
2. **Recommended:** set up the free Cloudflare helper below.

#### Why a helper is recommended
Google's script servers are shared by millions of scripts. Discord sometimes blocks messages from that shared pool (you may see "Error 1015 – You are being rate limited"). A tiny free Cloudflare Worker acts as a "forwarding post office" with its own address, so Discord never blocks it.

#### Setting up the Cloudflare helper
1. Create a free account at https://dash.cloudflare.com/.
2. In the left menu go to **Compute (Workers & Pages)** → **Overview** → **Create application** (or **Create Worker**).
3. Name it (e.g. `calminbox-proxy`) and click **Deploy**.
4. Click **Edit code**, delete everything there, paste the contents of `cloudflare-worker/worker.js`, and click **Save and deploy**.
5. Copy your Worker address (for example `https://calminbox-proxy.yourname.workers.dev`).
6. Take your Discord webhook link and swap the start:
   - Original: `https://discord.com/api/webhooks/1234567890/abcdef`
   - New: `https://calminbox-proxy.yourname.workers.dev/api/webhooks/1234567890/abcdef`
7. In Script Properties set:
   - `NOTIFICATION_PROVIDER` = `DISCORD`
   - `TARGET_DESTINATION` = the new link from step 6
   - `AUTH_TOKEN` = *(leave empty)*

### Option B: Google Chat (Google Workspace)
1. Open your Chat space → click the space name → **Apps & integrations** → **Webhooks** → **Add webhook**.
2. Name it `CalmInbox` and copy the link.
3. Script Properties:
   - `NOTIFICATION_PROVIDER` = `GCHAT`
   - `TARGET_DESTINATION` = the webhook link
   - `AUTH_TOKEN` = *(empty)*

### Option C: Telegram
1. In Telegram, message **@BotFather**, send `/newbot`, follow the prompts, and copy the **Bot Token** it gives you.
2. Open a chat with your new bot and press **Start**.
3. Message **@userinfobot** to learn your numeric **Chat ID**.
4. Script Properties:
   - `NOTIFICATION_PROVIDER` = `TELEGRAM`
   - `TARGET_DESTINATION` = your Chat ID (e.g. `987654321`)
   - `AUTH_TOKEN` = your Bot Token

### Option D: WhatsApp (free, via CallMeBot)
1. Save the CallMeBot number in your phone contacts: `+34 644 44 24 53` (or `+34 644 10 55 84`).
2. Send it this exact WhatsApp message: `I allow callmebot to send me messages`
3. It will reply with your personal API key.
4. Script Properties:
   - `NOTIFICATION_PROVIDER` = `WHATSAPP`
   - `TARGET_DESTINATION` = your number with country code, no `+` or spaces (e.g. `60123456789`)
   - `AUTH_TOKEN` = the API key CallMeBot sent you

---

## 🎯 Customize what counts as "important"

Open `Prompt.gs` in Apps Script (it is `src/Prompt.js` in this repo). Inside you will find ordinary English instructions given to the AI, like:

> Mark important for: direct personal, academic, client or workplace messages, deadlines, official notices, bills, and events with concrete dates.
> Mark NOT important for: promotions, surveys, social noise, spam and automated digests.

You can edit these sentences in plain English. For example:
- *"Always treat emails from my manager as important."*
- *"Ignore anything from LinkedIn or Facebook."*
- *"Job offers and interview invitations are always important."*

Save the file and the new rules apply at the next check.

---

## 🎛️ Settings you can change

At the top of `Code.gs` there is a small settings block:

| Setting | What it does | Default |
| :--- | :--- | :--- |
| `MAX_THREADS_PER_RUN` | How many emails to check each time | 4 |
| `DELAY_BETWEEN_EMAILS_MS` | Pause between emails, in milliseconds (7000 = 7 seconds) | 7000 |
| `MARK_AS_READ` | Mark checked emails as read (`true`) or leave them unread (`false`) | `true` |
| `PROCESSED_LABEL` | Name of the Gmail label added to checked emails | `CalmInbox-Processed` |

---

## 🔒 Privacy and safety

- **Everything runs inside your own Google account.** There is no CalmInbox server, and nobody else can see your emails through it.
- **Be aware:** the text of each email (first ~2,500 characters) and small image/PDF attachments are sent to Google Gemini for analysis, and the summary is sent to the chat app you chose. Don't use this on an inbox whose contents you are not comfortable sharing with those services.
- **Keep your secrets secret.** Your Gemini key, bot token and webhook links are stored in *Script Properties* (not in the code). Never paste them into the code or share them publicly.
- The script only needs permission to **read and label Gmail** and to **make web requests**. It does not delete or send email.

---

## 🩺 Troubleshooting

| Problem | What to try |
| :--- | :--- |
| No test message arrives | Re-check the spelling of the Script Property names and values, and that `NOTIFICATION_PROVIDER` is exactly one of the four options. |
| Log says "Missing GEMINI_API_KEY" or "Missing TARGET_DESTINATION" | That property was not saved. Add it in Project Settings → Script Properties. |
| Discord messages fail or show "rate limited" | Use the Cloudflare helper described above. |
| Nothing happens automatically | Check the Triggers page. The trigger must exist for `runEmailTriage`. Also look at **Executions** (left sidebar) for error messages. |
| An important email wasn't flagged | Tweak the rules in `Prompt.gs` (see above). |
| Too many alerts | Make the rules in `Prompt.gs` stricter. |
| Attachments are ignored | Only images and PDFs smaller than 4 MB are read. |

To see what the script is doing, open **Executions** in Apps Script and click a run to read its log.

---

## 📚 Glossary (tech words explained)

- **AI / Gemini:** Google's smart text-and-image reading program that makes the "important or not" decision.
- **API key:** A password that lets a program use a service (here, Gemini) on your behalf.
- **Apps Script:** Google's free tool for running small automatic programs inside your Google account.
- **Webhook:** A private web address that lets a program post messages into a chat room.
- **Trigger:** A timer that tells the script to run automatically.
- **Script Properties:** A safe storage box inside Apps Script for your passwords and settings.
- **Cloudflare Worker:** A tiny free forwarding service used to make Discord delivery dependable.
- **Label:** A Gmail tag, like a sticker on a folder.

---

## 📄 License

Released under the MIT License. See [LICENSE.txt](LICENSE.txt) for details.
