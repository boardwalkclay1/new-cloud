// /public/pages/messages/js/chatrooms/chatrooms-text.js
// TEXT CHATROOM ENGINE — messaging, attachments, presence, moderation

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
   LOAD ALL TEXT ROOMS
--------------------------------------------------------- */
export async function loadTextRooms(user) {
  try {
    const res = await fetch(`${API}/api/chatrooms/text/list?userId=${user.id}`);
    const rooms = await res.json();

    return (rooms || []).map(r => ({
      id: r.id,
      name: r.name,
      preview: r.lastText || "",
      avatar: safeAvatar(r.avatar),
      meta: { type: "text", roomId: r.id }
    }));
  } catch (err) {
    console.error("loadTextRooms error:", err);
    return [];
  }
}

/* ---------------------------------------------------------
   OPEN TEXT ROOM
--------------------------------------------------------- */
export async function openTextRoom(user, roomId, viewEl) {
  viewEl.innerHTML = "<div class='loading'>Loading chatroom...</div>";

  const res = await fetch(`${API}/api/chatrooms/text/messages?roomId=${roomId}`);
  const messages = await res.json();

  /* ROOM UI */
  viewEl.innerHTML = `
    <div class="thread-header chatroom-header">
      <div class="thread-title">Chatroom</div>

      <div class="thread-actions">
        <button id="crLeaveBtn" class="thread-btn red">Leave</button>
        <button id="crMuteBtn" class="thread-btn yellow">Mute</button>
        <button id="crDeleteBtn" class="thread-btn gray">Delete</button>
      </div>
    </div>

    <div class="thread-container">
      <div class="thread-messages" id="crThreadMessages"></div>

      <div class="compose-box">
        <input id="crComposeInput" class="compose-input" placeholder="Type a message...">
        <button id="crComposeSend" class="compose-send">Send</button>
      </div>

      <div class="typing-indicator" id="crTypingIndicator" style="display:none;">
        Someone is typing...
      </div>
    </div>
  `;

  const msgBox = el("crThreadMessages");

  /* RENDER MESSAGES */
  (messages || []).forEach(m => {
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble " + (m.fromUserId === user.id ? "msg-me" : "msg-them");

    bubble.innerHTML = `
      <div class="msg-text">${m.text}</div>
      <div class="msg-meta">
        <span>${new Date(m.createdAt).toLocaleTimeString()}</span>
      </div>
    `;

    msgBox.appendChild(bubble);
  });

  msgBox.scrollTop = msgBox.scrollHeight;

  /* SEND MESSAGE */
  el("crComposeSend").onclick = async () => {
    const text = el("crComposeInput").value.trim();
    if (!text) return;

    await fetch(`${API}/api/chatrooms/text/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        fromUserId: user.id,
        text
      })
    });

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble msg-me";
    bubble.innerHTML = `
      <div class="msg-text">${text}</div>
      <div class="msg-meta">
        <span>${new Date().toLocaleTimeString()}</span>
      </div>
    `;

    msgBox.appendChild(bubble);
    msgBox.scrollTop = msgBox.scrollHeight;
    el("crComposeInput").value = "";
  };

  /* LEAVE ROOM */
  el("crLeaveBtn").onclick = async () => {
    await fetch(`${API}/api/chatrooms/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, roomId })
    });

    alert("You left the chatroom.");
    viewEl.innerHTML = "<div class='notif-empty'>You left this room.</div>";
  };

  /* MUTE ROOM */
  el("crMuteBtn").onclick = async () => {
    await fetch(`${API}/api/chatrooms/mute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, roomId })
    });

    alert("Room muted.");
  };

  /* DELETE ROOM */
  el("crDeleteBtn").onclick = async () => {
    await fetch(`${API}/api/chatrooms/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, roomId })
    });

    alert("Room deleted.");
    viewEl.innerHTML = "<div class='notif-empty'>Room deleted.</div>";
  };

  /* TYPING INDICATOR */
  setInterval(async () => {
    const res = await fetch(`${API}/api/chatrooms/text/typing?roomId=${roomId}`);
    const data = await res.json();
    el("crTypingIndicator").style.display = data.typing ? "block" : "none";
  }, 1500);

  /* AUTO REFRESH */
  setInterval(async () => {
    const res = await fetch(`${API}/api/chatrooms/text/messages?roomId=${roomId}`);
    const newMessages = await res.json();

    msgBox.innerHTML = "";

    (newMessages || []).forEach(m => {
      const bubble = document.createElement("div");
      bubble.className = "msg-bubble " + (m.fromUserId === user.id ? "msg-me" : "msg-them");

      bubble.innerHTML = `
        <div class="msg-text">${m.text}</div>
        <div class="msg-meta">
          <span>${new Date(m.createdAt).toLocaleTimeString()}</span>
        </div>
      `;

      msgBox.appendChild(bubble);
    });

    msgBox.scrollTop = msgBox.scrollHeight;
  }, 3000);
}
