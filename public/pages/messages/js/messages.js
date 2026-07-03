import { Auth } from "/js/auth.js";

const user = Auth.current();
if (!user) {
  window.location.href = "/pages/login.html";
  throw new Error("User not logged in");
}

const viewEl = document.getElementById("messages-view");

/* ROUTER */
export function switchMessagesView(view, threadId = null) {
  if (view === "inbox") loadInbox();
  if (view === "thread") loadThread(threadId);
  if (view === "compose") loadCompose();
  if (view === "requests") loadRequests();
  if (view === "settings") loadMessageSettings();
}

/* INBOX */
async function loadInbox() {
  viewEl.innerHTML = "<div class='loading'>Loading inbox...</div>";

  const res = await fetch(`/api/messages/inbox?id=${user.id}`);
  const data = await res.json();

  viewEl.innerHTML = "";

  if (!data || data.length === 0) {
    viewEl.innerHTML = "<div class='notif-empty'>No messages yet.</div>";
    return;
  }

  data.forEach(msg => {
    const div = document.createElement("div");
    div.className = "inbox-item";
    div.onclick = () => switchMessagesView("thread", msg.threadId);

    div.innerHTML = `
      <img src="${msg.avatar || '/assets/img/cloud/default-avatar.jpg'}" class="inbox-avatar">
      <div class="inbox-info">
        <div class="inbox-name">${msg.name}</div>
        <div class="inbox-preview">${msg.preview}</div>
      </div>
    `;

    viewEl.appendChild(div);
  });
}

/* THREAD */
async function loadThread(threadId) {
  viewEl.innerHTML = "<div class='loading'>Loading conversation...</div>";

  const res = await fetch(`/api/messages/thread?id=${user.id}&thread=${threadId}`);
  const data = await res.json();

  viewEl.innerHTML = `
    <div class="thread-container">
      <div class="thread-messages" id="threadMessages"></div>

      <div class="compose-box">
        <input id="composeInput" class="compose-input" placeholder="Type a message...">
        <button id="composeSend" class="compose-send">Send</button>
      </div>
    </div>
  `;

  const msgBox = document.getElementById("threadMessages");

  data.messages.forEach(m => {
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble " + (m.senderId === user.id ? "msg-me" : "msg-them");
    bubble.textContent = m.text;
    msgBox.appendChild(bubble);
  });

  msgBox.scrollTop = msgBox.scrollHeight;

  document.getElementById("composeSend").onclick = async () => {
    const text = document.getElementById("composeInput").value.trim();
    if (!text) return;

    await fetch(`/api/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        senderId: user.id,
        text
      })
    });

    switchMessagesView("thread", threadId);
  };
}

/* COMPOSE */
function loadCompose() {
  viewEl.innerHTML = `
    <div class="thread-container">
      <div class="compose-box">
        <input id="composeInput" class="compose-input" placeholder="Search user or type message...">
        <button id="composeSend" class="compose-send">Send</button>
      </div>
    </div>
  `;

  document.getElementById("composeSend").onclick = async () => {
    const text = document.getElementById("composeInput").value.trim();
    if (!text) return;

    await fetch(`/api/messages/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.id,
        text
      })
    });

    switchMessagesView("inbox");
  };
}

/* REQUESTS */
async function loadRequests() {
  viewEl.innerHTML = "<div class='loading'>Loading requests...</div>";

  const res = await fetch(`/api/messages/requests?id=${user.id}`);
  const data = await res.json();

  viewEl.innerHTML = "";

  if (!data || data.length === 0) {
    viewEl.innerHTML = "<div class='notif-empty'>No message requests.</div>";
    return;
  }

  data.forEach(req => {
    const div = document.createElement("div");
    div.className = "request-item";

    div.innerHTML = `
      <div class="inbox-name">${req.name}</div>
      <p>${req.preview}</p>

      <div class="request-actions">
        <button class="request-btn" onclick="acceptRequest('${req.id}')">Accept</button>
        <button class="request-btn" onclick="declineRequest('${req.id}')">Decline</button>
      </div>
    `;

    viewEl.appendChild(div);
  });
}

window.acceptRequest = async function(id) {
  await fetch(`/api/messages/requests/accept?id=${user.id}&req=${id}`);
  loadRequests();
};

window.declineRequest = async function(id) {
  await fetch(`/api/messages/requests/decline?id=${user.id}&req=${id}`);
  loadRequests();
};

/* SETTINGS */
function loadMessageSettings() {
  viewEl.innerHTML = `
    <div class="thread-container">
      <h3 style="font-family:Cinzel; color:#f7d354;">Message Settings</h3>

      <p style="color:white;">Block list, mute list, privacy controls coming soon.</p>
    </div>
  `;
}

/* AUTO LOAD VIEW */
const params = new URLSearchParams(window.location.search);
const view = params.get("view");

switchMessagesView(view || "inbox");

/* MENU */
const menu = document.getElementById("cloudMenu");
const trigger = document.getElementById("menuTrigger");
const closeBtn = document.getElementById("menuClose");

trigger.onclick = () => menu.classList.add("open");
closeBtn.onclick = () => menu.classList.remove("open");

/* LOGOUT */
window.logout = function () {
  Auth.logout();
  window.location.href = "/pages/login.html";
};
