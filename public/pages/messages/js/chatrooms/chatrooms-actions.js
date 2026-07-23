// /public/pages/messages/js/chatrooms/chatrooms-actions.js
// CHATROOM ACTIONS — create, delete, mute, block, rename, promote, demote

const API = "https://api.beltlinecloud.com";
const Auth = window.Auth;

/* ---------------------------------------------------------
   CREATE ROOM
--------------------------------------------------------- */
export async function createRoom(user, name, type = "text") {
  try {
    const res = await fetch(`${API}/api/chatrooms/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        name,
        type
      })
    });

    return await res.json();
  } catch (err) {
    console.error("createRoom error:", err);
    return { success: false };
  }
}

/* ---------------------------------------------------------
   DELETE ROOM
--------------------------------------------------------- */
export async function deleteRoom(user, roomId) {
  try {
    const res = await fetch(`${API}/api/chatrooms/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        roomId
      })
    });

    return await res.json();
  } catch (err) {
    console.error("deleteRoom error:", err);
    return { success: false };
  }
}

/* ---------------------------------------------------------
   MUTE ROOM
--------------------------------------------------------- */
export async function muteRoom(user, roomId) {
  try {
    const res = await fetch(`${API}/api/chatrooms/mute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        roomId
      })
    });

    return await res.json();
  } catch (err) {
    console.error("muteRoom error:", err);
    return { success: false };
  }
}

/* ---------------------------------------------------------
   BLOCK ROOM
--------------------------------------------------------- */
export async function blockRoom(user, roomId) {
  try {
    const res = await fetch(`${API}/api/chatrooms/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        roomId
      })
    });

    return await res.json();
  } catch (err) {
    console.error("blockRoom error:", err);
    return { success: false };
  }
}

/* ---------------------------------------------------------
   RENAME ROOM
--------------------------------------------------------- */
export async function renameRoom(user, roomId, newName) {
  try {
    const res = await fetch(`${API}/api/chatrooms/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        roomId,
        newName
      })
    });

    return await res.json();
  } catch (err) {
    console.error("renameRoom error:", err);
    return { success: false };
  }
}

/* ---------------------------------------------------------
   PROMOTE MEMBER (admin)
--------------------------------------------------------- */
export async function promoteMember(user, roomId, targetUserId) {
  try {
    const res = await fetch(`${API}/api/chatrooms/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        roomId,
        targetUserId
      })
    });

    return await res.json();
  } catch (err) {
    console.error("promoteMember error:", err);
    return { success: false };
  }
}

/* ---------------------------------------------------------
   DEMOTE MEMBER
--------------------------------------------------------- */
export async function demoteMember(user, roomId, targetUserId) {
  try {
    const res = await fetch(`${API}/api/chatrooms/demote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        roomId,
        targetUserId
      })
    });

    return await res.json();
  } catch (err) {
    console.error("demoteMember error:", err);
    return { success: false };
  }
}
