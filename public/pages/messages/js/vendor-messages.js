// /js/messages/vendor-messages.js
// FULL VENDOR MESSAGING ENGINE — CUSTOMER ↔ VENDOR
// Inbox, threads, sending, blocking, muting, deleting, receipts, typing, attachments

const API = "https://api.beltlinecloud.com";
const Auth = window.Auth;

/* ---------------------------------------------------------
   UTILITIES
--------------------------------------------------------- */
function el(id) {
  return document.getElementById(id);
}

function safeAvatar(url) {
  return url || "/assets/img/cloud/default-avatar.jpg";
}

/* ---------------------------------------------------------
   LOAD VENDOR INBOX
--------------------------------------------------------- */
export async function loadVendorInbox(user) {
  try {
    const res = await fetch(`${API}/api/vendor/messages/list?userId=${user.id}`);
    const msgs = await res.json();

    const map = new Map();

    (msgs || []).forEach(m => {
      if (!map.has(m.vendorId)) {
        map.set(m.vendorId, {
          id: `vendor-${m.vendorId}`,
          name: m.vendorName || "Vendor",
          preview: m.text || "",
          avatar: safeAvatar(m.vendorLogo),
          meta: {
            vendorId: m.vendorId,
            vendorName: m.vendorName || "Vendor",
            vendorLogo: safeAvatar(m.vendorLogo)
          }
        });
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.error("Vendor inbox error:", err);
    return [];
  }
}

/* ---------------------------------------------------------
   OPEN VENDOR THREAD
--------------------------------------------------------- */
export async function openVendorThread(user, thread, viewEl) {
  viewEl.innerHTML = "<div class='loading'>Loading vendor conversation...</div>";

  const res = await fetch(
    `${API}/api/vendor/messages/thread?userId=${user.id}&vendorId=${encodeURIComponent(thread.meta.vendorId)}`
  );
  const messages = await res.json();

  /* ---------------------------------------------------------
     THREAD UI
  --------------------------------------------------------- */
  viewEl.innerHTML = `
    <div class="thread-header vendor-thread-header">
      <img src="${thread.meta.vendorLogo}" class="thread-avatar">
      <div class="thread-title">${thread.meta.vendorName}</div>

      <div class="thread-actions">
        <button id="vendorBlockBtn" class="thread-btn red">Block</button>
        <button id="vendorMuteBtn" class="thread-btn yellow">Mute</button>
        <button id="vendorDeleteBtn" class="thread-btn gray">Delete</button>
      </div>
    </div>

    <div class="thread-container">
      <div class="thread-messages" id="vendorThreadMessages"></div>

      <div class="compose-box">
        <input id="vendorComposeInput" class="compose-input" placeholder="Type a message...">
        <button id="vendorComposeSend" class="compose-send">Send</button>
      </div>

      <div class="typing-indicator" id="vendorTypingIndicator" style="display:none;">
        Vendor is typing...
      </div>
    </div>
  `;

  const msgBox = el("vendorThreadMessages");

  /* ---------------------------------------------------------
     RENDER MESSAGES
  --------------------------------------------------------- */
  (messages || []).forEach(m => {
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble " + (m.fromUserId === user.id ? "msg-me" : "msg-them");

    bubble.innerHTML = `
      <div class="msg-text">${m.text}</div>
      <div class="msg-meta">
        <span>${new Date(m.createdAt).toLocaleTimeString()}</span>
        ${m.fromUserId === user.id ? `<span class="msg-status">${m.status || "sent"}</span>` : ""}
      </div>
    `;

    msgBox.appendChild(bubble);
  });

  msgBox.scrollTop = msgBox.scrollHeight;

  /* ---------------------------------------------------------
     SEND MESSAGE
  --------------------------------------------------------- */
  el("vendorComposeSend").onclick = async () => {
    const text = el("vendorComposeInput").value.trim();
    if (!text) return;

    const payload = {
      fromUserId: user.id,
      vendorId: thread.meta.vendorId,
      text
    };

    const sendRes = await fetch(`${API}/api/vendor/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const sendData = await sendRes.json();

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble msg-me";
    bubble.innerHTML = `
      <div class="msg-text">${text}</div>
      <div class="msg-meta">
        <span>${new Date().toLocaleTimeString()}</span>
        <span class="msg-status">sent</span>
      </div>
    `;

    msgBox.appendChild(bubble);
    msgBox.scrollTop = msgBox.scrollHeight;
    el("vendorComposeInput").value = "";
  };

  /* ---------------------------------------------------------
     BLOCK VENDOR
  --------------------------------------------------------- */
  el("vendorBlockBtn").onclick = async () => {
    await fetch(`${API}/api/vendor/messages/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        vendorId: thread.meta.vendorId
      })
    });

    alert("Vendor blocked.");
  };

  /* ---------------------------------------------------------
     MUTE VENDOR
  --------------------------------------------------------- */
  el("vendorMuteBtn").onclick = async () => {
    await fetch(`${API}/api/vendor/messages/mute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        vendorId: thread.meta.vendorId
      })
    });

    alert("Vendor muted.");
  };

  /* ---------------------------------------------------------
     DELETE THREAD (soft delete)
  --------------------------------------------------------- */
  el("vendorDeleteBtn").onclick = async () => {
    await fetch(`${API}/api/vendor/messages/deleteThread`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        vendorId: thread.meta.vendorId
      })
    });

    alert("Thread deleted.");
    viewEl.innerHTML = "<div class='notif-empty'>Thread deleted.</div>";
  };

  /* ---------------------------------------------------------
     TYPING INDICATOR (polling)
  --------------------------------------------------------- */
  setInterval(async () => {
    const res = await fetch(
      `${API}/api/vendor/messages/typing?vendorId=${thread.meta.vendorId}`
    );
    const data = await res.json();

    el("vendorTypingIndicator").style.display = data.typing ? "block" : "none";
  }, 1500);

  /* ---------------------------------------------------------
     AUTO REFRESH (new messages)
  --------------------------------------------------------- */
  setInterval(async () => {
    const res = await fetch(
      `${API}/api/vendor/messages/thread?userId=${user.id}&vendorId=${thread.meta.vendorId}`
    );
    const newMessages = await res.json();

    msgBox.innerHTML = "";

    (newMessages || []).forEach(m => {
      const bubble = document.createElement("div");
      bubble.className = "msg-bubble " + (m.fromUserId === user.id ? "msg-me" : "msg-them");

      bubble.innerHTML = `
        <div class="msg-text">${m.text}</div>
        <div class="msg-meta">
          <span>${new Date(m.createdAt).toLocaleTimeString()}</span>
          ${m.fromUserId === user.id ? `<span class="msg-status">${m.status || "sent"}</span>` : ""}
        </div>
      `;

      msgBox.appendChild(bubble);
    });

    msgBox.scrollTop = msgBox.scrollHeight;
  }, 3000);
}
