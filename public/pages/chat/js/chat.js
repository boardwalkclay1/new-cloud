// =========================================================
// BELTLINE CLOUD — CHAT ENGINE (UPGRADED)
// =========================================================

const CHAT_API = "https://api.beltlinecloud.com/chat";

/* ---------------------------------------------------------
   CORE API WRAPPER
--------------------------------------------------------- */
async function cloudAPI(path, options = {}) {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      console.error("Chat API Error:", res.status, res.statusText);
      throw new Error("Chat API Error");
    }

    return res.json();
  } catch (err) {
    console.error("Cloud Chat API Failure:", err);
    return { error: true };
  }
}

/* ---------------------------------------------------------
   LOAD CHAT LIST (One-on-One + Groups)
--------------------------------------------------------- */
export async function loadChatList(userId) {
  const container = document.getElementById("chatList");
  if (!container) return;

  const chats = await cloudAPI(`${CHAT_API}/list/${userId}`);
  if (!chats || chats.error) {
    container.innerHTML = `<p class="error">Unable to load chats.</p>`;
    return;
  }

  container.innerHTML = chats.map(c => `
    <div class="chat-card" onclick="location.href='/pages/chat/thread.html?id=${c.id}'">
      <h3>${c.name}</h3>
      <p>${c.lastMessage || "No messages yet"}</p>
      <span class="chat-time">${new Date(c.updatedAt).toLocaleString()}</span>
    </div>
  `).join("");
}

/* ---------------------------------------------------------
   LOAD THREAD (Messages)
--------------------------------------------------------- */
export async function loadThread(threadId, userId) {
  const thread = await cloudAPI(`${CHAT_API}/thread/${threadId}`);
  const box = document.getElementById("messageBox");
  const title = document.getElementById("threadName");

  if (!thread || thread.error) {
    box.innerHTML = `<p class="error">Unable to load thread.</p>`;
    return;
  }

  title.textContent = thread.name;

  box.innerHTML = thread.messages.map(m => `
    <div class="msg ${m.userId === userId ? "me" : "them"}">
      <p>${m.text}</p>
      <span>${new Date(m.timestamp).toLocaleTimeString()}</span>
    </div>
  `).join("");

  box.scrollTop = box.scrollHeight;
}

/* ---------------------------------------------------------
   SEND MESSAGE (Text)
--------------------------------------------------------- */
export async function sendMessage(threadId, userId, text, isIncident = false) {
  if (!text.trim()) return;

  await cloudAPI(`${CHAT_API}/send`, {
    method: "POST",
    body: JSON.stringify({
      threadId,
      userId,
      text,
      isIncident
    })
  });

  loadThread(threadId, userId);
}

/* ---------------------------------------------------------
   SEND VOICE MESSAGE
--------------------------------------------------------- */
export async function sendVoiceMessage(threadId, userId, blob) {
  const formData = new FormData();
  formData.append("threadId", threadId);
  formData.append("userId", userId);
  formData.append("voice", blob);

  await fetch(`${CHAT_API}/send-voice`, {
    method: "POST",
    body: formData
  });

  loadThread(threadId, userId);
}

/* ---------------------------------------------------------
   SEND PHOTO
--------------------------------------------------------- */
export async function sendPhoto(threadId, userId, file) {
  const formData = new FormData();
  formData.append("threadId", threadId);
  formData.append("userId", userId);
  formData.append("photo", file);

  await fetch(`${CHAT_API}/send-photo`, {
    method: "POST",
    body: formData
  });

  loadThread(threadId, userId);
}

/* ---------------------------------------------------------
   INCIDENT THREAD (Responder Channels)
--------------------------------------------------------- */
export async function loadIncidentThread(incidentId, userId) {
  const thread = await cloudAPI(`${CHAT_API}/incident/${incidentId}`);
  const box = document.getElementById("messageBox");

  if (!thread || thread.error) {
    box.innerHTML = `<p class="error">Unable to load incident thread.</p>`;
    return;
  }

  box.innerHTML = thread.messages.map(m => `
    <div class="msg ${m.userId === userId ? "me" : "them"}">
      <p>${m.text}</p>
      <span>${new Date(m.timestamp).toLocaleTimeString()}</span>
    </div>
  `).join("");

  box.scrollTop = box.scrollHeight;
}

/* ---------------------------------------------------------
   LOAD RESPONDER CHANNELS (Emergency Rooms)
--------------------------------------------------------- */
export async function loadChannels() {
  const container = document.getElementById("channelList");
  if (!container) return;

  const channels = await cloudAPI(`${CHAT_API}/channels`);
  if (!channels || channels.error) {
    container.innerHTML = `<p class="error">Unable to load channels.</p>`;
    return;
  }

  container.innerHTML = channels.map(ch => `
    <div class="channel-card" onclick="location.href='/pages/chat/incident-thread.html?incident=${ch.id}'">
      <h3>${ch.name}</h3>
      <p>${ch.description}</p>
    </div>
  `).join("");
}

/* ---------------------------------------------------------
   CREATE GROUP CHAT
--------------------------------------------------------- */
export async function createGroupChat(userId, groupName, members) {
  const res = await cloudAPI(`${CHAT_API}/group/create`, {
    method: "POST",
    body: JSON.stringify({
      ownerId: userId,
      name: groupName,
      members
    })
  });

  return res;
}

/* ---------------------------------------------------------
   SEND GROUP JOIN REQUEST
--------------------------------------------------------- */
export async function sendJoinRequest(groupId, userId) {
  return cloudAPI(`${CHAT_API}/group/join-request`, {
    method: "POST",
    body: JSON.stringify({ groupId, userId })
  });
}

/* ---------------------------------------------------------
   LOAD JOIN REQUESTS
--------------------------------------------------------- */
export async function loadJoinRequests(userId) {
  const container = document.getElementById("requestList");
  if (!container) return;

  const requests = await cloudAPI(`${CHAT_API}/group/requests/${userId}`);

  container.innerHTML = requests.map(r => `
    <div class="request-card">
      <h3>${r.groupName}</h3>
      <p>Requested by: ${r.requesterName}</p>
      <button onclick="approveRequest('${r.id}')">Approve</button>
      <button onclick="denyRequest('${r.id}')">Deny</button>
    </div>
  `).join("");
}

export async function approveRequest(requestId) {
  await cloudAPI(`${CHAT_API}/group/approve`, {
    method: "POST",
    body: JSON.stringify({ requestId })
  });
  location.reload();
}

export async function denyRequest(requestId) {
  await cloudAPI(`${CHAT_API}/group/deny`, {
    method: "POST",
    body: JSON.stringify({ requestId })
  });
  location.reload();
}
