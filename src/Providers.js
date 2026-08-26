/**
 * CalmInbox - Multi-Platform Notification Dispatcher
 * Handles formatting and delivery for Discord, Google Chat, Telegram, and WhatsApp.
 */

function dispatchNotification(provider, target, token, email, analysis) {
  switch (provider) {
    case 'DISCORD':
      sendDiscordNotification(target, email, analysis);
      break;
    case 'GCHAT':
      sendGoogleChatNotification(target, email, analysis);
      break;
    case 'TELEGRAM':
      sendTelegramNotification(target, token, email, analysis);
      break;
    case 'WHATSAPP':
      sendWhatsAppNotification(target, token, email, analysis);
      break;
    default:
      console.error(`Invalid NOTIFICATION_PROVIDER: "${provider}". Use DISCORD, GCHAT, TELEGRAM, or WHATSAPP.`);
  }
}

function sendDiscordNotification(webhookUrl, email, analysis) {
  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
  const colorMap = { "HIGH": 15158332, "MEDIUM": 16763904, "LOW": 3066993 };

  const safeSubject = (email.subject || '(No Subject)').trim();
  const safeCategory = (analysis.category || 'General').trim();
  const rawTitle = `[${analysis.urgency || 'INFO'}] ${safeCategory}: ${safeSubject}`;
  const truncatedTitle = rawTitle.length > 250 ? rawTitle.substring(0, 247) + '...' : rawTitle;

  const payload = {
    username: "CalmInbox Bot",
    embeds: [{
      title: truncatedTitle,
      url: gmailUrl,
      color: colorMap[analysis.urgency] || 3447003,
      fields: [
        { name: "Sender", value: (email.from || 'Unknown').replace(/<.*?>/, '').trim().substring(0, 100), inline: true },
        { name: "Date / Deadline", value: (analysis.key_date_or_deadline || 'N/A').substring(0, 200), inline: true },
        { name: "Summary", value: (analysis.summary || 'No summary.').substring(0, 1000), inline: false },
        { name: "Action Needed", value: (analysis.action_required || 'None').substring(0, 1000), inline: false }
      ],
      footer: { text: "CalmInbox Triage Agent" }
    }]
  };

  const response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const responseCode = response.getResponseCode();
  if (responseCode !== 200 && responseCode !== 204) {
    console.error(`Discord Delivery Failed (HTTP ${responseCode}):`, response.getContentText());
  }
}

function sendGoogleChatNotification(webhookUrl, email, analysis) {
  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
  const urgencyIcon = analysis.urgency === 'HIGH' ? '🔴' : (analysis.urgency === 'MEDIUM' ? '🟡' : '🟢');

  const cardPayload = {
    cardsV2: [{
      cardId: `email-${email.id}`,
      card: {
        header: {
          title: `${urgencyIcon} [${analysis.urgency}] ${analysis.category}`,
          subtitle: email.from.replace(/<.*?>/, '').trim()
        },
        sections: [{
          widgets: [
            { decoratedText: { topLabel: "Subject", text: `<b>${email.subject}</b>`, wrapText: true } },
            { decoratedText: { topLabel: "Date / Deadline", text: analysis.key_date_or_deadline || "N/A", wrapText: true } },
            { decoratedText: { topLabel: "Summary", text: analysis.summary, wrapText: true } },
            { decoratedText: { topLabel: "Action Required", text: analysis.action_required || "None", wrapText: true } },
            {
              buttonList: {
                buttons: [{
                  text: "Open Email in Gmail",
                  onClick: { openLink: { url: gmailUrl } }
                }]
              }
            }
          ]
        }]
      }
    }]
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(cardPayload),
    muteHttpExceptions: true
  });
}

function sendTelegramNotification(chatId, botToken, email, analysis) {
  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
  const urgencyIcon = analysis.urgency === 'HIGH' ? '🔴' : (analysis.urgency === 'MEDIUM' ? '🟡' : '🟢');

  const text = `${urgencyIcon} <b>[${analysis.urgency}] ${analysis.category}</b>\n\n` +
               `👤 <b>From:</b> ${email.from.replace(/<.*?>/, '').trim()}\n` +
               `📌 <b>Subject:</b> ${email.subject}\n` +
               `🗓️ <b>Date/Deadline:</b> ${analysis.key_date_or_deadline || 'N/A'}\n\n` +
               `📝 <b>Summary:</b>\n${analysis.summary}\n\n` +
               `⚡ <b>Action:</b> ${analysis.action_required || 'None'}\n\n` +
               `<a href="${gmailUrl}">👉 Open Email in Gmail</a>`;

  UrlFetchApp.fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }),
    muteHttpExceptions: true
  });
}

function sendWhatsAppNotification(phone, apiKey, email, analysis) {
  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
  const urgencyIcon = analysis.urgency === 'HIGH' ? '🔴' : (analysis.urgency === 'MEDIUM' ? '🟡' : '🟢');

  const message = `${urgencyIcon} *[${analysis.urgency}] ${analysis.category}*\n\n` +
                  `*From:* ${email.from.replace(/<.*?>/, '').trim()}\n` +
                  `*Subject:* ${email.subject}\n` +
                  `*Date/Deadline:* ${analysis.key_date_or_deadline || 'N/A'}\n\n` +
                  `*Summary:*\n${analysis.summary}\n\n` +
                  `*Action:* ${analysis.action_required || 'None'}\n\n` +
                  `🔗 ${gmailUrl}`;

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  const endpoint = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${apiKey}`;

  UrlFetchApp.fetch(endpoint, { method: 'get', muteHttpExceptions: true });
}

/**
 * Diagnostic test runner to verify notification connectivity
 */
function testNotificationProvider() {
  const props = PropertiesService.getScriptProperties();
  const provider = (props.getProperty('NOTIFICATION_PROVIDER') || 'DISCORD').trim().toUpperCase();
  const target = (props.getProperty('TARGET_DESTINATION') || '').trim();
  const token = (props.getProperty('AUTH_TOKEN') || '').trim();

  const dummyEmail = {
    id: "test12345",
    from: "Notification Test <bot@calminbox.internal>",
    subject: "System Connectivity Test",
    date: new Date().toISOString()
  };

  const dummyAnalysis = {
    is_important: true,
    category: "Connectivity Test",
    urgency: "HIGH",
    key_date_or_deadline: "Immediate",
    summary: "Your notification dispatch pipeline is active and communicating properly.",
    action_required: "No action required."
  };

  console.log(`Sending diagnostic message to ${provider}...`);
  dispatchNotification(provider, target, token, dummyEmail, dummyAnalysis);
  console.log(`Dispatched! Check your ${provider} client.`);
}