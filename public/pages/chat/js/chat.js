// =========================================================
// BELTLINE CLOUD — CHAT ENGINE
// =========================================================

const CHAT_API = "https://api.beltlinecloud.com/chat";

// API wrapper
async function cloudAPI(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error("Chat API Error");
  return res.json();
}

// =========================================================
// LOAD CHAT LIST
// =========================================================
export async function loadChatList(userId) {
  const chats = await cloudAPI(`${CHAT_API}/list/${userId}`);
  const container = document.getElementById("chatList");

  container.innerHTML = chats.map(c => `
    <div class="chat-card" onclick="location.href='/pages/chat/thread.html?id=${c.id}'">
      <h3>${c.name}</h3>
      <p>${c.lastMessage}</p>
    </div>
  `).join("");
}

// =========================================================
// LOAD THREAD
// =========================================================
export async function loadThread(threadId, userId) {
  const thread = await cloudAPI(`${CHAT_API}/thread/${threadId}`);
  const box = document.getElementById("messageBox");

  document.getElementById("threadName").textContent = thread.name;

  box.innerHTML = thread.messages.map(m => `
    <div class="msg ${m.userId === userId ? "me" : "them"}">
      <p>${m.text}</p>
      <span>${new Date(m.timestamp).toLocaleTimeString()}</span>
    </div>
  `).join("");
}

// =========================================================
// SEND MESSAGE
// =========================================================
export async function sendMessage(threadId, userId, text, isIncident = false) {
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

// =========================================================
// INCIDENT THREAD
// =========================================================
export async function loadIncidentThread(incidentId, userId) {
  const thread = await cloudAPI(`${CHAT_API}/incident/${incidentId}`);
  const box = document.getElementById("messageBox");

  box.innerHTML = thread.messages.map(m => `
    <div class="msg ${m.userId === userId ? "me" : "them"}">
      <p>${m.text}</p>
      <span>${new Date(m.timestamp).toLocaleTimeString()}</span>
    </div>
  `).join("");
}

// =========================================================
// LOAD RESPONDER CHANNELS
// =========================================================
export async function loadChannels() {
  const channels = await cloudAPI(`${CHAT_API}/channels`);
  const container = document.getElementById("channelList");

  container.innerHTML = channels.map(ch => `
    <div class="channel-card" onclick="location.href='/pages/chat/incident-thread.html?incident=${ch.id}'">
      <h3>${ch.name}</h3>
      <p>${ch.description}</p>
    </div>
  `).join("");
}
