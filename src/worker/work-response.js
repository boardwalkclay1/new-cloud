// =========================================================
// BELTLINE CLOUD — WORKER (FULL RESPONSE + SAFETY ENGINE)
// =========================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const db = env.DB;

    const resUser       = await handleUserRoutes(path, request, db, url);
    if (resUser) return resUser;

    const resSafety     = await handleSafetyRoutes(path, request, db, url);
    if (resSafety) return resSafety;

    const resResponse   = await handleResponseRoutes(path, request, db, url);
    if (resResponse) return resResponse;

    const resChat       = await handleChatRoutes(path, request, db, url);
    if (resChat) return resChat;

    const resReputation = await handleReputationRoutes(path, request, db, url);
    if (resReputation) return resReputation;

    return json({ error: "Route not found" }, 404);
  }
};

// =========================================================
// JSON HELPER
// =========================================================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// =========================================================
// CLOUD USERS ROUTES (cloud_users)
// =========================================================
export async function handleUserRoutes(path, request, db, url) {
  // USER CREATE
  if (path === "/api/users/create" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_users (id, name, email, createdAt)
       VALUES (?, ?, ?, datetime('now'))`
    ).bind(id, body.name, body.email).run();

    return json({ success: true, id });
  }

  // USER GET
  if (path === "/api/users/get") {
    const userId = url.searchParams.get("userId");

    const { results } = await db.prepare(
      "SELECT * FROM cloud_users WHERE id = ?"
    ).bind(userId).all();

    return json(results[0] || null);
  }

  return null;
}

// =========================================================
// SAFETY ALERTS ROUTES (cloud_safety_alerts)
// =========================================================
export async function handleSafetyRoutes(path, request, db, url) {
  // ALERT CREATE (manual + auto)
  if (path === "/api/safety/alerts/create" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_safety_alerts (id, userId, type, message, location, createdAt)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      id,
      body.userId,
      body.type,              // "manual" | "auto"
      body.message || "",
      body.location || ""
    ).run();

    return json({ success: true, id });
  }

  // ALERT CLOSE
  if (path === "/api/safety/alerts/close" && request.method === "POST") {
    const body = await request.json();

    await db.prepare(
      `UPDATE cloud_safety_alerts
       SET status = 'closed'
       WHERE id = ?`
    ).bind(body.alertId).run();

    return json({ success: true });
  }

  // ALERT FEED
  if (path === "/api/safety/alerts/feed") {
    const { results } = await db.prepare(
      `SELECT * FROM cloud_safety_alerts
       ORDER BY createdAt DESC`
    ).all();

    return json(results);
  }

  // ALERT HISTORY (filters optional)
  if (path === "/api/safety/alerts/history" && request.method === "POST") {
    const body = await request.json();
    let query = "SELECT * FROM cloud_safety_alerts WHERE 1=1";
    const binds = [];

    if (body.userId) {
      query += " AND userId = ?";
      binds.push(body.userId);
    }
    if (body.type) {
      query += " AND type = ?";
      binds.push(body.type);
    }

    const stmt = db.prepare(query);
    const { results } = await stmt.bind(...binds).all();

    return json(results);
  }

  return null;
}

// =========================================================
// RESPONSE ROUTES (groups, members, activity, units)
// =========================================================
export async function handleResponseRoutes(path, request, db, url) {

  // GROUP CREATE
  if (path === "/api/response/group/create" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_response_groups (id, name, description, createdAt)
       VALUES (?, ?, ?, datetime('now'))`
    ).bind(id, body.name, body.description || "").run();

    return json({ success: true, id });
  }

  // MEMBER ADD
  if (path === "/api/response/member/add" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_response_members (id, userId, groupId, rank, joinedAt)
       VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(
      id,
      body.userId,
      body.groupId,
      body.rank || "cloud_responder"
    ).run();

    return json({ success: true, id });
  }

  // MEMBER RANK UPDATE
  if (path === "/api/response/member/rank" && request.method === "POST") {
    const body = await request.json();

    await db.prepare(
      `UPDATE cloud_response_members
       SET rank = ?
       WHERE id = ?`
    ).bind(body.rank, body.id).run();

    return json({ success: true });
  }

  // ACTIVITY LOG
  if (path === "/api/response/activity/log" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_response_activity (id, memberId, action, details, timestamp)
       VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(
      id,
      body.memberId,
      body.action,
      body.details || ""
    ).run();

    return json({ success: true, id });
  }

  // GROUP MEMBERS
  if (path === "/api/response/group/members") {
    const groupId = url.searchParams.get("groupId");

    const { results } = await db.prepare(
      `SELECT m.*, u.name, u.email
       FROM cloud_response_members m
       JOIN cloud_users u ON u.id = m.userId
       WHERE m.groupId = ?`
    ).bind(groupId).all();

    return json(results);
  }

  // MEMBER ACTIVITY
  if (path === "/api/response/member/activity") {
    const memberId = url.searchParams.get("memberId");

    const { results } = await db.prepare(
      `SELECT * FROM cloud_response_activity
       WHERE memberId = ?
       ORDER BY timestamp DESC`
    ).bind(memberId).all();

    return json(results);
  }

  // UNIT CREATE (dispatch)
  if (path === "/api/response/unit/create" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_response_units (id, userId, type, description, location, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`
    ).bind(
      id,
      body.userId,
      body.type,
      body.description || "",
      body.location || ""
    ).run();

    return json({ success: true, id });
  }

  // UNIT STATUS UPDATE
  if (path === "/api/response/unit/update" && request.method === "POST") {
    const body = await request.json();

    await db.prepare(
      `UPDATE cloud_response_units
       SET status = ?, updatedAt = datetime('now')
       WHERE id = ?`
    ).bind(body.status, body.id).run();

    return json({ success: true });
  }

  // UNIT LIST FOR USER
  if (path === "/api/response/unit/list") {
    const userId = url.searchParams.get("userId");

    const { results } = await db.prepare(
      `SELECT * FROM cloud_response_units
       WHERE userId = ?
       ORDER BY createdAt DESC`
    ).bind(userId).all();

    return json(results);
  }

  return null;
}

// =========================================================
// CHAT / INCIDENT CHANNEL ROUTES (minimal stub)
// =========================================================
export async function handleChatRoutes(path, request, db, url) {
  // INCIDENT CHANNEL CREATE
  if (path === "/api/chat/incident-channel" && request.method === "POST") {
    const body = await request.json();
    // You can wire this to your chat tables; stubbed here
    return json({ success: true, channelId: crypto.randomUUID() });
  }

  // RESPONSE VOICE NOTE
  if (path === "/api/chat/response-voice" && request.method === "POST") {
    const body = await request.json();
    // Store voice note in your media/chat system; stubbed
    return json({ success: true });
  }

  return null;
}

// =========================================================
// REPUTATION ROUTES (minimal, aligned with members)
// =========================================================
export async function handleReputationRoutes(path, request, db, url) {
  // AWARD REPUTATION
  if (path === "/api/response/reputation/award" && request.method === "POST") {
    const body = await request.json();
    // body.updates = [{ memberId, points, alertId }]
    // You can store this in a reputation table; stubbed
    return json({ success: true });
  }

  // GET REPUTATION
  if (path.startsWith("/api/response/reputation/")) {
    const memberId = path.split("/").pop();
    // Fetch from reputation table; stubbed
    return json({ memberId, points: 0 });
  }

  return null;
}
