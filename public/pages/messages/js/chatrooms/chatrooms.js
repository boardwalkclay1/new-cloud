// /public/pages/messages/js/chatrooms/chatrooms.js
// MAIN CHATROOMS CONTROLLER — TEXT ROOMS + VOICE ROOMS + PRESENCE

import { loadTextRooms, openTextRoom } from "./chatrooms-text.js";
import { loadVoiceRooms, openVoiceRoom } from "./chatrooms-voice.js";
import { joinRoom, leaveRoom, getPresence } from "./chatrooms-presence.js";
import { createRoom, deleteRoom, muteRoom, blockRoom } from "./chatrooms-actions.js";

const API = "https://api.beltlinecloud.com";
const Auth = window.Auth;

const user = Auth.getUser();
if (!user) {
  window.location.href = "/pages/login.html";
  throw new Error("User not logged in");
}

/* ---------------------------------------------------------
   LOAD ALL CHATROOMS (TEXT + VOICE)
--------------------------------------------------------- */
export async function loadChatroomsView() {
  const textRooms = await loadTextRooms(user);
  const voiceRooms = await loadVoiceRooms(user);

  return [
    ...textRooms.map(r => ({
      id: r.id,
      name: r.name,
      preview: r.preview,
      avatar: r.avatar,
      category: "chatroom",
      meta: { type: "text", roomId: r.id }
    })),
    ...voiceRooms.map(r => ({
      id: r.id,
      name: r.name,
      preview: r.preview,
      avatar: r.avatar,
      category: "chatroom",
      meta: { type: "voice", roomId: r.id }
    }))
  ];
}

/* ---------------------------------------------------------
   OPEN CHATROOM (TEXT OR VOICE)
--------------------------------------------------------- */
export function openChatroom(user, thread, viewEl) {
  const { type, roomId } = thread.meta;

  if (type === "text") {
    openTextRoom(user, roomId, viewEl);
  }

  if (type === "voice") {
    openVoiceRoom(user, roomId, viewEl);
  }
}

/* ---------------------------------------------------------
   CREATE NEW CHATROOM
--------------------------------------------------------- */
export async function createNewChatroom(name, type = "text") {
  return await createRoom(user, name, type);
}

/* ---------------------------------------------------------
   DELETE CHATROOM
--------------------------------------------------------- */
export async function deleteChatroom(roomId) {
  return await deleteRoom(user, roomId);
}

/* ---------------------------------------------------------
   MUTE CHATROOM
--------------------------------------------------------- */
export async function muteChatroom(roomId) {
  return await muteRoom(user, roomId);
}

/* ---------------------------------------------------------
   BLOCK CHATROOM
--------------------------------------------------------- */
export async function blockChatroom(roomId) {
  return await blockRoom(user, roomId);
}

/* ---------------------------------------------------------
   JOIN CHATROOM
--------------------------------------------------------- */
export async function joinChatroom(roomId) {
  return await joinRoom(user, roomId);
}

/* ---------------------------------------------------------
   LEAVE CHATROOM
--------------------------------------------------------- */
export async function leaveChatroom(roomId) {
  return await leaveRoom(user, roomId);
}

/* ---------------------------------------------------------
   PRESENCE (WHO IS IN THE ROOM)
--------------------------------------------------------- */
export async function loadChatroomPresence(roomId) {
  return await getPresence(roomId);
}
