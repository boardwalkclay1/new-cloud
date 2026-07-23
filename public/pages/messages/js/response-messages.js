// /js/messages/response-messages.js
// RESPONSE UNIT MESSAGING — MEMBER ↔ MEMBER / MEMBER ↔ COMMAND

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
   LOAD RESPONSE INBOX
--------------------------------------------------------- */
export async function loadResponseInbox(user) {
  try {
    const res = await fetch(`${API}/api/response/messages/list?userId=${user.id}`);
    const msgs = await res.json();

    const map = new Map();

    (msgs || []).forEach(m => {
      const key = m.threadId || `${m.fromId}-${m.toId}`;

      if (!map.has(key)) {
        map.set(key, {
          id: `response-${key}`,
          name: m.withName || "Response Member",
          preview: m.text || "",
          avatar: safeAvatar(m.withAvatar),
          meta: {
            threadId: m.threadId || key,
            withId: m.fromId === user.id ? m.toId : m.fromId,
            withName: m.withName || "Response Member",
            withAvatar: safeAvatar(m.withAvatar)
          }
        });
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.error("Response inbox error:", err);
    return [];
  }
}

/* ---------------------------------------------------------
   OPEN RESPONSE THREAD
--------------------------------------------------------- */
export async function openResponseThread(user, thread, viewEl) {
  viewEl.innerHTML = "<div class='loading'>Loading Response Unit conversation...</div>";

  const res = await fetch(
    `${API}/api/response/messages/thread?userId=${user.id}&withId=${encodeURIComponent(thread.meta.withId)}`
  );
  const messages = await res.json();

  /* THREAD UI */
  viewEl.innerHTML = `
    <div class="thread-header response-thread-header">
      <img src="${thread.meta.withAvatar}" class="thread-avatar">
      <div class="thread-title">${thread.meta.withName}</div>

      <div class="thread-actions">
        <button id="respBlockBtn" class="thread-btn red">Block</button>
        <button id="respMuteBtn" class="thread-btn yellow">Mute</button>
        <button id="respDeleteBtn" class="thread-btn gray">Delete</button>
      </div>
    </div>

    <div class="thread-container">
      <div class="thread-messages" id="respThreadMessages"></div>

      <div class="compose-box">
        <input id="respComposeInput" class="compose-input" placeholder="Type a message...">
        <button id="respComposeSend" class="compose-send">Send</button>
      </div>

      <div class="typing-indicator" id="respTypingIndicator" style="display:none;">
        Member is typing...
      </div>
    </div>
  `;

  const msgBox = el("respThreadMessages");

  /* RENDER MESSAGES */
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

  /* SEND MESSAGE */
  el("respComposeSend").onclick = async () => {
    const text = el("respComposeInput").value.trim();
    if (!text) return;

    const payload = {
      fromUserId: user.id,
      toUserId: thread.meta.withId,
      text
    };

    const sendRes = await fetch(`${API}/api/response/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    await sendRes.json();

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
    el("respComposeInput").value = "";
  };

  /* BLOCK MEMBER */
  el("respBlockBtn").onclick = async () => {
    await fetch(`${API}/api/response/messages/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        withId: thread.meta.withId
      })
    });

    alert("Response Unit member blocked.");
  };

  /* MUTE THREAD */
  el("respMuteBtn").onclick = async () => {
    await fetch(`${API}/api/response/messages/mute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        withId: thread.meta.withId
      })
    });

    alert("Response Unit thread muted.");
  };

  /* DELETE THREAD */
  el("respDeleteBtn").onclick = async () => {
    await fetch(`${API}/api/response/messages/deleteThread`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        withId: thread.meta.withId
      })
    });

    alert("Response Unit thread deleted.");
    viewEl.innerHTML = "<div class='notif-empty'>Thread deleted.</div>";
  };

  /* TYPING INDICATOR */
  setInterval(async () => {
    const res = await fetch(
      `${API}/api/response/messages/typing?withId=${thread.meta.withId}`
    );
    const data = await res.json();
    el("respTypingIndicator").style.display = data.typing ? "block" : "none";
  }, 1500);

  /* AUTO REFRESH */
  setInterval(async () => {
    const res = await fetch(
      `${API}/api/response/messages/thread?userId=${user.id}&withId=${thread.meta.withId}`
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
