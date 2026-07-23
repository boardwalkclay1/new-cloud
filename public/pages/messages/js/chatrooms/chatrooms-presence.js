// /public/pages/messages/js/chatrooms/chatrooms-presence.js
// CHATROOM PRESENCE — join, leave, list members, heartbeat

const API = "https://api.beltlinecloud.com";
const Auth = window.Auth;

/* ---------------------------------------------------------
   JOIN ROOM
--------------------------------------------------------- */
export async function joinRoom(user, roomId) {
  try {
    const res = await fetch(`${API}/api/chatrooms/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        roomId
      })
    });

    return await res.json();
  } catch (err) {
    console.error("joinRoom error:", err);
    return { success: false };
  }
}

/* ---------------------------------------------------------
   LEAVE ROOM
--------------------------------------------------------- */
export async function leaveRoom(user, roomId) {
  try {
    const res = await fetch(`${API}/api/chatrooms/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        roomId
      })
    });

    return await res.json();
  } catch (err) {
    console.error("leaveRoom error:", err);
    return { success: false };
  }
}

/* ---------------------------------------------------------
   GET PRESENCE LIST
--------------------------------------------------------- */
export async function getPresence(roomId) {
  try {
    const res = await fetch(`${API}/api/chatrooms/presence?roomId=${roomId}`);
    return await res.json();
  } catch (err) {
    console.error("getPresence error:", err);
    return [];
  }
}

/* ---------------------------------------------------------
   HEARTBEAT (auto presence refresh)
--------------------------------------------------------- */
export function startPresenceHeartbeat(user, roomId, callback) {
  setInterval(async () => {
    const list = await getPresence(roomId);
    callback(list);
  }, 2000);
}
