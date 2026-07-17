// public/pages/chat/rooms/chat.js

const API_BASE = "https://api.beltlinecloud.com";

// Simple state
const state = {
  user: {
    id: null,
    name: "Guest",
    avatar: "/assets/img/default-avatar.png",
    color: "#00bcd4",
    font: "system"
  },
  currentRoomId: null,
  rooms: [],
  users: [],
  messages: []
};

// DOM
const roomsList = document.getElementById("roomsList");
const usersList = document.getElementById("usersList");
const messagesContainer = document.getElementById("messagesContainer");
const roomTitle = document.getElementById("roomTitle");
const roomTopic = document.getElementById("roomTopic");
const roomUserCount = document.getElementById("roomUserCount");
const nameColorSelect = document.getElementById("nameColorSelect");
const fontSelect = document.getElementById("fontSelect");
const emojiSelect = document.getElementById("emojiSelect");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const userNameEl = document.getElementById("userName");
const userAvatarEl = document.getElementById("userAvatar");

// Init
initUser();
loadRooms();
connectRoomEvents();
startPolling();

// User init from cloud_user
function initUser() {
  const cloudUserRaw = localStorage.getItem("cloud_user");
  if (cloudUserRaw) {
    try {
      const u = JSON.parse(cloudUserRaw);
      state.user.id = u.id;
      state.user.name = u.name || u.email || "Cloud User";
      state.user.avatar = u.photoUrl || state.user.avatar;
    } catch {}
  }
  userNameEl.textContent = state.user.name;
  userAvatarEl.src = state.user.avatar;
  userNameEl.style.color = state.user.color;
}

// Rooms
async function loadRooms() {
  try {
    const res = await fetch(`${API_BASE}/api/chat/rooms`, {
      credentials: "include"
    });
    const data = await res.json();
    state.rooms = Array.isArray(data) ? data : [];
    renderRooms();
    if (!state.currentRoomId && state.rooms.length) {
      joinRoom(state.rooms[0].id);
    }
  } catch (e) {
    console.error("loadRooms error", e);
  }
}

function renderRooms() {
  roomsList.innerHTML = "";
  state.rooms.forEach(room => {
    const li = document.createElement("li");
    li.className = room.id === state.currentRoomId ? "active" : "";
    li.onclick = () => joinRoom(room.id);

    const nameSpan = document.createElement("span");
    nameSpan.className = "room-name";
    nameSpan.textContent = room.name;

    const countSpan = document.createElement("span");
    countSpan.className = "room-count";
    countSpan.textContent = `${room.userCount || 0} online`;

    li.appendChild(nameSpan);
    li.appendChild(countSpan);
    roomsList.appendChild(li);
  });
}

async function joinRoom(roomId) {
  state.currentRoomId = roomId;
  try {
    const res = await fetch(`${API_BASE}/api/chat/room?id=${encodeURIComponent(roomId)}`, {
      credentials: "include"
    });
    const data = await res.json();
    roomTitle.textContent = data.name || "Room";
    roomTopic.textContent = data.topic || "";
    state.users = data.users || [];
    state.messages = data.messages || [];
    roomUserCount.textContent = `${state.users.length} online`;
    renderUsers();
    renderMessages();
  } catch (e) {
    console.error("joinRoom error", e);
  }
}

// Users
function renderUsers() {
  usersList.innerHTML = "";
  state.users.forEach(u => {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = u.avatar || "/assets/img/default-avatar.png";
    const span = document.createElement("span");
    span.textContent = u.name || "User";
    span.style.color = u.color || "#ffffff";
    li.appendChild(img);
    li.appendChild(span);
    usersList.appendChild(li);
  });
}

// Messages
function renderMessages() {
  messagesContainer.innerHTML = "";
  state.messages.forEach(m => {
    const row = document.createElement("div");
    row.className = "message-row";

    const avatar = document.createElement("img");
    avatar.className = "message-avatar";
    avatar.src = m.avatar || "/assets/img/default-avatar.png";

    const body = document.createElement("div");
    body.className = "message-body";

    const meta = document.createElement("div");
    meta.className = "message-meta";

    const nameSpan = document.createElement("span");
    nameSpan.className = "message-name";
    nameSpan.textContent = m.name || "User";
    nameSpan.style.color = m.color || "#ffffff";
    nameSpan.style.fontFamily = m.font || "inherit";

    const timeSpan = document.createElement("span");
    timeSpan.className = "message-time";
    timeSpan.textContent = formatTime(m.createdAt);

    meta.appendChild(nameSpan);
    meta.appendChild(timeSpan);

    const textDiv = document.createElement("div");
    textDiv.className = "message-text";
    textDiv.textContent = m.text || "";

    body.appendChild(meta);
    body.appendChild(textDiv);

    row.appendChild(avatar);
    row.appendChild(body);

    messagesContainer.appendChild(row);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });
  } catch {
    return "";
  }
}

// Sending
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

emojiSelect.addEventListener("change", () => {
  const emoji = emojiSelect.value;
  if (!emoji) return;
  messageInput.value += emoji;
  emojiSelect.value = "";
});

nameColorSelect.addEventListener("change", () => {
  state.user.color = nameColorSelect.value;
  userNameEl.style.color = state.user.color;
});

fontSelect.addEventListener("change", () => {
  const val = fontSelect.value;
  state.user.font = val === "system" ? "inherit" : val;
});

createRoomBtn.addEventListener("click", async () => {
  const name = prompt("Room name:");
  if (!name) return;
  try {
    const res = await fetch(`${API_BASE}/api/chat/rooms/create`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data && data.id) {
      await loadRooms();
      await joinRoom(data.id);
    }
  } catch (e) {
    console.error("createRoom error", e);
  }
});

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !state.currentRoomId) return;

  const payload = {
    roomId: state.currentRoomId,
    text,
    name: state.user.name,
    color: state.user.color,
    font: state.user.font,
    avatar: state.user.avatar
  };

  try {
    const res = await fetch(`${API_BASE}/api/chat/messages/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.success) {
      messageInput.value = "";
      await refreshMessages();
    }
  } catch (e) {
    console.error("sendMessage error", e);
  }
}

// Polling
function startPolling() {
  setInterval(() => {
    refreshMessages();
    refreshUsers();
  }, 4000);
}

async function refreshMessages() {
  if (!state.currentRoomId) return;
  try {
    const res = await fetch(`${API_BASE}/api/chat/messages?roomId=${encodeURIComponent(state.currentRoomId)}`, {
      credentials: "include"
    });
    const data = await res.json();
    state.messages = Array.isArray(data) ? data : [];
    renderMessages();
  } catch (e) {
    console.error("refreshMessages error", e);
  }
}

async function refreshUsers() {
  if (!state.currentRoomId) return;
  try {
    const res = await fetch(`${API_BASE}/api/chat/users?roomId=${encodeURIComponent(state.currentRoomId)}`, {
      credentials: "include"
    });
    const data = await res.json();
    state.users = Array.isArray(data) ? data : [];
    roomUserCount.textContent = `${state.users.length} online`;
    renderUsers();
  } catch (e) {
    console.error("refreshUsers error", e);
  }
}

// Room events
function connectRoomEvents() {
  // placeholder for future WebSocket or SSE hookup
}
