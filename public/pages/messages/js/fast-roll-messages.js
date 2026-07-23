// /js/messages/fastroll-messages.js
// FAST ROLL MESSAGING — RIDER ↔ DISPATCH / RIDER ↔ CUSTOMER

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
   LOAD FAST ROLL INBOX
--------------------------------------------------------- */
export async function loadFastRollInbox(user) {
  try {
    const res = await fetch(`${API}/api/fastroll/messages/list?userId=${user.id}`);
    const msgs = await res.json();

    const map = new Map();

    (msgs || []).forEach(m => {
      if (!map.has(m.riderId)) {
        map.set(m.riderId, {
          id: `fastroll-${m.riderId}`,
          name: m.riderName || "Fast Roll",
          preview: m.text || "",
          avatar: safeAvatar(m.riderPhoto),
          meta: {
            riderId: m.riderId,
            riderName: m.riderName || "Fast Roll",
            riderPhoto: safeAvatar(m.riderPhoto)
          }
        });
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.error("Fast Roll inbox error:", err);
    return [];
  }
}

/* ---------------------------------------------------------
   OPEN FAST ROLL THREAD
--------------------------------------------------------- */
export async function openFastRollThread(user, thread, viewEl) {
  viewEl.innerHTML = "<div class='loading'>Loading Fast Roll conversation...</div>";

  const res = await fetch(
    `${API}/api/fastroll/messages/thread?userId=${user.id}&riderId=${encodeURIComponent(thread.meta.riderId)}`
  );
  const messages = await res.json();

  /* THREAD UI */
  viewEl.innerHTML = `
    <div class="thread-header fastroll-thread-header">
      <img src="${thread.meta.riderPhoto}" class="thread-avatar">
      <div class="thread-title">${thread.meta.riderName}</div>

      <div class="thread-actions">
        <button id="frBlockBtn" class="thread-btn red">Block</button>
        <button id="frMuteBtn" class="thread-btn yellow">Mute</button>
        <button id="frDeleteBtn" class="thread-btn gray">Delete</button>
      </div>
    </div>

    <div class="thread-container">
      <div class="thread-messages" id="frThreadMessages"></div>

      <div class="compose-box">
        <input id="frComposeInput" class="compose-input" placeholder="Type a message...">
        <button id="frComposeSend" class="compose-send">Send</button>
      </div>

      <div class="typing-indicator" id="frTypingIndicator" style="display:none;">
        Rider is typing...
      </div>
    </div>
  `;

  const msgBox = el("frThreadMessages");

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
  el("frComposeSend").onclick = async () => {
    const text = el("frComposeInput").value.trim();
    if (!text) return;

    const payload = {
      fromUserId: user.id,
      riderId: thread.meta.riderId,
      text
    };

    const sendRes = await fetch(`${API}/api/fastroll/messages/send`, {
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
    el("frComposeInput").value = "";
  };

  /* BLOCK RIDER / DISPATCH */
  el("frBlockBtn").onclick = async () => {
    await fetch(`${API}/api/fastroll/messages/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        riderId: thread.meta.riderId
      })
    });

    alert("Fast Roll contact blocked.");
  };

  /* MUTE THREAD */
  el("frMuteBtn").onclick = async () => {
    await fetch(`${API}/api/fastroll/messages/mute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        riderId: thread.meta.riderId
      })
    });

    alert("Fast Roll thread muted.");
  };

  /* DELETE THREAD */
  el("frDeleteBtn").onclick = async () => {
    await fetch(`${API}/api/fastroll/messages/deleteThread`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        riderId: thread.meta.riderId
      })
    });

    alert("Fast Roll thread deleted.");
    viewEl.innerHTML = "<div class='notif-empty'>Thread deleted.</div>";
  };

  /* TYPING INDICATOR (polling) */
  setInterval(async () => {
    const res = await fetch(
      `${API}/api/fastroll/messages/typing?riderId=${thread.meta.riderId}`
    );
    const data = await res.json();
    el("frTypingIndicator").style.display = data.typing ? "block" : "none";
  }, 1500);

  /* AUTO REFRESH */
  setInterval(async () => {
    const res = await fetch(
      `${API}/api/fastroll/messages/thread?userId=${user.id}&riderId=${thread.meta.riderId}`
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
