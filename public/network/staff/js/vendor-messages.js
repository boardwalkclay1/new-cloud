// vendor-messages.js
// Handles loading and displaying messages

import { staffGetMessages } from "/network/staff/js/staff.js";

const messagesList = document.getElementById("messagesList");

/* ---------------------------------------------------------
   RENDER MESSAGES
--------------------------------------------------------- */
function renderMessages(messages) {
  messagesList.innerHTML = "";

  const safeMessages = Array.isArray(messages) ? messages : [];

  safeMessages.forEach(m => {
    const item = document.createElement("div");
    item.className = "message-item";
    item.innerHTML = `
      <strong>${m.toEmail || "Customer"}</strong><br>
      ${m.text || ""}
    `;
    messagesList.appendChild(item);
  });
}

/* ---------------------------------------------------------
   PUBLIC LOAD FUNCTION
--------------------------------------------------------- */
export async function loadVendorMessages() {
  const messages = await staffGetMessages();
  renderMessages(messages);
}
