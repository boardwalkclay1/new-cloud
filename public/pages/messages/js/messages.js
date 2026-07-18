// /public/pages/messages/messages.js
// UPDATED UNIVERSAL MESSAGES JS — CLOUD + NETWORK + RESPONSE

import { Auth } from "/js/auth.js";

const user = Auth.current();
if (!user) {
  window.location.href = "/pages/login.html";
  throw new Error("User not logged in");
}

const viewEl = document.getElementById("messages-view") || document.getElementById("messageContainer");
const threadListEl = document.getElementById("threadList");
const familyListEl = document.getElementById("familyList");
const phonebookListEl = document.getElementById("phonebookList");
const userAvatarEl = document.getElementById("userAvatar");
const userNameEl = document.getElementById("userName");
const threadNameEl = document.getElementById("threadName");
const threadStatusEl = document.getElementById("threadStatus");

if (userAvatarEl) userAvatarEl.src = user.photoUrl || "/assets/img/cloud/default-avatar.jpg";
if (userNameEl) userNameEl.textContent = user.name || user.email;

/* ROUTER */
export function switchMessagesView(view, threadId = null, meta = {}) {
  if (view === "inbox") loadInbox();
  if (view === "thread") loadThread(threadId, meta);
  if (view === "compose") loadCompose();
  if (view === "requests") loadRequests();
  if (view === "settings") loadMessageSettings();
}

/* INBOX: CLOUD + NETWORK + RESPONSE */
async function loadInbox() {
  if (!viewEl) return;
  viewEl.innerHTML = "<div class='loading'>Loading inbox...</div>";

  const [cloud, network, response] = await Promise.all([
    fetch(`/api/work/message/list?userId=${user.id}`).then(r => r.json()).catch(() => []),
    fetch(`/api/network/messages/list?fromUserId=${user.id}`).then(r => r.json()).catch(() => []),
    fetch(`/api/response/messages/list?userId=${user.id}`).then(r => r.json()).catch(() => [])
  ]);

  const threads = [];

  (cloud || []).forEach(m => {
    threads.push({
      type: "cloud",
      threadId: m.threadId || `${m.fromId}-${m.toId}`,
      name: m.fromId === user.id ? m.toId : m.fromId,
      preview: m.text || "[cloud message]",
      avatar: m.avatar || "/assets/img/cloud/default-avatar.jpg",
      meta: { threadId: m.threadId, withId: m.fromId === user.id ? m.toId : m.fromId }
    });
  });

  (network || []).forEach(m => {
    threads.push({
      type: "network",
      threadId: `vendor-${m.vendorId}`,
      name: m.vendorName || "Vendor",
      preview: m.text || "[vendor message]",
      avatar: m.vendorLogo || "/assets/img/cloud/default-avatar.jpg",
      meta: { vendorId: m.vendorId }
    });
  });

  (response || []).forEach(m => {
    threads.push({
      type: "response",
      threadId: `response-${m.threadId || `${m.fromId}-${m.toId}`}`,
      name: m.fromId === user.id ? m.toId : m.fromId,
      preview: m.text || "[response message]",
      avatar: "/assets/img/cloud/default-avatar.jpg",
      meta: { threadId: m.threadId, withId: m.fromId === user.id ? m.toId : m.fromId }
    });
  });

  if (threadListEl) threadListEl.innerHTML = "";
  viewEl.innerHTML = "";

  if (!threads.length) {
    viewEl.innerHTML = "<div class='notif-empty'>No messages yet.</div>";
    return;
  }

  threads.forEach(t => {
    const li = document.createElement("li");
    li.className = "inbox-item";
    li.onclick = () => switchMessagesView("thread", t.threadId, { type: t.type, meta: t.meta });

    li.innerHTML = `
      <img src="${t.avatar}" class="inbox-avatar">
      <div class="inbox-info">
        <div class="inbox-name">${t.name}</div>
        <div class="inbox-preview">${t.preview}</div>
      </div>
    `;

    if (threadListEl) threadListEl.appendChild(li);
  });
}

/* THREAD: CLOUD / NETWORK / RESPONSE */
async function loadThread(threadId, { type = "cloud", meta = {} } = {}) {
  if (!viewEl) return;
  viewEl.innerHTML = "<div class='loading'>Loading conversation...</div>";

  let messages = [];

  if (type === "cloud") {
    const res = await fetch(`/api/work/message/thread?userId=${user.id}&threadId=${encodeURIComponent(meta.threadId || threadId)}`);
    const data = await res.json();
    messages = Array.isArray(data) ? data : [];
    if (threadNameEl) threadNameEl.textContent = "Cloud conversation";
  }

  if (type === "network") {
    const res = await fetch(`/api/network/messages/thread?fromUserId=${user.id}&vendorId=${encodeURIComponent(meta.vendorId)}`);
    const data = await res.json();
    messages = Array.isArray(data) ? data : [];
    if (threadNameEl) threadNameEl.textContent = "Vendor messages";
  }

  if (type === "response") {
    const res = await fetch(`/api/response/messages/thread?userId=${user.id}&withId=${encodeURIComponent(meta.withId)}`);
    const data = await res.json();
    messages = Array.isArray(data) ? data : [];
    if (threadNameEl) threadNameEl.textContent = "Response messages";
  }

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

  messages.forEach(m => {
    const bubble = document.createElement("div");
    const senderId = m.fromId || m.senderId;
    bubble.className = "msg-bubble " + (senderId === user.id ? "msg-me" : "msg-them");
    bubble.textContent = m.text || "";
    msgBox.appendChild(bubble);
  });

  msgBox.scrollTop = msgBox.scrollHeight;

  document.getElementById("composeSend").onclick = async () => {
    const text = document.getElementById("composeInput").value.trim();
    if (!text) return;

    if (type === "cloud") {
      await fetch(`/api/work/message/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: meta.threadId || threadId,
          fromId: user.id,
          toId: meta.withId || user.id,
          text
        })
      });
    }

    if (type === "network") {
      await fetch(`/api/network/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: user.id,
          vendorId: meta.vendorId,
          text
        })
      });
    }

    if (type === "response") {
      await fetch(`/api/response/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: user.id,
          toId: meta.withId,
          text
        })
      });
    }

    switchMessagesView("thread", threadId, { type, meta });
  };
}

/* COMPOSE: NEW CLOUD THREAD */
function loadCompose() {
  if (!viewEl) return;
  viewEl.innerHTML = `
    <div class="thread-container">
      <div class="compose-box">
        <input id="composeInput" class="compose-input" placeholder="Type a message...">
        <button id="composeSend" class="compose-send">Send</button>
      </div>
    </div>
  `;

  document.getElementById("composeSend").onclick = async () => {
    const text = document.getElementById("composeInput").value.trim();
    if (!text) return;

    await fetch(`/api/work/message/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromId: user.id,
        toId: user.id,
        text
      })
    });

    switchMessagesView("inbox");
  };
}

/* REQUESTS: USE RESPONSE SYSTEM FOR NOW */
async function loadRequests() {
  if (!viewEl) return;
  viewEl.innerHTML = "<div class='loading'>Loading requests...</div>";

  const res = await fetch(`/api/response/messages/requests?userId=${user.id}`).catch(() => null);
  const data = res ? await res.json() : [];

  viewEl.innerHTML = "";

  if (!data || data.length === 0) {
    viewEl.innerHTML = "<div class='notif-empty'>No message requests.</div>";
    return;
  }

  data.forEach(req => {
    const div = document.createElement("div");
    div.className = "request-item";

    div.innerHTML = `
      <div class="inbox-name">${req.name || req.fromId}</div>
      <p>${req.preview || req.text}</p>

      <div class="request-actions">
        <button class="request-btn" onclick="acceptRequest('${req.id}')">Accept</button>
        <button class="request-btn" onclick="declineRequest('${req.id}')">Decline</button>
      </div>
    `;

    viewEl.appendChild(div);
  });
}

window.acceptRequest = async function(id) {
  await fetch(`/api/response/messages/requests/accept?userId=${user.id}&req=${id}`);
  loadRequests();
};

window.declineRequest = async function(id) {
  await fetch(`/api/response/messages/requests/decline?userId=${user.id}&req=${id}`);
  loadRequests();
};

/* SETTINGS */
function loadMessageSettings() {
  if (!viewEl) return;
  viewEl.innerHTML = `
    <div class="thread-container">
      <h3 style="font-family:Cinzel; color:#f7d354;">Message Settings</h3>
      <p style="color:white;">Block list, mute list, privacy controls coming soon.</p>
    </div>
  `;
}

/* CLOUD FAMILY + PHONEBOOK SIDEBARS */
(async function loadSidebars() {
  if (familyListEl) {
    const res = await fetch(`/api/work/family/list?userId=${user.id}`).catch(() => null);
    const data = res ? await res.json() : [];
    familyListEl.innerHTML = "";
    (data || []).forEach(f => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${f.familyId}</span>`;
      li.onclick = () => switchMessagesView("thread", `cloud-${f.familyId}`, { type: "cloud", meta: { withId: f.familyId } });
      familyListEl.appendChild(li);
    });
  }

  if (phonebookListEl) {
    const res = await fetch(`/api/vendor/phonebook?email=${encodeURIComponent(user.email)}`).catch(() => null);
    const data = res ? await res.json() : [];
    phonebookListEl.innerHTML = "";
    (data || []).forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${p.name || p.phone}</span>`;
      li.onclick = () => switchMessagesView("thread", `phone-${p.id}`, { type: "cloud", meta: { withId: p.userId } });
      phonebookListEl.appendChild(li);
    });
  }
})();

/* AUTO LOAD VIEW */
const params = new URLSearchParams(window.location.search);
const view = params.get("view");
switchMessagesView(view || "inbox");

/* MENU */
const menu = document.getElementById("cloudMenu");
const trigger = document.getElementById("menuTrigger");
const closeBtn = document.getElementById("menuClose");

if (trigger && menu && closeBtn) {
  trigger.onclick = () => menu.classList.add("open");
  closeBtn.onclick = () => menu.classList.remove("open");
}

/* LOGOUT */
window.logout = function () {
  Auth.logout();
  window.location.href = "/pages/login.html";
};
