// src/worker/work-message.js
// CLOUD MESSAGING + CLOUD FAMILY + CLOUD CALLS
// Uses tables: work_message, work_family, work_call

export async function handleWorkMessage(path, request, db, url, env) {

  /* CLOUD FAMILY */
  if (path === "/api/work/family/list" && request.method === "GET")
    return cloudFamilyList(db, url);

  if (path === "/api/work/family/add" && request.method === "POST")
    return cloudFamilyAdd(request, db);

  if (path === "/api/work/family/remove" && request.method === "POST")
    return cloudFamilyRemove(request, db);

  if (path === "/api/work/family/settings" && request.method === "POST")
    return cloudFamilySettings(request, db);


  /* CLOUD MESSAGES (WORK MESSAGE) */
  if (path === "/api/work/message/send" && request.method === "POST")
    return workMessageSend(request, db);

  if (path === "/api/work/message/thread" && request.method === "GET")
    return workMessageThread(db, url);

  if (path === "/api/work/message/list" && request.method === "GET")
    return workMessageList(db, url);

  if (path === "/api/work/message/seen" && request.method === "POST")
    return workMessageSeen(request, db);


  /* CLOUD CALLS (WORK CALL) */
  if (path === "/api/work/call/start" && request.method === "POST")
    return workCallStart(request, db);

  if (path === "/api/work/call/end" && request.method === "POST")
    return workCallEnd(request, db);

  if (path === "/api/work/call/voicemail" && request.method === "POST")
    return workCallVoicemail(request, db, env);

  if (path === "/api/work/call/history" && request.method === "GET")
    return workCallHistory(db, url);


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

  // permissions from work_family
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
