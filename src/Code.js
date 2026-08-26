/**
 * InboxIntel - Core Triage Engine (Multimodal)
 * Automated email triage powered by Google Gemini & Google Apps Script.
 */

const CONFIG = {
  SEARCH_QUERY: 'is:unread -label:AI-Processed',
  PROCESSED_LABEL: 'AI-Processed',
  MAX_THREADS_PER_RUN: 4,
  DELAY_BETWEEN_EMAILS_MS: 7000,
  MARK_AS_READ: true
};

function runEmailTriage() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GEMINI_API_KEY');
  const provider = (props.getProperty('NOTIFICATION_PROVIDER') || 'DISCORD').trim().toUpperCase();
  const target = (props.getProperty('TARGET_DESTINATION') || '').trim();
  const token = (props.getProperty('AUTH_TOKEN') || '').trim();

  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY in Script Properties.');
    return;
  }

  if (!target) {
    console.error('Missing TARGET_DESTINATION in Script Properties.');
    return;
  }

  let label = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (!label) {
    label = GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
  }

  const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, CONFIG.MAX_THREADS_PER_RUN);
  if (threads.length === 0) {
    console.log('No new unread emails.');
    return;
  }

  console.log(`Processing ${threads.length} email threads for [${provider}]...`);

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    try {
      const messages = thread.getMessages();
      const latestMsg = messages[messages.length - 1];

      const emailData = {
        id: thread.getId(),
        subject: latestMsg.getSubject() || '(No Subject)',
        from: latestMsg.getFrom(),
        date: latestMsg.getDate().toISOString(),
        body: latestMsg.getPlainBody().substring(0, 2500),
        attachments: latestMsg.getAttachments()
      };

      console.log(`[${i + 1}/${threads.length}] Analyzing: "${emailData.subject}"`);
      const analysis = analyzeEmailMultimodal(emailData, apiKey);

      if (analysis) {
        if (analysis.is_important) {
          dispatchNotification(provider, target, token, emailData, analysis);
          console.log(`-> Alert sent via ${provider}: ${emailData.subject}`);
        } else {
          console.log(`-> Silenced (Low Priority): ${emailData.subject}`);
        }

        thread.addLabel(label);
        if (CONFIG.MARK_AS_READ) {
          thread.markRead();
        }
      }

      if (i < threads.length - 1) {
        Utilities.sleep(CONFIG.DELAY_BETWEEN_EMAILS_MS);
      }
    } catch (err) {
      console.error(`Error processing thread ${thread.getId()}:`, err);
    }
  }
}

/**
 * Multimodal Analysis using Gemini (Text + Poster Images + PDFs)
 */
function analyzeEmailMultimodal(email, apiKey) {
  const MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash'
  ];

  // Uses PROMPT_SYSTEM_INSTRUCTIONS from Prompt.js
  const parts = [
    {
      text: `${PROMPT_SYSTEM_INSTRUCTIONS}\n\nEMAIL DETAILS:\nFrom: ${email.from}\nSubject: ${email.subject}\nBody:\n"""\n${email.body}\n"""`
    }
  ];

  if (email.attachments && email.attachments.length > 0) {
    for (const att of email.attachments) {
      const mime = att.getContentType();
      const sizeBytes = att.getSize();
      if ((mime.startsWith('image/') || mime === 'application/pdf') && sizeBytes < 4 * 1024 * 1024) {
        parts.push({
          inlineData: {
            mimeType: mime,
            data: Utilities.base64Encode(att.getBytes())
          }
        });
      }
    }
  }

  const payload = {
    contents: [{ parts: parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          is_important: { type: "BOOLEAN" },
          category: { type: "STRING" },
          urgency: { type: "STRING", enum: ["HIGH", "MEDIUM", "LOW"] },
          key_date_or_deadline: { type: "STRING" },
          summary: { type: "STRING" },
          action_required: { type: "STRING" }
        },
        required: ["is_important", "category", "urgency", "key_date_or_deadline", "summary", "action_required"]
      }
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = UrlFetchApp.fetch(url, options);
        const code = response.getResponseCode();
        
        if (code === 200) {
          const json = JSON.parse(response.getContentText());
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          return text ? JSON.parse(text) : null;
        }

        if (code === 429 || code === 503) {
          Utilities.sleep(7000);
        } else {
          break;
        }
      } catch (e) {
        Utilities.sleep(3000);
      }
    }
  }
  return null;
}