// src/worker/work-message.js
// FULL MESSAGING SYSTEM
// CLOUD + FAMILY + CALLS + VENDORS + FAST ROLL + RESPONSE + CHATROOMS

export async function handleWorkMessage(path, request, db, url, env) {

  /* ---------------------------------------------------------
     CLOUD FAMILY
  --------------------------------------------------------- */
  if (path === "/api/work/family/list" && request.method === "GET")
    return cloudFamilyList(db, url);

  if (path === "/api/work/family/add" && request.method === "POST")
    return cloudFamilyAdd(request, db);

  if (path === "/api/work/family/remove" && request.method === "POST")
    return cloudFamilyRemove(request, db);

  if (path === "/api/work/family/settings" && request.method === "POST")
    return cloudFamilySettings(request, db);


  /* ---------------------------------------------------------
     CLOUD MESSAGES (WORK MESSAGE)
  --------------------------------------------------------- */
  if (path === "/api/work/message/send" && request.method === "POST")
    return workMessageSend(request, db);

  if (path === "/api/work/message/thread" && request.method === "GET")
    return workMessageThread(db, url);

  if (path === "/api/work/message/list" && request.method === "GET")
    return workMessageList(db, url);

  if (path === "/api/work/message/seen" && request.method === "POST")
    return workMessageSeen(request, db);


  /* ---------------------------------------------------------
     CLOUD CALLS (WORK CALL)
  --------------------------------------------------------- */
  if (path === "/api/work/call/start" && request.method === "POST")
    return workCallStart(request, db);

  if (path === "/api/work/call/end" && request.method === "POST")
    return workCallEnd(request, db);

  if (path === "/api/work/call/voicemail" && request.method === "POST")
    return workCallVoicemail(request, db, env);

  if (path === "/api/work/call/history" && request.method === "GET")
    return workCallHistory(db, url);


  /* ---------------------------------------------------------
     VENDOR MESSAGES
     Tables: network_vendor_messages
  --------------------------------------------------------- */
  if (path === "/api/network/messages/list" && request.method === "GET")
    return vendorMessageList(db, url);

  if (path === "/api/network/messages/thread" && request.method === "GET")
    return vendorMessageThread(db, url);

  if (path === "/api/network/messages/send" && request.method === "POST")
    return vendorMessageSend(request, db);

  if (path === "/api/network/messages/block" && request.method === "POST")
    return vendorBlock(request, db);

  if (path === "/api/network/messages/mute" && request.method === "POST")
    return vendorMute(request, db);

  if (path === "/api/network/messages/deleteThread" && request.method === "POST")
    return vendorDeleteThread(request, db);

  if (path === "/api/network/messages/typing" && request.method === "GET")
    return vendorTyping(db, url);


  /* ---------------------------------------------------------
     FAST ROLL MESSAGES
     Tables: fastroll_messages
  --------------------------------------------------------- */
  if (path === "/api/fastroll/messages/list" && request.method === "GET")
    return fastRollMessageList(db, url);

  if (path === "/api/fastroll/messages/thread" && request.method === "GET")
    return fastRollMessageThread(db, url);

  if (path === "/api/fastroll/messages/send" && request.method === "POST")
    return fastRollMessageSend(request, db);

  if (path === "/api/fastroll/messages/block" && request.method === "POST")
    return fastRollBlock(request, db);

  if (path === "/api/fastroll/messages/mute" && request.method === "POST")
    return fastRollMute(request, db);

  if (path === "/api/fastroll/messages/deleteThread" && request.method === "POST")
    return fastRollDeleteThread(request, db);

  if (path === "/api/fastroll/messages/typing" && request.method === "GET")
    return fastRollTyping(db, url);


  /* ---------------------------------------------------------
     RESPONSE UNIT MESSAGES
     Tables: response_messages
  --------------------------------------------------------- */
  if (path === "/api/response/messages/list" && request.method === "GET")
    return responseMessageList(db, url);

  if (path === "/api/response/messages/thread" && request.method === "GET")
    return responseMessageThread(db, url);

  if (path === "/api/response/messages/send" && request.method === "POST")
    return responseMessageSend(request, db);

  if (path === "/api/response/messages/block" && request.method === "POST")
    return responseBlock(request, db);

  if (path === "/api/response/messages/mute" && request.method === "POST")
    return responseMute(request, db);

  if (path === "/api/response/messages/deleteThread" && request.method === "POST")
    return responseDeleteThread(request, db);

  if (path === "/api/response/messages/typing" && request.method === "GET")
    return responseTyping(db, url);


  /* ---------------------------------------------------------
     CHATROOMS (TEXT)
     Tables: chatrooms, chatroom_members, chatroom_messages
  --------------------------------------------------------- */
  if (path === "/api/chatrooms/text/list" && request.method === "GET")
    return chatroomsTextList(db, url);

  if (path === "/api/chatrooms/text/messages" && request.method === "GET")
    return chatroomsTextMessages(db, url);

  if (path === "/api/chatrooms/text/send" && request.method === "POST")
    return chatroomsTextSend(request, db);

  if (path === "/api/chatrooms/text/typing" && request.method === "GET")
    return chatroomsTextTyping(db, url);


  /* ---------------------------------------------------------
     CHATROOMS CORE (JOIN / LEAVE / PRESENCE / ADMIN)
  --------------------------------------------------------- */
  if (path === "/api/chatrooms/create" && request.method === "POST")
    return chatroomCreate(request, db);

  if (path === "/api/chatrooms/delete" && request.method === "POST")
    return chatroomDelete(request, db);

  if (path === "/api/chatrooms/mute" && request.method === "POST")
    return chatroomMute(request, db);

  if (path === "/api/chatrooms/block" && request.method === "POST")
    return chatroomBlock(request, db);

  if (path === "/api/chatrooms/rename" && request.method === "POST")
    return chatroomRename(request, db);

  if (path === "/api/chatrooms/join" && request.method === "POST")
    return chatroomJoin(request, db);

  if (path === "/api/chatrooms/leave" && request.method === "POST")
    return chatroomLeave(request, db);

  if (path === "/api/chatrooms/presence" && request.method === "GET")
    return chatroomPresence(db, url);

  if (path === "/api/chatrooms/promote" && request.method === "POST")
    return chatroomPromote(request, db);

  if (path === "/api/chatrooms/demote" && request.method === "POST")
    return chatroomDemote(request, db);


  /* ---------------------------------------------------------
     CHATROOMS VOICE (SIGNALING)
     Tables: chatroom_voice_signals, chatroom_members
  --------------------------------------------------------- */
  if (path === "/api/chatrooms/voice/list" && request.method === "GET")
    return chatroomsVoiceList(db, url);

  if (path === "/api/chatrooms/voice/join" && request.method === "POST")
    return chatroomsVoiceJoin(request, db);

  if (path === "/api/chatrooms/voice/leave" && request.method === "POST")
    return chatroomsVoiceLeave(request, db);

  if (path === "/api/chatrooms/voice/presence" && request.method === "GET")
    return chatroomsVoicePresence(db, url);

  if (path === "/api/chatrooms/voice/signal/join" && request.method === "POST")
    return chatroomsVoiceSignalJoin(request, db);

  if (path === "/api/chatrooms/voice/signal/poll" && request.method === "GET")
    return chatroomsVoiceSignalPoll(db, url);

  if (path === "/api/chatrooms/voice/signal/answer" && request.method === "POST")
    return chatroomsVoiceSignalAnswer(request, db);

  if (path === "/api/chatrooms/voice/signal/ice" && request.method === "POST")
    return chatroomsVoiceSignalIce(request, db);


  return null;
}


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}


/* ---------------------------------------------------------
   CLOUD FAMILY (WORK FAMILY)
--------------------------------------------------------- */

async function cloudFamilyList(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    "SELECT * FROM work_family WHERE userId = ?"
  ).bind(userId).all();

  return json(rows.results || []);
}

async function cloudFamilyAdd(request, db) {
  const body = await request.json();
  const { userId, familyId } = body;

  if (!userId || !familyId)
    return json({ error: "Missing userId or familyId" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO work_family (id, userId, familyId)
     VALUES (?, ?, ?)`
  ).bind(id, userId, familyId).run();

  return json({ success: true, id });
}

async function cloudFamilyRemove(request, db) {
  const body = await request.json();
  const { userId, familyId } = body;

  if (!userId || !familyId)
    return json({ error: "Missing userId or familyId" }, 400);

  await db.prepare(
    "DELETE FROM work_family WHERE userId = ? AND familyId = ?"
  ).bind(userId, familyId).run();

  return json({ success: true });
}

async function cloudFamilySettings(request, db) {
  const body = await request.json();
  const { userId, familyId, muted, blocked, allowMessages, allowCalls } = body;

  if (!userId || !familyId)
    return json({ error: "Missing userId or familyId" }, 400);

  await db.prepare(
    `UPDATE work_family
     SET muted = ?, blocked = ?, allowMessages = ?, allowCalls = ?
     WHERE userId = ? AND familyId = ?`
  ).bind(
    muted ? 1 : 0,
    blocked ? 1 : 0,
    allowMessages ? 1 : 0,
    allowCalls ? 1 : 0,
    userId,
    familyId
  ).run();

  return json({ success: true });
}


/* ---------------------------------------------------------
   CLOUD MESSAGES (WORK MESSAGE)
--------------------------------------------------------- */

async function workMessageSend(request, db) {
  const body = await request.json();
  const {
    threadId,
    fromId,
    toId,
    text,
    voiceUrl,
    attachmentUrl,
    font,
    color
  } = body;

  if (!fromId || !toId || (!text && !voiceUrl && !attachmentUrl))
    return json({ error: "Missing required fields" }, 400);

  const fam = await db.prepare(
    "SELECT * FROM work_family WHERE userId = ? AND familyId = ?"
  ).bind(toId, fromId).first();

  if (fam) {
    if (fam.blocked) return json({ error: "Blocked" }, 403);
    if (!fam.allowMessages) return json({ error: "Messages disabled" }, 403);
  }

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO work_message (
       id, threadId, fromId, toId,
       text, voiceUrl, attachmentUrl,
       font, color,
       reactions, seen, muted, blocked, allowMessages, createdAt
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 1, datetime('now'))`
  ).bind(
    id,
    threadId || null,
    fromId,
    toId,
    text || null,
    voiceUrl || null,
    attachmentUrl || null,
    font || "system",
    color || "#ffffff",
    "[]"
  ).run();

  return json({ success: true, id });
}

async function workMessageThread(db, url) {
  const userId = url.searchParams.get("userId");
  const withId = url.searchParams.get("withId");
  const threadId = url.searchParams.get("threadId");

  let rows;

  if (threadId) {
    rows = await db.prepare(
      `SELECT * FROM work_message
       WHERE threadId = ?
       ORDER BY createdAt ASC`
    ).bind(threadId).all();
  } else if (userId && withId) {
    rows = await db.prepare(
      `SELECT * FROM work_message
       WHERE (fromId = ? AND toId = ?)
          OR (fromId = ? AND toId = ?)
       ORDER BY createdAt ASC`
    ).bind(userId, withId, withId, userId).all();
  } else {
    return json({ error: "Missing threadId or userId/withId" }, 400);
  }

  return json(rows.results || []);
}

async function workMessageList(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM work_message
     WHERE fromId = ? OR toId = ?
     ORDER BY createdAt DESC`
  ).bind(userId, userId).all();

  return json(rows.results || []);
}

async function workMessageSeen(request, db) {
  const body = await request.json();
  const { messageId, userId } = body;

  if (!messageId || !userId)
    return json({ error: "Missing messageId or userId" }, 400);

  await db.prepare(
    `UPDATE work_message
     SET seen = 1
     WHERE id = ? AND toId = ?`
  ).bind(messageId, userId).run();

  return json({ success: true });
}


/* ---------------------------------------------------------
   CLOUD CALLS (WORK CALL)
--------------------------------------------------------- */

async function workCallStart(request, db) {
  const body = await request.json();
  const { callerId, receiverId } = body;

  if (!callerId || !receiverId)
    return json({ error: "Missing callerId or receiverId" }, 400);

  const fam = await db.prepare(
    "SELECT * FROM work_family WHERE userId = ? AND familyId = ?"
  ).bind(receiverId, callerId).first();

  if (fam) {
    if (fam.blocked) return json({ error: "Blocked" }, 403);
    if (!fam.allowCalls) return json({ error: "Calls disabled" }, 403);
  }

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO work_call (
       id, callerId, receiverId,
       status, startedAt, endedAt, voicemailUrl
     )
     VALUES (?, ?, ?, 'ringing', datetime('now'), NULL, NULL)`
  ).bind(id, callerId, receiverId).run();

  return json({ success: true, id });
}

async function workCallEnd(request, db) {
  const body = await request.json();
  const { callId, status } = body;

  if (!callId) return json({ error: "Missing callId" }, 400);

  await db.prepare(
    `UPDATE work_call
     SET status = ?, endedAt = datetime('now')
     WHERE id = ?`
  ).bind(status || "ended", callId).run();

  return json({ success: true });
}

async function workCallVoicemail(request, db, env) {
  const form = await request.formData();
  const file = form.get("file");
  const callerId = form.get("callerId");
  const receiverId = form.get("receiverId");

  if (!file || !callerId || !receiverId)
    return json({ error: "Missing fields" }, 400);

  const key = `work/voicemail/${receiverId}/${crypto.randomUUID()}.mp3`;

  await env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const urlPath = `/work/voicemail/${receiverId}/${key.split("/").pop()}`;

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO work_call (
       id, callerId, receiverId,
       status, startedAt, endedAt, voicemailUrl
     )
     VALUES (?, ?, ?, 'voicemail', datetime('now'), NULL, ?)`
  ).bind(id, callerId, receiverId, urlPath).run();

  return json({ success: true, id, url: urlPath });
}

async function workCallHistory(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM work_call
     WHERE callerId = ? OR receiverId = ?
     ORDER BY startedAt DESC`
  ).bind(userId, userId).all();

  return json(rows.results || []);
}


/* ---------------------------------------------------------
   VENDOR MESSAGES
--------------------------------------------------------- */

async function vendorMessageList(db, url) {
  const fromUserId = url.searchParams.get("fromUserId");
  if (!fromUserId) return json({ error: "Missing fromUserId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM network_vendor_messages
     WHERE fromUserId = ?
        OR toUserId = ?
     ORDER BY createdAt DESC`
  ).bind(fromUserId, fromUserId).all();

  return json(rows.results || []);
}

async function vendorMessageThread(db, url) {
  const fromUserId = url.searchParams.get("fromUserId");
  const vendorId = url.searchParams.get("vendorId");
  if (!fromUserId || !vendorId) return json({ error: "Missing fromUserId or vendorId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM network_vendor_messages
     WHERE fromUserId = ? AND vendorId = ?
        OR toUserId = ? AND vendorId = ?
     ORDER BY createdAt ASC`
  ).bind(fromUserId, vendorId, fromUserId, vendorId).all();

  return json(rows.results || []);
}

async function vendorMessageSend(request, db) {
  const body = await request.json();
  const { fromUserId, vendorId, text } = body;

  if (!fromUserId || !vendorId || !text)
    return json({ error: "Missing fields" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_vendor_messages (
       id, fromUserId, vendorId, text,
       status, createdAt
     )
     VALUES (?, ?, ?, ?, 'sent', datetime('now'))`
  ).bind(id, fromUserId, vendorId, text).run();

  return json({ success: true, id });
}

async function vendorBlock(request, db) {
  const body = await request.json();
  const { userId, vendorId } = body;

  if (!userId || !vendorId)
    return json({ error: "Missing userId or vendorId" }, 400);

  await db.prepare(
    `UPDATE network_vendors
     SET active = 0
     WHERE id = ?`
  ).bind(vendorId).run();

  return json({ success: true });
}

async function vendorMute(request, db) {
  const body = await request.json();
  const { userId, vendorId } = body;

  if (!userId || !vendorId)
    return json({ error: "Missing userId or vendorId" }, 400);

  await db.prepare(
    `UPDATE network_vendor_messages
     SET muted = 1
     WHERE vendorId = ? AND toUserId = ?`
  ).bind(vendorId, userId).run();

  return json({ success: true });
}

async function vendorDeleteThread(request, db) {
  const body = await request.json();
  const { userId, vendorId } = body;

  if (!userId || !vendorId)
    return json({ error: "Missing userId or vendorId" }, 400);

  await db.prepare(
    `DELETE FROM network_vendor_messages
     WHERE vendorId = ? AND (fromUserId = ? OR toUserId = ?)`
  ).bind(vendorId, userId, userId).run();

  return json({ success: true });
}

async function vendorTyping(db, url) {
  const vendorId = url.searchParams.get("vendorId");
  if (!vendorId) return json({ error: "Missing vendorId" }, 400);

  // simple stub: always false unless you add a typing table
  return json({ typing: false });
}


/* ---------------------------------------------------------
   FAST ROLL MESSAGES
--------------------------------------------------------- */

async function fastRollMessageList(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM fastroll_messages
     WHERE fromUserId = ? OR toUserId = ?
     ORDER BY createdAt DESC`
  ).bind(userId, userId).all();

  return json(rows.results || []);
}

async function fastRollMessageThread(db, url) {
  const userId = url.searchParams.get("userId");
  const riderId = url.searchParams.get("riderId");
  if (!userId || !riderId) return json({ error: "Missing userId or riderId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM fastroll_messages
     WHERE (fromUserId = ? AND riderId = ?)
        OR (toUserId = ? AND riderId = ?)
     ORDER BY createdAt ASC`
  ).bind(userId, riderId, userId, riderId).all();

  return json(rows.results || []);
}

async function fastRollMessageSend(request, db) {
  const body = await request.json();
  const { fromUserId, riderId, text } = body;

  if (!fromUserId || !riderId || !text)
    return json({ error: "Missing fields" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO fastroll_messages (
       id, fromUserId, riderId, text,
       status, createdAt
     )
     VALUES (?, ?, ?, ?, 'sent', datetime('now'))`
  ).bind(id, fromUserId, riderId, text).run();

  return json({ success: true, id });
}

async function fastRollBlock(request, db) {
  const body = await request.json();
  const { userId, riderId } = body;

  if (!userId || !riderId)
    return json({ error: "Missing userId or riderId" }, 400);

  await db.prepare(
    `UPDATE fastroll_riders
     SET active = 0
     WHERE id = ?`
  ).bind(riderId).run();

  return json({ success: true });
}

async function fastRollMute(request, db) {
  const body = await request.json();
  const { userId, riderId } = body;

  if (!userId || !riderId)
    return json({ error: "Missing userId or riderId" }, 400);

  await db.prepare(
    `UPDATE fastroll_messages
     SET muted = 1
     WHERE riderId = ? AND toUserId = ?`
  ).bind(riderId, userId).run();

  return json({ success: true });
}

async function fastRollDeleteThread(request, db) {
  const body = await request.json();
  const { userId, riderId } = body;

  if (!userId || !riderId)
    return json({ error: "Missing userId or riderId" }, 400);

  await db.prepare(
    `DELETE FROM fastroll_messages
     WHERE riderId = ? AND (fromUserId = ? OR toUserId = ?)`
  ).bind(riderId, userId, userId).run();

  return json({ success: true });
}

async function fastRollTyping(db, url) {
  const riderId = url.searchParams.get("riderId");
  if (!riderId) return json({ error: "Missing riderId" }, 400);

  return json({ typing: false });
}


/* ---------------------------------------------------------
   RESPONSE UNIT MESSAGES
--------------------------------------------------------- */

async function responseMessageList(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM response_messages
     WHERE fromUserId = ? OR toUserId = ?
     ORDER BY createdAt DESC`
  ).bind(userId, userId).all();

  return json(rows.results || []);
}

async function responseMessageThread(db, url) {
  const userId = url.searchParams.get("userId");
  const withId = url.searchParams.get("withId");
  if (!userId || !withId) return json({ error: "Missing userId or withId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM response_messages
     WHERE (fromUserId = ? AND toUserId = ?)
        OR (fromUserId = ? AND toUserId = ?)
     ORDER BY createdAt ASC`
  ).bind(userId, withId, withId, userId).all();

  return json(rows.results || []);
}

async function responseMessageSend(request, db) {
  const body = await request.json();
  const { fromUserId, toUserId, text } = body;

  if (!fromUserId || !toUserId || !text)
    return json({ error: "Missing fields" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO response_messages (
       id, fromUserId, toUserId, text,
       status, createdAt
     )
     VALUES (?, ?, ?, ?, 'sent', datetime('now'))`
  ).bind(id, fromUserId, toUserId, text).run();

  return json({ success: true, id });
}

async function responseBlock(request, db) {
  const body = await request.json();
  const { userId, withId } = body;

  if (!userId || !withId)
    return json({ error: "Missing userId or withId" }, 400);

  await db.prepare(
    `UPDATE cloud_response_members
     SET active = 0
     WHERE userId = ? AND id = ?`
  ).bind(withId, userId).run();

  return json({ success: true });
}

async function responseMute(request, db) {
  const body = await request.json();
  const { userId, withId } = body;

  if (!userId || !withId)
    return json({ error: "Missing userId or withId" }, 400);

  await db.prepare(
    `UPDATE response_messages
     SET muted = 1
     WHERE toUserId = ? AND fromUserId = ?`
  ).bind(userId, withId).run();

  return json({ success: true });
}

async function responseDeleteThread(request, db) {
  const body = await request.json();
  const { userId, withId } = body;

  if (!userId || !withId)
    return json({ error: "Missing userId or withId" }, 400);

  await db.prepare(
    `DELETE FROM response_messages
     WHERE (fromUserId = ? AND toUserId = ?)
        OR (fromUserId = ? AND toUserId = ?)`
  ).bind(userId, withId, withId, userId).run();

  return json({ success: true });
}

async function responseTyping(db, url) {
  const withId = url.searchParams.get("withId");
  if (!withId) return json({ error: "Missing withId" }, 400);

  return json({ typing: false });
}


/* ---------------------------------------------------------
   CHATROOMS TEXT
--------------------------------------------------------- */

async function chatroomsTextList(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    `SELECT c.id, c.name,
            (SELECT text FROM chatroom_messages m
             WHERE m.roomId = c.id
             ORDER BY m.createdAt DESC LIMIT 1) AS lastText
     FROM chatrooms c
     JOIN chatroom_members cm ON cm.roomId = c.id
     WHERE cm.userId = ? AND c.type = 'text'
     ORDER BY c.name ASC`
  ).bind(userId).all();

  return json(rows.results || []);
}

async function chatroomsTextMessages(db, url) {
  const roomId = url.searchParams.get("roomId");
  if (!roomId) return json({ error: "Missing roomId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM chatroom_messages
     WHERE roomId = ?
     ORDER BY createdAt ASC`
  ).bind(roomId).all();

  return json(rows.results || []);
}

async function chatroomsTextSend(request, db) {
  const body = await request.json();
  const { roomId, fromUserId, text } = body;

  if (!roomId || !fromUserId || !text)
    return json({ error: "Missing fields" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO chatroom_messages (
       id, roomId, fromUserId, text, createdAt
     )
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(id, roomId, fromUserId, text).run();

  return json({ success: true, id });
}

async function chatroomsTextTyping(db, url) {
  const roomId = url.searchParams.get("roomId");
  if (!roomId) return json({ error: "Missing roomId" }, 400);

  return json({ typing: false });
}


/* ---------------------------------------------------------
   CHATROOMS CORE
--------------------------------------------------------- */

async function chatroomCreate(request, db) {
  const body = await request.json();
  const { userId, name, type } = body;

  if (!userId || !name)
    return json({ error: "Missing userId or name" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO chatrooms (id, name, type, createdAt)
     VALUES (?, ?, ?, datetime('now'))`
  ).bind(id, name, type || "text").run();

  await db.prepare(
    `INSERT INTO chatroom_members (id, roomId, userId, role)
     VALUES (?, ?, ?, 'owner')`
  ).bind(crypto.randomUUID(), id, userId).run();

  return json({ success: true, id });
}

async function chatroomDelete(request, db) {
  const body = await request.json();
  const { userId, roomId } = body;

  if (!userId || !roomId)
    return json({ error: "Missing userId or roomId" }, 400);

  await db.prepare(
    `DELETE FROM chatrooms WHERE id = ?`
  ).bind(roomId).run();

  await db.prepare(
    `DELETE FROM chatroom_members WHERE roomId = ?`
  ).bind(roomId).run();

  await db.prepare(
    `DELETE FROM chatroom_messages WHERE roomId = ?`
  ).bind(roomId).run();

  return json({ success: true });
}

async function chatroomMute(request, db) {
  const body = await request.json();
  const { userId, roomId } = body;

  if (!userId || !roomId)
    return json({ error: "Missing userId or roomId" }, 400);

  await db.prepare(
    `UPDATE chatroom_members
     SET muted = 1
     WHERE roomId = ? AND userId = ?`
  ).bind(roomId, userId).run();

  return json({ success: true });
}

async function chatroomBlock(request, db) {
  const body = await request.json();
  const { userId, roomId } = body;

  if (!userId || !roomId)
    return json({ error: "Missing userId or roomId" }, 400);

  await db.prepare(
    `UPDATE chatroom_members
     SET blocked = 1
     WHERE roomId = ? AND userId = ?`
  ).bind(roomId, userId).run();

  return json({ success: true });
}

async function chatroomRename(request, db) {
  const body = await request.json();
  const { userId, roomId, newName } = body;

  if (!userId || !roomId || !newName)
    return json({ error: "Missing fields" }, 400);

  await db.prepare(
    `UPDATE chatrooms
     SET name = ?
     WHERE id = ?`
  ).bind(newName, roomId).run();

  return json({ success: true });
}

async function chatroomJoin(request, db) {
  const body = await request.json();
  const { userId, roomId } = body;

  if (!userId || !roomId)
    return json({ error: "Missing userId or roomId" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO chatroom_members (id, roomId, userId, role)
     VALUES (?, ?, ?, 'member')`
  ).bind(id, roomId, userId).run();

  return json({ success: true });
}

async function chatroomLeave(request, db) {
  const body = await request.json();
  const { userId, roomId } = body;

  if (!userId || !roomId)
    return json({ error: "Missing userId or roomId" }, 400);

  await db.prepare(
    `DELETE FROM chatroom_members
     WHERE roomId = ? AND userId = ?`
  ).bind(roomId, userId).run();

  return json({ success: true });
}

async function chatroomPresence(db, url) {
  const roomId = url.searchParams.get("roomId");
  if (!roomId) return json({ error: "Missing roomId" }, 400);

  const rows = await db.prepare(
    `SELECT userId, role
     FROM chatroom_members
     WHERE roomId = ?`
  ).bind(roomId).all();

  return json(rows.results || []);
}

async function chatroomPromote(request, db) {
  const body = await request.json();
  const { userId, roomId, targetUserId } = body;

  if (!userId || !roomId || !targetUserId)
    return json({ error: "Missing fields" }, 400);

  await db.prepare(
    `UPDATE chatroom_members
     SET role = 'admin'
     WHERE roomId = ? AND userId = ?`
  ).bind(roomId, targetUserId).run();

  return json({ success: true });
}

async function chatroomDemote(request, db) {
  const body = await request.json();
  const { userId, roomId, targetUserId } = body;

  if (!userId || !roomId || !targetUserId)
    return json({ error: "Missing fields" }, 400);

  await db.prepare(
    `UPDATE chatroom_members
     SET role = 'member'
     WHERE roomId = ? AND userId = ?`
  ).bind(roomId, targetUserId).run();

  return json({ success: true });
}


/* ---------------------------------------------------------
   CHATROOMS VOICE
--------------------------------------------------------- */

async function chatroomsVoiceList(db, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return json({ error: "Missing userId" }, 400);

  const rows = await db.prepare(
    `SELECT c.id, c.name
     FROM chatrooms c
     JOIN chatroom_members cm ON cm.roomId = c.id
     WHERE cm.userId = ? AND c.type = 'voice'
     ORDER BY c.name ASC`
  ).bind(userId).all();

  return json(rows.results || []);
}

async function chatroomsVoiceJoin(request, db) {
  const body = await request.json();
  const { userId, roomId } = body;

  if (!userId || !roomId)
    return json({ error: "Missing userId or roomId" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO chatroom_members (id, roomId, userId, role)
     VALUES (?, ?, ?, 'member')`
  ).bind(id, roomId, userId).run();

  return json({ success: true });
}

async function chatroomsVoiceLeave(request, db) {
  const body = await request.json();
  const { userId, roomId } = body;

  if (!userId || !roomId)
    return json({ error: "Missing userId or roomId" }, 400);

  await db.prepare(
    `DELETE FROM chatroom_members
     WHERE roomId = ? AND userId = ?`
  ).bind(roomId, userId).run();

  return json({ success: true });
}

async function chatroomsVoicePresence(db, url) {
  const roomId = url.searchParams.get("roomId");
  if (!roomId) return json({ error: "Missing roomId" }, 400);

  const rows = await db.prepare(
    `SELECT userId
     FROM chatroom_members
     WHERE roomId = ?`
  ).bind(roomId).all();

  return json(rows.results || []);
}

async function chatroomsVoiceSignalJoin(request, db) {
  const body = await request.json();
  const { roomId, userId } = body;

  if (!roomId || !userId)
    return json({ error: "Missing roomId or userId" }, 400);

  return json({ success: true });
}

async function chatroomsVoiceSignalPoll(db, url) {
  const roomId = url.searchParams.get("roomId");
  const userId = url.searchParams.get("userId");
  if (!roomId || !userId) return json({ error: "Missing roomId or userId" }, 400);

  const rows = await db.prepare(
    `SELECT *
     FROM chatroom_voice_signals
     WHERE roomId = ? AND toUserId = ?
     ORDER BY createdAt ASC`
  ).bind(roomId, userId).all();

  await db.prepare(
    `DELETE FROM chatroom_voice_signals
     WHERE roomId = ? AND toUserId = ?`
  ).bind(roomId, userId).run();

  return json(rows.results || []);
}

async function chatroomsVoiceSignalAnswer(request, db) {
  const body = await request.json();
  const { roomId, fromUserId, toUserId, answer } = body;

  if (!roomId || !fromUserId || !toUserId || !answer)
    return json({ error: "Missing fields" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO chatroom_voice_signals (
       id, roomId, fromUserId, toUserId, answer, createdAt
     )
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).bind(id, roomId, fromUserId, toUserId, JSON.stringify(answer)).run();

  return json({ success: true });
}

async function chatroomsVoiceSignalIce(request, db) {
  const body = await request.json();
  const { roomId, fromUserId, toUserId, ice } = body;

  if (!roomId || !fromUserId || !toUserId || !ice)
    return json({ error: "Missing fields" }, 400);

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO chatroom_voice_signals (
       id, roomId, fromUserId, toUserId, ice, createdAt
     )
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).bind(id, roomId, fromUserId, toUserId, JSON.stringify(ice)).run();

  return json({ success: true });
}
