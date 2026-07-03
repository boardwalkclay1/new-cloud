// work-response.js
import { json } from "./work-utils.js";

export async function handleResponseRoutes(path, request, db, url) {
  // GROUP CREATE
  if (path.startsWith("/api/response/group/create") && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO cloud_response_groups (id, name, description, createdAt)
       VALUES (?, ?, ?, datetime('now'))`
    ).bind(id, body.name, body.description || "").run();

    return json({ success: true, id });
  }

  // MEMBER ADD
  if (path.startsWith("/api/response/member/add") && request.method === "POST") {
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
  if (path.startsWith("/api/response/member/rank") && request.method === "POST") {
    const body = await request.json();

    await db.prepare(
      `UPDATE cloud_response_members
       SET rank = ?
       WHERE id = ?`
    ).bind(body.rank, body.id).run();

    return json({ success: true });
  }

  // ACTIVITY LOG
  if (path.startsWith("/api/response/activity/log") && request.method === "POST") {
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
  if (path.startsWith("/api/response/group/members")) {
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
  if (path.startsWith("/api/response/member/activity")) {
    const memberId = url.searchParams.get("memberId");

    const { results } = await db.prepare(
      "SELECT * FROM cloud_response_activity WHERE memberId = ? ORDER BY timestamp DESC"
    ).bind(memberId).all();

    return json(results);
  }

  // DISPATCH CREATE
  if (path.startsWith("/api/response/create") && request.method === "POST") {
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

  // DISPATCH STATUS UPDATE
  if (path.startsWith("/api/response/update") && request.method === "POST") {
    const body = await request.json();

    await db.prepare(
      `UPDATE cloud_response_units
       SET status = ?, updatedAt = datetime('now')
       WHERE id = ?`
    ).bind(body.status, body.id).run();

    return json({ success: true });
  }

  // DISPATCH LIST FOR USER
  if (path.startsWith("/api/response/list")) {
    const userId = url.searchParams.get("userId");

    const { results } = await db.prepare(
      "SELECT * FROM cloud_response_units WHERE userId = ? ORDER BY createdAt DESC"
    ).bind(userId).all();

    return json(results);
  }

  return null;
}
