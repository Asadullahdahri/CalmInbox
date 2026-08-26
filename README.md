# 📬 CalmInbox: Serverless Multimodal AI Email Triage Agent

> An automated, zero-server email assistant powered by Google Gemini and Google Apps Script. It parses incoming unread emails—including **attached image posters (JPEG/PNG) and PDF flyers**—filters out noise, and delivers high-priority alerts with actionable summaries to your chosen platform: **Discord**, **Google Chat**, **Telegram**, or **WhatsApp**.

---

## 🌟 Key Features

- **Multimodal Intelligence:** Reads email text, flyer/poster graphics, and attached PDFs directly using Gemini Flash models.
- **100% Serverless:** Runs 24/7 on Google Apps Script at zero infrastructure cost.
- **Universal Routing:** Connects to:
  - **Discord** (Embed cards with Cloudflare Worker proxy support)
  - **Google Chat** (Card v2 formatting for Google Workspace)
  - **Telegram** (Rich HTML formatting with deep links)
  - **WhatsApp** (CallMeBot API gateway)
- **Built-in Rate-Limiting & Fallbacks:** Automatic request throttling and fallback model tiers to stay within free-tier quotas.
- **Inbox Organization:** Automatically labels triaged threads (AI-Processed) and marks them as read.

---

## ⚙️ Configuration Matrix (Pick ONE)

Choose **one** preferred notification platform. You only need credentials for your selected service:

| Provider | NOTIFICATION_PROVIDER | TARGET_DESTINATION | AUTH_TOKEN |
| :--- | :--- | :--- | :--- |
| **Discord** | DISCORD | Discord Webhook (or Worker) URL | *(Leave Empty)* |
| **Google Chat** | GCHAT | Google Chat Webhook URL | *(Leave Empty)* |
| **Telegram** | TELEGRAM | Your Numeric Chat ID | Your Bot Token |
| **WhatsApp** | WHATSAPP | Phone number with country code (+...) | CallMeBot API Key |

---

## 🚀 Setup & Deployment (5-Minute Guide)

### Step 1: Get Your Free Gemini API Key
1. Visit https://aistudio.google.com/
2. Sign in with your Google account.
3. Click **Get API key** -> **Create API key** and copy it.

---

### Step 2: Create Your Google Apps Script Project
1. Open https://script.google.com/ in your browser.
2. Click **+ New project** on the top left.
3. Rename the project to **CalmInbox** or whatever you like.

---

### Step 3: Add the Project Files
1. **Code.gs**:
   - Open the default Code.gs file in the editor.
   - Replace its contents with the code from src/Code.js.
2. **Prompt.gs**:
   - Hover over **Files** in the left sidebar, click **+** -> select **Script**.
   - Name the file **Prompt** (it will become Prompt.gs).
   - Paste the contents of src/Prompt.js.
3. **Providers.gs**:
   - Hover over **Files** in the left sidebar, click **+** -> select **Script**.
   - Name the file **Providers** (it will become Providers.gs).
   - Paste the contents of src/Providers.js.
4. **appsscript.json (Manifest)**:
   - Click the **Gear icon (Project Settings)** on the left sidebar.
   - Check **"Show 'appsscript.json' manifest file in editor"**.
   - Return to the **Editor (< >)** tab, open appsscript.json, and replace its content with appsscript.json from this repo.
5. Save your changes (Ctrl+S or Cmd+S).

---

### Step 4: Configure Script Properties
1. In Apps Script, go to **Project Settings (Gear Icon)** -> **Script Properties**.
2. Click **Edit script properties** -> **Add script property**.
3. Add GEMINI_API_KEY, along with the values for your chosen notification provider:

GEMINI_API_KEY = your_gemini_api_key_here
NOTIFICATION_PROVIDER = DISCORD
TARGET_DESTINATION = your_destination_url_or_id
AUTH_TOKEN = your_token_here (optional depending on provider)

## 📡 Provider Setup Instructions

### Option A: Discord Setup & Cloudflare Worker Proxy

#### Why is a Cloudflare Worker Proxy Recommended for Discord?
Google Apps Script executes on shared Google cloud IP addresses. Because millions of automated scripts use these same shared IP ranges, Discord frequently triggers **Cloudflare Error 1015 ("You are being rate limited")** or temporarily blocks direct webhook requests originating from Google Apps Script. 

Deploying a free, 10-line Cloudflare Worker acts as a lightweight reverse proxy with your own dedicated edge route, guaranteeing **100% reliable message delivery without IP blocks**.

#### Step-by-Step: Setting Up the Cloudflare Worker Proxy
1. **Sign Up / Log In to Cloudflare:**
   - Go to https://dash.cloudflare.com/ and create a free account (or log in).
2. **Create a Worker:**
   - On the left sidebar menu, navigate to **Compute (Workers & Pages)** -> **Overview**.
   - Click the **Create application** (or **Create Worker**) button.
   - Give your worker a name (for example, `discord-proxy` or `calminbox-proxy`).
   - Click **Deploy**.
3. **Paste the Proxy Code:**
   - Click **Edit code** on your newly deployed worker.
   - In the code editor on the left, delete any existing boilerplate code and paste the code from `cloudflare-worker/worker.js`:
     ```javascript
     export default {
       async fetch(request) {
         const url = new URL(request.url);
         const targetUrl = `[https://discord.com](https://discord.com)${url.pathname}${url.search}`;
         const newRequest = new Request(targetUrl, request);
         return fetch(newRequest);
       }
     };
     ```
   - Click **Save and deploy** in the top-right corner.
4. **Construct Your Proxied Webhook URL:**
   - Copy your Worker URL from the top of the dashboard (e.g., `https://discord-proxy.yourname.workers.dev`).
   - Copy your official Discord Webhook URL from Discord:
     `https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz`
   - Replace `https://discord.com` with your Worker URL:
     `https://discord-proxy.yourname.workers.dev/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz`
5. **Set in Script Properties:**
   - `NOTIFICATION_PROVIDER`: `DISCORD`
   - `TARGET_DESTINATION`: Your proxied webhook URL
   - `AUTH_TOKEN`: *(Leave empty)*

---

### Option B: Google Chat (Google Workspace)
1. Open your Space in Google Chat -> Click Space Name at the top -> **Apps & integrations** -> **Webhooks**.
2. Click **Add webhook**, give it a name (e.g., `CalmInbox`), and copy the URL.
3. In Script Properties:
   - `NOTIFICATION_PROVIDER`: `GCHAT`
   - `TARGET_DESTINATION`: Your copied Webhook URL
   - `AUTH_TOKEN`: *(Leave empty)*

---

### Option C: Telegram
1. Message `@BotFather` on Telegram -> run `/newbot` -> name your bot and copy your **Bot Token**.
2. Open a chat with your newly created bot and click **Start**.
3. Message `@userinfobot` on Telegram to get your numeric **Chat ID**.
4. In Script Properties:
   - `NOTIFICATION_PROVIDER`: `TELEGRAM`
   - `TARGET_DESTINATION`: Your numeric Chat ID (e.g., `987654321`)
   - `AUTH_TOKEN`: Your Bot Token from BotFather

---

### Option D: WhatsApp (Free via CallMeBot)
1. Add the CallMeBot contact to your phone: `+34 644 44 24 53` (or `+34 644 10 55 84`).
2. Send this exact WhatsApp message to that number:
   `I allow callmebot to send me messages`
3. CallMeBot will reply with your personal API key.
4. In Script Properties:
   - `NOTIFICATION_PROVIDER`: `WHATSAPP`
   - `TARGET_DESTINATION`: Your international phone number without `+` or spaces (e.g., `60123456789`)
   - `AUTH_TOKEN`: The API key you received from CallMeBot

---

### Step 5: Test Connectivity
1. In the Apps Script toolbar dropdown, select **testNotificationProvider**.
2. Click **Run**.
3. Grant standard OAuth execution permissions when prompted.
4. Verify that the test alert is received on your configured platform.

---

### Step 6: Enable 24/7 Automation
1. Click the **Triggers (Alarm Clock icon)** in the left sidebar.
2. Click **+ Add Trigger** (bottom right).
3. Set:
   - **Function to run:** runEmailTriage
   - **Deployment:** Head
   - **Event source:** Time-driven
   - **Type of time based trigger:** Minutes timer
   - **Minute interval:** Every 5 minutes (or Every 10 minutes)
4. Click **Save**.

---

## 🎯 Customizing Rules

To adapt the triage criteria to your own schedule, university, or work needs, update the PROMPT_SYSTEM_INSTRUCTIONS constant in src/Prompt.js.

---

## 📄 License

Distributed under the MIT License. See LICENSE for details.